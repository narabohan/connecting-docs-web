'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Lock, Zap, Target, Activity, Layers, Users, Sparkles } from 'lucide-react';
import { LanguageCode } from '@/utils/translations';

interface Protocol {
    id: string;
    rank: number;
    name: string;
    matchScore: number;
    composition: string[];
    description: string;
    tags: string[];
    energyDepth?: string;
    isLocked?: boolean;
    doctor?: any;
    faceZones?: string[];
    targetLayers?: string | string[];
    reasonWhy?: {
        why_suitable: string;
        pain_level: string;
        downtime_level: string;
        combinations: string[];
    };
}

interface Top3SolutionsProps {
    recommendations: Protocol[];
    language?: LanguageCode;
    goals?: string[];
    onUnlock?: () => void;
    painValue?: number;
    downtimeValue?: number;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const RANK_BG_COLORS = [
    'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(30,58,138,0.15) 100%)',
    'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(14,116,144,0.08) 100%)',
    'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(15,23,42,0.2) 100%)',
];
const RANK_BORDER = ['rgba(251,191,36,0.35)', 'rgba(99,102,241,0.3)', 'rgba(16,185,129,0.25)'];
const RANK_GLOW = ['rgba(251,191,36,0.12)', 'rgba(99,102,241,0.1)', 'rgba(16,185,129,0.1)'];

// Device category mapping (based on device name keywords)
const DEVICE_CATEGORY: Record<string, Record<LanguageCode, string>> = {
    DEFAULT: { EN: 'Energy Device', KO: '에너지 장비', JP: 'エネルギー機器', CN: '能量设备' },
    HIFU: { EN: 'HIFU / Ultrasound', KO: 'HIFU / 초음파', JP: 'HIFU/超音波', CN: 'HIFU/超声波' },
    RF: { EN: 'RF / Radiofrequency', KO: 'RF / 고주파', JP: 'RF/高周波', CN: 'RF/射频' },
    LASER: { EN: 'Laser Therapy', KO: '레이저', JP: 'レーザー', CN: '激光' },
    EXOSOME: { EN: 'Regenerative / Exosome', KO: '재생 / 엑소좀', JP: '再生/エクソソーム', CN: '再生/外泌体' },
    INJECTION: { EN: 'Injectables', KO: '필러 / 보톡스', JP: '注射剤', CN: '注射' },
    MICRONEEDLE: { EN: 'Microneedling RF', KO: '마이크로니들링 RF', JP: 'マイクロニードルRF', CN: '微针RF' },
};

function guessCategory(name: string): string {
    const n = name.toLowerCase();
    if (/ulthera|ulth|hifu|smas|universe|fokus/i.test(n)) return 'HIFU';
    if (/genius|thermage|morpheus|inmode|vivace|fractora|potenza/i.test(n)) return 'RF';
    if (/lasemd|clear|fraxel|co2|picosure|picoway/i.test(n)) return 'LASER';
    if (/exosome|rejuran|pdrn|stem|gf/i.test(n)) return 'EXOSOME';
    if (/botox|filler|hyaluron|juvederm|restylane/i.test(n)) return 'INJECTION';
    if (/mnrf|microneedle|mnfr/i.test(n)) return 'MICRONEEDLE';
    if (/rf|radiofreq|volnewmer|shurink/i.test(n)) return 'RF';
    return 'DEFAULT';
}

// Labels
const L: Record<LanguageCode, Record<string, string>> = {
    EN: {
        title: 'SIGNATURE SOLUTIONS', subtitle: 'AI-matched protocols ranked by clinical fit',
        deviceLabel: 'Device Combination', categoryLabel: 'Category', featureLabel: 'Features & Mechanism',
        improvesLabel: 'What Improves', comboLabel: 'Synergy Combinations', whyLabel: 'Why This Match',
        painLabel: 'Pain', downtimeLabel: 'Downtime', seeDetail: 'Expand Details',
        hideDetail: 'Close', verifiedDoctor: 'Master Doctor', lockMsg: 'Unlock after verification',
    },
    KO: {
        title: '시그니처 솔루션', subtitle: 'AI가 임상 적합도 기준으로 추천한 프로토콜',
        deviceLabel: '장비 조합', categoryLabel: '카테고리', featureLabel: '기전 및 특징',
        improvesLabel: '개선 효과', comboLabel: '컴비네이션 시술', whyLabel: '추천 이유',
        painLabel: '통증', downtimeLabel: '회복 기간', seeDetail: '상세 보기',
        hideDetail: '접기', verifiedDoctor: '마스터 닥터', lockMsg: '이메일 인증 후 공개',
    },
    JP: {
        title: 'シグネチャーソリューション', subtitle: 'AI臨床適合度順プロトコル',
        deviceLabel: '機器の組み合わせ', categoryLabel: 'カテゴリー', featureLabel: '特徴・作用機序',
        improvesLabel: '改善効果', comboLabel: '複合施術', whyLabel: '推薦理由',
        painLabel: '痛み', downtimeLabel: 'ダウンタイム', seeDetail: '詳細を見る',
        hideDetail: '閉じる', verifiedDoctor: 'マスタードクター', lockMsg: '確認後に公開',
    },
    CN: {
        title: '签名解决方案', subtitle: 'AI按临床匹配度排名推荐',
        deviceLabel: '设备组合', categoryLabel: '类别', featureLabel: '特点与机制',
        improvesLabel: '改善效果', comboLabel: '联合治疗', whyLabel: '推荐原因',
        painLabel: '疼痛', downtimeLabel: '恢复期', seeDetail: '展开详情',
        hideDetail: '收起', verifiedDoctor: '大师医生', lockMsg: '验证后解锁',
    },
};

const PAIN_COLOR: Record<string, string> = {
    Low: '#4ade80', Minimal: '#4ade80',
    Medium: '#facc15', Moderate: '#facc15',
    High: '#f87171', Intense: '#f87171',
};
const DOWNTIME_COLOR: Record<string, string> = {
    None: '#4ade80', Zero: '#4ade80',
    Short: '#facc15', Mild: '#facc15',
    Medium: '#facc15', Moderate: '#facc15',
    Long: '#f87171', Extended: '#f87171',
};

export default function Top3Solutions({ recommendations, language = 'EN', goals = [], onUnlock }: Top3SolutionsProps) {
    const [expandedRank, setExpandedRank] = useState<number | null>(1); // #1 open by default
    const lbl = L[language] || L['EN'];

    if (!recommendations || recommendations.length === 0) return null;

    const toggleExpand = (rank: number) => setExpandedRank(prev => prev === rank ? null : rank);

    return (
        <section className="mb-12" id="solutions">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
                    style={{ background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.2)' }}>
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] font-mono tracking-[0.25em] text-cyan-400">{lbl.title}</span>
                </div>
                <p className="text-sm text-white/40 font-mono">{lbl.subtitle}</p>
            </div>

            {/* Cards */}
            <div className="space-y-4">
                {recommendations.slice(0, 3).map((proto, idx) => {
                    const isExpanded = expandedRank === proto.rank;
                    const isLocked = proto.isLocked && proto.rank !== 1;
                    const rankLabel = ['No.1 Clinical Fit', 'No.2 Strong Alternative', 'No.3 Consider'][idx];
                    const painColor = PAIN_COLOR[proto.reasonWhy?.pain_level || ''] || '#94a3b8';
                    const dtColor = DOWNTIME_COLOR[proto.reasonWhy?.downtime_level || ''] || '#94a3b8';

                    // Device categories
                    const deviceCategories = proto.composition.map(d => ({
                        name: d,
                        cat: guessCategory(d),
                    }));

                    return (
                        <div
                            key={proto.id}
                            className="rounded-2xl overflow-hidden transition-all duration-500"
                            style={{
                                background: RANK_BG_COLORS[idx],
                                border: `1.5px solid ${RANK_BORDER[idx]}`,
                                boxShadow: isExpanded ? `0 0 30px ${RANK_GLOW[idx]}, 0 0 60px ${RANK_GLOW[idx]}` : 'none',
                            }}
                        >
                            {/* ── Card Header (always visible, clickable) ── */}
                            <button
                                className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-white/5 transition-colors"
                                onClick={() => toggleExpand(proto.rank)}
                            >
                                {/* Left: Medal + Rank + Name */}
                                <div className="flex items-center gap-4 min-w-0">
                                    <span className="text-2xl flex-shrink-0">{RANK_MEDALS[idx]}</span>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-mono tracking-[0.2em]"
                                                style={{ color: RANK_BORDER[idx] }}>{rankLabel}</span>
                                            <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold"
                                                style={{ background: 'rgba(0,255,255,0.1)', color: '#00FFFF', border: '1px solid rgba(0,255,255,0.3)' }}>
                                                {proto.matchScore}% Match
                                            </span>
                                        </div>
                                        <h3 className="text-base md:text-lg font-bold text-white truncate">{proto.name}</h3>
                                    </div>
                                </div>

                                {/* Right: Quick badges + expand toggle */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {proto.reasonWhy && (
                                        <div className="hidden sm:flex flex-col gap-1 items-end">
                                            <span className="text-[9px] font-mono px-2 py-0.5 rounded"
                                                style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${painColor}40`, color: painColor }}>
                                                🔥 {lbl.painLabel}: {proto.reasonWhy.pain_level}
                                            </span>
                                            <span className="text-[9px] font-mono px-2 py-0.5 rounded"
                                                style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${dtColor}40`, color: dtColor }}>
                                                ⏳ {lbl.downtimeLabel}: {proto.reasonWhy.downtime_level}
                                            </span>
                                        </div>
                                    )}
                                    <div className="rounded-full p-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-white/60" />
                                            : <ChevronDown className="w-4 h-4 text-white/60" />}
                                    </div>
                                </div>
                            </button>

                            {/* ── Expanded Detail Panel ── */}
                            {isExpanded && (
                                <div className="px-6 pb-6 space-y-6 border-t border-white/5">
                                    <div className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {/* Left Column */}
                                        <div className="space-y-5">
                                            {/* 1. Device Combination + Category */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Zap className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                                                    <span className="text-[10px] font-mono tracking-[0.2em] text-cyan-400/70">{lbl.deviceLabel}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {deviceCategories.map(({ name, cat }) => (
                                                        <div key={name} className="flex items-center gap-3 rounded-lg px-3 py-2"
                                                            style={{ background: 'rgba(0,255,255,0.04)', border: '1px solid rgba(0,255,255,0.1)' }}>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                                                            <div>
                                                                <div className="text-xs font-bold text-white">{name}</div>
                                                                <div className="text-[9px] text-white/40 font-mono mt-0.5">
                                                                    {DEVICE_CATEGORY[cat]?.[language] || DEVICE_CATEGORY['DEFAULT'][language]}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 2. Tags (features) */}
                                            {proto.tags && proto.tags.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Activity className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                                        <span className="text-[10px] font-mono tracking-[0.2em] text-violet-400/70">{lbl.featureLabel}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {proto.tags.map(tag => (
                                                            <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full font-mono"
                                                                style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: 'rgba(196,181,253,0.9)' }}>
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-5">
                                            {/* 3. Why suitable / What improves */}
                                            {proto.reasonWhy?.why_suitable && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Target className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                                        <span className="text-[10px] font-mono tracking-[0.2em] text-amber-400/70">{lbl.improvesLabel}</span>
                                                    </div>
                                                    <p className="text-sm text-white/70 leading-relaxed rounded-lg px-3 py-2"
                                                        style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
                                                        💡 {proto.reasonWhy.why_suitable}
                                                    </p>
                                                </div>
                                            )}

                                            {/* 4. Combination treatments */}
                                            {proto.reasonWhy?.combinations && proto.reasonWhy.combinations.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Layers className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                                        <span className="text-[10px] font-mono tracking-[0.2em] text-emerald-400/70">{lbl.comboLabel}</span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {proto.reasonWhy.combinations.slice(0, 3).map((combo, i) => (
                                                            <div key={i} className="flex items-start gap-2 text-xs text-white/60 rounded-lg px-3 py-2"
                                                                style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                                                <span className="text-emerald-400 mt-0.5">✦</span>
                                                                <span>{combo}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Doctor row */}
                                    <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        <div className="flex items-center gap-3">
                                            <Users className="w-4 h-4 text-white/30" />
                                            <span className="text-xs font-mono text-white/40">{lbl.verifiedDoctor}</span>
                                        </div>
                                        {isLocked ? (
                                            <button
                                                onClick={() => onUnlock?.()}
                                                className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
                                                style={{ color: '#00FFFF', border: '1px solid rgba(0,255,255,0.3)' }}>
                                                <Lock className="w-3 h-3" />
                                                {lbl.lockMsg}
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                    {proto.doctor?.name?.[0] || 'M'}
                                                </div>
                                                <span className="text-xs text-white/60 font-mono">
                                                    {proto.doctor?.name || 'Assigned Specialist'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {proto.description && (
                                        <p className="text-xs text-white/40 font-mono leading-relaxed">{proto.description}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
