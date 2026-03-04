import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import {
    Loader2, Lock, ArrowLeft, Stethoscope, Sparkles, ChevronDown, ChevronUp,
    AlertTriangle, Activity, CheckCircle, Zap, Clock, DollarSign, Droplets,
    Star, ChevronRight, Shield, Award
} from 'lucide-react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { useAuth } from '@/context/AuthContext';
import UnlockModal from '@/components/report/UnlockModal';

// ── Types ────────────────────────────────────────────────────────────────────
interface Device {
    name: string;
    suitability: number;
    area?: string;
    layer?: string;
    pain?: string;
    downtime?: string;
}

interface Booster {
    name: string;
    suitability: number;
    mechanism?: string;
    pain?: string;
    downtime?: string;
    method?: string;
}

interface Recommendation {
    id?: string;
    rank: number;
    name: string;
    categoryId?: string;
    matchScore: number;
    description?: string;
    rankRationale?: string;
    focusArea?: string;
    depthLevel?: string;
    tags?: string[];
    devices?: Device[];
    boosters?: Booster[];
}

interface ReportData {
    language: LanguageCode;
    patient?: { name?: string; age?: number; country?: string };
    skinAnalysis?: {
        thickness?: string;
        sensitivity?: string;
        primaryConcern?: string;
        clinicalNote?: string;
    };
    recommendations: Recommendation[];
    riskFlag?: string;
    riskLevel?: 'none' | 'low' | 'medium' | 'high';
}

// ── Translations ──────────────────────────────────────────────────────────────
const T: Record<LanguageCode, Record<string, string>> = {
    EN: {
        exit: 'Exit',
        reportTitle: 'Clinical Intelligence Report',
        skinAnalysis: 'Skin Analysis Summary',
        riskNote: 'Clinical Risk Note',
        rank1Label: 'Primary Protocol · Highest Match',
        rank2Label: '2nd Recommendation',
        rank3Label: '3rd Recommendation',
        whyTitle: 'Why This Is Right For You',
        devicesTitle: 'Recommended Devices',
        boostersTitle: 'Recommended Boosters',
        matchScore: 'Match Score',
        painLabel: 'Pain',
        downtimeLabel: 'Downtime',
        suitLabel: 'Fit',
        ctaButton: 'Book a Consultation ($10)',
        ctaDesc: 'Connect with a matched specialist doctor',
        disclaimer: 'This report is AI-assisted pre-consultation intelligence. Final diagnosis must be made by a licensed physician.',
        thickness: 'Skin Thickness',
        sensitivity: 'Sensitivity',
        primaryConcern: 'Primary Concern',
        expand: 'View Details',
        collapse: 'Collapse',
        analysisVerified: 'AI Analysis · Verified',
        rankRationale: 'Clinical Rationale',
    },
    KO: {
        exit: '나가기',
        reportTitle: '임상 인텔리전스 리포트',
        skinAnalysis: '피부 분석 요약',
        riskNote: '임상 리스크 메모',
        rank1Label: '1순위 프로토콜 · 최적 매칭',
        rank2Label: '2순위 추천',
        rank3Label: '3순위 추천',
        whyTitle: '왜 나에게 맞는 시술인가요?',
        devicesTitle: '추천 디바이스',
        boostersTitle: '추천 부스터',
        matchScore: '매칭 점수',
        painLabel: '통증',
        downtimeLabel: '회복기간',
        suitLabel: '적합도',
        ctaButton: '$10 내고 전문의 예약하기',
        ctaDesc: '매칭된 전문 의사와 연결됩니다',
        disclaimer: '본 리포트는 AI 기반 사전 상담용 인텔리전스입니다. 최종 진단은 반드시 면허 의사에게 받으세요.',
        thickness: '피부 두께',
        sensitivity: '민감도',
        primaryConcern: '주요 고민',
        expand: '상세 보기',
        collapse: '접기',
        analysisVerified: 'AI 분석 · 검증됨',
        rankRationale: '임상 근거',
    },
    JP: {
        exit: '戻る',
        reportTitle: '臨床インテリジェンスレポート',
        skinAnalysis: '肌分析サマリー',
        riskNote: '臨床リスクメモ',
        rank1Label: '第1プロトコル · 最高マッチ',
        rank2Label: '第2推薦',
        rank3Label: '第3推薦',
        whyTitle: 'なぜこの施術があなたに適しているのか',
        devicesTitle: '推奨デバイス',
        boostersTitle: '推奨ブースター',
        matchScore: 'マッチスコア',
        painLabel: '痛み',
        downtimeLabel: 'ダウンタイム',
        suitLabel: '適合度',
        ctaButton: '$10で専門医予約',
        ctaDesc: 'マッチした専門医と接続',
        disclaimer: '本レポートはAI支援の事前相談インテリジェンスです。最終診断は必ず医師が行います。',
        thickness: '肌の厚さ',
        sensitivity: '敏感度',
        primaryConcern: '主な悩み',
        expand: '詳細を見る',
        collapse: '折りたたむ',
        analysisVerified: 'AI分析 · 検証済み',
        rankRationale: '臨床的根拠',
    },
    CN: {
        exit: '退出',
        reportTitle: '临床智能报告',
        skinAnalysis: '皮肤分析摘要',
        riskNote: '临床风险说明',
        rank1Label: '第一方案 · 最高匹配',
        rank2Label: '第二推荐',
        rank3Label: '第三推荐',
        whyTitle: '为什么这个方案适合您',
        devicesTitle: '推荐设备',
        boostersTitle: '推荐增效剂',
        matchScore: '匹配分数',
        painLabel: '疼痛',
        downtimeLabel: '恢复期',
        suitLabel: '适合度',
        ctaButton: '$10预约专科医生',
        ctaDesc: '与匹配的专科医生连接',
        disclaimer: '本报告是AI辅助的预咨询智能报告。最终诊断必须由执业医师进行。',
        thickness: '皮肤厚度',
        sensitivity: '敏感度',
        primaryConcern: '主要问题',
        expand: '查看详情',
        collapse: '收起',
        analysisVerified: 'AI分析 · 已验证',
        rankRationale: '临床依据',
    },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
    const color = score >= 88 ? 'cyan' : score >= 75 ? 'violet' : 'amber';
    const colorMap = {
        cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
        violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400',
        amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
    };
    const sizeMap = { sm: 'text-2xl px-4 py-2', md: 'text-4xl px-6 py-3', lg: 'text-6xl px-8 py-4' };
    return (
        <div className={`inline-flex items-center gap-1 rounded-2xl bg-gradient-to-b ${colorMap[color]} border ${sizeMap[size]}`}>
            <span className="font-black tabular-nums">{score}</span>
            <span className="text-xs font-bold opacity-60">%</span>
        </div>
    );
}

function PillTag({ label, color = 'white' }: { label: string; color?: string }) {
    const map: Record<string, string> = {
        white: 'bg-white/5 text-white/50 border-white/10',
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return (
        <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border ${map[color]}`}>
            {label}
        </span>
    );
}

function DeviceRow({ device, t }: { device: Device; t: Record<string, string> }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                <span className="text-sm font-bold text-white truncate">{device.name}</span>
                {device.area && (
                    <span className="text-[10px] text-white/30 hidden sm:block">{device.area}</span>
                )}
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
                {device.pain && (
                    <div className="text-center hidden sm:block">
                        <div className="text-[9px] text-white/30 uppercase">{t.painLabel}</div>
                        <div className="text-xs font-bold text-amber-400">{device.pain}</div>
                    </div>
                )}
                {device.downtime && (
                    <div className="text-center hidden sm:block">
                        <div className="text-[9px] text-white/30 uppercase">{t.downtimeLabel}</div>
                        <div className="text-xs font-bold text-violet-400">{device.downtime}</div>
                    </div>
                )}
                <div className="text-center">
                    <div className="text-[9px] text-white/30 uppercase">{t.suitLabel}</div>
                    <div className="text-xs font-bold text-cyan-400">{device.suitability}%</div>
                </div>
            </div>
        </div>
    );
}

function BoosterRow({ booster, t }: { booster: Booster; t: Record<string, string> }) {
    return (
        <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0 gap-4">
            <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                    <span className="text-sm font-bold text-white">{booster.name}</span>
                </div>
                {booster.mechanism && (
                    <p className="text-[11px] text-white/40 leading-relaxed pl-4">{booster.mechanism}</p>
                )}
            </div>
            <div className="flex-shrink-0 text-center">
                <div className="text-[9px] text-white/30 uppercase">{t.suitLabel}</div>
                <div className="text-xs font-bold text-violet-400">{booster.suitability}%</div>
            </div>
        </div>
    );
}

// ── Protocol Card (rank 1 = expanded, rank 2/3 = accordion) ──────────────────
function ProtocolCard({
    rec,
    isExpanded,
    onToggle,
    isPrimary,
    t,
    rankLabel,
    onUnlock,
}: {
    rec: Recommendation;
    isExpanded: boolean;
    onToggle: () => void;
    isPrimary: boolean;
    t: Record<string, string>;
    rankLabel: string;
    onUnlock: () => void;
}) {
    const devices = rec.devices || [];
    const boosters = rec.boosters || [];

    return (
        <div className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
            isPrimary
                ? 'border-cyan-500/30 bg-gradient-to-b from-cyan-500/5 to-transparent'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
        }`}>
            {/* Card Header — always visible */}
            <button
                onClick={onToggle}
                className="w-full p-6 sm:p-8 text-left flex items-center justify-between gap-4"
            >
                <div className="flex items-center gap-5 min-w-0">
                    {isPrimary ? (
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                            <Star className="w-6 h-6 text-cyan-400" />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-black text-white/40">{rec.rank}</span>
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="text-[10px] font-black tracking-widest text-white/30 uppercase mb-1">{rankLabel}</div>
                        <h2 className={`font-black uppercase tracking-tight truncate ${isPrimary ? 'text-xl text-cyan-300' : 'text-lg text-white'}`}>
                            {rec.name}
                        </h2>
                        {rec.tags && rec.tags.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap mt-2">
                                {rec.tags.slice(0, 3).map((tag, i) => (
                                    <PillTag key={i} label={tag} color={isPrimary ? 'cyan' : 'white'} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                    <ScoreBadge score={rec.matchScore} size={isPrimary ? 'md' : 'sm'} />
                    <div className="text-white/30">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-6 sm:px-8 pb-8 space-y-8 border-t border-white/5 pt-6">

                    {/* Why This Section */}
                    {(rec.description || rec.rankRationale) && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <h3 className="text-xs font-black tracking-widest text-cyan-400 uppercase">{t.whyTitle}</h3>
                            </div>
                            <p className="text-sm text-white/70 leading-relaxed border-l-2 border-cyan-500/20 pl-4">
                                {rec.description || rec.rankRationale}
                            </p>
                        </div>
                    )}

                    {/* Clinical Rationale chip */}
                    {rec.rankRationale && rec.description && rec.rankRationale !== rec.description && (
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                            <div className="text-[10px] font-black tracking-widest text-white/30 uppercase mb-2">{t.rankRationale}</div>
                            <p className="text-xs text-white/50 leading-relaxed">{rec.rankRationale}</p>
                        </div>
                    )}

                    {/* Protocol Indicators */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {rec.focusArea && (
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
                                <Activity className="w-4 h-4 text-cyan-400 mx-auto mb-2" />
                                <div className="text-[9px] text-white/30 uppercase mb-1">Target Area</div>
                                <div className="text-sm font-bold text-white">{rec.focusArea}</div>
                            </div>
                        )}
                        {rec.depthLevel && (
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
                                <Zap className="w-4 h-4 text-violet-400 mx-auto mb-2" />
                                <div className="text-[9px] text-white/30 uppercase mb-1">Depth</div>
                                <div className="text-sm font-bold text-white">{rec.depthLevel}</div>
                            </div>
                        )}
                        {devices[0]?.downtime && (
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
                                <Clock className="w-4 h-4 text-amber-400 mx-auto mb-2" />
                                <div className="text-[9px] text-white/30 uppercase mb-1">Downtime</div>
                                <div className="text-sm font-bold text-white">{devices[0].downtime}</div>
                            </div>
                        )}
                        {devices[0]?.pain && (
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
                                <Droplets className="w-4 h-4 text-emerald-400 mx-auto mb-2" />
                                <div className="text-[9px] text-white/30 uppercase mb-1">Pain Level</div>
                                <div className="text-sm font-bold text-white">{devices[0].pain}</div>
                            </div>
                        )}
                    </div>

                    {/* Devices */}
                    {devices.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-cyan-400/60" />
                                <h3 className="text-xs font-black tracking-widest text-white/40 uppercase">{t.devicesTitle}</h3>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-5">
                                {devices.map((d, i) => <DeviceRow key={i} device={d} t={t} />)}
                            </div>
                        </div>
                    )}

                    {/* Boosters */}
                    {boosters.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-violet-400/60" />
                                <h3 className="text-xs font-black tracking-widest text-white/40 uppercase">{t.boostersTitle}</h3>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-5">
                                {boosters.map((b, i) => <BoosterRow key={i} booster={b} t={t} />)}
                            </div>
                        </div>
                    )}

                    {/* CTA inside expanded (rank 2/3 only) */}
                    {!isPrimary && (
                        <button
                            onClick={onUnlock}
                            className="w-full py-4 rounded-2xl border border-white/10 text-sm font-black uppercase tracking-widest text-white/60 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <Lock className="w-4 h-4" />
                            {t.ctaButton}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user } = useAuth();

    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedRank, setExpandedRank] = useState<number>(1); // rank 1 open by default

    const language = (data?.language || 'EN') as LanguageCode;
    const t = T[language] || T['EN'];

    // ── Fetch report ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const langParam = router.query.lang ? `?lang=${router.query.lang}` : '';
                const res = await fetch(`/api/report/${id}${langParam}`);
                if (!res.ok) throw new Error('Report load failed');
                const json = await res.json();
                setTimeout(() => { setData(json); setLoading(false); }, 1000);
            } catch (err) {
                console.error(err);
                setTimeout(() => { setData(null); setLoading(false); }, 1000);
            }
        };
        fetchData();
    }, [id, router.query.lang]);

    // ── Poll for async AI why_cat descriptions ────────────────────────────────
    useEffect(() => {
        if (!id || !data?.recommendations?.[0]) return;
        const lang = language as string;
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            if (attempts > 12) { clearInterval(interval); return; }
            try {
                const res = await fetch(`/api/engine/get-run?runId=${id}`);
                const runData = await res.json();
                if (runData[`why_cat1_${lang}`]) {
                    setData((prev: ReportData | null) => {
                        if (!prev) return prev;
                        const newRecs = [...prev.recommendations];
                        if (newRecs[0]) newRecs[0].description = runData[`why_cat1_${lang}`];
                        if (newRecs[1] && runData[`why_cat2_${lang}`]) newRecs[1].description = runData[`why_cat2_${lang}`];
                        if (newRecs[2] && runData[`why_cat3_${lang}`]) newRecs[2].description = runData[`why_cat3_${lang}`];
                        return { ...prev, recommendations: newRecs };
                    });
                    clearInterval(interval);
                }
            } catch (e) { }
        }, 5000);
        return () => clearInterval(interval);
    }, [id, !!data, language]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#02020a] gap-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full border-2 border-cyan-500/20 animate-ping absolute inset-0" />
                    <div className="w-20 h-20 rounded-full border border-cyan-500/40 flex items-center justify-center relative">
                        <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                    </div>
                </div>
                <div className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase animate-pulse">
                    {language === 'KO' ? '리포트 초기화 중...' : 'Initializing Report...'}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#02020a] gap-4 text-center px-8">
                <AlertTriangle className="w-12 h-12 text-amber-400" />
                <p className="text-white/60 text-sm">
                    {language === 'KO' ? '리포트를 불러올 수 없습니다.' : 'Unable to load report.'}
                </p>
                <button onClick={() => router.push('/')} className="text-xs text-cyan-400 hover:underline">
                    {language === 'KO' ? '홈으로' : 'Go Home'}
                </button>
            </div>
        );
    }

    const patientName = data.patient?.name || 'Guest';
    const recommendations = data.recommendations || [];
    const skinAnalysis = data.skinAnalysis || {};
    const riskLevel = data.riskLevel || 'none';
    const riskFlag = data.riskFlag;

    const rankLabels = [t.rank1Label, t.rank2Label, t.rank3Label];

    return (
        <div className="min-h-screen bg-[#02020a] text-white font-mono selection:bg-cyan-500/30">
            <Head>
                <title>{patientName}'s Intelligence Report | Connecting Docs</title>
                <meta name="robots" content="noindex" />
            </Head>

            {/* ── Navigation Bar ────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 w-full z-50 bg-black/70 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-[11px] font-black tracking-widest text-white/40 uppercase hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t.exit}
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-cyan-400 hidden sm:block">LOGIC_ACTIVE</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-cyan-400" />
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Main Content ──────────────────────────────────────────────── */}
            <main className="pt-24 pb-40 px-6 max-w-3xl mx-auto space-y-8">

                {/* Report Title */}
                <div className="space-y-1 pt-4">
                    <div className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase">
                        connectingdocs.ai
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white">
                        {t.reportTitle}
                    </h1>
                    <p className="text-xs text-white/30">{patientName}</p>
                </div>

                {/* ── Risk Flag ────────────────────────────────────────────── */}
                {riskFlag && riskLevel !== 'none' && (
                    <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
                        riskLevel === 'high'
                            ? 'border-red-500/30 bg-red-500/5'
                            : 'border-amber-500/30 bg-amber-500/5'
                    }`}>
                        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${riskLevel === 'high' ? 'text-red-400' : 'text-amber-400'}`} />
                        <div>
                            <div className="text-[10px] font-black tracking-widest uppercase mb-1 text-white/40">
                                {t.riskNote}
                            </div>
                            <p className="text-sm text-white/70 leading-relaxed">{riskFlag}</p>
                        </div>
                    </div>
                )}

                {/* ── Skin Analysis Summary ─────────────────────────────────── */}
                {(skinAnalysis.clinicalNote || skinAnalysis.primaryConcern) && (
                    <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-6 sm:p-8 space-y-5">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <h2 className="text-xs font-black tracking-widest text-emerald-400 uppercase">{t.skinAnalysis}</h2>
                        </div>

                        {skinAnalysis.clinicalNote && (
                            <p className="text-sm text-white/75 leading-relaxed">{skinAnalysis.clinicalNote}</p>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                            {skinAnalysis.thickness && (
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center">
                                    <div className="text-[9px] text-white/30 uppercase mb-1">{t.thickness}</div>
                                    <div className="text-xs font-bold text-emerald-400">{skinAnalysis.thickness}</div>
                                </div>
                            )}
                            {skinAnalysis.sensitivity && (
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center">
                                    <div className="text-[9px] text-white/30 uppercase mb-1">{t.sensitivity}</div>
                                    <div className="text-xs font-bold text-amber-400">{skinAnalysis.sensitivity}</div>
                                </div>
                            )}
                            {skinAnalysis.primaryConcern && (
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center">
                                    <div className="text-[9px] text-white/30 uppercase mb-1">{t.primaryConcern}</div>
                                    <div className="text-xs font-bold text-cyan-400 truncate">{skinAnalysis.primaryConcern}</div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] text-white/20 uppercase tracking-widest">{t.analysisVerified}</span>
                        </div>
                    </div>
                )}

                {/* ── Protocol Stack ────────────────────────────────────────── */}
                <div className="space-y-4">
                    {recommendations.map((rec, idx) => (
                        <ProtocolCard
                            key={rec.id || idx}
                            rec={rec}
                            isPrimary={rec.rank === 1}
                            isExpanded={expandedRank === rec.rank}
                            onToggle={() => setExpandedRank(expandedRank === rec.rank ? 0 : rec.rank)}
                            t={t}
                            rankLabel={rankLabels[idx] || `Rank ${rec.rank}`}
                            onUnlock={() => setIsModalOpen(true)}
                        />
                    ))}
                </div>

                {/* ── Doctor CTA Section ────────────────────────────────────── */}
                <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-8 space-y-5 text-center">
                    <div className="w-14 h-14 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                        <Shield className="w-7 h-7 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                            {language === 'KO' ? '전문의 매칭' : language === 'JP' ? '専門医マッチング' : language === 'CN' ? '专科医生匹配' : 'Specialist Doctor Match'}
                        </h3>
                        <p className="text-xs text-white/40 leading-relaxed max-w-xs mx-auto">{t.ctaDesc}</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 py-4 px-8 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-sm font-black uppercase tracking-widest text-violet-300 hover:bg-violet-500/25 transition-all"
                    >
                        <Award className="w-4 h-4" />
                        {language === 'KO' ? '의사 매칭 대기자 등록' : language === 'JP' ? '医師マッチング登録' : language === 'CN' ? '注册医生匹配' : 'Join Doctor Waitlist'}
                    </button>
                </div>

                {/* ── Disclaimer ────────────────────────────────────────────── */}
                <p className="text-[10px] text-white/15 text-center leading-relaxed uppercase tracking-widest px-4">
                    {t.disclaimer}
                </p>
            </main>

            {/* ── Sticky Bottom CTA ─────────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 w-full z-[60] pointer-events-none">
                <div className="bg-gradient-to-t from-black via-black/80 to-transparent pb-6 pt-10 px-6">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="pointer-events-auto w-full max-w-md mx-auto flex items-center justify-center gap-3 py-4 px-8 rounded-full bg-[#00FF88] text-black font-black text-sm uppercase tracking-widest shadow-[0_10px_40px_rgba(0,255,136,0.35)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Lock className="w-5 h-5" />
                        <span className="truncate">{t.ctaButton}</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* ── Unlock Modal ──────────────────────────────────────────────── */}
            <UnlockModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                language={language}
                reportId={typeof id === 'string' ? id : undefined}
            />

            <style jsx global>{`
                ::selection { background: rgba(0,255,255,0.3); }
                body { background-color: #02020a !important; }
            `}</style>
        </div>
    );
}
