import SignupForm from '../auth/SignupForm';
import { Scan, Database, Shield } from 'lucide-react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface ForPatientsProps {
    language?: LanguageCode;
}

export default function ForPatients({ language = 'EN' }: ForPatientsProps) {
    const t = (REPORT_TRANSLATIONS[language]?.landing || REPORT_TRANSLATIONS['EN'].landing).patients;

    return (
        <section id="signup" className="py-24 bg-[#0A0A0A] relative overflow-hidden">
            <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                {/* Left: Content */}
                <div>
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
                </div>

                {/* Right: Sign Up Form */}
                <div className="flex justify-center w-full">
                    <div className="w-full max-w-md bg-white p-6 rounded-xl">
                        <SignupForm role="patient" />
                    </div>
                </div>
            </div>
        </section>
    );
}
