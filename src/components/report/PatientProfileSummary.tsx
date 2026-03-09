'use client';
import { User, Target, Zap, Clock, DollarSign, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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
        title: 'YOUR CLINICAL PROFILE',
        subtitle: 'Based on your survey answers',
        summaryLabel: 'AI Clinical Assessment',
        primaryGoal: 'Primary Goal',
        secondaryGoal: 'Secondary Goal',
        areas: 'Focus Areas',
        skinType: 'Skin Type',
        painTolerance: 'Pain Tolerance',
        downtime: 'Downtime Preference',
        budget: 'Budget',
        risks: 'Risk Factors',
        history: 'Treatment History',
        style: 'Treatment Style',
        showMore: 'Show full profile',
        showLess: 'Collapse',
        noRisks: 'No significant risk factors',
        noHistory: 'No prior treatments',
    },
    KO: {
        title: '나의 임상 프로파일',
        subtitle: '설문 응답 기반 분석',
        summaryLabel: 'AI 임상 평가',
        primaryGoal: '주요 목표',
        secondaryGoal: '부목표',
        areas: '집중 케어 부위',
        skinType: '피부 타입',
        painTolerance: '통증 허용도',
        downtime: '다운타임 허용도',
        budget: '예산',
        risks: '위험 요소',
        history: '시술 이력',
        style: '시술 스타일',
        showMore: '전체 프로파일 보기',
        showLess: '접기',
        noRisks: '특별한 위험 요소 없음',
        noHistory: '이전 시술 없음',
    },
    JP: {
        title: 'あなたの臨床プロファイル',
        subtitle: 'アンケート回答に基づく分析',
        summaryLabel: 'AI臨床評価',
        primaryGoal: '主な目標',
        secondaryGoal: 'サブ目標',
        areas: '重点ケアエリア',
        skinType: '肌タイプ',
        painTolerance: '痛み許容度',
        downtime: 'ダウンタイム許容度',
        budget: '予算',
        risks: 'リスク要因',
        history: '治療歴',
        style: '施術スタイル',
        showMore: '全プロファイルを見る',
        showLess: '折りたたむ',
        noRisks: '特筆すべきリスクなし',
        noHistory: '治療歴なし',
    },
    CN: {
        title: '您的临床档案',
        subtitle: '基于问卷答案的分析',
        summaryLabel: 'AI临床评估',
        primaryGoal: '主要目标',
        secondaryGoal: '次要目标',
        areas: '重点护理区域',
        skinType: '肤质类型',
        painTolerance: '疼痛耐受度',
        downtime: '恢复期偏好',
        budget: '预算',
        risks: '风险因素',
        history: '治疗史',
        style: '治疗风格',
        showMore: '查看完整档案',
        showLess: '收起',
        noRisks: '无显著风险因素',
        noHistory: '无既往治疗',
    },
};

const PAIN_METER: Record<string, { bar: number; color: string; label: Record<string, string> }> = {
    Low: { bar: 25, color: '#4ade80', label: { EN: 'Low — prefers minimal discomfort', KO: '낮음 — 최소 통증 선호', JP: '低い — 痛み最小限', CN: '低 — 偏好最小不适' } },
    Medium: { bar: 55, color: '#facc15', label: { EN: 'Medium — manageable is OK', KO: '중간 — 약간 괜찮음', JP: '中程度 — 多少は大丈夫', CN: '中等 — 可接受' } },
    High: { bar: 85, color: '#f87171', label: { EN: 'High — results-first approach', KO: '높음 — 효과 우선', JP: '高い — 効果重視', CN: '高 — 效果优先' } },
};
const DT_METER: Record<string, { bar: number; color: string; label: Record<string, string> }> = {
    None: { bar: 100, color: '#4ade80', label: { EN: 'None — must work same day', KO: '없음 — 당일 일상 필수', JP: 'なし — 当日回復必須', CN: '无 — 当天恢复' } },
    Low: { bar: 75, color: '#86efac', label: { EN: 'Low — 1-2 days max', KO: '낮음 — 최대 1-2일', JP: '低い — 最大1〜2日', CN: '低 — 最多1-2天' } },
    Medium: { bar: 45, color: '#facc15', label: { EN: 'Medium — 3-4 days OK', KO: '중간 — 3-4일 가능', JP: '中程度 — 3〜4日OK', CN: '中等 — 3-4天可接受' } },
    High: { bar: 15, color: '#f87171', label: { EN: 'High — results worth it', KO: '높음 — 결과를 위해', JP: '高い — 結果のためなら', CN: '高 — 为效果值得' } },
};

function MeterBar({ value, color, label }: { value: number; color: string; label: string }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-white/50 font-mono">{label}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, background: color }} />
            </div>
        </div>
    );
}

function Tag({ children, color = '#22d3ee' }: { children: React.ReactNode; color?: string }) {
    return (
        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono"
            style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
            {children}
        </span>
    );
}

export default function PatientProfileSummary({ patientSummary, wizardData, language = 'EN' }: PatientProfileSummaryProps) {
    const [expanded, setExpanded] = useState(false);
    const lbl = L[language] || L['EN'];
    const wd = wizardData || {};

    if (!patientSummary && !wd.primaryGoal) return null;

    const painMeta = PAIN_METER[wd.painTolerance || 'Medium'] || PAIN_METER['Medium'];
    const dtMeta = DT_METER[wd.downtimeTolerance || 'Low'] || DT_METER['Low'];

    return (
        <section className="mb-10 rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.04) 0%, rgba(0,0,0,0.3) 100%)', border: '1px solid rgba(0,255,136,0.15)' }}>

            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)' }}>
                        <User className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <div>
                        <div className="text-[9px] font-mono tracking-[0.25em] text-green-400">{lbl.title}</div>
                        <div className="text-[10px] text-white/30 font-mono">{lbl.subtitle}</div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-5 space-y-5">
                {/* AI Clinical Assessment */}
                {patientSummary && (
                    <div className="rounded-xl px-4 py-3"
                        style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.18)' }}>
                        <div className="text-[9px] font-mono tracking-[0.2em] text-green-400 mb-2">{lbl.summaryLabel}</div>
                        <p className="text-sm text-white/80 leading-relaxed">{patientSummary}</p>
                    </div>
                )}

                {/* Goal + Key Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Goals */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-3 h-3 text-cyan-400" />
                            <span className="text-[9px] font-mono tracking-[0.2em] text-cyan-400/70">{lbl.primaryGoal}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {wd.primaryGoal && <Tag color="#22d3ee">{wd.primaryGoal}</Tag>}
                            {wd.secondaryGoal && <Tag color="#94a3b8">{wd.secondaryGoal}</Tag>}
                            {(wd.areas || []).map(a => <Tag key={a} color="#6366f1">{a}</Tag>)}
                        </div>
                    </div>

                    {/* Skin type + style */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-3 h-3 text-violet-400" />
                            <span className="text-[9px] font-mono tracking-[0.2em] text-violet-400/70">{lbl.skinType}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {wd.skinType && <Tag color="#a78bfa">{wd.skinType}</Tag>}
                            {wd.treatmentStyle && <Tag color="#818cf8">{wd.treatmentStyle}</Tag>}
                        </div>
                    </div>
                </div>

                {/* Tolerance Meters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-[9px] font-mono tracking-[0.2em] text-amber-400/70">{lbl.painTolerance}</span>
                        </div>
                        <MeterBar
                            value={painMeta.bar}
                            color={painMeta.color}
                            label={painMeta.label[language] || painMeta.label['EN']}
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span className="text-[9px] font-mono tracking-[0.2em] text-blue-400/70">{lbl.downtime}</span>
                        </div>
                        <MeterBar
                            value={dtMeta.bar}
                            color={dtMeta.color}
                            label={dtMeta.label[language] || dtMeta.label['EN']}
                        />
                    </div>
                </div>

                {/* Expand Toggle */}
                <button
                    onClick={() => setExpanded(p => !p)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-mono text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                    {expanded ? <><ChevronUp className="w-3 h-3" />{lbl.showLess}</> : <><ChevronDown className="w-3 h-3" />{lbl.showMore}</>}
                </button>

                {/* Expanded Details */}
                {expanded && (
                    <div className="space-y-4 border-t border-white/5 pt-4">
                        {/* Risk Factors */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-3 h-3 text-red-400" />
                                <span className="text-[9px] font-mono tracking-[0.2em] text-red-400/70">{lbl.risks}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {(wd.risks || []).length > 0
                                    ? (wd.risks || []).map(r => <Tag key={r} color="#f87171">{r}</Tag>)
                                    : <span className="text-[10px] text-white/20 font-mono">{lbl.noRisks}</span>
                                }
                            </div>
                        </div>

                        {/* Treatment History */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-3 h-3 text-emerald-400" />
                                <span className="text-[9px] font-mono tracking-[0.2em] text-emerald-400/70">{lbl.history}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {(wd.treatmentHistory || []).length > 0
                                    ? (wd.treatmentHistory || []).map(h => <Tag key={h} color="#34d399">{h}</Tag>)
                                    : <span className="text-[10px] text-white/20 font-mono">{lbl.noHistory}</span>
                                }
                            </div>
                        </div>

                        {/* Budget */}
                        {wd.budget && (
                            <div className="flex items-center gap-3">
                                <DollarSign className="w-3 h-3 text-yellow-400" />
                                <span className="text-[9px] font-mono tracking-[0.2em] text-yellow-400/70">{lbl.budget}:</span>
                                <Tag color="#facc15">{wd.budget}</Tag>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
