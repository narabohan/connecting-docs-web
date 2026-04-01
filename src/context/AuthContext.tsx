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

    // ── Save session (and Sync to DB)
    // Awaits Airtable sync so the correct role is available before rendering.
    // withRoleGuard relies on user.role — setting it prematurely causes
    // admin/doctor users to be redirected to /unauthorized.
    const saveSession = useCallback(async (u: AuthUser) => {
        if (u.provider !== 'demo') {
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
                // If Airtable has a different role (e.g., admin set them to 'doctor'), apply it
                if (data.dbRole && data.dbRole !== u.role) {
                    u = { ...u, role: data.dbRole as UserRole };
                }
            } catch (e) {
                console.error('Failed to sync user to DB:', e);
                // On failure, proceed with the original role (best-effort)
            }
        }

        setUser(u);
        localStorage.setItem('cd_user_session', JSON.stringify(u));
    }, []);

    // ── Restore session on mount
    useEffect(() => {
        try {
            // Try Firebase if configured
            const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
            if (apiKey && apiKey !== 'YOUR_API_KEY') {
                // Lazy import Firebase Auth listener
                import('@/lib/firebase').then(async ({ auth, onAuthStateChanged, getRedirectResult }) => {
                    // ── Handle redirect result (Google/GitHub signInWithRedirect) ──
                    try {
                        await getRedirectResult(auth);
                    } catch (err) {
                        console.error('[AuthContext] Redirect result error:', err);
                    }

                    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                        if (firebaseUser) {
                            // ── 모달 닫기 (수정 3 방어 로직) — Header와 같은 state 공유 ──
                            setIsAuthModalOpen(false);

                            const provider = (firebaseUser.providerData[0]?.providerId?.includes('google') ? 'google' :
                                firebaseUser.providerData[0]?.providerId?.includes('github') ? 'github' :
                                    'email') as AuthUser['provider'];

                            const u: AuthUser = {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                                photoURL: firebaseUser.photoURL || undefined,
                                role: 'patient',
                                provider: provider,
                            };
                            // Await sync so role is resolved before withRoleGuard checks
                            await saveSession(u);

                            // Execute pending action if any (e.g. redirect to report)
                            if (pendingAction) {
                                pendingAction();
                                setPendingAction(null);
                            }
                        } else {
                            setUser(null);
                        }
                        setLoading(false);
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
    }, [saveSession]);

    // ── Google OAuth (signInWithRedirect — COOP-safe) ──────────────────────
    const signInWithGoogle = useCallback(async () => {
        const { auth, googleProvider, signInWithRedirect } = await import('@/lib/firebase');
        // Redirect 방식이므로 페이지가 이동됨 → 돌아온 후 onAuthStateChanged가 처리
        await signInWithRedirect(auth, googleProvider);
    }, []);

    // ── GitHub OAuth (signInWithRedirect — COOP-safe) ────────────────────
    const signInWithGithub = useCallback(async () => {
        const { auth, githubProvider, signInWithRedirect } = await import('@/lib/firebase');
        await signInWithRedirect(auth, githubProvider);
    }, []);

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
