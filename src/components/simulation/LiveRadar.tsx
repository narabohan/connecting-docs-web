import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface LiveRadarProps {
    data: any[];
    language: LanguageCode;
}

export default function LiveRadar({ data, language }: LiveRadarProps) {
    const t = (REPORT_TRANSLATIONS[language]?.simulation || REPORT_TRANSLATIONS['EN'].simulation).radar;

    return (
        <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center relative bg-black/40 rounded-3xl border border-white/5">
            <h3 className="absolute top-6 left-6 text-sm font-mono text-cyan-400 uppercase tracking-widest">
                {t.title || "ACHIEVABLE IDEAL SKIN"}
            </h3>

            <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#333" strokeDasharray="3 3" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Ideal Skin"
                            dataKey="A"
                            stroke="#06b6d4"
                            strokeWidth={3}
                            fill="#06b6d4"
                            fillOpacity={0.4}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Labels for 5 axes */}
            <div className="absolute bottom-4 flex gap-4 text-[10px] text-gray-500 font-mono">
                <span>• {t.lifting}</span>
                <span>• {t.firmness}</span>
                <span>• {t.texture}</span>
                <span>• {t.glow}</span>
                <span>• {t.safety}</span>
            </div>
        </div>
    );
}
