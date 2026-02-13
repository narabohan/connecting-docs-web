import { useState, useEffect } from 'react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface LogicTerminalProps {
    text: string;
    language: LanguageCode;
}

export default function LogicTerminal({ text, language }: LogicTerminalProps) {
    const t = REPORT_TRANSLATIONS[language]?.logic || REPORT_TRANSLATIONS['EN'].logic;
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText('');
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText((prev) => prev + text.charAt(i));
            i++;
            if (i >= text.length) clearInterval(interval);
        }, 20); // Typing speed

        return () => clearInterval(interval);
    }, [text]);

    return (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 font-mono text-sm leading-relaxed h-full overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {t.title}
            </div>

            <div className="text-gray-300 min-h-[100px]">
                <span className="text-blue-400 mr-2">{'>'}</span>
                {displayedText}
                <span className="animate-pulse inline-block w-2 h-4 bg-blue-500 ml-1 align-middle" />
            </div>
        </div>
    );
}
