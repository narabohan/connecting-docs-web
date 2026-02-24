import { useState, useEffect } from 'react';
import { X, Loader2, Mail, Eye, EyeOff, ArrowRight, User, Lock, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'signin' | 'signup';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ─── SVG Social Icons ─────────────────────────────────────────────────────────
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const GithubIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
);

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [tab, setTab] = useState<Tab>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState<string | null>(null); // which button is loading

    const { signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail } = useAuth();

    // Reset form on tab change
    useEffect(() => {
        setError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
    }, [tab]);

    // Prevent body scroll when modal open
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const withLoading = async (key: string, fn: () => Promise<void>) => {
        setLoading(key);
        setError('');
        try {
            await fn();
        } catch (err: any) {
            const msg = err?.code
                ? firebaseErrorMessage(err.code)
                : err?.message || 'Something went wrong. Please try again.';
            setError(msg);
        } finally {
            setLoading(null);
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (tab === 'signup') {
            if (!name.trim()) { setError('Please enter your name.'); return; }
            if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
            if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
            await withLoading('email', () => signUpWithEmail(email, password, name));
        } else {
            await withLoading('email', () => signInWithEmail(email, password));
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.97 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="relative w-full max-w-md z-10"
                    >
                        <div className="relative bg-[#0C0C0E] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
                            {/* Background glow */}
                            <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Logo + Header */}
                            <div className="text-center mb-6">
                                <span className="text-2xl font-bold tracking-tight">
                                    <span className="text-white">Connecting</span>
                                    <span className="text-cyan-400">Docs</span>
                                </span>
                                <p className="text-slate-500 text-sm mt-1">
                                    {tab === 'signin'
                                        ? 'Sign in to access your personalized report'
                                        : 'Create your account to start your skin journey'}
                                </p>
                            </div>

                            {/* Tab Switcher */}
                            <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                                {(['signin', 'signup'] as Tab[]).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTab(t)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${tab === t
                                            ? 'bg-white text-black shadow'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {t === 'signin' ? 'Sign In' : 'Create Account'}
                                    </button>
                                ))}
                            </div>

                            {/* ── Social Buttons ── */}
                            <div className="space-y-2 mb-4">
                                <button
                                    onClick={() => withLoading('google', signInWithGoogle)}
                                    disabled={!!loading}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white hover:bg-gray-50 text-gray-800 font-medium text-sm transition-all hover:shadow-lg disabled:opacity-50"
                                >
                                    {loading === 'google' ? <Loader2 className="w-5 h-5 animate-spin text-gray-600" /> : <GoogleIcon />}
                                    Continue with Google
                                </button>

                                <button
                                    onClick={() => withLoading('github', signInWithGithub)}
                                    disabled={!!loading}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-[#161B22] hover:bg-[#21262D] text-white font-medium text-sm transition-all hover:shadow-lg disabled:opacity-50"
                                >
                                    {loading === 'github' ? <Loader2 className="w-5 h-5 animate-spin" /> : <GithubIcon />}
                                    Continue with GitHub
                                </button>
                            </div>

                            {/* ── Divider ── */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-xs text-slate-600 font-mono">or continue with email</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            {/* ── Email Form ── */}
                            <form onSubmit={handleEmailSubmit} className="space-y-3">
                                {tab === 'signup' && (
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Full name"
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all"
                                        />
                                    </div>
                                )}
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="Email address"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Password"
                                        required
                                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {tab === 'signup' && (
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm password"
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all"
                                        />
                                        {confirmPassword && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {password === confirmPassword
                                                    ? <Check className="w-4 h-4 text-green-400" />
                                                    : <X className="w-4 h-4 text-red-400" />}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!!loading}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                                >
                                    {loading === 'email' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            {tab === 'signin' ? 'Sign In' : 'Create Account'}
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* ── Toggle Hint ── */}
                            <p className="text-center text-xs text-slate-600 mt-4">
                                {tab === 'signin' ? (
                                    <>Don&apos;t have an account?{' '}
                                        <button onClick={() => setTab('signup')} className="text-cyan-400 hover:underline">Create one free →</button>
                                    </>
                                ) : (
                                    <>Already have an account?{' '}
                                        <button onClick={() => setTab('signin')} className="text-cyan-400 hover:underline">Sign in →</button>
                                    </>
                                )}
                            </p>

                            {/* Privacy note */}
                            <p className="text-center text-[10px] text-slate-700 mt-3">
                                By continuing, you agree to our{' '}
                                <span className="underline cursor-pointer hover:text-slate-500">Terms</span> &{' '}
                                <span className="underline cursor-pointer hover:text-slate-500">Privacy Policy</span>
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// ─── Firebase Error Messages ──────────────────────────────────────────────────
function firebaseErrorMessage(code: string): string {
    const map: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'This email is already registered. Try signing in.',
        'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
        'auth/cancelled-popup-request': 'Sign-in was cancelled.',
        'auth/configuration-not-found': 'Auth not configured yet — Firebase setup required.',
    };
    return map[code] || `Sign-in error (${code}). Please try again.`;
}
