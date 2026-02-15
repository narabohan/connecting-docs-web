import { motion } from 'framer-motion';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { ArrowRight, Trophy, Star, Sparkles } from 'lucide-react';

interface SignatureRankingProps {
    language: LanguageCode;
    onSelectSolution: (rank: 1 | 2 | 3) => void;
}

export default function SignatureRanking({ language, onSelectSolution }: SignatureRankingProps) {
    const t = (REPORT_TRANSLATIONS[language]?.curation || REPORT_TRANSLATIONS['EN'].curation);

    // Fallback if translation is missing (safety)
    if (!t) return null;

    const cards = [
        { rank: 1, data: t.ranking.rank1, icon: Sparkles, color: 'from-cyan-400 to-blue-600', shadow: 'shadow-cyan-500/20' },
        { rank: 2, data: t.ranking.rank2, icon: Star, color: 'from-amber-300 to-orange-500', shadow: 'shadow-amber-500/20' },
        { rank: 3, data: t.ranking.rank3, icon: Trophy, color: 'from-purple-400 to-pink-600', shadow: 'shadow-purple-500/20' },
    ];

    return (
        <section className="relative py-24 bg-[#050505] overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-900/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-6">
                        {t.title}
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {cards.map((card, index) => (
                        <motion.div
                            key={card.rank}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                            onClick={() => onSelectSolution(card.rank as 1 | 2 | 3)}
                            className={`
                                group relative bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10
                                cursor-pointer overflow-hidden hover:border-white/20 transition-all duration-300
                                hover:shadow-2xl ${card.shadow}
                            `}
                        >
                            {/* Rank Badge */}
                            <div className="absolute top-4 right-4 text-xs font-mono font-bold text-white/30 group-hover:text-white transition-colors">
                                NO.0{card.rank}
                            </div>

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center mb-6`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                                {card.data.title}
                            </h3>
                            <p className="text-sm text-blue-300 font-mono mb-4">
                                {card.data.combo}
                            </p>
                            <p className="text-sm text-gray-400 leading-relaxed mb-8">
                                {card.data.reason}
                            </p>

                            {/* CTA */}
                            <div className="flex items-center text-sm font-medium text-white/50 group-hover:text-white transition-colors">
                                Deep Dive Analysis
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Hover Glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
