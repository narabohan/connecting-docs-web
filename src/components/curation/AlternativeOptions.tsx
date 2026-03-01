import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Activity, Clock, ShieldAlert, ChevronRight, X } from 'lucide-react';

interface AlternativeOption {
    name: string;
    category: string;
    suitabilityScore: number;
    targetArea: string;
    pain: string;
    downtime: string;
    reason: string;
}

interface AlternativeOptionsProps {
    options: AlternativeOption[];
    language: string;
}

export default function AlternativeOptions({ options, language }: AlternativeOptionsProps) {
    const [selectedOption, setSelectedOption] = useState<AlternativeOption | null>(null);

    if (!options || options.length === 0) return null;

    return (
        <div className="mt-12 space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-rose-500 rounded-full" />
                <h3 className="text-xl font-bold text-white">
                    {language === 'KO' ? '나의 관심 시술 딥다이브' : 'Explore Alternatives'}
                </h3>
            </div>

            {/* Horizontal Scroll Area */}
            <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide">
                {options.map((opt, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => setSelectedOption(opt)}
                        className="min-w-[280px] md:min-w-[320px] snap-center bg-[#111116] border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-rose-500/50 transition-all duration-300 group relative overflow-hidden"
                    >
                        {/* Background subtle glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 via-transparent to-rose-500/0 group-hover:from-rose-500/5 transition-colors duration-500 pointer-events-none" />

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2 py-1 rounded-md">
                                    {opt.category}
                                </span>
                                <h4 className="text-lg font-bold text-white mt-2 group-hover:text-rose-100 transition-colors">{opt.name}</h4>
                            </div>

                            {/* Circular Suitability Score */}
                            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-white/5"
                                        strokeWidth="3"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                                        strokeDasharray={`${opt.suitabilityScore}, 100`}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">{opt.suitabilityScore}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Activity className="w-3.5 h-3.5 text-rose-400/70" />
                                {opt.pain}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Clock className="w-3.5 h-3.5 text-rose-400/70" />
                                {opt.downtime}
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 text-sm text-gray-500 relative z-10">
                            <span className="flex items-center gap-1">
                                <Info className="w-3.5 h-3.5" />
                                {language === 'KO' ? '상세 리뷰 보기' : 'View Details'}
                            </span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Selected Option Detail Pop-up / Expanded Area */}
            <AnimatePresence>
                {selectedOption && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 bg-[#16161a] border border-rose-500/20 rounded-2xl relative">
                            <button
                                onClick={() => setSelectedOption(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-rose-500" />
                                Clinical Insight: {selectedOption.name}
                            </h4>
                            <div className="text-gray-400 text-sm mb-6 max-w-2xl">
                                {selectedOption.targetArea}
                            </div>

                            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                                <div className="text-rose-200 className-sm leading-relaxed">
                                    {selectedOption.reason}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => {
                                        // Dispatch a custom event or let the user click the chatbot.
                                        // The chatbot currently handles general queries, but we could make it 
                                        // respond to a specific action here if needed.
                                        const chatBtn = document.querySelector('[aria-label="Ask AI for more details"]') as HTMLElement;
                                        if (chatBtn) chatBtn.click();
                                    }}
                                    className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {language === 'KO' ? 'AI 챗봇으로 더 물어보기' : 'Ask AI Chatbot'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
