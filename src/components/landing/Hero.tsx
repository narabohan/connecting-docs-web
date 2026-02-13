import { motion } from 'framer-motion';
import { ArrowRight, Activity, Stethoscope, User } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { cn } from '@/utils/cn';

interface HeroProps {
    language?: LanguageCode;
}

type UserType = 'patient' | 'doctor';

export default function Hero({ language = 'EN' }: HeroProps) {
    const [userType, setUserType] = useState<UserType>('patient');
    const [typedText, setTypedText] = useState('');

    const t = (REPORT_TRANSLATIONS[language]?.landing || REPORT_TRANSLATIONS['EN'].landing).hero;

    // Dynamic text based on user type from translations
    const fullText = userType === 'patient'
        ? t.typing.patient[0]
        : t.typing.doctor[0];

    useEffect(() => {
        let currentText = '';
        let isDeleting = false;
        let loopNum = 0;
        const typingSpeed = 50;

        const handleType = () => {
            const i = loopNum % 2;
            const fullTxt = userType === 'patient' ? t.typing.patient[i] : t.typing.doctor[i];

            if (isDeleting) {
                currentText = fullTxt.substring(0, currentText.length - 1);
            } else {
                currentText = fullTxt.substring(0, currentText.length + 1);
            }

            setTypedText(currentText);

            if (!isDeleting && currentText === fullTxt) {
                setTimeout(() => isDeleting = true, 2000); // Pause at end
            } else if (isDeleting && currentText === '') {
                isDeleting = false;
                loopNum++;
            }
        };

        const timer = setInterval(handleType, typingSpeed);
        return () => clearInterval(timer);
    }, [userType, language, t]);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505] pt-20">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black/90 z-10" />
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                    src="/hero-diagram-bg.png"
                    alt="Medical Intelligence Network"
                    className="w-full h-full object-cover opacity-50"
                />
            </div>

            <div className="container mx-auto px-6 z-20 text-center relative">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* User Type Toggle */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-white/5 backdrop-blur-md p-1 rounded-full border border-white/10 inline-flex">
                            <button
                                onClick={() => setUserType('patient')}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
                                    userType === 'patient'
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                                        : "text-gray-400 hover:text-white"
                                )}
                            >
                                <User className="w-4 h-4" />
                                {t.toggle.patient}
                            </button>
                            <button
                                onClick={() => setUserType('doctor')}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
                                    userType === 'doctor'
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                                        : "text-gray-400 hover:text-white"
                                )}
                            >
                                <Stethoscope className="w-4 h-4" />
                                {t.toggle.doctor}
                            </button>
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-6">
                        <Activity className="w-3 h-3 animate-pulse" />
                        <span>v2.0 SYSTEM ONLINE</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
                        {userType === 'patient' ? (
                            <>
                                {t.dynamicTitle.patient.main} <br />
                                <span className={cn(
                                    "text-2xl md:text-4xl font-light mt-4 block",
                                    "bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-blue-400"
                                )}>
                                    {t.dynamicTitle.patient.sub}
                                </span>
                            </>
                        ) : (
                            <>
                                {t.dynamicTitle.doctor.main} <br />
                                <span className={cn(
                                    "text-2xl md:text-4xl font-light mt-4 block",
                                    "bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 to-emerald-400"
                                )}>
                                    {t.dynamicTitle.doctor.sub}
                                </span>
                            </>
                        )}
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-4xl mx-auto mb-2 leading-relaxed font-light">
                        {userType === 'patient'
                            ? t.dynamicDesc.patient
                            : t.dynamicDesc.doctor
                        }
                    </p>
                    <p className="text-sm md:text-base text-gray-500 max-w-3xl mx-auto mb-10 font-mono">
                        {userType === 'patient'
                            ? t.dynamicSubDesc.patient
                            : t.dynamicSubDesc.doctor
                        }
                    </p>

                    <div className="font-mono text-sm text-blue-300 mb-10 h-6">
                        &gt; {typedText}<span className="animate-pulse">_</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                        <Link
                            href={userType === 'patient' ? "#signup" : "#doctors"}
                            className={cn(
                                "group px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1",
                                userType === 'patient'
                                    ? "bg-white text-black hover:bg-gray-100"
                                    : "bg-emerald-500 text-white hover:bg-emerald-400"
                            )}
                        >
                            {userType === 'patient' ? t.dynamicCta.patient : t.dynamicCta.doctor}
                            <span className="text-xs font-normal opacity-70 ml-1">(Free – Limited Access)</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                    </div>

                    <div className="mt-16 border-t border-white/10 pt-8 flex justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="text-center group">
                            <div className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">50+</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t.stats.protocols}</div>
                        </div>
                        <div className="text-center group">
                            <div className="text-3xl font-bold text-white group-hover:text-emerald-400 transition-colors">98%</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t.stats.accuracy}</div>
                        </div>
                        <div className="text-center group">
                            <div className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">RAG</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t.stats.monitoring}</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
