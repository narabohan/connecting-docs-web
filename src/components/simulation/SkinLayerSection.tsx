'use client';
import { LanguageCode } from '@/utils/translations';

interface SkinLayerSectionProps {
    activeLayers: string | string[];
    language?: LanguageCode;
    protocolName?: string;
}

const LAYER_CONFIG: Array<{
    id: string;
    depth: string;
    top: string;
    height: string;
    color: string;
    bg: string;
    shadow: string;
    label: Record<LanguageCode, string>;
    desc: Record<LanguageCode, string>;
}> = [
        {
            id: 'Epidermis',
            depth: '0.1–0.2mm',
            top: '8%',
            height: '16%',
            color: '#22d3ee',  // cyan
            bg: 'rgba(34,211,238,0.18)',
            shadow: '0 0 16px rgba(34,211,238,0.7)',
            label: { EN: 'Epidermis', KO: '표피', JP: '表皮', CN: '表皮' },
            desc: { EN: 'Surface – texture, glow', KO: '피부 표면 – 결, 광채', JP: '表面層', CN: '表层' },
        },
        {
            id: 'Dermis',
            depth: '0.2–2mm',
            top: '28%',
            height: '20%',
            color: '#e879f9',  // fuchsia
            bg: 'rgba(232,121,249,0.18)',
            shadow: '0 0 16px rgba(232,121,249,0.7)',
            label: { EN: 'Dermis', KO: '진피', JP: '真皮', CN: '真皮' },
            desc: { EN: 'Firmness, collagen', KO: '탄력, 콜라겐', JP: 'コラーゲン', CN: '胶原蛋白' },
        },
        {
            id: 'SMAS',
            depth: '3–5mm',
            top: '51%',
            height: '18%',
            color: '#818cf8',  // indigo
            bg: 'rgba(129,140,248,0.2)',
            shadow: '0 0 18px rgba(129,140,248,0.8)',
            label: { EN: 'SMAS', KO: 'SMAS', JP: 'SMAS', CN: 'SMAS层' },
            desc: { EN: 'Deep lift, V-line', KO: '심부 리프팅', JP: '深部リフト', CN: '深层提升' },
        },
        {
            id: 'Muscle',
            depth: '5mm+',
            top: '71%',
            height: '16%',
            color: '#f87171', // red
            bg: 'rgba(248,113,113,0.15)',
            shadow: '0 0 14px rgba(248,113,113,0.6)',
            label: { EN: 'Muscle', KO: '근육층', JP: '筋肉層', CN: '肌肉层' },
            desc: { EN: 'Contouring, jaw', KO: '윤곽 조각', JP: '輪郭', CN: '轮廓塑形' },
        },
    ];

const TITLE: Record<LanguageCode, string> = {
    EN: 'TARGET DEPTH',
    KO: '타겟 레이어',
    JP: 'ターゲット深度',
    CN: '目标深度',
};

export default function SkinLayerSection({ activeLayers, language = 'EN', protocolName }: SkinLayerSectionProps) {
    const active = Array.isArray(activeLayers) ? activeLayers : (typeof activeLayers === 'string' ? [activeLayers] : []);
    const title = TITLE[language] || TITLE['EN'];

    return (
        <div className="flex flex-col h-full bg-[#060618] rounded-2xl border border-white/5 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-mono tracking-[0.25em]" style={{ color: 'rgba(0,255,255,0.6)' }}>
                    ◈ {title}
                </span>
                {protocolName && (
                    <span className="text-[9px] font-mono truncate max-w-[120px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {protocolName}
                    </span>
                )}
            </div>

            {/* Layer cross-section diagram */}
            <div className="flex-1 relative mx-4 my-4 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.2) 100%)', border: '1px solid rgba(255,255,255,0.06)', minHeight: 220 }}>
                {/* Depth indicator line */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] ml-6" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    {LAYER_CONFIG.map(layer => (
                        <div key={layer.id} className="absolute" style={{ top: layer.top, left: 4, fontSize: 7, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {layer.depth}
                        </div>
                    ))}
                </div>

                {/* Layers */}
                {LAYER_CONFIG.map(layer => {
                    const isActive = active.includes(layer.id);
                    return (
                        <div
                            key={layer.id}
                            className="absolute left-10 right-0 flex items-center rounded-r-lg transition-all duration-700"
                            style={{
                                top: layer.top,
                                height: layer.height,
                                background: isActive ? layer.bg : 'rgba(255,255,255,0.02)',
                                borderLeft: `3px solid ${isActive ? layer.color : 'rgba(255,255,255,0.08)'}`,
                                boxShadow: isActive ? layer.shadow : 'none',
                            }}
                        >
                            <div className="flex items-center justify-between w-full px-3">
                                <div>
                                    <div className="text-[10px] font-bold font-mono" style={{ color: isActive ? layer.color : 'rgba(255,255,255,0.2)' }}>
                                        {layer.label[language as LanguageCode] || layer.label.EN}
                                        {isActive && <span className="ml-2 text-[8px] opacity-70 animate-pulse">▶ ACTIVE</span>}
                                    </div>
                                    <div className="text-[8px] font-mono mt-0.5" style={{ color: isActive ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)' }}>
                                        {layer.desc[language as LanguageCode] || layer.desc.EN}
                                    </div>
                                </div>
                                {isActive && (
                                    <div className="w-2 h-2 rounded-full animate-ping" style={{ background: layer.color }} />
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* No active state hint */}
                {active.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-[10px] font-mono text-center px-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            {language === 'KO' ? '시술을 선택하세요' : language === 'JP' ? '治療を選択してください' : language === 'CN' ? '请选择治疗方案' : 'Select a treatment'}
                        </p>
                    </div>
                )}
            </div>

            {/* Legend dots */}
            <div className="px-4 pb-3 flex flex-wrap gap-x-3 gap-y-1">
                {LAYER_CONFIG.map(layer => {
                    const isActive = active.includes(layer.id);
                    return (
                        <div key={layer.id} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full transition-all duration-500"
                                style={{ background: isActive ? layer.color : 'rgba(255,255,255,0.12)', boxShadow: isActive ? `0 0 6px ${layer.color}` : 'none' }} />
                            <span className="text-[9px] font-mono"
                                style={{ color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>
                                {layer.label[language as LanguageCode] || layer.label.EN}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
