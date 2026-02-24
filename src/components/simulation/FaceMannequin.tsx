'use client';
import { LanguageCode } from '@/utils/translations';

interface FaceMannequinProps {
    primaryZones: string[];   // Main target zones (Cyan highlight)
    secondaryZones?: string[]; // Secondary zones (Amber)
    language?: LanguageCode;
    protocolName?: string;
}

const ZONE_LABELS: Record<LanguageCode, Record<string, string>> = {
    EN: { Forehead: 'FOREHEAD', Cheek: 'CHEEK', Jawline: 'JAWLINE', EyeArea: 'EYE AREA', Nose: 'NOSE', Neck: 'NECK' },
    KO: { Forehead: '이마', Cheek: '볼', Jawline: '턱선', EyeArea: '눈가', Nose: '코', Neck: '목' },
    JP: { Forehead: '額', Cheek: '頬', Jawline: 'あご', EyeArea: '目元', Nose: '鼻', Neck: '首' },
    CN: { Forehead: '额头', Cheek: '脸颊', Jawline: '下颌', EyeArea: '眼周', Nose: '鼻子', Neck: '颈部' },
};

const NO_ZONE_MSG: Record<LanguageCode, string> = {
    EN: 'Select a treatment above',
    KO: '위의 시술을 선택하세요',
    JP: '上の治療を選択してください',
    CN: '请选择上方的治疗方案',
};

// Zone position + shape on the face SVG canvas (cx, cy, rx, ry in %)
const ZONE_SHAPES: Record<string, { cx: number; cy: number; rx: number; ry: number; labelDy?: number }> = {
    Forehead: { cx: 50, cy: 22, rx: 28, ry: 10 },
    EyeArea: { cx: 50, cy: 38, rx: 32, ry: 7 },
    Nose: { cx: 50, cy: 50, rx: 8, ry: 10 },
    Cheek: { cx: 50, cy: 55, rx: 30, ry: 9 },
    Jawline: { cx: 50, cy: 68, rx: 25, ry: 7 },
    Neck: { cx: 50, cy: 82, rx: 15, ry: 9 },
};

export default function FaceMannequin({ primaryZones, secondaryZones = [], language = 'EN', protocolName }: FaceMannequinProps) {
    const zoneLabels = ZONE_LABELS[language] || ZONE_LABELS['EN'];
    const noZoneMsg = NO_ZONE_MSG[language] || NO_ZONE_MSG['EN'];
    const hasZones = primaryZones.length > 0 || secondaryZones.length > 0;

    return (
        <div className="flex flex-col h-full bg-[#060618] rounded-2xl border border-white/5 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-mono tracking-[0.25em]" style={{ color: 'rgba(0,255,255,0.6)' }}>
                    ◈ TREATMENT ZONES
                </span>
                {protocolName && (
                    <span className="text-[9px] font-mono truncate max-w-[120px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {protocolName}
                    </span>
                )}
            </div>

            {/* SVG Face Map */}
            <div className="flex-1 flex items-center justify-center p-4 relative">
                {!hasZones && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <p className="text-[10px] font-mono text-center px-4" style={{ color: 'rgba(255,255,255,0.3)' }}>{noZoneMsg}</p>
                    </div>
                )}

                <svg viewBox="0 0 100 100" className="w-full max-w-[200px] h-auto" style={{ opacity: hasZones ? 1 : 0.3 }}>
                    {/* Face silhouette */}
                    <ellipse cx="50" cy="48" rx="30" ry="40"
                        fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                    {/* Neck */}
                    <rect x="40" y="85" width="20" height="12" rx="3"
                        fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                    {/* Face feature guides (subtle) */}
                    {/* Eyes */}
                    <ellipse cx="38" cy="38" rx="5" ry="3" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
                    <ellipse cx="62" cy="38" rx="5" ry="3" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
                    {/* Nose hint */}
                    <path d="M 47 46 Q 50 54 53 46" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
                    {/* Mouth */}
                    <path d="M 42 62 Q 50 67 58 62" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
                    {/* Jaw line */}
                    <path d="M 20 55 Q 50 88 80 55" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />

                    {/* Secondary zones (orange/amber) */}
                    {secondaryZones.filter(z => !primaryZones.includes(z)).map(zone => {
                        const shape = ZONE_SHAPES[zone];
                        if (!shape) return null;
                        return (
                            <g key={`sec-${zone}`}>
                                <ellipse
                                    cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry}
                                    fill="rgba(251,146,60,0.18)"
                                    stroke="rgba(251,146,60,0.7)"
                                    strokeWidth="0.8"
                                    className="animate-pulse"
                                    style={{ filter: 'drop-shadow(0 0 4px rgba(251,146,60,0.6))' }}
                                />
                                <text x={shape.cx} y={shape.cy + (shape.labelDy || 1)} textAnchor="middle"
                                    fontSize="3.5" fill="rgba(251,146,60,0.9)" fontFamily="monospace" fontWeight="bold">
                                    {zoneLabels[zone] || zone}
                                </text>
                            </g>
                        );
                    })}

                    {/* Primary zones (cyan — full highlight) */}
                    {primaryZones.map(zone => {
                        const shape = ZONE_SHAPES[zone];
                        if (!shape) return null;
                        return (
                            <g key={`pri-${zone}`}>
                                <ellipse
                                    cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry}
                                    fill="rgba(0,255,255,0.2)"
                                    stroke="rgba(0,255,255,0.9)"
                                    strokeWidth="1"
                                    className="animate-pulse"
                                    style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,255,0.8))' }}
                                />
                                <text x={shape.cx} y={shape.cy + (shape.labelDy || 1)} textAnchor="middle"
                                    fontSize="3.5" fill="white" fontFamily="monospace" fontWeight="bold"
                                    style={{ textShadow: '0 0 4px rgba(0,255,255,1)' }}>
                                    {zoneLabels[zone] || zone}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Zone Legend */}
            <div className="px-4 pb-3 space-y-1">
                {primaryZones.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {primaryZones.map(z => (
                            <span key={z} className="text-[9px] px-2 py-0.5 rounded font-mono"
                                style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.4)', color: '#00FFFF' }}>
                                ● {zoneLabels[z] || z}
                            </span>
                        ))}
                    </div>
                )}
                {secondaryZones.filter(z => !primaryZones.includes(z)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {secondaryZones.filter(z => !primaryZones.includes(z)).map(z => (
                            <span key={z} className="text-[9px] px-2 py-0.5 rounded font-mono"
                                style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.35)', color: 'rgb(251,146,60)' }}>
                                ○ {zoneLabels[z] || z}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
