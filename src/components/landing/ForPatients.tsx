import { motion } from 'framer-motion';
import { Scan, Database, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface ForPatientsProps {
    language?: LanguageCode;
    onStartSurvey?: () => void;
}

const SURVEY_CTA: Record<LanguageCode, string> = {
    EN: 'Design My Life Treatment',
    KO: '나의 인생 시술 설계하기',
    JP: '理想の施術をデザインする',
    CN: '设计我的理想疗程',
};

export default function ForPatients({ language = 'EN', onStartSurvey }: ForPatientsProps) {
    const t = (REPORT_TRANSLATIONS[language]?.landing || REPORT_TRANSLATIONS['EN'].landing).patients;

    return (
        <section id="signup" className="py-24 bg-[#0A0A0A] relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                {/* Left: Content */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        {t.title} <br />
                        <span className="text-blue-500">{t.titleHighlight}</span>
                    </h2>
                    <p className="text-lg text-gray-400 mb-12">
                        {t.description}
                    </p>

                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                <Scan className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-2">{t.cards.report.title}</h4>
                                <p className="text-gray-400">{t.cards.report.desc}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500 shrink-0">
                                <Database className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-2">{t.cards.vault.title}</h4>
                                <p className="text-gray-400">{t.cards.vault.desc}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-2">{t.cards.care.title}</h4>
                                <p className="text-gray-400">{t.cards.care.desc}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right: Survey CTA Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex justify-center w-full"
                >
                    <div className="w-full max-w-md bg-gradient-to-br from-[#0f0f17] to-[#0a0a12] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10">
                            {/* Icon */}
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                                <Sparkles className="w-8 h-8 text-blue-400" />
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl font-bold text-white mb-3">
                                {language === 'KO' ? '무료 AI 피부 진단' :
                                    language === 'JP' ? '無料AIスキン診断' :
                                        language === 'CN' ? '免费AI皮肤诊断' :
                                            'Free AI Skin Diagnosis'}
                            </h3>
                            <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                                {language === 'KO' ? '80개 이상의 임상 프로토콜을 기반으로 나에게 맞는 Top 3 시술을 알아보세요. 로그인 없이 바로 시작 가능합니다.' :
                                    language === 'JP' ? '80以上の臨床プロトコルに基づき、あなたに最適なTop 3施術を見つけましょう。ログイン不要でご利用いただけます。' :
                                        language === 'CN' ? '基于80+临床方案，找到最适合您的Top 3疗程。无需登录即可开始。' :
                                            'Discover your Top 3 recommended treatments based on 80+ clinical protocols. Start instantly — no login required.'}
                            </p>

                            {/* Steps */}
                            <div className="space-y-3 mb-8">
                                {[
                                    language === 'KO' ? '5분 설문 응답' : language === 'JP' ? '5分アンケート回答' : language === 'CN' ? '5分钟问卷' : '5-min survey',
                                    language === 'KO' ? 'AI 임상 분석 (80+ 프로토콜)' : language === 'JP' ? 'AI臨床分析 (80+プロトコル)' : language === 'CN' ? 'AI临床分析 (80+方案)' : 'AI clinical analysis (80+ protocols)',
                                    language === 'KO' ? 'Top 3 시술 리포트 수령' : language === 'JP' ? 'Top 3施術レポート受取' : language === 'CN' ? '获取Top 3疗程报告' : 'Receive Your Top 3 Report',
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                                            {i + 1}
                                        </div>
                                        <span className="text-sm text-gray-300">{step}</span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={onStartSurvey}
                                className="w-full group/btn flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-blue-900/30"
                            >
                                {SURVEY_CTA[language] || SURVEY_CTA['EN']}
                                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </button>

                            <p className="text-center text-xs text-gray-600 mt-4">
                                {language === 'KO' ? '✓ 로그인 없이 시작 가능  ✓ 100% 무료' :
                                    language === 'JP' ? '✓ ログイン不要  ✓ 完全無料' :
                                        language === 'CN' ? '✓ 无需登录  ✓ 完全免费' :
                                            '✓ No login required  ✓ 100% Free'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
