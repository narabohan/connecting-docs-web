import Link from 'next/link';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useState } from 'react';
import { LanguageCode } from '@/utils/translations';

const LANGUAGES = [
    { code: 'EN', label: 'English' },
    { code: 'KO', label: '한국어' },
    { code: 'JP', label: '日本語' },
    { code: 'CN', label: '中文' }
];

interface HeaderProps {
    currentLang: LanguageCode;
    onLangChange: (lang: LanguageCode) => void;
}

export default function Header({ currentLang, onLangChange }: HeaderProps) {
    const [isLangOpen, setIsLangOpen] = useState(false);

    return (
        <header className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-xl font-bold tracking-tighter text-white hover:opacity-80 transition-opacity">
                    Connecting<span className="text-blue-500">Docs</span>
                </Link>

                {/* Navigation (Desktop) */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="#signup" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        For Patients
                    </Link>
                    <Link href="#doctors" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        For Doctors
                    </Link>
                    <Link href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        Pricing
                    </Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {/* Language Switcher */}
                    <div className="relative">
                        <button
                            onClick={() => setIsLangOpen(!isLangOpen)}
                            className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition-colors"
                        >
                            <Globe className="w-4 h-4" />
                            <span>{currentLang}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isLangOpen && (
                            <div className="absolute top-full right-0 mt-2 w-32 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            onLangChange(lang.code as LanguageCode);
                                            setIsLangOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-white/5 hover:text-white flex items-center justify-between group"
                                    >
                                        <span>{lang.label}</span>
                                        {currentLang === lang.code && <Check className="w-3 h-3 text-blue-500" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-4 w-px bg-white/10 mx-2" />

                    <Link href="/login" className="text-sm font-bold text-white hover:text-blue-400 transition-colors hidden sm:block">
                        Log In
                    </Link>

                    <Link
                        href="#signup"
                        className="px-5 py-2 text-sm font-bold text-black bg-white rounded-full hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                    >
                        Get Report
                    </Link>
                </div>
            </div>
        </header>
    );
}
