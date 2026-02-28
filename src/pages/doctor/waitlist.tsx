import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import {
    Loader2, ArrowLeft, Mail, Calendar, CheckCircle, FileText,
    ChevronDown, ChevronUp, User, Target, AlertTriangle, Zap,
    DollarSign, Clock, Activity, Star, RefreshCw
} from 'lucide-react';
import { withDoctorGuard } from '@/components/auth/ProtectedRoute';
import { WizardData } from '@/components/report/DoctorClinicalPanel';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WaitlistItem {
    id: string;
    patientEmail: string;
    status: string;
    score: string;
    solutionId: string;
    createdAt: string;
    reportId?: string;
    wizardData?: WizardData;
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
    antiAging: '안티에이징 / 리프팅',
    glassSkin: '글라스 스킨 / 텍스처',
    pigmentation: '색소 개선',
    acneScar: '여드름 & 흉터',
    skinCare: '예방적 케어',
    bodyContouring: '바디 컨투어링',
    hairLoss: '탈모 치료',
    intimateCare: '인티메이트 케어',
};

const RISK_LABELS: Record<string, string> = {
    melasma: '멜라스마',
    activeAcne: '활성 여드름',
    rosacea: '로사세아',
    keloid: '켈로이드',
    pregnancy: '임신 중',
    pacemaker: '심박조율기',
    autoimmune: '자가면역',
    darkSkin: 'Fitz IV–VI',
};

function SurveyBadge({ label, value, color = 'default' }: { label: string; value: string; color?: 'cyan' | 'amber' | 'red' | 'emerald' | 'default' }) {
    const colors = {
        cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
        amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        red: 'border-red-500/30 bg-red-500/10 text-red-300',
        emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        default: 'border-white/15 bg-white/5 text-gray-300',
    };
    return (
        <div className={`px-2.5 py-1.5 rounded-lg border text-xs ${colors[color]}`}>
            <div className="text-[10px] opacity-60 mb-0.5">{label}</div>
            <div className="font-bold">{value}</div>
        </div>
    );
}

function PatientSurveyExpanded({ data }: { data: WizardData }) {
    const {
        primaryGoal, secondaryGoal, risks = [], areas = [], skinType,
        treatmentStyle, painTolerance, downtimeTolerance, budget, frequency,
        age, gender, acneStatus, poreType, treatmentHistory = [], careHabits = [],
    } = data;

    const painLevel = ['none', 'low'].includes(painTolerance || '')
        ? { label: '저통증', color: 'red' as const }
        : painTolerance === 'moderate'
        ? { label: '중간', color: 'amber' as const }
        : { label: '고통증 OK', color: 'emerald' as const };

    const budgetLevel = budget === 'premium'
        ? { label: '💎 프리미엄', color: 'cyan' as const }
        : budget === 'mid'
        ? { label: '💳 중간', color: 'amber' as const }
        : { label: '💰 가성비', color: 'default' as const };

    return (
        <div className="mt-4 space-y-4 border-t border-white/8 pt-4">
            {/* Goals */}
            <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" /> 시술 목표
                </div>
                <div className="flex flex-wrap gap-2">
                    {primaryGoal && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                            <Star className="w-3 h-3 text-cyan-400" />
                            <span className="text-xs text-cyan-300 font-bold">{GOAL_LABELS[primaryGoal] || primaryGoal}</span>
                            <span className="text-[10px] text-cyan-500 font-bold">70%</span>
                        </div>
                    )}
                    {secondaryGoal && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
                            <span className="text-xs text-purple-300">{GOAL_LABELS[secondaryGoal] || secondaryGoal}</span>
                            <span className="text-[10px] text-purple-500 font-bold">30%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Patient profile grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {age && <SurveyBadge label="나이" value={age} />}
                {gender && <SurveyBadge label="성별" value={gender} />}
                {skinType && <SurveyBadge label="피부 타입" value={skinType} color="cyan" />}
                {treatmentStyle && <SurveyBadge label="선호 스타일" value={treatmentStyle === 'natural' ? '자연스럽게' : treatmentStyle === 'dramatic' ? '드라마틱' : treatmentStyle} />}
                <SurveyBadge label="통증 내성" value={painLevel.label} color={painLevel.color} />
                <SurveyBadge label="예산" value={budgetLevel.label} color={budgetLevel.color} />
                {downtimeTolerance && <SurveyBadge label="다운타임" value={['high', 'veryHigh'].includes(downtimeTolerance) ? 'OK' : downtimeTolerance === 'moderate' ? '중간' : '최소'} />}
                {frequency && <SurveyBadge label="방문 주기" value={
                    frequency === 'monthly' ? '월 1회' :
                    frequency === 'quarterly' ? '3개월' :
                    frequency === 'biweekly' ? '2주' : '연 1회'
                } />}
            </div>

            {/* Risks */}
            {risks.length > 0 && (
                <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> 위험 인자
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {risks.map(r => (
                            <span key={r} className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-red-500/30 bg-red-500/10 text-red-300">
                                {RISK_LABELS[r] || r}
                                {r === 'melasma' && acneStatus && ` (${acneStatus})`}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Areas */}
            {areas.length > 0 && (
                <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> 관심 부위
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {areas.map(a => (
                            <span key={a} className="px-2.5 py-1 rounded-full text-[11px] border border-white/15 bg-white/5 text-gray-300">
                                {a}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Treatment History */}
            {treatmentHistory.length > 0 && (
                <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 시술 이력
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {treatmentHistory.map(h => (
                            <span key={h} className="px-2.5 py-1 rounded-full text-[11px] border border-white/10 bg-white/5 text-gray-400">
                                {h}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Waitlist Card ────────────────────────────────────────────────────────────

function WaitlistCard({
    item,
    onMarkContacted,
    marking,
}: {
    item: WaitlistItem;
    onMarkContacted: (id: string) => void;
    marking: boolean;
}) {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [contacted, setContacted] = useState(item.status === 'Contacted');

    const hasSurveyData = item.wizardData && Object.keys(item.wizardData).length > 0;

    const handleMarkContacted = async () => {
        await onMarkContacted(item.id);
        setContacted(true);
    };

    return (
        <div className={`rounded-2xl border transition-all ${
            contacted ? 'border-white/8 bg-[#0a0f1a]' : 'border-white/10 bg-[#0f1219] hover:border-cyan-500/30'
        }`}>
            <div className="p-5">
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row gap-4 sm:items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-3 py-1 text-[11px] font-bold uppercase rounded-full border ${
                                contacted
                                    ? 'border-gray-600/30 bg-gray-600/10 text-gray-500'
                                    : item.status === 'New'
                                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                            }`}>
                                {contacted ? '연락 완료' : item.status}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                            </span>
                            <span className="ml-auto text-xs font-bold text-white px-2 py-0.5 rounded bg-white/8 border border-white/10">
                                {item.score}% 매칭
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <h3 className="text-sm font-bold text-white">{item.patientEmail}</h3>
                        </div>

                        {/* Quick goal preview */}
                        {item.wizardData?.primaryGoal && (
                            <div className="flex items-center gap-1.5 mt-2">
                                <Target className="w-3 h-3 text-cyan-400" />
                                <span className="text-xs text-cyan-300 font-medium">
                                    {GOAL_LABELS[item.wizardData.primaryGoal] || item.wizardData.primaryGoal}
                                </span>
                                {item.wizardData.risks && item.wizardData.risks.length > 0 && (
                                    <>
                                        <span className="text-gray-600 mx-1">|</span>
                                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                                        <span className="text-xs text-amber-300">
                                            {item.wizardData.risks.slice(0, 2).map(r => RISK_LABELS[r] || r).join(', ')}
                                            {item.wizardData.risks.length > 2 && ` +${item.wizardData.risks.length - 2}`}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-all flex items-center gap-1.5"
                            onClick={() => {
                                if (item.reportId) {
                                    router.push(`/report/${item.reportId}`);
                                } else {
                                    // Navigate using patient email as fallback
                                    router.push(`/report/${item.id}`);
                                }
                            }}>
                            <FileText className="w-3.5 h-3.5" />
                            임상 리포트
                        </button>
                        {!contacted && (
                            <button
                                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                                onClick={handleMarkContacted}
                                disabled={marking}
                            >
                                {marking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                연락 완료
                            </button>
                        )}
                    </div>
                </div>

                {/* Expand Survey Data */}
                {hasSurveyData && (
                    <button
                        className="mt-3 flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {expanded ? '설문 데이터 닫기' : '설문 데이터 보기'}
                    </button>
                )}
            </div>

            {/* Expanded Survey Data */}
            {expanded && hasSurveyData && (
                <div className="px-5 pb-5">
                    <PatientSurveyExpanded data={item.wizardData!} />
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function DoctorWaitlist() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
    const [fetching, setFetching] = useState(true);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'new' | 'contacted'>('all');
    const [contactedModal, setContactedModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

    useEffect(() => {
        if (user?.email) fetchWaitlist();
    }, [user]);

    const fetchWaitlist = async () => {
        setFetching(true);
        try {
            const res = await fetch(`/api/doctor/waitlist?email=${encodeURIComponent(user!.email)}`);
            const data = await res.json();
            if (data.waitlist) setWaitlist(data.waitlist);
        } catch (e) {
            console.error('Failed to fetch waitlist:', e);
        } finally {
            setFetching(false);
        }
    };

    const handleMarkContacted = async (id: string) => {
        setMarkingId(id);
        try {
            const res = await fetch('/api/doctor/mark-contacted', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId: id }),
            });
            if (res.ok) {
                setWaitlist(prev => prev.map(w => w.id === id ? { ...w, status: 'Contacted' } : w));
                setContactedModal({ open: true, message: '상태가 업데이트되었습니다.' });
                setTimeout(() => setContactedModal({ open: false, message: '' }), 2500);
            }
        } catch (e) {
            console.error('Failed to mark contacted:', e);
        } finally {
            setMarkingId(null);
        }
    };

    if (loading) return null;

    const filtered = filter === 'all' ? waitlist :
        filter === 'new' ? waitlist.filter(w => w.status === 'New') :
        waitlist.filter(w => w.status === 'Contacted');

    const newCount = waitlist.filter(w => w.status === 'New').length;

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Head>
                <title>환자 대기 명단 | Connecting Docs</title>
            </Head>

            {/* Header */}
            <header className="border-b border-white/10 bg-[#0f1219] py-4 px-6 flex items-center gap-4">
                <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div>
                    <h1 className="text-lg font-bold">환자 대기 명단</h1>
                    <p className="text-xs text-gray-500">매칭된 환자 설문 데이터 및 임상 정보</p>
                </div>
                <button onClick={fetchWaitlist} className="ml-auto p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all" title="새로고침">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
            </header>

            <main className="max-w-4xl mx-auto py-8 px-6">

                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { label: '전체 문의', value: waitlist.length, color: 'text-white' },
                        { label: '신규 (New)', value: newCount, color: 'text-cyan-400' },
                        { label: '연락 완료', value: waitlist.length - newCount, color: 'text-emerald-400' },
                    ].map(s => (
                        <div key={s.label} className="p-4 rounded-xl bg-[#0f1219] border border-white/8 text-center">
                            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 p-1 bg-[#0f1219] rounded-xl border border-white/8 mb-6">
                    {(['all', 'new', 'contacted'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                filter === f ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {f === 'all' ? '전체' : f === 'new' ? `신규 (${newCount})` : '연락 완료'}
                        </button>
                    ))}
                </div>

                {/* List */}
                {fetching ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/20 rounded-3xl bg-white/5">
                        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">
                            {filter === 'all' ? '아직 문의가 없습니다' : `${filter === 'new' ? '신규' : '연락 완료'} 항목 없음`}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {filter === 'all' ? '환자가 매칭되면 여기에 표시됩니다.' : '필터를 변경해 보세요.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((item) => (
                            <WaitlistCard
                                key={item.id}
                                item={item}
                                onMarkContacted={handleMarkContacted}
                                marking={markingId === item.id}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Toast notification */}
            {contactedModal.open && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-emerald-500 text-black font-bold text-sm shadow-2xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {contactedModal.message}
                </div>
            )}
        </div>
    );
}

export default withDoctorGuard(DoctorWaitlist);
