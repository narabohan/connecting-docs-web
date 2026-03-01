import { motion } from 'framer-motion';
import { Syringe, Sparkles, Droplets, Target, ShieldCheck } from 'lucide-react';
import { LanguageCode } from '@/utils/translations';
import { cn } from '@/utils/cn';

interface SkinBoosterRecommendationsProps {
    language: LanguageCode;
    recommendations?: any[];
}

// Temporary data until translations are fully updated
const COMBINATIONS = [
    {
        id: 'cb1',
        name: 'Glass Skin Rejuran',
        combo: 'Rejuran Healer + Skin Botox',
        effect: 'Deep Hydration & Pore Control',
        method: 'Direct Manual Injection (손주사)',
        pain: 'High',
        painScore: 9,
        icon: Droplets,
        color: 'from-blue-400 to-cyan-500'
    },
    {
        id: 'cb2',
        name: 'Collagen Volume Build',
        combo: 'Juvelook Volume + LDM',
        effect: 'Natural Volume & Skin Texture',
        method: 'Cannula / Deep Injection',
        pain: 'Medium',
        painScore: 5,
        icon: Target,
        color: 'from-amber-400 to-orange-500'
    },
    {
        id: 'cb3',
        name: 'Barrier Repair System',
        combo: 'ASCE+ Exosome + MNRF',
        effect: 'Anti-inflammatory & Regeneration',
        method: 'Microneedling Channeling',
        pain: 'Medium',
        painScore: 6,
        icon: ShieldCheck,
        color: 'from-emerald-400 to-teal-500'
    },
    {
        id: 'cb4',
        name: 'Chanel Radiance',
        combo: 'NCTF 135HA + Meso',
        effect: 'Instant Glow & Tone Up',
        method: 'Meso-Injector (인젝터)',
        pain: 'Low',
        painScore: 3,
        icon: Sparkles,
        color: 'from-purple-400 to-pink-500'
    },
    {
        id: 'cb5',
        name: 'Instant Aqua Glow',
        combo: 'Lilied M + Cryo',
        effect: 'Immediate Moisture Plumping',
        method: 'Meso-Injector (인젝터)',
        pain: 'Low',
        painScore: 2,
        icon: Syringe,
        color: 'from-cyan-300 to-blue-400'
    }
];

export default function SkinBoosterRecommendations({ language, recommendations }: SkinBoosterRecommendationsProps) {
    const apiBoosters = recommendations?.length ? recommendations.map((r, i) => ({
        id: r.id,
        name: r.name + " Booster Combo",
        combo: r.composition?.join(' + ') || r.name,
        effect: r.reasonWhy?.why_suitable || 'Deep Hydration & Regeneration',
        method: r.tags?.[0] || 'Targeted Injection',
        pain: r.reasonWhy?.pain_level || 'Medium',
        painScore: String(r.reasonWhy?.pain_level).toLowerCase().includes('high') ? 8 : String(r.reasonWhy?.pain_level).toLowerCase().includes('low') ? 3 : 5,
        icon: [Droplets, Target, ShieldCheck, Sparkles, Syringe][i % 5],
        color: ['from-blue-400 to-cyan-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-purple-400 to-pink-500', 'from-cyan-300 to-blue-400'][i % 5]
    })) : undefined;

    const displayBoosters = apiBoosters && apiBoosters.length > 0 ? apiBoosters : COMBINATIONS;

    return (
        <section className="relative py-24 bg-[#050505] overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-900/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
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

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
                    {displayBoosters.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="group relative bg-[#111111] backdrop-blur-md rounded-2xl p-6 border border-[#1F1F1F] hover:border-cyan-500/30 transition-all duration-300 flex flex-col h-full overflow-hidden"
                        >
                            {/* Accent Top Gradient */}
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.color} opacity-50`} />

                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 bg-opacity-10 shadow-lg shadow-black/50`}>
                                <item.icon className="w-5 h-5 text-white" />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                                    {item.name}
                                </h3>
                                <p className="text-xs text-cyan-400/80 font-mono mb-4">
                                    {item.combo}
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider block mb-1">Expected Effect</span>
                                        <p className="text-sm text-slate-300 font-medium line-clamp-2">{item.effect}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider block mb-1">Injection Method</span>
                                        <p className="text-sm text-slate-400">{item.method}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-[#1F1F1F]">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] uppercase font-mono text-slate-500">Pain Level: {item.pain}</span>
                                    <span className="text-xs font-bold text-slate-300">{item.painScore}/10</span>
                                </div>
                                <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-1000",
                                            item.painScore > 7 ? 'bg-red-500' :
                                                item.painScore > 4 ? 'bg-amber-400' : 'bg-emerald-400'
                                        )}
                                        style={{ width: `${item.painScore * 10}%` }}
                                    />
                                </div>
                            </div>

                            {/* Hover Glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none`} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
