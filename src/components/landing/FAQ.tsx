import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { LanguageCode } from '@/utils/translations';

interface FAQProps {
    language?: LanguageCode;
}

const FAQS = [
    {
        q: {
            EN: 'Is this a substitute for a doctor consultation?',
            KO: '이 서비스가 의사 상담을 대체하나요?',
            JP: 'このサービスは医師の診察の代替になりますか？',
            CN: '这个服务可以替代医生咨询吗？',
        },
        a: {
            EN: 'No. ConnectingDocs is an educational pre-consultation tool. Our AI report helps you understand your options before seeing a doctor — not replace that consultation. Always consult a licensed medical professional for diagnosis and treatment.',
            KO: '아니요. ConnectingDocs는 교육적 사전 상담 도구입니다. AI 리포트는 의사를 만나기 전 선택지를 이해하는 데 도움을 주는 것이지, 상담을 대체하지 않습니다. 진단과 치료를 위해서는 반드시 면허를 가진 의료 전문가와 상담하세요.',
            JP: 'いいえ。ConnectingDocsは教育的な事前相談ツールです。AIレポートは医師に会う前に選択肢を理解するためのものであり、診察の代替ではありません。診断と治療のためには必ず医療資格者にご相談ください。',
            CN: '不是。ConnectingDocs是一种教育性的预咨询工具。AI报告帮助您在看医生之前了解您的选择，而不是替代咨询。诊断和治疗请务必咨询持牌医疗专业人员。',
        },
    },
    {
        q: {
            EN: 'How is my personal data protected?',
            KO: '내 개인정보는 어떻게 보호되나요?',
            JP: '個人データはどのように保護されますか？',
            CN: '我的个人数据如何被保护？',
        },
        a: {
            EN: 'Your data is encrypted in transit and at rest. We do not sell your personal information to third parties. You can request deletion of your data at any time by contacting hello@connectingdocs.ai.',
            KO: '귀하의 데이터는 전송 중 및 저장 시 암호화됩니다. 저희는 귀하의 개인정보를 제3자에게 판매하지 않습니다. hello@connectingdocs.ai로 연락하여 언제든지 데이터 삭제를 요청할 수 있습니다.',
            JP: 'データは転送中および保存時に暗号化されます。個人情報を第三者に販売することはありません。hello@connectingdocs.aiにご連絡いただければ、いつでもデータの削除を依頼できます。',
            CN: '您的数据在传输和存储时均经过加密。我们不会将您的个人信息出售给第三方。您可以随时通过hello@connectingdocs.ai联系我们请求删除数据。',
        },
    },
    {
        q: {
            EN: 'How accurate is the AI recommendation?',
            KO: 'AI 추천은 얼마나 정확한가요?',
            JP: 'AIの推薦はどれほど正確ですか？',
            CN: 'AI推荐有多准确？',
        },
        a: {
            EN: 'Our recommendations are based on 80+ evidence-based clinical protocols developed by medical professionals. The system matches your profile against established treatment algorithms. However, individual results vary and final treatment decisions must be made with a qualified doctor.',
            KO: '저희 추천은 의료 전문가가 개발한 80개 이상의 근거 중심 임상 프로토콜을 기반으로 합니다. 시스템은 귀하의 프로필을 검증된 치료 알고리즘과 대조합니다. 단, 개인차가 있으며 최종 치료 결정은 자격을 갖춘 의사와 함께 내려야 합니다.',
            JP: '推薦は医療専門家が開発した80以上のエビデンスに基づく臨床プロトコルに基づいています。システムはあなたのプロフィールを確立された治療アルゴリズムと照合します。ただし、個人差があり、最終的な治療決定は資格を持つ医師と行う必要があります。',
            CN: '我们的推荐基于80+个由医疗专业人员开发的循证临床方案。系统将您的档案与既定治疗算法进行匹配。但个体结果不同，最终治疗决策必须与有资质的医生共同做出。',
        },
    },
    {
        q: {
            EN: 'Where can I get the recommended treatment?',
            KO: '추천된 시술을 어디서 받을 수 있나요?',
            JP: '推薦された施術はどこで受けられますか？',
            CN: '我在哪里可以接受推荐的治疗？',
        },
        a: {
            EN: 'The report is designed to help you have a more informed consultation with any licensed dermatologist or aesthetic clinic near you. We currently do not provide direct clinic referrals, but this feature is on our roadmap.',
            KO: '리포트는 가까운 면허 피부과 전문의 또는 미용 클리닉과 더 효과적인 상담을 하도록 도와줍니다. 현재는 직접 클리닉 추천 기능을 제공하지 않지만, 로드맵에 포함되어 있습니다.',
            JP: 'レポートは、近くの認定皮膚科医や美容クリニックとのより充実した相談に役立てるために設計されています。現在は直接のクリニック紹介機能はありませんが、ロードマップに含まれています。',
            CN: '报告旨在帮助您与附近任何持牌皮肤科医生或美容诊所进行更充分的咨询。我们目前不提供直接诊所转介，但此功能已在我们的路线图中。',
        },
    },
    {
        q: {
            EN: 'Is the report really free?',
            KO: '리포트가 정말 무료인가요?',
            JP: 'レポートは本当に無料ですか？',
            CN: '报告真的免费吗？',
        },
        a: {
            EN: 'Yes — the basic AI analysis and Top 3 report is completely free. A free account is required to save and access your report. Premium features for deeper analysis and doctor matching are available on paid plans.',
            KO: '네 — 기본 AI 분석 및 Top 3 리포트는 완전히 무료입니다. 리포트를 저장하고 접근하려면 무료 계정이 필요합니다. 더 깊은 분석과 의사 매칭을 위한 프리미엄 기능은 유료 플랜에서 제공됩니다.',
            JP: 'はい — 基本的なAI分析とTop 3レポートは完全無料です。レポートを保存・アクセスするには無料アカウントが必要です。より詳細な分析と医師マッチングのプレミアム機能は有料プランで利用できます。',
            CN: '是的——基本AI分析和Top 3报告完全免费。保存和访问报告需要免费账户。更深入分析和医生匹配的高级功能在付费计划中提供。',
        },
    },
];

export default function FAQ({ language = 'EN' }: FAQProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const lang = language as keyof typeof FAQS[0]['q'];

    return (
        <section className="py-24 bg-[#050505] border-t border-white/5">
            <div className="container mx-auto px-6 max-w-3xl">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-mono tracking-widest uppercase mb-4">
                        FAQ
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                        {language === 'KO' ? '자주 묻는 질문' :
                            language === 'JP' ? 'よくある質問' :
                                language === 'CN' ? '常见问题' :
                                    'Frequently Asked Questions'}
                    </h2>
                </motion.div>

                {/* FAQ Items */}
                <div className="space-y-3">
                    {FAQS.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className={`rounded-2xl border transition-colors duration-200 overflow-hidden ${
                                openIndex === i ? 'border-blue-500/30 bg-blue-950/10' : 'border-white/8 bg-[#0A0A0A] hover:border-white/15'
                            }`}
                        >
                            <button
                                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                            >
                                <span className="text-sm font-semibold text-white leading-snug">
                                    {faq.q[lang] || faq.q.EN}
                                </span>
                                <span className="shrink-0 text-gray-500">
                                    {openIndex === i
                                        ? <Minus className="w-4 h-4 text-blue-400" />
                                        : <Plus className="w-4 h-4" />}
                                </span>
                            </button>

                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="px-6 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                                            {faq.a[lang] || faq.a.EN}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* Contact CTA */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-sm text-gray-600 mt-10"
                >
                    {language === 'KO' ? '더 궁금한 점이 있으신가요? ' :
                        language === 'JP' ? 'まだご質問がありますか？ ' :
                            language === 'CN' ? '还有其他问题吗？ ' :
                                'Still have questions? '}
                    <a href="mailto:hello@connectingdocs.ai" className="text-blue-400 hover:text-blue-300 transition-colors">
                        hello@connectingdocs.ai
                    </a>
                </motion.p>

            </div>
        </section>
    );
}
