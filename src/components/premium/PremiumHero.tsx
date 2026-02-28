import { motion, AnimatePresence } from 'framer-motion';
import { motion as m } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArrowRight, Fingerprint, Activity, Globe, User, Scissors } from 'lucide-react';
import { LanguageCode, REPORT_TRANSLATIONS } from '@/utils/translations';

interface PremiumHeroProps {
    readonly language: LanguageCode;
    readonly onStartAnalysis: () => void;
}

export default function PremiumHero({ language, onStartAnalysis }: PremiumHeroProps) {
    const [mode, setMode] = useState<'patient' | 'doctor'>('patient');
    const t = (REPORT_TRANSLATIONS[language]?.landing || REPORT_TRANSLATIONS['EN'].landing).hero;

    // Content mapping for Dynamic Hero
    const content = {
        badge: t.badge,
        title: t.dynamicTitle[mode].main,
        subTitle: t.dynamicTitle[mode].sub,
        description: t.dynamicDesc[mode],
        cta: t.dynamicCta[mode],
        stats: [
            { label: t.stats.protocols, value: mode === 'patient' ? "80+" : "12,000+" },
            { label: t.stats.accuracy, value: "99.8%" },
            { label: t.stats.monitoring, value: "24/7" },
        ]
    };

    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#050505] pt-24 pb-12">
            {/* 1. Background Visuals */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(#00F0FF 0.5px, transparent 0.5px)`,
                        backgroundSize: '32px 32px'
                    }}
                />
                <m.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.4, 0.3]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px]"
                />
            </div>

            <div className="container mx-auto px-6 z-10">
                {/* 2. Mode Selector Toggle */}
                <div className="flex justify-center mb-12">
                    <div className="p-1.5 bg-surface-gray border border-border-slate rounded-full flex gap-2">
                        <button
                            onClick={() => setMode('patient')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'patient' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            <User className="w-4 h-4" />
                            {t.toggle.patient}
                        </button>
                        <button
                            onClick={() => setMode('doctor')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'doctor' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Scissors className="w-4 h-4" />
                            {t.toggle.doctor}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center text-center">
                    {/* 3. Hero Content Area */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.02, y: -10 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-4xl"
                        >
                            {/* Top Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/10 backdrop-blur-md mb-8">
                                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400">{content.badge}</span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[1] text-white uppercase italic">
                                {content.title} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-200">
                                    {content.subTitle}
                                </span>
                            </h1>

                            {/* Subheadline & Description */}
                            <div className="space-y-4 mb-12 max-w-2xl mx-auto">
                                <p className="text-lg md:text-xl text-slate-200 font-medium leading-relaxed">
                                    {content.description}
                                </p>
                            </div>

                            {/* Main CTA */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <button
                                    onClick={onStartAnalysis}
                                    className="group relative px-10 py-5 bg-white text-black rounded-full font-black text-lg transition-all hover:bg-cyan-400 hover:scale-[1.05] shadow-[0_0_40px_rgba(255,255,255,0.1)] overflow-hidden"
                                >
                                    <span className="relative z-10 inline-flex items-center gap-2">
                                        {content.cta}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* 4. Bento Stats Container */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-24 w-full max-w-5xl">
                        {/* Protocl Mapping */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 text-left group hover:border-cyan-500/30 transition-all">
                            <Fingerprint className="w-6 h-6 text-cyan-400 mb-4" />
                            <div className="text-3xl font-black text-white mb-1">{content.stats[0].value}</div>
                            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">{content.stats[0].label}</div>
                            <div className="mt-4 h-[1px] w-full bg-white/5 group-hover:bg-cyan-500/20" />
                        </div>

                        {/* Accuracy */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 text-left group hover:border-cyan-500/30 transition-all">
                            <Activity className="w-6 h-6 text-blue-400 mb-4" />
                            <div className="text-3xl font-black text-white mb-1">{content.stats[1].value}</div>
                            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">{content.stats[1].label}</div>
                            <div className="mt-4 h-[1px] w-full bg-white/5 group-hover:bg-blue-500/20" />
                        </div>

                        {/* Monitoring */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 text-left group hover:border-cyan-500/30 transition-all">
                            <Globe className="w-6 h-6 text-indigo-400 mb-4" />
                            <div className="text-3xl font-black text-white mb-1">{content.stats[2].value}</div>
                            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">{content.stats[2].label}</div>
                            <div className="mt-4 h-[1px] w-full bg-white/5 group-hover:bg-indigo-500/20" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
