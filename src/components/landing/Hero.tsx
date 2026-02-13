import { motion } from 'framer-motion';
import { ArrowRight, Activity, Stethoscope, User } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { cn } from '@/utils/cn'; // Assuming you have a cn utility, if not I will use template literals

interface HeroProps {
    language?: LanguageCode;
}

type UserType = 'patient' | 'doctor';

export default function Hero({ language = 'EN' }: HeroProps) {
    const [userType, setUserType] = useState<UserType>('patient');
    const [typedText, setTypedText] = useState('');

    // Dynamic text based on user type
    const fullText = userType === 'patient'
        ? "Scanning Your Unique Skin Variables..."
        : "Analyzing Clinical Protocol Assets...";

    const t = (REPORT_TRANSLATIONS[language]?.landing || REPORT_TRANSLATIONS['EN'].landing).hero;

    useEffect(() => {
        let i = 0;
        setTypedText(''); // Reset on toggle
        const interval = setInterval(() => {
            setTypedText(fullText.slice(0, i + 1));
            i++;
            if (i > fullText.length) clearInterval(interval);
        }, 50);
        return () => clearInterval(interval);
    }, [fullText]);

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
                                I am a Patient
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
                                I am a Doctor
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
                                Tired of Skin Trial & Error? <br />
                                <span className={cn(
                                    "text-2xl md:text-4xl font-light mt-4 block",
                                    "bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-blue-400"
                                )}>
                                    Discover Your AI-Powered Signature Treatment
                                </span>
                            </>
                        ) : (
                            <>
                                Stop Repeating Consults <br />
                                <span className={cn(
                                    "text-2xl md:text-4xl font-light mt-4 block",
                                    "bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 to-emerald-400"
                                )}>
                                    Turn Your Expertise into a VIP Patient Magnet
                                </span>
                            </>
                        )}
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-4xl mx-auto mb-2 leading-relaxed font-light">
                        {userType === 'patient'
                            ? "피부 실험 피로? AI가 안전한 '나만의 시그니처 시술'을 찾아드립니다 – 개인화, 글로벌 연결."
                            : "반복 상담 피로? 노하우를 VIP 환자 유치 자산으로 바꾸세요."
                        }
                    </p>
                    <p className="text-sm md:text-base text-gray-500 max-w-3xl mx-auto mb-10 font-mono">
                        {userType === 'patient'
                            ? "From Price Wars to Logic-Driven Choices: Empowering Top 1% Connections."
                            : "Be the Chef with Signature Courses, Not Just a Menu Seller."
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
                            {userType === 'patient' ? "Get My Free Skin Report" : "Inquire Signature Registration"}
                            <span className="text-xs font-normal opacity-70 ml-1">(Free – Limited Access)</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                    </div>

                    <div className="mt-16 border-t border-white/10 pt-8 flex justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="text-center group">
                            <div className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">50+</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Verified Protocols</div>
                        </div>
                        <div className="text-center group">
                            <div className="text-3xl font-bold text-white group-hover:text-emerald-400 transition-colors">98%</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Logic Accuracy</div>
                        </div>
                        <div className="text-center group">
                            <div className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">RAG</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Medical Intelligence</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}



