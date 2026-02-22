import { useState } from 'react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface WhatIfSlidersProps {
    language?: LanguageCode;
    baseScore?: number;
    onScoreChange?: (score: number) => void;
}

export default function WhatIfSliders({ language = 'EN', baseScore = 92, onScoreChange }: WhatIfSlidersProps) {
    const t = (REPORT_TRANSLATIONS[language] || REPORT_TRANSLATIONS['EN']).report?.sliders || {
        title: 'WHAT-IF SIMULATOR',
        subtitle: 'Adjust tolerance parameters to recalculate your optimal match.',
        pain: 'Pain Tolerance',
        downtime: 'Downtime Acceptance',
        days: 'days',
        painLabels: ['Minimal', 'Moderate', 'High'],
        downtimeLabels: ['Zero', '1-3 Days', '5+ Days'],
        scoreLabel: 'Projected Score',
    };

    const [pain, setPain] = useState(50);
    const [downtime, setDowntime] = useState(2);

    // Compute simulated score delta
    const painDelta = Math.round((pain - 50) * 0.08);
    const downtimeDelta = Math.round((downtime - 2) * 1.5);
    const simulatedScore = Math.min(100, Math.max(60, baseScore + painDelta + downtimeDelta));

    const handlePain = (v: number) => {
        setPain(v);
        onScoreChange?.(Math.min(100, Math.max(60, baseScore + Math.round((v - 50) * 0.08) + downtimeDelta)));
    };

    const handleDowntime = (v: number) => {
        setDowntime(v);
        onScoreChange?.(Math.min(100, Math.max(60, baseScore + painDelta + Math.round((v - 2) * 1.5))));
    };

    const painLabel = pain <= 30 ? t.painLabels?.[0] : pain <= 70 ? t.painLabels?.[1] : t.painLabels?.[2];
    const downtimeLabel = downtime <= 1 ? t.downtimeLabels?.[0] : downtime <= 3 ? t.downtimeLabels?.[1] : t.downtimeLabels?.[2];

    return (
        <section className="w-full mb-6 rounded-2xl p-6"
            style={{
                background: 'rgba(10,10,42,0.7)',
                border: '1px solid rgba(0,255,255,0.1)',
                backdropFilter: 'blur(12px)',
            }}>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="text-[10px] font-mono tracking-[0.3em] mb-1" style={{ color: 'rgba(0,255,255,0.6)' }}>
                        ◈ {t.title}
                    </div>
                    <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {t.subtitle}
                    </div>
                </div>
                {/* Live score readout */}
                <div className="text-right flex-shrink-0 ml-6">
                    <div className="text-[10px] font-mono mb-1" style={{ color: 'rgba(0,255,255,0.5)' }}>{t.scoreLabel}</div>
                    <div className="text-3xl font-bold font-mono" style={{
                        color: '#00FFFF',
                        textShadow: '0 0 16px rgba(0,255,255,0.5)',
                    }}>
                        {simulatedScore}
                        <span className="text-sm ml-0.5 font-normal">/100</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pain Slider */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            {t.pain}
                        </label>
                        <span className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ background: 'rgba(0,255,255,0.1)', color: '#00FFFF', border: '1px solid rgba(0,255,255,0.2)' }}>
                            {painLabel}
                        </span>
                    </div>
                    <div className="relative">
                        <input
                            type="range" min={0} max={100} step={1} value={pain}
                            onChange={e => handlePain(Number(e.target.value))}
                            className="w-full h-2 appearance-none rounded-full cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #00FFFF ${pain}%, rgba(255,255,255,0.08) ${pain}%)`,
                                outline: 'none',
                            }}
                        />
                        <div className="flex justify-between mt-2">
                            {(t.painLabels || ['Low', 'Medium', 'High']).map((l: string) => (
                                <span key={l} className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{l}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Downtime Slider */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            {t.downtime}
                        </label>
                        <span className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ background: 'rgba(0,255,255,0.1)', color: '#00FFFF', border: '1px solid rgba(0,255,255,0.2)' }}>
                            {downtimeLabel}
                        </span>
                    </div>
                    <div className="relative">
                        <input
                            type="range" min={0} max={7} step={1} value={downtime}
                            onChange={e => handleDowntime(Number(e.target.value))}
                            className="w-full h-2 appearance-none rounded-full cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #00FFFF ${(downtime / 7) * 100}%, rgba(255,255,255,0.08) ${(downtime / 7) * 100}%)`,
                                outline: 'none',
                            }}
                        />
                        <div className="flex justify-between mt-2">
                            {(t.downtimeLabels || ['0', '1-3d', '5d+']).map((l: string) => (
                                <span key={l} className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{l}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Score bar visualization */}
            <div className="mt-6 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-300"
                    style={{
                        width: `${simulatedScore}%`,
                        background: 'linear-gradient(to right, #00FFFF, #00d4aa)',
                        boxShadow: '0 0 8px rgba(0,255,255,0.5)',
                    }} />
            </div>
            <style>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 16px; height: 16px;
                    border-radius: 50%;
                    background: #00FFFF;
                    box-shadow: 0 0 8px rgba(0,255,255,0.7);
                    cursor: pointer;
                    border: 2px solid #0a0a2a;
                }
                input[type=range]::-moz-range-thumb {
                    width: 16px; height: 16px;
                    border-radius: 50%;
                    background: #00FFFF;
                    box-shadow: 0 0 8px rgba(0,255,255,0.7);
                    cursor: pointer;
                    border: 2px solid #0a0a2a;
                }
            `}</style>
        </section>
    );
}
