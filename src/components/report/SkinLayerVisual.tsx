import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface SkinLayerVisualProps {
    energyDepth?: 'epidermis' | 'dermis' | 'hypodermis' | 'smas';
    language?: LanguageCode;
    protocolName?: string;
}

const DEPTH_CONFIG = {
    epidermis: { y: 40, label: '0.1–0.3 mm', percent: 15 },
    dermis: { y: 80, label: '1–3 mm', percent: 38 },
    hypodermis: { y: 120, label: '4–6 mm', percent: 62 },
    smas: { y: 150, label: '8–12 mm', percent: 85 },
};

const LAYER_DEFS = [
    { id: 'epidermis', y: 20, h: 30, name: 'Epidermis', color: 'rgba(255,220,180,0.35)', border: 'rgba(255,200,150,0.4)' },
    { id: 'dermis', y: 50, h: 55, name: 'Dermis', color: 'rgba(220,150,120,0.25)', border: 'rgba(210,120,90,0.35)' },
    { id: 'hypodermis', y: 105, h: 50, name: 'Hypodermis', color: 'rgba(180,120,80,0.2)', border: 'rgba(180,100,60,0.3)' },
    { id: 'smas', y: 155, h: 35, name: 'SMAS', color: 'rgba(140,90,60,0.2)', border: 'rgba(140,80,40,0.3)' },
];

export default function SkinLayerVisual({ energyDepth = 'dermis', language = 'EN', protocolName }: SkinLayerVisualProps) {
    const t = (REPORT_TRANSLATIONS[language] || REPORT_TRANSLATIONS['EN']).report?.skinLayer || {
        title: 'ENERGY PENETRATION DEPTH',
        epidermis: 'Epidermis',
        dermis: 'Dermis',
        hypodermis: 'Hypodermis',
        smas: 'SMAS Layer',
        depth: 'Target depth',
    };

    const layerNames: Record<string, string> = {
        epidermis: t.epidermis,
        dermis: t.dermis,
        hypodermis: t.hypodermis,
        smas: t.smas,
    };

    const cfg = DEPTH_CONFIG[energyDepth];

    return (
        <div className="w-full rounded-xl p-4 mt-4"
            style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(0,255,255,0.1)',
                backdropFilter: 'blur(8px)',
            }}>
            <div className="text-[9px] font-mono tracking-[0.25em] mb-3" style={{ color: 'rgba(0,255,255,0.5)' }}>
                ◈ {t.title}
            </div>

            <div className="flex gap-4 items-start">
                {/* SVG cross-section */}
                <svg width="80" height="200" viewBox="0 0 80 200" className="flex-shrink-0">
                    {/* Layer fills */}
                    {LAYER_DEFS.map(layer => (
                        <g key={layer.id}>
                            <rect
                                x={4} y={layer.y} width={72} height={layer.h}
                                rx={2}
                                fill={layer.color}
                                stroke={layer.border}
                                strokeWidth={0.5}
                            />
                        </g>
                    ))}

                    {/* Cyan pulse at target depth */}
                    <circle cx={40} cy={cfg.y} r={6}
                        fill="rgba(0,255,255,0.3)"
                        stroke="#00FFFF"
                        strokeWidth={1.5}
                        style={{ filter: 'drop-shadow(0 0 6px #00FFFF)' }}>
                        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                    </circle>

                    {/* Pulse ring */}
                    <circle cx={40} cy={cfg.y} r={12}
                        fill="none"
                        stroke="rgba(0,255,255,0.3)"
                        strokeWidth={1}>
                        <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                    </circle>

                    {/* Depth indicator line */}
                    <line x1={40} y1={0} x2={40} y2={cfg.y}
                        stroke="rgba(0,255,255,0.15)"
                        strokeWidth={1}
                        strokeDasharray="3,3" />

                    {/* Arrow from top */}
                    <polygon points="37,4 43,4 40,12" fill="rgba(0,255,255,0.4)" />
                </svg>

                {/* Layer labels + depth info */}
                <div className="flex flex-col justify-between h-[190px] py-1">
                    {LAYER_DEFS.map(layer => (
                        <div key={layer.id}
                            className="flex items-center gap-2 transition-all"
                            style={{ opacity: layer.id === energyDepth ? 1 : 0.4 }}>
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{
                                    background: layer.id === energyDepth ? '#00FFFF' : 'rgba(255,255,255,0.3)',
                                    boxShadow: layer.id === energyDepth ? '0 0 6px #00FFFF' : 'none',
                                }} />
                            <span className="text-[10px] font-mono"
                                style={{ color: layer.id === energyDepth ? '#00FFFF' : 'rgba(255,255,255,0.4)' }}>
                                {layerNames[layer.id] || layer.name}
                            </span>
                        </div>
                    ))}

                    <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(0,255,255,0.1)' }}>
                        <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {t.depth}
                        </div>
                        <div className="text-xs font-bold font-mono" style={{ color: '#00FFFF' }}>
                            {cfg.label}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
