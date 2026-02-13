import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
    const [lang, setLang] = useState('EN');

    return (
        <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold tracking-tight text-white group">
                    Connecting<span className="text-primary group-hover:text-secondary transition-colors">Docs</span>
                </Link>

                <div className="flex items-center gap-8">
                    <div className="hidden md:flex gap-6 text-sm font-medium text-slate-400">
                        <Link href="#logic" className="hover:text-white transition-colors">The Logic</Link>
                        <Link href="#engine" className="hover:text-white transition-colors">The Engine</Link>
                        <Link href="#manifesto" className="hover:text-white transition-colors">Manifesto</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            className="px-3 py-1.5 text-xs font-bold bg-slate-800 border border-slate-700 rounded-full hover:bg-slate-700 hover:border-slate-500 text-slate-300 transition-all flex items-center gap-2"
                            onClick={() => setLang(lang === 'EN' ? 'KO' : 'EN')}
                        >
                            <span className="opacity-70">🌐</span> {lang}
                        </button>

                        <Link href="#start" className="hidden md:block px-5 py-2.5 bg-white text-slate-900 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors shadow-lg shadow-white/5 hover:shadow-white/20">
                            Start Analysis
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
