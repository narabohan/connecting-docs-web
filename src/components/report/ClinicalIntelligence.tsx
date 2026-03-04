'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Droplets, Target, Syringe } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BoosterItem {
    name: string;
    suitability: number;
    mechanism: string;
    pain?: string;
    downtime?: string;
    effect?: string;
    method?: string;
}

interface ClinicalIntelligenceProps {
    boosters: BoosterItem[];
    onSelectItem?: (item: BoosterItem) => void;
    activeItemName?: string;
    language?: string;
}

const CARD_STYLES = [
    { color: 'from-blue-400 to-cyan-500', Icon: Droplets },
    { color: 'from-amber-400 to-orange-500', Icon: Target },
    { color: 'from-emerald-400 to-teal-500', Icon: ShieldCheck },
    { color: 'from-purple-400 to-pink-500', Icon: Sparkles },
    { color: 'from-cyan-300 to-blue-400', Icon: Syringe }
];

export default function ClinicalIntelligence({ boosters, onSelectItem, activeItemName, language = 'EN' }: ClinicalIntelligenceProps) {
    if (!boosters || boosters.length === 0) return null;

    const parsePainLevel = (painStr?: string) => {
        const p = (painStr || '').toLowerCase();
        if (p.includes('low') || p.includes('none') || p.includes('zero')) return 3;
        if (p.includes('med')) return 6;
        if (p.includes('high')) return 9;
        return 5;
    };

    return (
        <section className="relative py-24 bg-[#050505] overflow-hidden rounded-[2rem] border border-white/5 mb-12">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-900/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6">
                        <Droplets className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-medium text-slate-300 tracking-wide uppercase">Synergy Protocols</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 uppercase tracking-tight">
                        Combination <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Skin Boosters</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        Optimize your device treatments with synergistic skin boosters. Combining energy-based devices with directed injectables accelerates regeneration and maximizes final aesthetic outcomes.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {boosters.map((booster, index) => {
                        const styleIdx = index % CARD_STYLES.length;
                        const { color, Icon } = CARD_STYLES[styleIdx];
                        const painScore = parsePainLevel(booster.pain);

                        return (
                            <motion.div
                                key={booster.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                onClick={() => onSelectItem?.(booster)}
                                className={cn(
                                    "group relative bg-[#111111] backdrop-blur-md rounded-2xl p-6 border transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer",
                                    activeItemName === booster.name ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,160,0.1)]' : 'border-[#1F1F1F] hover:border-cyan-500/30'
                                )}
                            >
                                {/* Accent Top Gradient */}
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${color} opacity-50`} />

                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 bg-opacity-10 shadow-lg shadow-black/50`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors pr-2 break-words">
                                            {booster.name}
                                        </h3>
                                        {activeItemName === booster.name && (
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 animate-pulse mt-2" />
                                        )}
                                    </div>
                                    <p className="text-xs text-cyan-400/80 font-mono mb-4 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" />
                                        {booster.suitability}% Match
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider block mb-1">Expected Effect</span>
                                            <p className="text-sm text-slate-300 font-medium leading-snug">{booster.effect || booster.mechanism}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider block mb-1">Injection Method</span>
                                            <p className="text-sm text-slate-400">{booster.method || 'MTS / ID'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-[#1F1F1F]">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[10px] uppercase font-mono text-slate-500">Pain Level: {booster.pain || 'Med'}</span>
                                        <span className="text-xs font-bold text-slate-300">{painScore}/10</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000",
                                                painScore >= 7 ? 'bg-red-500' :
                                                    painScore >= 4 ? 'bg-amber-400' : 'bg-emerald-400'
                                            )}
                                            style={{ width: `${Math.min(painScore * 10, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Hover Glow */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none`} />
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
