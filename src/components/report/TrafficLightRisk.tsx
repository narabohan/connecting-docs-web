import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface RiskFactor {
    level: 'SAFE' | 'CAUTION' | 'DANGER' | 'HIGH' | 'MODERATE' | 'LOW';
    factor: string;
    description: string;
}

interface TrafficLightRiskProps {
    risks: RiskFactor[];
    language?: LanguageCode;
}

const LEVEL_CONFIG = {
    danger: {
        dot: '#FF3B30',
        glow: 'rgba(255,59,48,0.4)',
        bg: 'rgba(255,59,48,0.05)',
        border: 'rgba(255,59,48,0.2)',
        text: '#FF6B6B',
        label: '🔴',
    },
    caution: {
        dot: '#FFD60A',
        glow: 'rgba(255,214,10,0.4)',
        bg: 'rgba(255,214,10,0.05)',
        border: 'rgba(255,214,10,0.2)',
        text: '#FFE04D',
        label: '🟡',
    },
    safe: {
        dot: '#30D158',
        glow: 'rgba(48,209,88,0.4)',
        bg: 'rgba(48,209,88,0.05)',
        border: 'rgba(48,209,88,0.2)',
        text: '#4AE06A',
        label: '🟢',
    },
};

function getGroup(level: string): 'danger' | 'caution' | 'safe' {
    if (level === 'DANGER' || level === 'HIGH') return 'danger';
    if (level === 'CAUTION' || level === 'MODERATE') return 'caution';
    return 'safe';
}

export default function TrafficLightRisk({ risks, language = 'EN' }: TrafficLightRiskProps) {
    const t = (REPORT_TRANSLATIONS[language] || REPORT_TRANSLATIONS['EN']).report?.trafficLight || {
        title: 'RISK FILTER PROTOCOL',
        danger: 'CONTRAINDICATED',
        caution: 'PROCEED WITH CAUTION',
        safe: 'CLEARED FOR TREATMENT',
        dangerSub: 'These procedures are not recommended for your skin profile.',
        cautionSub: 'These may be used under strict monitoring conditions.',
        safeSub: 'Fully matched and cleared for your skin logic.',
    };
    const rt = (REPORT_TRANSLATIONS[language] || REPORT_TRANSLATIONS['EN']).risks;

    const grouped: Record<'danger' | 'caution' | 'safe', RiskFactor[]> = { danger: [], caution: [], safe: [] };
    risks.forEach(r => grouped[getGroup(r.level)].push(r));

    const sections: Array<{ key: 'danger' | 'caution' | 'safe'; title: string; sub: string }> = [
        { key: 'danger', title: rt?.danger || t.danger, sub: t.dangerSub },
        { key: 'caution', title: rt?.caution || t.caution, sub: t.cautionSub },
        { key: 'safe', title: rt?.safe || t.safe, sub: t.safeSub },
    ];

    return (
        <section className="w-full mb-6">
            <div className="text-[10px] font-mono tracking-[0.3em] mb-4 flex items-center gap-2"
                style={{ color: 'rgba(0,255,255,0.6)' }}>
                <span style={{ color: '#00FFFF' }}>◈</span> {t.title}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sections.map(({ key, title, sub }) => {
                    const cfg = LEVEL_CONFIG[key];
                    const items = grouped[key];

                    return (
                        <div key={key} className="rounded-xl p-5 flex flex-col gap-3"
                            style={{
                                background: cfg.bg,
                                border: `1px solid ${cfg.border}`,
                                backdropFilter: 'blur(12px)',
                            }}>
                            {/* Header */}
                            <div className="flex items-center gap-3">
                                {/* Traffic light dot */}
                                <div className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{
                                        background: cfg.dot,
                                        boxShadow: `0 0 10px ${cfg.glow}, 0 0 20px ${cfg.glow}`,
                                    }} />
                                <div>
                                    <div className="text-xs font-bold font-mono tracking-wider" style={{ color: cfg.text }}>
                                        {title}
                                    </div>
                                    <div className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                        {sub}
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px w-full" style={{ background: cfg.border }} />

                            {/* Items */}
                            {items.length === 0 ? (
                                <div className="text-[11px] font-mono italic" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                    — None —
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {items.map((r, i) => (
                                        <div key={i} className="rounded-lg p-3"
                                            style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${cfg.border}` }}>
                                            <div className="text-xs font-bold mb-1" style={{ color: cfg.text }}>
                                                {r.factor}
                                            </div>
                                            <div className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                                {r.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
