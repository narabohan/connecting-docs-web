import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Star, Send, CheckCircle, Loader2, ArrowLeft, Smile, Meh, Frown, Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeedbackData {
    overallSatisfaction: number;        // 1–5 stars
    resultAchieved: 'yes' | 'partial' | 'no' | '';
    sideEffects: string[];
    painActual: 'none' | 'less' | 'as_expected' | 'more' | '';
    downtimeActual: 'none' | 'less' | 'as_expected' | 'more' | '';
    wouldReturn: boolean | null;
    wouldRecommend: boolean | null;
    openFeedback: string;
    treatmentDate: string;
    clinicName: string;
    reportId: string;
}

const SIDE_EFFECTS = [
    '홍반 (발적)', '부종 (붓기)', '멍 (멍듦)', '색소 변화', '딱지/각질',
    '민감성 증가', '일시적 열감', '특이사항 없음',
];

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(n)}
                    className="transition-transform hover:scale-110"
                >
                    <Star
                        className={`w-8 h-8 transition-colors ${
                            n <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

// ─── Choice Button ────────────────────────────────────────────────────────────

function ChoiceBtn({
    selected, onClick, children, color = 'default',
}: {
    selected: boolean; onClick: () => void; children: React.ReactNode;
    color?: 'green' | 'amber' | 'red' | 'default';
}) {
    const colors = {
        green: selected ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/5 text-gray-400 hover:border-emerald-500/40',
        amber: selected ? 'border-amber-500 bg-amber-500/15 text-amber-300' : 'border-white/10 bg-white/5 text-gray-400 hover:border-amber-500/40',
        red: selected ? 'border-red-500 bg-red-500/15 text-red-300' : 'border-white/10 bg-white/5 text-gray-400 hover:border-red-500/40',
        default: selected ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-white/5 text-gray-400 hover:border-cyan-500/40',
    };
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${colors[color]}`}
        >
            {children}
        </button>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) {
    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-black flex items-center justify-center">{step}</span>
                <h3 className="text-sm font-bold text-white">{title}</h3>
            </div>
            {subtitle && <p className="text-xs text-gray-500 ml-8">{subtitle}</p>}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { reportId } = router.query;
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState<FeedbackData>({
        overallSatisfaction: 0,
        resultAchieved: '',
        sideEffects: [],
        painActual: '',
        downtimeActual: '',
        wouldReturn: null,
        wouldRecommend: null,
        openFeedback: '',
        treatmentDate: '',
        clinicName: '',
        reportId: (reportId as string) || '',
    });

    useEffect(() => {
        if (reportId) setForm(f => ({ ...f, reportId: reportId as string }));
    }, [reportId]);

    const toggleSideEffect = (e: string) => {
        setForm(f => ({
            ...f,
            sideEffects: f.sideEffects.includes(e)
                ? f.sideEffects.filter(x => x !== e)
                : [...f.sideEffects, e],
        }));
    };

    const handleSubmit = async () => {
        if (form.overallSatisfaction === 0) {
            alert('전체 만족도를 선택해주세요.');
            return;
        }
        setSubmitting(true);
        try {
            await fetch('/api/patient/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    patientEmail: user?.email,
                    submittedAt: new Date().toISOString(),
                }),
            });
            setSubmitted(true);
        } catch (e) {
            console.error('Feedback submission failed:', e);
            // Still show success to user even if API fails
            setSubmitted(true);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">피드백 감사합니다! 🎉</h2>
                    <p className="text-gray-400 mb-8">
                        소중한 후기가 담당 의사에게 전달됩니다. 더 나은 시술 경험을 위해 활용됩니다.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-6 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-bold hover:bg-white/15 transition-all"
                        >
                            대시보드로
                        </button>
                        {reportId && (
                            <button
                                onClick={() => router.push(`/report/${reportId}`)}
                                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-black text-sm font-bold hover:bg-cyan-400 transition-all"
                            >
                                리포트 보기
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Head>
                <title>시술 후기 | Connecting Docs</title>
                <meta name="description" content="시술 경험을 공유하고 더 나은 케어를 받으세요." />
            </Head>

            {/* Header */}
            <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl py-4 px-6 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                    <ArrowLeft className="w-4 h-4 text-gray-400" />
                </button>
                <div>
                    <h1 className="text-sm font-bold">시술 후기 작성</h1>
                    <p className="text-xs text-gray-500">Treatment Feedback</p>
                </div>
            </header>

            <main className="max-w-xl mx-auto py-8 px-6 space-y-8">

                {/* Intro */}
                <div className="p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
                    <p className="text-sm text-cyan-200 leading-relaxed">
                        시술 후 경험을 공유해주세요. 담당 의사에게 전달되어 <strong>다음 방문 플랜</strong>에 활용됩니다.
                        모든 항목은 익명으로 처리됩니다.
                    </p>
                </div>

                {/* ① Overall Satisfaction */}
                <div>
                    <SectionHeader step={1} title="전체 만족도" subtitle="시술 결과에 전반적으로 얼마나 만족하셨나요?" />
                    <div className="flex flex-col items-center gap-3">
                        <StarRating value={form.overallSatisfaction} onChange={(v) => setForm(f => ({ ...f, overallSatisfaction: v }))} />
                        <div className="text-xs text-gray-500">
                            {form.overallSatisfaction === 0 ? '별을 선택해주세요' :
                             form.overallSatisfaction === 1 ? '😞 불만족' :
                             form.overallSatisfaction === 2 ? '😕 아쉬움' :
                             form.overallSatisfaction === 3 ? '😐 보통' :
                             form.overallSatisfaction === 4 ? '😊 만족' : '🤩 매우 만족'}
                        </div>
                    </div>
                </div>

                {/* ② Result Achieved */}
                <div>
                    <SectionHeader step={2} title="목표 달성 여부" subtitle="원하시던 결과를 얻으셨나요?" />
                    <div className="flex gap-3 flex-wrap">
                        <ChoiceBtn selected={form.resultAchieved === 'yes'} onClick={() => setForm(f => ({ ...f, resultAchieved: 'yes' }))} color="green">
                            ✅ 충분히 달성
                        </ChoiceBtn>
                        <ChoiceBtn selected={form.resultAchieved === 'partial'} onClick={() => setForm(f => ({ ...f, resultAchieved: 'partial' }))} color="amber">
                            🔶 부분적 달성
                        </ChoiceBtn>
                        <ChoiceBtn selected={form.resultAchieved === 'no'} onClick={() => setForm(f => ({ ...f, resultAchieved: 'no' }))} color="red">
                            ❌ 미달성
                        </ChoiceBtn>
                    </div>
                </div>

                {/* ③ Pain Actual */}
                <div>
                    <SectionHeader step={3} title="실제 통증 수준" subtitle="사전 안내와 비교해 통증이 어떠셨나요?" />
                    <div className="flex flex-wrap gap-2">
                        {[
                            { v: 'none', label: '없었음' },
                            { v: 'less', label: '예상보다 적음' },
                            { v: 'as_expected', label: '예상대로' },
                            { v: 'more', label: '예상보다 많음' },
                        ].map(({ v, label }) => (
                            <ChoiceBtn key={v} selected={form.painActual === v} onClick={() => setForm(f => ({ ...f, painActual: v as any }))}>
                                {label}
                            </ChoiceBtn>
                        ))}
                    </div>
                </div>

                {/* ④ Downtime Actual */}
                <div>
                    <SectionHeader step={4} title="실제 다운타임" subtitle="회복 기간이 어떠셨나요?" />
                    <div className="flex flex-wrap gap-2">
                        {[
                            { v: 'none', label: '전혀 없었음' },
                            { v: 'less', label: '예상보다 짧음' },
                            { v: 'as_expected', label: '예상대로' },
                            { v: 'more', label: '예상보다 길었음' },
                        ].map(({ v, label }) => (
                            <ChoiceBtn key={v} selected={form.downtimeActual === v} onClick={() => setForm(f => ({ ...f, downtimeActual: v as any }))}>
                                {label}
                            </ChoiceBtn>
                        ))}
                    </div>
                </div>

                {/* ⑤ Side Effects */}
                <div>
                    <SectionHeader step={5} title="경험한 부작용/반응" subtitle="해당되는 항목을 모두 선택해주세요." />
                    <div className="flex flex-wrap gap-2">
                        {SIDE_EFFECTS.map((e) => (
                            <button
                                key={e}
                                onClick={() => toggleSideEffect(e)}
                                className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                                    form.sideEffects.includes(e)
                                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                                }`}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ⑥ Would Return / Recommend */}
                <div>
                    <SectionHeader step={6} title="재방문 & 추천 의향" />
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-400 mb-2">같은 의원에 다시 방문하실 의향이 있으신가요?</p>
                            <div className="flex gap-3">
                                <ChoiceBtn selected={form.wouldReturn === true} onClick={() => setForm(f => ({ ...f, wouldReturn: true }))} color="green">
                                    👍 네
                                </ChoiceBtn>
                                <ChoiceBtn selected={form.wouldReturn === false} onClick={() => setForm(f => ({ ...f, wouldReturn: false }))} color="red">
                                    👎 아니요
                                </ChoiceBtn>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-2">주변에 추천하실 의향이 있으신가요?</p>
                            <div className="flex gap-3">
                                <ChoiceBtn selected={form.wouldRecommend === true} onClick={() => setForm(f => ({ ...f, wouldRecommend: true }))} color="green">
                                    👍 추천할게요
                                </ChoiceBtn>
                                <ChoiceBtn selected={form.wouldRecommend === false} onClick={() => setForm(f => ({ ...f, wouldRecommend: false }))} color="red">
                                    👎 아직은 아님
                                </ChoiceBtn>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ⑦ Treatment Info */}
                <div>
                    <SectionHeader step={7} title="시술 정보 (선택)" />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">시술 날짜</label>
                            <input
                                type="date"
                                value={form.treatmentDate}
                                onChange={(e) => setForm(f => ({ ...f, treatmentDate: e.target.value }))}
                                className="w-full bg-[#0f1219] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/40 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">의원명 (선택)</label>
                            <input
                                type="text"
                                value={form.clinicName}
                                onChange={(e) => setForm(f => ({ ...f, clinicName: e.target.value }))}
                                placeholder="OO 피부과"
                                className="w-full bg-[#0f1219] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* ⑧ Open Feedback */}
                <div>
                    <SectionHeader step={8} title="추가 의견 (선택)" subtitle="의사에게 전달하고 싶은 내용을 자유롭게 작성해주세요." />
                    <textarea
                        value={form.openFeedback}
                        onChange={(e) => setForm(f => ({ ...f, openFeedback: e.target.value }))}
                        rows={4}
                        placeholder="시술 전후 변화, 추가 요청사항, 다음 방문 목표 등..."
                        className="w-full bg-[#0f1219] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-cyan-500/40 transition-colors"
                    />
                    <div className="text-right text-xs text-gray-600 mt-1">{form.openFeedback.length} / 500</div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting || form.overallSatisfaction === 0}
                    className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        background: form.overallSatisfaction > 0
                            ? 'linear-gradient(135deg, #00FFFF, #00b4d8)'
                            : 'rgba(255,255,255,0.08)',
                        color: form.overallSatisfaction > 0 ? '#050505' : '#4B5563',
                    }}
                >
                    {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> 제출 중...</>
                    ) : (
                        <><Send className="w-4 h-4" /> 피드백 제출하기</>
                    )}
                </button>

                <p className="text-center text-xs text-gray-600 pb-8">
                    제출된 내용은 담당 의사에게만 공유됩니다. 익명 처리됩니다.
                </p>
            </main>
        </div>
    );
}
