import { motion } from 'framer-motion';
import { ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface HeroProps {
    language?: LanguageCode;
}

export default function Hero({ language = 'EN' }: HeroProps) {
    const [typedText, setTypedText] = useState('');
    const fullText = "Scanning Clinical Variables...";
    const t = (REPORT_TRANSLATIONS[language]?.landing || REPORT_TRANSLATIONS['EN'].landing).hero;

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setTypedText(fullText.slice(0, i + 1));
            i++;
            if (i > fullText.length) clearInterval(interval);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505]">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-black/90 z-10" />
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                    src="/hero-diagram-bg.png"
                    alt="Medical Intelligence Network"
                    className="w-full h-full object-cover opacity-60"
                />
            </div>

            <div className="container mx-auto px-6 z-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-8">
                        <Activity className="w-3 h-3 animate-pulse" />
                        <span>v2.0 SYSTEM ONLINE</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                        Connecting Docs <br />
                        <span className="text-2xl md:text-4xl font-light text-gray-200 mt-4 block">
                            수익 주도형 메디컬 인텔리전스 v2.0
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-4xl mx-auto mb-2 leading-relaxed font-light">
                        데이터와 임상 권위를 통해 K-Aesthetics의 탈상품화를 주도하다.
                    </p>
                    <p className="text-sm md:text-base text-gray-500 max-w-3xl mx-auto mb-10 font-mono">
                        A Medical Intelligence Platform turning Clinical Judgment into Tradable Assets.
                    </p>

                    <div className="font-mono text-sm text-blue-300 mb-10 h-6">
                        &gt; {typedText}<span className="animate-pulse">_</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                        <Link
                            href="#signup"
                            className="group px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-100 transition-all flex items-center gap-2"
                        >
                            {t.cta}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="#doctors"
                            className="px-8 py-4 bg-white/5 text-white rounded-full font-bold text-lg border border-white/10 hover:bg-white/10 transition-all"
                        >
                            {t.doctors}
                        </Link>
                    </div>

                    <div className="mt-12 flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Trust Badges / Stats */}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">50+</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">{t.stats.protocols}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">98%</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">{t.stats.accuracy}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">24/7</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">{t.stats.monitoring}</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
