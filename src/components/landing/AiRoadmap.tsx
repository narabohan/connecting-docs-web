import { motion } from 'framer-motion';
import { LanguageCode } from '@/utils/translations';

interface AiRoadmapProps {
    language: LanguageCode;
}

const highlights = [
    {
        icon: '📊',
        name: {
            KO: '실제 장비 & 임상 프로토콜 DB',
            EN: 'Clinical Protocol Database'
        },
        description: {
            KO: '30여 종의 실제 EBD 장비 스펙과 80여 개의 검증된 임상 프로토콜을 디지털 자산으로 관리하여 진단의 근거로 활용합니다.',
            EN: 'Utilizes 30+ real EBD device specs and 80+ validated clinical protocols managed as digital assets for diagnosis.'
        },
        gradient: 'from-blue-500/20 to-cyan-500/5'
    },
    {
        icon: '👨‍⚕️',
        name: {
            KO: '전문의 시술 노하우 & 임상 지식',
            EN: 'Expert Procedural Intelligence'
        },
        description: {
            KO: 'Top 1% 피부 전문의들의 실제 시술 데이터와 최신 임상 가이드라인을 학습하여, 단순 정보를 넘어선 의학적 추론을 제공합니다.',
            EN: 'Learns from actual procedure data and clinical guidelines of top 1% dermatologists to provide medical reasoning.'
        },
        gradient: 'from-purple-500/20 to-indigo-500/5'
    },
    {
        icon: '🧠',
        name: {
            KO: '5개 모델 통합 AI 추론 엔진',
            EN: '5-AI Model Unified Engine'
        },
        description: {
            KO: '서로 다른 역할을 가진 5개의 특화 AI 모델이 환자의 고유 변수(통증, 예산, 목표)를 다차원 분석하여 최적의 솔루션을 도출합니다.',
            EN: '5 specialized AI models with unique roles analyze patient variables (pain, budget, goals) to derive optimal solutions.'
        },
        gradient: 'from-emerald-500/20 to-teal-500/5'
    },
    {
        icon: '🔄',
        name: {
            KO: '지속적 학습 & 지능 고도화',
            EN: 'Continuous Learning Loop'
        },
        description: {
            KO: '실제 시술 피드백과 매월 업데이트되는 신규 지식을 통해 추천 로직이 매일 더 정교하게 진화하는 자가 학습 시스템입니다.',
            EN: 'A self-improving system where recommendation logic evolves daily through procedural feedback and monthly knowledge updates.'
        },
        gradient: 'from-orange-500/20 to-red-500/5'
    }
];

export default function AiRoadmap({ language }: AiRoadmapProps) {
    const lang = (language === 'KO' || language === 'JA' || language === 'ZH') ? 'KO' : 'EN';

    return (
        <section className="relative py-32 overflow-hidden bg-[#050505]">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-50" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:64px_64px]" />

            <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-20 md:mb-28">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono tracking-widest uppercase mb-6"
                    >
                        Intelligence Architecture
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight"
                    >
                        Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">AI × 5</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-lg md:text-xl max-w-4xl mx-auto leading-relaxed"
                    >
                        {lang === 'KO'
                            ? '커넥팅닥스는 단순한 AI 챗봇이 아닙니다. 실제 장비 DB와 전문의 프로토콜, 그리고 5개의 특화 AI 모델이 결합된 상위 1%의 임상 추론 엔진입니다.'
                            : 'Connecting Docs is NOT just an AI chatbot. It is a top 1% clinical reasoning engine combined with real equipment DB, expert protocols, and 5 specialized AI models.'}
                    </motion.p>
                </div>

                {/* Simplified Pillar Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                    {highlights.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`group relative p-8 md:p-12 rounded-[2.5rem] border border-white/10 bg-gradient-to-br ${item.gradient} backdrop-blur-md overflow-hidden transition-all duration-500 hover:border-white/20`}
                        >
                            {/* Decorative Glow */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 -mr-24 -mt-24 rounded-full blur-[80px] group-hover:bg-white/10 transition-colors" />

                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-8 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight group-hover:text-cyan-400 transition-colors">
                                    {item.name[lang]}
                                </h3>
                                <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">
                                    {item.description[lang]}
                                </p>
                            </div>

                            {/* Hover Progress bar indicator */}
                            <div className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-cyan-500/80 via-blue-500/80 to-purple-500/80 w-0 group-hover:w-full transition-all duration-700 ease-in-out" />
                        </motion.div>
                    ))}
                </div>

                {/* Simplified Technical Trust Signals */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="mt-24 pt-12 border-t border-white/5 flex flex-wrap justify-center gap-12 md:gap-24"
                >
                    <div className="flex flex-col items-center">
                        <span className="text-white text-xl font-bold tracking-tighter mb-1 select-none">30+ Devices</span>
                        <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono font-bold">Hardware DB</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-white text-xl font-bold tracking-tighter mb-1 select-none">80+ Protocols</span>
                        <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono font-bold">Clinical Logic</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-white text-xl font-bold tracking-tighter mb-1 select-none">5 Specialists</span>
                        <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono font-bold">AI Models</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-white text-xl font-bold tracking-tighter mb-1 select-none">Real-Time Fit</span>
                        <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono font-bold">Patient Matching</span>
                    </div>
                </motion.div>

                {/* Footer simple text */}
                <p className="text-center text-[10px] text-slate-700 mt-16 font-mono tracking-widest uppercase">
                    Architected for Trust, Precision, and Clinical Authority
                </p>
            </div>
        </section>
    );
}

