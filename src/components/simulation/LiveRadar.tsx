'use client';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { motion } from 'framer-motion';

interface LiveRadarProps {
    data: any[];
    language: LanguageCode;
}

export default function LiveRadar({ data, language }: LiveRadarProps) {
    const t = (REPORT_TRANSLATIONS[language]?.simulation || REPORT_TRANSLATIONS['EN'].simulation).radar;

    return (
        <div className="w-full h-full min-h-[440px] flex flex-col items-center justify-center relative bg-[#02050A] rounded-3xl border border-[#00FFA0]/20 overflow-hidden shadow-[0_0_60px_rgba(0,255,160,0.05)_inset]">

            {/* Cyber Radar Background Image */}
            <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none flex items-center justify-center p-12">
                <img
                    src="/images/concepts/radar_bg.png"
                    alt="Radar Cybernetic Background"
                    className="w-full h-full object-contain object-center animate-[spin_180s_linear_infinite]"
                />
            </div>

            {/* High-Tech Decor Overlays */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-[#00FFA0]/30" />
                <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-[#00FFA0]/30" />
                <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-[#00FFA0]/30" />
                <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-[#00FFA0]/30" />
            </div>

            <h3 className="absolute top-6 left-6 text-[10px] font-mono text-[#00FFA0] uppercase tracking-[0.3em] font-bold z-20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA0] animate-pulse" />
                {t.title || "ACHIEVABLE IDEAL SKIN"}
            </h3>

            <div className="w-full h-[350px] relative z-20">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#00FFA0" strokeOpacity={0.15} gridType="circle" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#00FFA0', fontSize: 10, fontWeight: 500, opacity: 0.8 }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Ideal Skin"
                            dataKey="A"
                            stroke="#00FFA0"
                            strokeWidth={2}
                            fill="#00FFA0"
                            fillOpacity={0.25}
                            animationDuration={1500}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Labels for 5 axes */}
            <div className="absolute bottom-6 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[9px] text-[#00FFA0]/40 font-mono z-20 px-6 uppercase tracking-wider">
                <span className="flex items-center gap-1"><span className="w-1 h-1 bg-[#00FFA0]/30 rounded-full" /> {t.lifting}</span>
                <span className="flex items-center gap-1"><span className="w-1 h-1 bg-[#00FFA0]/30 rounded-full" /> {t.firmness}</span>
                <span className="flex items-center gap-1"><span className="w-1 h-1 bg-[#00FFA0]/30 rounded-full" /> {t.texture}</span>
                <span className="flex items-center gap-1"><span className="w-1 h-1 bg-[#00FFA0]/30 rounded-full" /> {t.glow}</span>
                <span className="flex items-center gap-1"><span className="w-1 h-1 bg-[#00FFA0]/30 rounded-full" /> {t.safety}</span>
            </div>

            {/* Scanning line effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-10">
                <div className="w-full h-1 bg-[#00FFA0] blur-[2px] animate-[scan_8s_linear_infinite]" />
            </div>
        </div>
    );
}
