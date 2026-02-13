import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface JudgmentLayerProps {
    language?: LanguageCode;
}

export default function JudgmentLayer({ language = 'EN' }: JudgmentLayerProps) {
    const t = (REPORT_TRANSLATIONS[language]?.landing || REPORT_TRANSLATIONS['EN'].landing).judgment;

    return (
        <section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-900/5 blur-3xl rounded-full translate-x-1/2" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">

                    {/* Left: Copy & Empathy */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{t.badge}</span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                            {t.title} <br />
                            <span className="text-red-500">{t.titleHighlight}</span>
                        </h2>

                        <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                            <p>
                                <strong className="text-white">&quot;{t.quote}&quot;</strong>
                            </p>
                            <p>
                                {t.desc}
                            </p>
                            <p className="text-sm font-mono text-gray-500 border-l-2 border-gray-800 pl-4">
                                {t.quoteKorean}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">{t.cards.filter.title}</h4>
                                    <p className="text-xs text-gray-400">{t.cards.filter.desc}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">{t.cards.safe.title}</h4>
                                    <p className="text-xs text-gray-400">{t.cards.safe.desc}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Visual Proof (Mockup) */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        {/* Abstract UI Mockup */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-2xl -z-10 rounded-full" />

                        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                            {/* Mock Header */}
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 uppercase tracking-widest">Analysis Report</span>
                                    <span className="text-white font-bold">{t.mock.title}</span>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                            </div>

                            {/* Radar Chart Placeholder / Risk Visual */}
                            <div className="aspect-square bg-black/50 rounded-xl mb-6 relative flex items-center justify-center border border-gray-800/50">
                                {/* Conceptual Radar Lines */}
                                <div className="absolute w-[80%] h-[80%] border border-gray-800 rounded-full opacity-30"></div>
                                <div className="absolute w-[60%] h-[60%] border border-gray-800 rounded-full opacity-30"></div>
                                <div className="absolute w-[40%] h-[40%] border border-gray-800 rounded-full opacity-30"></div>

                                {/* Risk Area (Red Polygon Mock) */}
                                <svg viewBox="0 0 100 100" className="w-full h-full p-8 absolute opacity-80">
                                    <title>Risk Radar Chart</title>
                                    <polygon points="50,10 90,40 80,90 20,90 10,40" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
                                    <circle cx="50" cy="10" r="3" fill="#ef4444" />
                                    <text x="50" y="5" textAnchor="middle" fill="#ef4444" fontSize="6" className="font-mono">Pain Level</text>
                                </svg>

                                <div className="text-center relative z-10 bg-black/80 p-2 rounded backdrop-blur">
                                    <div className="text-3xl font-bold text-red-500">{t.mock.level}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">{t.mock.label}</div>
                                </div>
                            </div>

                            {/* Excluded List */}
                            <div className="space-y-3">
                                <div className="text-xs text-gray-400 font-mono mb-2">{t.mock.excluded}</div>
                                <div className="flex justify-between items-center p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
                                    <span className="text-sm text-gray-300">Thermage FLX (Standard)</span>
                                    <span className="text-xs text-red-400 font-mono">PAIN_LIMIT_EXCEEDED</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
                                    <span className="text-sm text-gray-300">CO2 Fractional</span>
                                    <span className="text-xs text-red-400 font-mono">DOWNTIME_CONFLICT</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 -right-6 bg-blue-600 text-white p-4 rounded-xl shadow-xl hidden md:block">
                            <div className="text-xs font-bold uppercase opacity-80 mb-1">Safety First</div>
                            <div className="font-bold">Protocol Validated</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
