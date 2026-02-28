import { ShieldCheck, Lock, Globe } from 'lucide-react';
import { LanguageCode, REPORT_TRANSLATIONS } from '@/utils/translations';

interface FooterProps {
    language?: LanguageCode;
}

export default function Footer({ language = 'EN' }: FooterProps) {
    return (
        <footer className="bg-[#050505] border-t border-white/5 py-12">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                    <div className="text-xl font-bold tracking-tighter text-white">
                        Connecting<span className="text-blue-500">Docs</span>
                    </div>

                    <div className="text-center md:text-right">
                        <p className="text-gray-400 italic mb-2">
                            "{REPORT_TRANSLATIONS[language]?.footer.tagline || REPORT_TRANSLATIONS['EN'].footer.tagline}"
                        </p>
                        <div className="flex justify-center md:justify-end gap-4 mt-4">
                            <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                                <ShieldCheck className="w-3 h-3" /> {REPORT_TRANSLATIONS[language]?.footer.compliance.hipaa || REPORT_TRANSLATIONS['EN'].footer.compliance.hipaa}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                                <Lock className="w-3 h-3" /> {REPORT_TRANSLATIONS[language]?.footer.compliance.iso || REPORT_TRANSLATIONS['EN'].footer.compliance.iso}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                                <Globe className="w-3 h-3" /> {REPORT_TRANSLATIONS[language]?.footer.compliance.fhir || REPORT_TRANSLATIONS['EN'].footer.compliance.fhir}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 text-center text-xs text-gray-600">
                    &copy; {new Date().getFullYear()} {REPORT_TRANSLATIONS[language]?.footer.copyright || REPORT_TRANSLATIONS['EN'].footer.copyright}
                </div>
            </div>
        </footer>
    );
}
