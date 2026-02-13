import { Network, UploadCloud, TrendingUp } from 'lucide-react';
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
                    Signature Logic <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Assetization</span>
                </h2>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-16">
                    Tired of Repetitive Explanations? Pre-Qualified VIPs Come with Your Reports. <br />
                    <span className="text-sm font-mono text-gray-500 mt-2 block">"반복 설명 피로? 준비된 VIP 환자가 원장님 리포트 들고 찾아옵니다."</span>
                </p>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="bg-[#0A0A0A] p-8 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-colors group">
                        <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Upload Protocol Asset</h3>
                        <p className="text-gray-400">
                            Digitize your unique treatment combinations. We verify and turn them into tradable logic assets.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-[#0A0A0A] p-8 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition-colors group">
                        <div className="w-16 h-16 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Network className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Patient-Logic Match</h3>
                        <p className="text-gray-400">
                            Our RAG engine matches your logic to patient skin data. No more random walk-ins.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-[#0A0A0A] p-8 rounded-2xl border border-white/10 hover:border-teal-500/50 transition-colors group">
                        <div className="w-16 h-16 mx-auto bg-teal-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-8 h-8 text-teal-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Build VIP Fanbase</h3>
                        <p className="text-gray-400">
                            Be the Chef with Signature Courses. Patients come for *your* logic, not just lowest price.
                        </p>
                    </div>
                </div>

                <div className="mt-16">
                    <Link
                        href="#signup"
                        className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                    >
                        {t.cta}
                    </Link>
                </div>
            </div>
        </section>
    );
}
