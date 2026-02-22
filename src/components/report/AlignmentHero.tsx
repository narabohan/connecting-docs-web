'use client';
import { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface AlignmentHeroProps {
    score?: number;
    radarData: { subject: string; A: number; fullMark: number }[];
    language: LanguageCode;
}

export default function AlignmentHero({ score = 92, radarData, language }: AlignmentHeroProps) {
    const t = (REPORT_TRANSLATIONS[language] || REPORT_TRANSLATIONS['EN']).report?.hero || {
        score: 'ALIGNMENT SCORE',
        scoreLabel: 'Clinical Match',
        subtitle: 'Pre-Consulting Intelligence Report',
        matrixTitle: 'CLINICAL PROFILE MATRIX',
        toleranceZone: 'TOLERANCE_ZONE: MATCHED ✓',
        badges: { protocol: 'PROTOCOL MATCH', risk: 'RISK FILTERED', logic: 'LOGIC VERIFIED' },
        axes: {
            thickness: 'Skin Thickness', pain: 'Pain Tolerance', downtime: 'Downtime',
            pigment: 'Pigment Risk', aging: 'Aging Stage',
        },
    } as const;

    const [displayScore, setDisplayScore] = useState(0);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;
        let start = 0;
        const step = () => {
            start += 2;
            if (start >= score) { setDisplayScore(score); return; }
            setDisplayScore(start);
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [score]);

    // Map/localize radar axes
    const localizedData = radarData.map(item => {
        const axes = t.axes as Record<string, string>;
        const key = item.subject.toLowerCase().replace(/\s/g, '');
        const mapped = Object.entries(axes).find(([k]) => key.includes(k));
        return { ...item, subject: mapped ? mapped[1] : item.subject };
    });

    const renderTick = ({ x, y, payload }: any) => (
        <text x={x} y={y} dy={4} fill="#6ee7f7" fontSize={10} textAnchor="middle" fontFamily="monospace">
            {payload.value}
        </text>
    );

    // SVG circle ring params
    const r = 56;
    const circum = 2 * Math.PI * r;
    const progress = (displayScore / 100) * circum;

    return (
        <section className="relative w-full rounded-2xl overflow-hidden mb-6"
            style={{ background: 'linear-gradient(135deg, #0a0a2a 0%, #0d1040 60%, #081828 100%)', border: '1px solid rgba(0,255,255,0.15)' }}>
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at 20% 50%, rgba(0,255,255,0.06) 0%, transparent 60%)',
            }} />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Left: Score Ring */}
                <div className="flex flex-col items-center justify-center p-10 gap-4">
                    <div className="text-[10px] font-mono tracking-[0.3em] text-cyan-400/70 uppercase mb-2 flex items-center gap-2">
                        <Activity className="w-3 h-3" /> {t.score}
                    </div>

                    {/* Ring */}
                    <div className="relative">
                        <svg width="160" height="160" className="-rotate-90">
                            {/* Track */}
                            <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,255,255,0.08)" strokeWidth="8" />
                            {/* Progress */}
                            <circle
                                cx="80" cy="80" r={r}
                                fill="none"
                                stroke="#00FFFF"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${progress} ${circum}`}
                                style={{ filter: 'drop-shadow(0 0 8px #00FFFF)', transition: 'stroke-dasharray 0.05s linear' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-bold text-white font-mono" style={{ textShadow: '0 0 20px rgba(0,255,255,0.4)' }}>
                                {displayScore}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-mono tracking-widest">/100</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="text-sm font-bold text-white font-mono">{t.scoreLabel}</div>
                        <div className="text-[11px] text-white/40 mt-1 font-mono">{t.subtitle}</div>
                    </div>

                    {/* Status badges */}
                    <div className="flex gap-2 mt-2 flex-wrap justify-center">
                        {[
                            t.badges?.protocol || 'PROTOCOL MATCH',
                            t.badges?.risk || 'RISK FILTERED',
                            t.badges?.logic || 'LOGIC VERIFIED',
                        ].map((badge) => (
                            <span key={badge} className="text-[9px] font-mono px-2 py-1 rounded border tracking-widest"
                                style={{ borderColor: 'rgba(0,255,255,0.25)', color: '#00FFFF', background: 'rgba(0,255,255,0.05)' }}>
                                ✓ {badge}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Right: 5-axis Radar */}
                <div className="flex flex-col p-8">
                    <div className="text-[10px] font-mono tracking-[0.3em] text-cyan-400/70 uppercase mb-4">
                        {t.matrixTitle || 'CLINICAL PROFILE MATRIX'}
                    </div>
                    <div className="flex-1 min-h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={localizedData}>
                                <PolarGrid stroke="rgba(0,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={renderTick} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Profile"
                                    dataKey="A"
                                    stroke="#00FFFF"
                                    strokeWidth={2}
                                    fill="#00FFFF"
                                    fillOpacity={0.12}
                                    style={{ filter: 'drop-shadow(0 0 6px #00FFFF)' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-[9px] font-mono text-right text-cyan-400/40 mt-2">
                        {t.toleranceZone || 'TOLERANCE_ZONE: MATCHED ✓'}
                    </div>
                </div>
            </div>
        </section>
    );
}
