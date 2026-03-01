import { motion } from 'framer-motion';
import { Star, Users, FileText } from 'lucide-react';
import { LanguageCode } from '@/utils/translations';

interface SocialProofProps {
    language?: LanguageCode;
}

const STATS = [
    {
        value: '500+',
        label: { EN: 'Reports Generated', KO: '생성된 리포트', JP: '生成されたレポート', CN: '已生成报告' },
        icon: FileText,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
    },
    {
        value: '80+',
        label: { EN: 'Clinical Protocols', KO: '임상 프로토콜', JP: '臨床プロトコル', CN: '临床方案' },
        icon: Star,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
    },
    {
        value: '4',
        label: { EN: 'Languages Supported', KO: '지원 언어', JP: '対応言語', CN: '支持语言' },
        icon: Users,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
    },
];

const TESTIMONIALS = [
    {
        name: 'Dr. Kim J.',
        role: { EN: 'Dermatologist, Seoul', KO: '피부과 전문의, 서울', JP: '皮膚科医, ソウル', CN: '皮肤科医生, 首尔' },
        quote: {
            EN: 'My patients arrive with ConnectingDocs reports already understanding their skin type and goals. Consultation time is cut in half.',
            KO: '환자들이 이미 자신의 피부 타입과 목표를 이해하고 리포트를 가지고 옵니다. 상담 시간이 절반으로 줄었어요.',
            JP: '患者さんがすでに肌質や目標を理解してレポートを持ってきます。診察時間が半分になりました。',
            CN: '我的患者带着ConnectingDocs报告来诊，已经了解自己的皮肤类型和目标。咨询时间缩短了一半。',
        },
        rating: 5,
    },
    {
        name: 'Sarah M.',
        role: { EN: 'Patient, Singapore', KO: '환자, 싱가포르', JP: '患者, シンガポール', CN: '患者, 新加坡' },
        quote: {
            EN: "I finally understood why certain treatments weren't working for my skin type. The report explained everything in plain language.",
            KO: '왜 특정 시술이 내 피부 타입에 맞지 않았는지 마침내 이해했어요. 리포트가 모든 것을 쉽게 설명해 줬어요.',
            JP: 'なぜ特定の施術が自分の肌質に合わなかったのか、やっと理解できました。レポートがすべてをわかりやすく説明してくれました。',
            CN: '我终于明白了为什么某些疗程对我的肤质不起作用。报告用通俗语言解释了一切。',
        },
        rating: 5,
    },
    {
        name: 'Dr. Park H.',
        role: { EN: 'Aesthetic Surgeon, Gangnam', KO: '성형외과 전문의, 강남', JP: '美容外科医, 江南', CN: '整形外科医生, 江南' },
        quote: {
            EN: 'The protocol matching system is incredibly accurate. It aligns with evidence-based approaches I use in my practice.',
            KO: '프로토콜 매칭 시스템이 놀라울 정도로 정확합니다. 제가 실제 진료에서 사용하는 근거 중심 접근 방식과 일치해요.',
            JP: 'プロトコルマッチングシステムは非常に精度が高い。私の診療で使用するエビデンスに基づいたアプローチと一致しています。',
            CN: '协议匹配系统非常准确。与我在实践中使用的循证方法高度吻合。',
        },
        rating: 5,
    },
];

export default function SocialProof({ language = 'EN' }: SocialProofProps) {
    const lang = language as keyof typeof TESTIMONIALS[0]['quote'];

    return (
        <section className="py-24 bg-[#080808] border-t border-white/5 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        {language === 'KO' ? '이미 신뢰하고 있습니다' :
                            language === 'JP' ? '信頼されています' :
                                language === 'CN' ? '值得信赖' :
                                    'Trusted by Doctors & Patients'}
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {language === 'KO' ? '의사와 환자 모두가 더 나은 결정을 내릴 수 있도록 돕습니다' :
                            language === 'JP' ? '医師と患者の両方がより良い意思決定を行えるよう支援します' :
                                language === 'CN' ? '帮助医生和患者做出更好的决策' :
                                    'Helping doctors and patients make better-informed decisions together'}
                    </p>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                    {STATS.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 text-center hover:border-blue-500/30 transition-all group"
                        >
                            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className={`text-4xl font-black ${stat.color} mb-2 tracking-tight`}>{stat.value}</div>
                            <div className="text-sm text-gray-400 font-medium uppercase tracking-widest">
                                {stat.label[lang] || stat.label.EN}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
