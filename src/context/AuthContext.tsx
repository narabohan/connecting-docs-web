import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/router';
import type { UserRole } from '@/types/auth';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    provider: 'google' | 'github' | 'apple' | 'email' | 'kakao' | 'naver' | 'demo';
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithGithub: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
    signOut: () => Promise<void>;
    openAuthModal: (onSuccess?: () => void) => void;
    closeAuthModal: () => void;
    isAuthModalOpen: boolean;
    pendingAction: (() => void) | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const router = useRouter();

    // ── Fetch role from DB via /api/auth/sync ──
    const fetchDbRole = useCallback(async (u: AuthUser): Promise<UserRole> => {
        if (u.provider === 'demo') return u.role;
        try {
            const res = await fetch('/api/auth/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: u.uid,
                    email: u.email,
                    name: u.displayName,
                    photoUrl: u.photoURL || undefined,
                    provider: u.provider,
                    role: u.role
                })
            });
            const data = await res.json();
            if (data.dbRole) return data.dbRole as UserRole;
        } catch (e) {
            console.error('Failed to sync user to DB:', e);
        }
        // Fallback: try cached role from localStorage
        try {
            const cached = localStorage.getItem('cd_user_session');
            if (cached) {
                const parsed = JSON.parse(cached) as AuthUser;
                if (parsed.uid === u.uid && parsed.role) return parsed.role;
            }
        } catch { /* ignore parse errors */ }
        return 'patient';
    }, []);

    // ── Save session (role already resolved) ──
    const saveSession = useCallback((u: AuthUser) => {
        setUser(u);
        localStorage.setItem('cd_user_session', JSON.stringify(u));
    }, []);

    // ── Restore session on mount
    useEffect(() => {
        try {
            // Immediately restore cached session for fast guard pass
            const cached = localStorage.getItem('cd_user_session');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached) as AuthUser;
                    setUser(parsed);
                } catch { /* ignore corrupt cache */ }
            }

            // Try Firebase if configured
            const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
            if (apiKey && apiKey !== 'YOUR_API_KEY') {
                // Lazy import Firebase Auth listener
                import('@/lib/firebase').then(({ auth, onAuthStateChanged }) => {
                    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                        if (firebaseUser) {
                            setLoading(true); // Re-lock while fetchDbRole resolves
                            setIsAuthModalOpen(false); // Close modal on login detection
                            const provider = (firebaseUser.providerData[0]?.providerId?.includes('google') ? 'google' :
                                firebaseUser.providerData[0]?.providerId?.includes('github') ? 'github' :
                                    'email') as AuthUser['provider'];

                            const baseUser: AuthUser = {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                                photoURL: firebaseUser.photoURL || undefined,
                                role: 'patient',
                                provider: provider,
                            };

                            // Await DB role before setting user — prevents withRoleGuard race
                            fetchDbRole(baseUser).then((resolvedRole) => {
                                saveSession({ ...baseUser, role: resolvedRole });
                                setLoading(false);
                            });
                        } else {
                            setUser(null);
                            setLoading(false);
                        }
                    });
                    return () => unsubscribe();
                });
            } else {
                // Fallback: localStorage demo session
                const saved = localStorage.getItem('cd_user_session');
                if (saved) setUser(JSON.parse(saved));
                setLoading(false);
            }
        } catch {
            setLoading(false);
        }
    }, [saveSession, fetchDbRole]);

    // ── Google OAuth ──────────────────────────────────────────────────────────
    const signInWithGoogle = useCallback(async () => {
        try {
            const { auth, googleProvider, signInWithPopup } = await import('@/lib/firebase');
            await signInWithPopup(auth, googleProvider);
            // We rely on onAuthStateChanged to catch the login and sync!
            setIsAuthModalOpen(false);
            pendingAction?.();
            setPendingAction(null);
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user') throw err;
        }
    }, [pendingAction]);

    // ── GitHub OAuth ──────────────────────────────────────────────────────────
    const signInWithGithub = useCallback(async () => {
        try {
            const { auth, githubProvider, signInWithPopup } = await import('@/lib/firebase');
            await signInWithPopup(auth, githubProvider);
            setIsAuthModalOpen(false);
            pendingAction?.();
            setPendingAction(null);
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user') throw err;
        }
    }, [pendingAction]);

    // ── Email Sign In ─────────────────────────────────────────────────────────
    const signInWithEmail = useCallback(async (email: string, password: string) => {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (apiKey && apiKey !== 'YOUR_API_KEY') {
            const { auth, signInWithEmailAndPassword } = await import('@/lib/firebase');
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle the rest
        } else {
            // Demo fallback
            saveSession({ uid: `demo_${Date.now()}`, email, displayName: email.split('@')[0], role: 'patient', provider: 'demo' });
        }
        setIsAuthModalOpen(false);
        pendingAction?.();
        setPendingAction(null);
    }, [pendingAction, saveSession]);

    // ── Email Sign Up ─────────────────────────────────────────────────────────
    const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (apiKey && apiKey !== 'YOUR_API_KEY') {
            const { auth, createUserWithEmailAndPassword, updateProfile } = await import('@/lib/firebase');
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(result.user, { displayName: name });
            // onAuthStateChanged will catch this and trigger sync
        } else {
            saveSession({ uid: `demo_${Date.now()}`, email, displayName: name, role: 'patient', provider: 'demo' });
        }
        setIsAuthModalOpen(false);
        pendingAction?.();
        setPendingAction(null);
    }, [pendingAction, saveSession]);

    // ── Sign Out ──────────────────────────────────────────────────────────────
    const signOut = useCallback(async () => {
        try {
            const { auth, firebaseSignOut } = await import('@/lib/firebase');
            await firebaseSignOut(auth);
        } catch { /* ignore if firebase not configured */ }
        setUser(null);
        localStorage.removeItem('cd_user_session');
        router.push('/');
    }, [router]);

    // ── Auth Modal Controls ───────────────────────────────────────────────────
    const openAuthModal = useCallback((onSuccess?: () => void) => {
        setPendingAction(onSuccess ? () => onSuccess : null);
        setIsAuthModalOpen(true);
    }, []);

    const closeAuthModal = useCallback(() => {
        setIsAuthModalOpen(false);
        setPendingAction(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            user, loading,
            signInWithGoogle, signInWithGithub,
            signInWithEmail, signUpWithEmail,
            signOut,
            openAuthModal, closeAuthModal, isAuthModalOpen, pendingAction,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}

// Legacy compat shim (keep existing code from breaking)
export type { AuthContextType };
