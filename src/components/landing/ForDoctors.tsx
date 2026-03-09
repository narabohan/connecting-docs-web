import { Network, UploadCloud, TrendingUp, ArrowRight, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface ForDoctorsProps {
    language?: LanguageCode;
}

export default function ForDoctors({ language = 'EN' }: ForDoctorsProps) {
    const t = (REPORT_TRANSLATIONS[language]?.landing || REPORT_TRANSLATIONS['EN'].landing).doctors;

    return (
        <section id="doctors" className="py-24 bg-[#050505] border-t border-white/5">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                    {t.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">{t.titleHighlight}</span>
                </h2>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-16">
                    {t.description} <br />
                    <span className="text-sm font-mono text-gray-500 mt-2 block">{t.subDescription}</span>
                </p>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="bg-[#0A0A0A] p-8 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-colors group">
                        <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">{t.cards.upload.title}</h3>
                        <p className="text-gray-400">
                            {t.cards.upload.desc}
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-[#0A0A0A] p-8 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition-colors group">
                        <div className="w-16 h-16 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Network className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">{t.cards.match.title}</h3>
                        <p className="text-gray-400">
                            {t.cards.match.desc}
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-[#0A0A0A] p-8 rounded-2xl border border-white/10 hover:border-teal-500/50 transition-colors group">
                        <div className="w-16 h-16 mx-auto bg-teal-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-8 h-8 text-teal-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">{t.cards.revenue.title}</h3>
                        <p className="text-gray-400">
                            {t.cards.revenue.desc}
                        </p>
                    </div>
                </div>

                {/* Trust bar */}
                <div className="flex flex-wrap justify-center gap-8 mt-14 mb-10 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span>{language === 'KO' ? '베타 의사 모집 중' : language === 'JP' ? 'ベータ医師募集中' : language === 'CN' ? '正在招募测试医生' : 'Beta Doctors Being Accepted'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span>{language === 'KO' ? '온보딩 5분 이내' : language === 'JP' ? 'オンボーディング5分以内' : language === 'CN' ? '5分钟完成注册' : 'Onboarding under 5 minutes'}</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4">
                    <Link
                        href="/doctor/waitlist"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-colors shadow-xl group"
                    >
                        {t.cta}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="/doctor/waitlist"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/15 text-gray-400 hover:text-white hover:border-white/30 rounded-full text-sm transition-colors"
                    >
                        {language === 'KO' ? '문의하기' : language === 'JP' ? 'お問い合わせ' : language === 'CN' ? '联系我们' : 'Contact Us'}
                    </Link>
                </div>
            </div>
        </section>
    );
}
