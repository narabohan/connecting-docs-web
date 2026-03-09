import Link from 'next/link';
import { Globe, ChevronDown, Check, LogOut, FileText, User, ChevronUp, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LanguageCode, REPORT_TRANSLATIONS } from '@/utils/translations';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/auth/AuthModal';

const LANGUAGES = [
    { code: 'EN', label: 'English' },
    { code: 'KO', label: '한국어' },
    { code: 'JP', label: '日本語' },
    { code: 'CN', label: '中文' },
];

interface HeaderProps {
    currentLang: LanguageCode;
    onLangChange: (lang: LanguageCode) => void;
}

export default function Header({ currentLang, onLangChange }: HeaderProps) {
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const { user, signOut, loading } = useAuth();

    // Close user menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const initials = user?.displayName
        ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : user?.email?.[0]?.toUpperCase() || 'U';

    return (
        <>
            <header className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="text-xl font-bold tracking-tighter text-white hover:opacity-80 transition-opacity">
                        Connecting<span className="text-cyan-400">Docs</span>
                    </Link>

                    {/* Navigation (Desktop) */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="#patients" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            {REPORT_TRANSLATIONS[currentLang]?.header?.nav?.patients || 'For Patients'}
                        </Link>
                        <Link href="#doctors" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            {REPORT_TRANSLATIONS[currentLang]?.header?.nav?.doctors || 'For Doctors'}
                        </Link>
                        <Link href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            {REPORT_TRANSLATIONS[currentLang]?.header?.nav?.pricing || 'Pricing'}
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Language Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setIsLangOpen(!isLangOpen)}
                                className="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
                            >
                                <Globe className="w-4 h-4" />
                                <span>{currentLang}</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isLangOpen && (
                                <div className="absolute top-full right-0 mt-2 w-32 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1">
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => { onLangChange(lang.code as LanguageCode); setIsLangOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-white/5 hover:text-white flex items-center justify-between"
                                        >
                                            <span>{lang.label}</span>
                                            {currentLang === lang.code && <Check className="w-3 h-3 text-cyan-400" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="h-4 w-px bg-white/10" />

                        {/* ── Auth State ─────────────────────────────── */}
                        {!loading && (
                            user ? (
                                /* Logged In: Avatar + Dropdown */
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                                    >
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                                {initials}
                                            </div>
                                        )}
                                        <span className="text-xs text-white font-medium hidden sm:block max-w-[80px] truncate">
                                            {user.displayName || user.email?.split('@')[0]}
                                        </span>
                                        {isUserMenuOpen
                                            ? <ChevronUp className="w-3 h-3 text-slate-400" />
                                            : <ChevronDown className="w-3 h-3 text-slate-400" />}
                                    </button>

                                    {isUserMenuOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1">
                                            <div className="px-4 py-2 border-b border-white/5">
                                                <p className="text-xs text-white font-medium truncate">{user.displayName}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                                            </div>
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                My Reports
                                            </Link>
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                            >
                                                <User className="w-3.5 h-3.5" />
                                                Profile
                                            </Link>
                                            <button
                                                onClick={() => { signOut(); setIsUserMenuOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 border-t border-white/5 mt-1"
                                            >
                                                <LogOut className="w-3.5 h-3.5" />
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Not Logged In: Login + Get Report buttons */
                                <>
                                    <button
                                        onClick={() => setIsAuthModalOpen(true)}
                                        className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block"
                                    >
                                        {REPORT_TRANSLATIONS[currentLang]?.header?.nav?.login || 'Log In'}
                                    </button>
                                    <button
                                        onClick={() => setIsAuthModalOpen(true)}
                                        className="px-5 py-2 text-sm font-bold text-black bg-white rounded-full hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                                    >
                                        {REPORT_TRANSLATIONS[currentLang]?.header?.nav?.getReport || 'Get Report'}
                                    </button>
                                </>
                            )
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="fixed top-20 left-0 right-0 z-40 md:hidden bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 shadow-2xl">
                    <nav className="container mx-auto px-6 py-4 flex flex-col gap-1">
                        <Link
                            href="#patients"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                            {REPORT_TRANSLATIONS[currentLang]?.header?.nav?.patients || 'For Patients'}
                        </Link>
                        <Link
                            href="#doctors"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                            {REPORT_TRANSLATIONS[currentLang]?.header?.nav?.doctors || 'For Doctors'}
                        </Link>
                        <Link
                            href="#pricing"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                            {REPORT_TRANSLATIONS[currentLang]?.header?.nav?.pricing || 'Pricing'}
                        </Link>
                        <div className="border-t border-white/10 mt-2 pt-3">
                            {!user && (
                                <button
                                    onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                                    className="w-full px-4 py-3 text-sm font-bold text-black bg-white rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    {REPORT_TRANSLATIONS[currentLang]?.header?.nav?.getReport || 'Get Report'}
                                </button>
                            )}
                        </div>
                    </nav>
                </div>
            )}

            {/* Auth Modal */}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
    );
}
