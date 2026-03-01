'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Lock, Zap, Target, Activity, Layers, Users, Sparkles, TrendingUp, ArrowUpRight, CheckCircle } from 'lucide-react';
import { LanguageCode } from '@/utils/translations';

interface Protocol {
    id: string;
    rank: number;
    name: string;
    matchScore: number;
    composition: string[];
    devices?: string[];
    boosters?: string[];
    description: string;
    tags: string[];
    energyDepth?: string;
    isLocked?: boolean;
    doctor?: any;
    faceZones?: string[];
    targetLayers?: string | string[];
    sessions?: number;
    rankLabel?: string;
    rankRationale?: string;
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
    onSelectProtocol?: (protocol: Protocol) => void;
    selectedProtocolId?: string;
    painValue?: number;
    downtimeValue?: number;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const RANK_BG = [
    'linear-gradient(135deg, rgba(251,191,36,0.07) 0%, rgba(30,58,138,0.12) 100%)',
    'linear-gradient(135deg, rgba(20,184,166,0.07) 0%, rgba(14,116,144,0.1) 100%)',
    'linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(15,23,42,0.2) 100%)',
];
const RANK_BORDER = ['rgba(251,191,36,0.35)', 'rgba(20,184,166,0.35)', 'rgba(139,92,246,0.3)'];
const RANK_GLOW = ['rgba(251,191,36,0.12)', 'rgba(20,184,166,0.1)', 'rgba(139,92,246,0.1)'];
const RANK_ACCENT = ['#fbbf24', '#14b8a6', '#a78bfa'];
const RANK_ICONS = [
    <Target className="w-3.5 h-3.5" key="r1" />,
    <TrendingUp className="w-3.5 h-3.5" key="r2" />,
    <ArrowUpRight className="w-3.5 h-3.5" key="r3" />
];

const DEVICE_CATEGORY: Record<string, Record<LanguageCode, string>> = {
    DEFAULT: { EN: 'Energy Device', KO: '에너지 장비', JP: 'エネルギー機器', CN: '能量设备' },
    HIFU: { EN: 'HIFU / Ultrasound', KO: 'HIFU / 초음파', JP: 'HIFU/超音波', CN: 'HIFU/超声波' },
    RF: { EN: 'RF / Radiofrequency', KO: 'RF / 고주파', JP: 'RF/高周波', CN: 'RF/射频' },
    LASER: { EN: 'Laser Therapy', KO: '레이저', JP: 'レーザー', CN: '激光' },
    EXOSOME: { EN: 'Regenerative / Exosome', KO: '재생 / 엑소좀', JP: '再生/エクソソーム', CN: '再生/外泌体' },
    INJECTION: { EN: 'Injectables / Booster', KO: '주사 / 부스터', JP: '注射/ブースター', CN: '注射/促进剂' },
    MICRONEEDLE: { EN: 'Microneedling RF', KO: '마이크로니들링 RF', JP: 'マイクロニードルRF', CN: '微针RF' },
    TITANIUM: { EN: 'Titanium RF (Trending)', KO: '티타늄 RF (트렌딩)', JP: 'チタンRF（人気）', CN: '钛RF（热门）' },
};

function guessCategory(name: string): string {
    const n = name.toLowerCase();
    if (/titanium/i.test(n)) return 'TITANIUM';
    if (/ulthera|ulth|hifu|smas|universe|fokus|ultraformer/i.test(n)) return 'HIFU';
    if (/genius|thermage|morpheus|inmode|vivace|fractora|potenza/i.test(n)) return 'RF';
    if (/lasemd|clear|fraxel|co2|picosure|picoway|pico/i.test(n)) return 'LASER';
    if (/exosome|pdrn|stem|asce|mn/i.test(n)) return 'EXOSOME';
    if (/rejuran|skinvive|juvelook|botox|filler|hyaluron|restylane|salmon/i.test(n)) return 'INJECTION';
    if (/mnrf|microneedle|mnfr/i.test(n)) return 'MICRONEEDLE';
    if (/rf|radiofreq|shurink/i.test(n)) return 'RF';
    return 'DEFAULT';
}

const L: Record<LanguageCode, Record<string, string>> = {
    EN: {
        title: 'SIGNATURE SOLUTIONS', subtitle: 'AI-matched protocols ranked by clinical fit',
        deviceLabel: 'Device Combination', boosterLabel: 'Skin Booster', categoryLabel: 'Category',
        featureLabel: 'Features & Mechanism', whyLabel: 'Why This Match', rankRationaleLabel: 'Why This Rank',
        painLabel: 'Pain', downtimeLabel: 'Downtime', sessionsLabel: 'Sessions',
        selectBtn: 'Choose This Protocol', selectedBtn: '✓ Selected',
        findDoctor: 'Find Master Doctor →',
        verifiedDoctor: 'Master Doctor', lockMsg: 'Unlock after verification',
        rank1desc: 'Best clinical match for your profile',
        rank2desc: 'Trending treatment you may know',
        rank3desc: 'Stronger results if you can stretch',
    },
    KO: {
        title: '시그니처 솔루션', subtitle: 'AI가 임상 적합도 기준으로 추천한 프로토콜',
        deviceLabel: '장비 조합', boosterLabel: '스킨 부스터', categoryLabel: '카테고리',
        featureLabel: '기전 및 특징', whyLabel: '추천 이유', rankRationaleLabel: '랭킹 이유',
        painLabel: '통증', downtimeLabel: '회복 기간', sessionsLabel: '세션',
        selectBtn: '이 시술 선택', selectedBtn: '✓ 선택됨',
        findDoctor: '마스터 닥터 찾기 →',
        verifiedDoctor: '마스터 닥터', lockMsg: '이메일 인증 후 공개',
        rank1desc: '내 프로파일에 가장 적합한 임상 추천',
        rank2desc: '요즘 가장 인기 있는 트렌딩 시술',
        rank3desc: '조금 더 감내하면 더 강력한 효과',
    },
    JP: {
        title: 'シグネチャーソリューション', subtitle: 'AI臨床適合度順プロトコル',
        deviceLabel: '機器の組み合わせ', boosterLabel: 'スキンブースター', categoryLabel: 'カテゴリー',
        featureLabel: '特徴・作用機序', whyLabel: '推薦理由', rankRationaleLabel: 'ランクの理由',
        painLabel: '痛み', downtimeLabel: 'ダウンタイム', sessionsLabel: 'セッション',
        selectBtn: 'このプロトコルを選ぶ', selectedBtn: '✓ 選択済み',
        findDoctor: 'マスタードクターを探す →',
        verifiedDoctor: 'マスタードクター', lockMsg: '確認後に公開',
        rank1desc: 'あなたのプロファイルへの最適解',
        rank2desc: '今話題のトレンド施術',
        rank3desc: '少し頑張ればさらに高い効果',
    },
    CN: {
        title: '签名解决方案', subtitle: 'AI按临床匹配度排名推荐',
        deviceLabel: '设备组合', boosterLabel: '皮肤促进剂', categoryLabel: '类别',
        featureLabel: '特点与机制', whyLabel: '推荐原因', rankRationaleLabel: '排名原因',
        painLabel: '疼痛', downtimeLabel: '恢复期', sessionsLabel: '疗程',
        selectBtn: '选择此方案', selectedBtn: '✓ 已选择',
        findDoctor: '寻找大师医生 →',
        verifiedDoctor: '大师医生', lockMsg: '验证后解锁',
        rank1desc: '最适合您档案的临床推荐',
        rank2desc: '您可能听说过的热门疗法',
        rank3desc: '稍微忍耐可获得更强效果',
    },
};

const PAIN_COLOR: Record<string, string> = { Low: '#4ade80', Minimal: '#4ade80', Medium: '#facc15', Moderate: '#facc15', High: '#f87171', Intense: '#f87171' };
const DT_COLOR: Record<string, string> = { None: '#4ade80', Zero: '#4ade80', Short: '#facc15', Mild: '#facc15', Low: '#86efac', Medium: '#facc15', Moderate: '#facc15', Long: '#f87171', Extended: '#f87171' };

export default function Top3Solutions({ recommendations, language = 'EN', goals = [], onUnlock, onSelectProtocol, selectedProtocolId }: Top3SolutionsProps) {
    const [expandedRank, setExpandedRank] = useState<number | null>(1);
    const lbl = L[language] || L['EN'];

    if (!recommendations || recommendations.length === 0) return null;

    const RANK_DESC = [lbl.rank1desc, lbl.rank2desc, lbl.rank3desc];

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

            {/* Selection Banner (when a protocol is selected) */}
            {selectedProtocolId && onSelectProtocol && (
                <div className="mb-5 rounded-xl px-5 py-3 flex items-center justify-between gap-4"
                    style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)' }}>
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-white/70 font-mono">
                            {recommendations.find(r => r.id === selectedProtocolId)?.name || 'Protocol selected'}
                        </span>
                    </div>
                    <button
                        onClick={() => onUnlock?.()}
                        className="text-xs font-bold px-4 py-2 rounded-lg transition-all"
                        style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.4)' }}>
                        {lbl.findDoctor}
                    </button>
                </div>
            )}

            {/* Cards */}
            <div className="space-y-4">
                {recommendations.slice(0, 3).map((proto, idx) => {
                    const isExpanded = expandedRank === proto.rank;
                    const isSelected = selectedProtocolId === proto.id;
                    const painColor = PAIN_COLOR[proto.reasonWhy?.pain_level || ''] || '#94a3b8';
                    const dtColor = DT_COLOR[proto.reasonWhy?.downtime_level || ''] || '#94a3b8';
                    const accent = RANK_ACCENT[idx];

                    const devices = proto.devices || proto.composition?.filter(c => {
                        const cat = guessCategory(c);
                        return ['HIFU', 'RF', 'LASER', 'MICRONEEDLE', 'TITANIUM'].includes(cat);
                    }) || [];
                    const boosters = proto.boosters || proto.composition?.filter(c => {
                        const cat = guessCategory(c);
                        return ['EXOSOME', 'INJECTION'].includes(cat);
                    }) || [];

                    return (
                        <div key={proto.id}
                            className="rounded-2xl overflow-hidden transition-all duration-500"
                            style={{
                                background: isSelected ? `linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(0,0,0,0.3) 100%)` : RANK_BG[idx],
                                border: `1.5px solid ${isSelected ? 'rgba(0,255,136,0.4)' : RANK_BORDER[idx]}`,
                                boxShadow: isExpanded ? `0 0 30px ${RANK_GLOW[idx]}, 0 0 60px ${RANK_GLOW[idx]}` : 'none',
                            }}
                        >
                            {/* ── Card Header ── */}
                            <button className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-white/5 transition-colors"
                                onClick={() => setExpandedRank(prev => prev === proto.rank ? null : proto.rank)}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-xl flex-shrink-0">{RANK_MEDALS[idx]}</span>
                                    <div className="min-w-0">
                                        {/* Rank label + icon */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="flex items-center gap-1" style={{ color: accent }}>
                                                {RANK_ICONS[idx]}
                                                <span className="text-[9px] font-mono tracking-[0.18em]">
                                                    {proto.rankLabel || ['No.1 Clinical Fit', 'No.2 Trending Match', 'No.3 Stretch Goal'][idx]}
                                                </span>
                                            </span>
                                            <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold"
                                                style={{ background: 'rgba(0,255,255,0.1)', color: '#00FFFF', border: '1px solid rgba(0,255,255,0.3)' }}>
                                                {proto.matchScore}%
                                            </span>
                                            {isSelected && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                                        </div>
                                        <h3 className="text-sm md:text-base font-bold text-white truncate">{proto.name}</h3>
                                        <p className="text-[10px] text-white/30 font-mono mt-0.5">{RANK_DESC[idx]}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
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
                                    <div className="rounded-full p-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
                                    </div>
                                </div>
                            </button>

                            {/* ── Expanded Detail Panel ── */}
                            {isExpanded && (
                                <div className="px-5 pb-5 space-y-5 border-t border-white/5">
                                    {/* Rank Rationale Banner */}
                                    {proto.rankRationale && (
                                        <div className="mt-4 rounded-lg px-3 py-2.5 flex items-start gap-2"
                                            style={{ background: `${accent}12`, border: `1px solid ${accent}30` }}>
                                            {RANK_ICONS[idx]}
                                            <span className="text-[11px] leading-relaxed" style={{ color: accent }}>{proto.rankRationale}</span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                                        {/* Left Column */}
                                        <div className="space-y-4">
                                            {/* Device Combination */}
                                            {devices.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Zap className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                                        <span className="text-[9px] font-mono tracking-[0.2em] text-cyan-400/70">{lbl.deviceLabel}</span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {devices.map(d => {
                                                            const cat = guessCategory(d);
                                                            return (
                                                                <div key={d} className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                                                                    style={{ background: 'rgba(0,255,255,0.04)', border: '1px solid rgba(0,255,255,0.12)' }}>
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                                                                    <div>
                                                                        <div className="text-xs font-bold text-white">{d}</div>
                                                                        <div className="text-[9px] text-white/35 font-mono">
                                                                            {DEVICE_CATEGORY[cat]?.[language] || DEVICE_CATEGORY['DEFAULT'][language]}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Skin Booster */}
                                            {boosters.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
                                                        <span className="text-[9px] font-mono tracking-[0.2em] text-violet-400/70">{lbl.boosterLabel}</span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {boosters.map(b => (
                                                            <div key={b} className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                                                                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)' }}>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                                                                <div className="text-xs font-bold text-white">{b}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Session count + tags */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {proto.sessions && (
                                                    <span className="text-[9px] px-2.5 py-1 rounded-full font-mono"
                                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
                                                        {proto.sessions} {lbl.sessionsLabel}
                                                    </span>
                                                )}
                                                {proto.tags?.map(tag => (
                                                    <span key={tag} className="text-[9px] px-2.5 py-1 rounded-full font-mono"
                                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-4">
                                            {/* Why suitable */}
                                            {proto.reasonWhy?.why_suitable && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Target className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                                        <span className="text-[9px] font-mono tracking-[0.2em] text-amber-400/70">{lbl.whyLabel}</span>
                                                    </div>
                                                    <p className="text-sm text-white/65 leading-relaxed rounded-lg px-3 py-2"
                                                        style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)' }}>
                                                        💡 {proto.reasonWhy.why_suitable}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Combination pills (remaining items) */}
                                            {proto.reasonWhy?.combinations && proto.reasonWhy.combinations.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Layers className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                                        <span className="text-[9px] font-mono tracking-[0.2em] text-emerald-400/70">Protocol Combination</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {proto.reasonWhy.combinations.slice(0, 5).map((combo, i) => (
                                                            <span key={i} className="text-[10px] px-2.5 py-1 rounded-full font-mono"
                                                                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: 'rgba(110,231,183,0.9)' }}>
                                                                ✦ {combo}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Doctor Row */}
                                    <div className="rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-3"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        <div className="flex items-center gap-3">
                                            <Users className="w-4 h-4 text-white/25" />
                                            <span className="text-xs font-mono text-white/35">{lbl.verifiedDoctor}</span>
                                        </div>
                                        {proto.doctor ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                    {proto.doctor?.name?.[0] || 'M'}
                                                </div>
                                                <span className="text-xs text-white/55 font-mono">{proto.doctor?.name || 'Assigned Specialist'}</span>
                                            </div>
                                        ) : (
                                            <button onClick={() => onUnlock?.()}
                                                className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
                                                style={{ color: '#00FFFF', border: '1px solid rgba(0,255,255,0.3)' }}>
                                                <Lock className="w-3 h-3" />
                                                {lbl.lockMsg}
                                            </button>
                                        )}
                                    </div>

                                    {/* SELECT BUTTON */}
                                    {onSelectProtocol && (
                                        <button
                                            onClick={() => onSelectProtocol(proto)}
                                            className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-300"
                                            style={isSelected
                                                ? { background: 'rgba(0,255,136,0.15)', color: '#00FF88', border: '1.5px solid rgba(0,255,136,0.5)' }
                                                : { background: `${RANK_ACCENT[idx]}18`, color: RANK_ACCENT[idx], border: `1.5px solid ${RANK_ACCENT[idx]}50` }
                                            }
                                        >
                                            {isSelected ? lbl.selectedBtn : lbl.selectBtn}
                                        </button>
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
