'use client';
import { User, Target, Zap, Clock, DollarSign, AlertTriangle, ChevronDown, ChevronUp, Shield, Activity, Sparkles, Brain } from 'lucide-react';
import { useState } from 'react';

interface PatientProfileSummaryProps {
    patientSummary?: string;
    wizardData?: {
        primaryGoal?: string;
        secondaryGoal?: string;
        age?: string;
        gender?: string;
        country?: string;
        skinType?: string;
        areas?: string[];
        risks?: string[];
        painTolerance?: string;
        downtimeTolerance?: string;
        budget?: string;
        treatmentHistory?: string[];
        treatmentStyle?: string;
    };
    language?: string;
}

const L: Record<string, Record<string, string>> = {
    EN: {
        title: 'CLINICAL INTELLIGENCE BRIEF',
        subtitle: 'BETA PREVIEW — Verified Medical Logic',
        summaryLabel: 'AI Clinical Assessment',
        primaryGoal: 'Primary Indication',
        secondaryGoal: 'Secondary Indication',
        indications: 'Indication Matrix',
        areas: 'Target Zones',
        skinType: 'Skin Profile',
        painTolerance: 'Pain Resilience',
        downtime: 'Social Recovery Period',
        budget: 'Investment Profile',
        risks: 'Risk Mitigation Tags',
        history: 'Clinical History',
        style: 'Result Preference',
        showMore: 'Expand Full Data',
        showLess: 'Collapse',
        noRisks: 'No immediate contraindications detected',
        noHistory: 'First-time treatment profile',
    },
    KO: {
        title: '임상 인텔리전스 브리핑',
        subtitle: '베타 프리뷰 — 검증된 메디컬 로직',
        summaryLabel: 'AI 임상 진단 총평',
        primaryGoal: '주요 적응증',
        secondaryGoal: '보조 적응증',
        indications: '인디케이션 매트릭스',
        areas: '타겟 부위',
        skinType: '피부 프로필',
        painTolerance: '통증 허용도',
        downtime: '다운타임 허용도',
        budget: '투자 성향',
        risks: '위험 인자 태그',
        history: '임상 이력',
        style: '결과 스타일',
        showMore: '전체 데이터 확장',
        showLess: '접기',
        noRisks: '즉각적인 금기 사항 발견되지 않음',
        noHistory: '신규 시술 프로필',
    },
};

const PAIN_METER: Record<string, { bar: number; color: string; label: Record<string, string> }> = {
    low: { bar: 25, color: '#4ade80', label: { EN: 'Low — Minimized Pain Focus', KO: '낮음 — 최소 통증 선호', JP: '低い — 痛み最小限', CN: '低 — 偏好最小不适' } },
    moderate: { bar: 55, color: '#facc15', label: { EN: 'Moderate — Standard Tolerance', KO: '보통 — 표준 통증 허용', JP: '中程度 — 多少は大丈夫', CN: '中等 — 可接受' } },
    high: { bar: 85, color: '#00FFA0', label: { EN: 'High — Performance First', KO: '높음 — 효과 극대화 선호', JP: '高い — 効果重視', CN: '高 — 效果优先' } },
    veryHigh: { bar: 100, color: '#00FFA0', label: { EN: 'Elite — No Restriction', KO: '엘리트 — 통증 제약 없음', JP: 'エリート — 痛み制限なし', CN: '精英 — 无限制' } },
};

const DT_METER: Record<string, { bar: number; color: string; label: Record<string, string> }> = {
    none: { bar: 100, color: '#4ade80', label: { EN: 'Zero — Instant Social Return', KO: '제로 — 즉시 일상 복귀', JP: 'なし — 当日回復必須', CN: '无 — 当天恢复' } },
    low: { bar: 75, color: '#86efac', label: { EN: 'Minimal — 24h Recovery', KO: '최소 — 24시간 내 회복', JP: '低い — 最大1〜2日', CN: '低 — 最多1-2天' } },
    moderate: { bar: 45, color: '#facc15', label: { EN: 'Moderate — 3-5 Day Plan', KO: '보통 — 3~5일 관리 주간', JP: '中程度 — 3〜4日OK', CN: '中等 — 3-4天可接受' } },
    high: { bar: 15, color: '#f87171', label: { EN: 'Extended — Maximum Efficacy', KO: '집중 — 결과 중심 장기 회복', JP: '高い — 結果のためなら', CN: '高 — 为效果值得' } },
};

const GOAL_LABELS: Record<string, { EN: string; KO: string }> = {
    antiAging: { EN: 'Anti-Aging & Lifting', KO: '안티에이징 & 리프팅' },
    glassSkin: { EN: 'Glass Skin & Texture', KO: '글래스 스킨 & 결' },
    pigmentation: { EN: 'Tone & Pigmentation', KO: '톤업 & 색소 교정' },
    acneScar: { EN: 'Acne & Scar Repair', KO: '여드름 & 흉터 복구' },
};

function MeterBar({ value, color, label }: { value: number; color: string; label: string }) {
    return (
        <div className="group">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/40 font-mono tracking-wider uppercase group-hover:text-white/60 transition-colors">{label}</span>
                <span className="text-[10px] text-white/20 font-mono">{value}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,255,160,0.2)]"
                    style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}44, ${color})` }} />
            </div>
        </div>
    );
}

function Tag({ children, color = '#00FFA0' }: { children: React.ReactNode; color?: string }) {
    return (
        <span className="text-[10px] px-2.5 py-1 rounded-md font-mono transition-all hover:brightness-125"
            style={{ background: `${color}10`, border: `1px solid ${color}25`, color }}>
            {children}
        </span>
    );
}

export default function PatientProfileSummary({ patientSummary, wizardData, language = 'EN' }: PatientProfileSummaryProps) {
    const [expanded, setExpanded] = useState(false);
    const lbl = L[language] || L['EN'];
    const wd = wizardData || ({} as any);

    if (!patientSummary && !wd.primaryGoal) return null;

    const painMeta = PAIN_METER[wd.painTolerance?.toLowerCase() || 'moderate'] || PAIN_METER['moderate'];
    const dtMeta = DT_METER[wd.downtimeTolerance?.toLowerCase() || 'low'] || DT_METER['low'];

    const primaryGoalLabel = GOAL_LABELS[wd.primaryGoal as any]?.[language as 'EN' | 'KO'] || wd.primaryGoal;
    const secondaryGoalLabel = GOAL_LABELS[wd.secondaryGoal as any]?.[language as 'EN' | 'KO'] || wd.secondaryGoal;

    return (
        <section className="mb-12 relative overflow-hidden group/main">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[#05051a] opacity-50" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FFA0]/[0.02] rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 p-[1px] rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                <div className="rounded-[23px] bg-[#05051a]/95 backdrop-blur-xl overflow-hidden">

                    {/* ── Status Header ── */}
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#00FFA0]/5 border border-[#00FFA0]/20">
                                    <Activity className="w-5 h-5 text-[#00FFA0]" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#05051a] flex items-center justify-center border border-white/10">
                                    <Sparkles className="w-2.5 h-2.5 text-[#00FFA0]" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xs font-bold tracking-[0.2em] text-white uppercase">{lbl.title}</h2>
                                <p className="text-[10px] text-white/30 font-mono mt-0.5">{lbl.subtitle}</p>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA0] animate-pulse" />
                            <span className="text-[9px] text-white/50">LIVE CLINICAL LINK</span>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* ── AI Assessment Block ── */}
                        {patientSummary && (
                            <div className="relative p-6 rounded-2xl bg-gradient-to-r from-[#00FFA0]/[0.03] to-transparent border border-[#00FFA0]/10">
                                <div className="absolute top-4 right-4">
                                    <Shield className="w-4 h-4 text-[#00FFA0]/20" />
                                </div>
                                <h3 className="text-[10px] font-bold tracking-widest text-[#00FFA0] uppercase mb-3 flex items-center gap-2">
                                    <Brain className="w-3 h-3" />
                                    {lbl.summaryLabel}
                                </h3>
                                <p className="text-sm text-white/80 leading-relaxed font-light italic">
                                    "{patientSummary}"
                                </p>
                            </div>
                        )}

                        {/* ── Indication Matrix (70/30) ── */}
                        <div>
                            <h3 className="text-[10px] font-bold tracking-widest text-[#00FFA0]/60 uppercase mb-4 flex items-center gap-2">
                                <Target className="w-3 h-3" />
                                {lbl.indications}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Primary */}
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] text-white/30 uppercase font-mono">{lbl.primaryGoal}</span>
                                        <span className="text-xs font-black text-[#00FFA0]">70%</span>
                                    </div>
                                    <p className="text-sm font-bold text-white mb-2">{primaryGoalLabel || 'General Skin Care'}</p>
                                    <div className="h-1 rounded-full bg-white/5">
                                        <div className="h-full rounded-full bg-[#00FFA0]" style={{ width: '70%' }} />
                                    </div>
                                </div>
                                {/* Secondary */}
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] text-white/30 uppercase font-mono">{lbl.secondaryGoal}</span>
                                        <span className="text-xs font-black text-white/60">30%</span>
                                    </div>
                                    <p className="text-sm font-bold text-white/80 mb-2">{secondaryGoalLabel || 'Barrier Support'}</p>
                                    <div className="h-1 rounded-full bg-white/5">
                                        <div className="h-full rounded-full bg-white/20" style={{ width: '30%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Resilience Meters ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <MeterBar value={painMeta.bar} color={painMeta.color} label={painMeta.label[language] || painMeta.label['EN']} />
                            <MeterBar value={dtMeta.bar} color={dtMeta.color} label={dtMeta.label[language] || dtMeta.label['EN']} />
                        </div>

                        {/* ── Expanding Content ── */}
                        <div className="pt-2">
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="group/btn flex items-center gap-2 text-[10px] font-mono tracking-widest text-white/30 hover:text-[#00FFA0] transition-all"
                            >
                                {expanded ? (
                                    <><ChevronUp className="w-3 h-3 border border-white/10 rounded" /> {lbl.showLess}</>
                                ) : (
                                    <><ChevronDown className="w-3 h-3 border border-white/10 rounded" /> {lbl.showMore}</>
                                )}
                            </button>

                            {expanded && (
                                <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                    {/* Risk mitigation */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 opacity-50">
                                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                                            <span className="text-[9px] font-mono tracking-widest uppercase">{lbl.risks}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(wd.risks || []).length > 0
                                                ? wd.risks.map((r: string) => <Tag key={r} color="#facc15">{r}</Tag>)
                                                : <span className="text-[10px] text-white/20 font-mono">{lbl.noRisks}</span>
                                            }
                                        </div>
                                    </div>

                                    {/* Social & Style */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 opacity-50">
                                            <Zap className="w-3 h-3 text-violet-400" />
                                            <span className="text-[9px] font-mono tracking-widest uppercase">{lbl.style}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {wd.skinType && <Tag color="#a78bfa">{wd.skinType}</Tag>}
                                            {wd.treatmentStyle && <Tag color="#818cf8">{wd.treatmentStyle}</Tag>}
                                            {wd.budget && <Tag color="#fdbaf8">Investment: {wd.budget}</Tag>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Banner */}
                    <div className="px-8 py-3 bg-[#00FFA0]/5 border-t border-white/5 flex items-center justify-center">
                        <span className="text-[9px] font-mono text-[#00FFA0]/60 tracking-widest">
                            PRECISION CLINICAL MATCHING ENGINE V2.0.4 — BETA
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
