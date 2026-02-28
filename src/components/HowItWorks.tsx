import { motion } from 'framer-motion';
import { LanguageCode } from '@/utils/translations';

interface HowItWorksProps {
    language?: LanguageCode;
}

const steps = [
    {
        number: '01',
        title: { EN: 'Answer 8 Questions', KO: '8가지 질문 응답', JP: '8つの質問に回答', CN: '回答8个问题' },
        desc: {
            EN: 'Tell us about your skin concerns, pain tolerance, downtime preferences, and goals. Takes under 5 minutes.',
            KO: '피부 고민, 통증 내성, 다운타임 선호도, 목표를 알려주세요. 5분 이내로 완료됩니다.',
            JP: '肌の悩み、痛みの耐性、ダウンタイムの希望、目標をお聞かせください。5分以内で完了します。',
            CN: '告诉我们您的皮肤问题、疼痛耐受度、停工期偏好和目标。不到5分钟即可完成。',
        },
    },
    {
        number: '02',
        title: { EN: 'AI Clinical Analysis', KO: 'AI 임상 분석', JP: 'AI臨床分析', CN: 'AI临床分析' },
        desc: {
            EN: 'Our AI, trained on 80+ clinical protocols, maps your profile against evidence-based treatment data to find your optimal match.',
            KO: '80개+ 임상 프로토콜로 학습된 AI가 근거 중심 치료 데이터와 프로필을 대조해 최적의 시술을 찾아드립니다.',
            JP: '80以上の臨床プロトコルで訓練されたAIが、エビデンスに基づく治療データとプロフィールを照合し最適な施術を見つけます。',
            CN: '经过80+临床方案训练的AI，将您的档案与循证治疗数据进行匹配，找到最优方案。',
        },
    },
    {
        number: '03',
        title: { EN: 'Receive Your Report', KO: '리포트 수령', JP: 'レポートを受け取る', CN: '获取报告' },
        desc: {
            EN: 'Get a personalized Top 3 treatment report with clinical reasoning, risk analysis, and expected outcomes — completely free.',
            KO: '임상 근거, 위험 분석, 예상 결과가 담긴 맞춤형 Top 3 시술 리포트를 무료로 받아보세요.',
            JP: '臨床的根拠、リスク分析、期待される結果を含むパーソナライズされたTop 3施術レポートを無料で受け取れます。',
            CN: '免费获取包含临床依据、风险分析和预期效果的个性化Top 3疗程报告。',
        },
    },
    {
        number: '04',
        title: { EN: 'Connect with a Doctor', KO: '의사와 연결', JP: '医師とつながる', CN: '与医生连接' },
        desc: {
            EN: 'Use your report to have a more informed consultation with a specialist who aligns with your matched protocol.',
            KO: '매칭된 프로토콜에 맞는 전문의와 더 깊이 있는 상담을 위해 리포트를 활용하세요.',
            JP: 'マッチしたプロトコルに対応した専門医とより充実した相談ができます。',
            CN: '利用报告与匹配方案的专科医生进行更有价值的咨询。',
        },
    },
];

export default function HowItWorks({ language = 'EN' }: HowItWorksProps) {
    const lang = language as keyof typeof steps[0]['title'];
    return (
        <section className="py-24 bg-[#050505] text-slate-50 relative border-t border-white/5">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono tracking-widest uppercase mb-4">
                        {language === 'KO' ? '이용 방법' : language === 'JP' ? '使い方' : language === 'CN' ? '使用方法' : 'How It Works'}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold text-white">
                        {language === 'KO' ? '어떻게 작동하나요?' : language === 'JP' ? 'どのように機能する？' : language === 'CN' ? '如何运作？' : 'Four Steps to Your Report'}
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-4 gap-8 relative">
                    {/* Connection Line (Desktop) */}
                    <div className="hidden md:block absolute top-[2.5rem] left-[12.5%] w-3/4 h-px bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0" />

                    {steps.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            className="group relative z-10 flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center text-xl font-bold text-gray-600 mb-6 group-hover:border-blue-500/50 group-hover:text-blue-400 group-hover:bg-blue-500/5 transition-all duration-300 shadow-xl">
                                {s.number}
                            </div>
                            <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                {s.title[lang] || s.title.EN}
                            </h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                {s.desc[lang] || s.desc.EN}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
