import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import {
    Loader2, Lock, ArrowLeft, Stethoscope, Sparkles,
    AlertTriangle, CheckCircle, Zap, Clock, Droplets,
    Star, ChevronRight, Shield, Award, Copy, Info
} from 'lucide-react';
import { LanguageCode } from '@/utils/translations';
import { useAuth } from '@/context/AuthContext';
import UnlockModal from '@/components/report/UnlockModal';
import DeepDiveModal from '@/components/curation/DeepDiveModal';
import LiveRadar from '@/components/simulation/LiveRadar'; // Radar chart

interface ReportData {
    language: LanguageCode;
    runId: string;
    rank1: any;
    rank2: any;
    rank3: any;
    skinAnalysis: { ko: string; en: string };
    whatToAvoid: { ko: string; en: string };
    overallDirection: { ko: string; en: string };
    doctorQuestion: { ko: string; en: string };
    surveyMeta: any;
    error?: string;
}

export default function ReportPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user } = useAuth();

    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deepDiveConfig, setDeepDiveConfig] = useState<{ isOpen: boolean; rankData: any }>({
        isOpen: false,
        rankData: null,
    });
    const [copied, setCopied] = useState(false);
    const [timedOut, setTimedOut] = useState(false);

    const language = (data?.language || 'EN') as string;
    // displayLang: available even before data loads (uses URL ?lang= param)
    const displayLang = ((router.query.lang as string) || 'KO').toUpperCase();

    useEffect(() => {
        if (!id) return;
        let pollCount = 0;
        const MAX_POLLS = 24; // 24 × 5s = 2 minutes max wait before showing timeout error
        const fetchData = async () => {
            try {
                const langParam = router.query.lang ? `?lang=${router.query.lang}` : '';
                const res = await fetch(`/api/report/${id}${langParam}`);
                if (!res.ok) throw new Error('Report load failed');
                const json = await res.json();

                // Keep polling if recommendation still processing
                if (json.error === 'recommendation_not_ready') {
                    pollCount++;
                    if (pollCount >= MAX_POLLS) {
                        // Stop polling after 2 minutes — show timeout error
                        setTimedOut(true);
                        setLoading(false);
                        return;
                    }
                    setTimeout(() => fetchData(), 5000);
                    return;
                }
                // Background function failed — stop polling, show error
                if (json.error === 'recommendation_failed') {
                    setTimeout(() => { setData(null); setLoading(false); }, 500);
                    return;
                }
                setTimeout(() => { setData(json); setLoading(false); }, 1000);
            } catch (err) {
                console.error(err);
                setTimeout(() => { setData(null); setLoading(false); }, 1000);
            }
        };
        fetchData();
    }, [id, router.query.lang]);

    // Poll for async AI descriptions if empty
    useEffect(() => {
        if (!id || !data) return;
        if (data.rank1?.why_KO && data.rank2?.why_KO && data.rank3?.why_KO) return;

        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            if (attempts > 12) { clearInterval(interval); return; }
            try {
                const res = await fetch(`/api/engine/get-run?runId=${id}`);
                const runData = await res.json();
                if (runData.why_cat1_KO || runData.why_cat2_KO || runData.why_cat3_KO) {
                    setData((prev: ReportData | null) => {
                        if (!prev) return prev;
                        const newData = { ...prev };
                        if (newData.rank1 && runData.why_cat1_KO) newData.rank1.why_KO = runData.why_cat1_KO;
                        if (newData.rank1 && runData.why_cat1_EN) newData.rank1.why_EN = runData.why_cat1_EN;
                        if (newData.rank2 && runData.why_cat2_KO) newData.rank2.why_KO = runData.why_cat2_KO;
                        if (newData.rank2 && runData.why_cat2_EN) newData.rank2.why_EN = runData.why_cat2_EN;
                        if (newData.rank3 && runData.why_cat3_KO) newData.rank3.why_KO = runData.why_cat3_KO;
                        if (newData.rank3 && runData.why_cat3_EN) newData.rank3.why_EN = runData.why_cat3_EN;
                        return newData;
                    });
                    if (runData.why_cat1_KO && runData.why_cat2_KO && runData.why_cat3_KO) {
                        clearInterval(interval);
                    }
                }
            } catch (e) { }
        }, 5000);
        return () => clearInterval(interval);
    }, [id, !!data]);

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
                    {displayLang === 'EN' ? 'Generating your report...' : '리포트 생성 중...'}
                </div>
            </div>
        );
    }

    if (!data || data.error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#02020a] gap-4 text-center px-8">
                <AlertTriangle className="w-12 h-12 text-amber-400" />
                <p className="text-white/60 text-sm">
                    {timedOut
                        ? (displayLang === 'EN'
                            ? 'Report generation timed out. Please try again.'
                            : '리포트 생성 시간이 초과되었습니다. 다시 시도해 주세요.')
                        : (displayLang === 'EN'
                            ? 'Unable to load report.'
                            : '리포트를 불러올 수 없습니다.')}
                </p>
                {timedOut && (
                    <button onClick={() => router.reload()} className="text-xs text-cyan-400 hover:underline font-bold">
                        {displayLang === 'EN' ? 'Try again' : '다시 시도'}
                    </button>
                )}
                <button onClick={() => router.push('/')} className="text-xs text-cyan-400 hover:underline">
                    {displayLang === 'EN' ? 'Go Home' : '홈으로'}
                </button>
            </div>
        );
    }

    const patientName = data.surveyMeta?.name || '고객';
    const skinAnalysisText = language === 'EN' ? data.skinAnalysis?.en : data.skinAnalysis?.ko;
    const whatToAvoidText = language === 'EN' ? data.whatToAvoid?.en : data.whatToAvoid?.ko;
    const doctorQuestionText = language === 'EN' ? data.doctorQuestion?.en : data.doctorQuestion?.ko;

    const ranks = [
        { data: data.rank1, label: language === 'EN' ? 'Primary Protocol' : '1순위 추천 프로토콜 · 최적 매칭', rankNum: 1 },
        { data: data.rank2, label: language === 'EN' ? '2nd Recommendation' : '2순위 추천', rankNum: 2 },
        { data: data.rank3, label: language === 'EN' ? '3rd Recommendation' : '3순위 추천', rankNum: 3 }
    ].filter(r => r.data && r.data.category);

    const getTranslate = (obj: any, key: string) => {
        if (!obj) return '';
        if (language === 'EN' && obj[`${key}_EN`]) return obj[`${key}_EN`];
        return obj[`${key}_KO`] || obj[key] || '';
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(doctorQuestionText || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Extract radar data if available from surveyMeta
    let radarData = null;
    if (data.surveyMeta?.radar_score_json) {
        try {
            const rawRadar = JSON.parse(data.surveyMeta.radar_score_json);
            radarData = [
                { subject: 'Lifting', A: rawRadar.lifting || 50, fullMark: 100 },
                { subject: 'Firmness', A: rawRadar.firmness || 50, fullMark: 100 },
                { subject: 'Texture', A: rawRadar.texture || 50, fullMark: 100 },
                { subject: 'Glow', A: rawRadar.glow || 50, fullMark: 100 },
                { subject: 'Safety', A: rawRadar.safety || 50, fullMark: 100 },
            ];
        } catch (e) { console.error(e); }
    }

    return (
        <div className="min-h-screen bg-[#02020a] text-white selection:bg-cyan-500/30 font-sans pb-40">
            <Head>
                <title>{patientName}님의 임상 분석 리포트 | Connecting Docs</title>
                <meta name="robots" content="noindex" />
                <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&display=swap" rel="stylesheet" />
            </Head>

            {/* ── Navigation Bar ────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 w-full z-50 bg-[#02020a]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> {language === 'EN' ? 'Exit' : '나가기'}
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-cyan-400 tracking-widest hidden sm:block">AI CLINICAL ENGINE</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-cyan-400" />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="pt-24 px-6 max-w-2xl mx-auto space-y-10">
                {/* ── Title ─────────────────────────────────────────────────── */}
                <div className="space-y-2 pt-4">
                    <div className="text-[10px] font-black tracking-widest text-cyan-400 uppercase flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        Intelligence Report V3
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
                        {patientName}님을 위한<br />맞춤형 시술 분석 결과
                    </h1>
                </div>

                {/* ── 1. Patient Skin Analysis ──────────────────────────────── */}
                {(skinAnalysisText || radarData) && (
                    <section className="relative overflow-hidden bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-3xl p-6 sm:p-10 space-y-8">
                        {/* Decorative background glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

                        <div className="flex flex-col md:flex-row gap-10 relative z-10">
                            {/* Analysis Text & Illustration Placeholder */}
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <h2 className="text-2xl font-serif font-light text-cyan-50 tracking-wide">
                                        {language === 'EN' ? 'AI Skin Analysis' : 'AI 피부 상태 분석'}
                                    </h2>
                                </div>
                                <div className="bg-black/30 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400" />
                                    <p className="text-[15px] leading-[1.8] text-white/80 whitespace-pre-wrap font-light">
                                        {skinAnalysisText}
                                    </p>
                                </div>
                            </div>

                            {/* Radar Data */}
                            {radarData && (
                                <div className="w-full md:w-[320px] shrink-0">
                                    <div className="text-[10px] text-cyan-400/60 font-bold tracking-widest uppercase mb-4 text-center md:text-left">
                                        Clinical Parameter Radar
                                    </div>
                                    <div className="h-[280px] w-full flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                                        <LiveRadar data={radarData} language={language as LanguageCode} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── 2. Top Recommendations (Card Format) ─────────────────────────────────── */}
                <section className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 pl-2">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <Star className="w-4 h-4 text-white/70" />
                        </div>
                        <h2 className="text-3xl font-serif font-light text-white">
                            {language === 'EN' ? 'Top 3 Protocol Recommendations' : 'AI 추천 솔루션 Top 3'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {ranks.map((rankObj, idx) => {
                            const rec = rankObj.data;
                            const cat = rec.category;
                            const isRank1 = rankObj.rankNum === 1;

                            return (
                                <div key={idx} className={`rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col h-full group ${isRank1
                                    ? 'border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-black hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]'
                                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                                    }`}>

                                    {isRank1 && (
                                        <div className="absolute -top-10 -right-10 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
                                            <Award className="w-48 h-48 text-cyan-400" />
                                        </div>
                                    )}

                                    <div className="p-6 relative z-10 flex flex-col h-full">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className={`px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-black tracking-widest uppercase ${isRank1 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/10 text-white/60'}`}>
                                                {isRank1 && <Star className="w-3 h-3 fill-cyan-400" />}
                                                {rankObj.label}
                                            </div>
                                        </div>

                                        <h3 className={`text-2xl mb-4 font-serif italic font-light leading-tight ${isRank1 ? 'text-cyan-50' : 'text-white'}`}>
                                            {cat.category_display_name}
                                        </h3>

                                        <p className="text-sm text-white/60 leading-relaxed mb-6 line-clamp-4 flex-1 font-light">
                                            {language === 'EN' ? rec.why_EN : rec.why_KO}
                                        </p>

                                        <div className="grid grid-cols-2 gap-2 mb-6 mt-auto">
                                            <div className="bg-black/50 border border-white/5 rounded-xl p-3 text-center transition-colors group-hover:border-white/10">
                                                <Droplets className={`w-3 h-3 mx-auto mb-1 ${isRank1 ? 'text-cyan-400' : 'text-white/40'}`} />
                                                <div className="text-[9px] text-white/40 mb-0.5 tracking-wider">{language === 'EN' ? 'PAIN' : '통증'}</div>
                                                <div className="text-xs font-bold text-white">{cat.avg_pain_level || '-'}</div>
                                            </div>
                                            <div className="bg-black/50 border border-white/5 rounded-xl p-3 text-center transition-colors group-hover:border-white/10">
                                                <Clock className={`w-3 h-3 mx-auto mb-1 ${isRank1 ? 'text-blue-400' : 'text-white/40'}`} />
                                                <div className="text-[9px] text-white/40 mb-0.5 tracking-wider">{language === 'EN' ? 'DOWNTIME' : '회복기간'}</div>
                                                <div className="text-xs font-bold text-white">{cat.avg_downtime || '-'}</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setDeepDiveConfig({ isOpen: true, rankData: rec })}
                                            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 mt-auto shrink-0 ${isRank1
                                                ? 'bg-cyan-500 text-black shadow-[0_4px_20px_rgba(6,182,212,0.2)] hover:bg-cyan-400'
                                                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                                                }`}
                                        >
                                            {language === 'EN' ? 'View Blueprint' : '상세 분석 보기'} <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── 3. What To Avoid ──────────────────────────────────────── */}
                {whatToAvoidText && (
                    <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <h2 className="text-lg font-serif font-light text-amber-500 tracking-wide">
                                {language === 'EN' ? 'Treatments to Avoid' : '주의할 치료'}
                            </h2>
                        </div>
                        <p className="text-sm leading-relaxed text-amber-500/90 whitespace-pre-wrap">
                            {whatToAvoidText}
                        </p>
                    </section>
                )}

                {/* ── 4. Doctor Question ────────────────────────────────────── */}
                {doctorQuestionText && (
                    <section className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-violet-400" />
                                <h2 className="text-lg font-serif font-light text-violet-400 tracking-wide">
                                    {language === 'EN' ? 'Questions for your Doctor' : '클리닉 방문 시 이 질문을 해보세요'}
                                </h2>
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-300 hover:bg-violet-500/20 transition-colors"
                            >
                                {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? (language === 'EN' ? 'Copied' : '복사됨') : (language === 'EN' ? 'Copy' : '복사')}
                            </button>
                        </div>
                        <div className="bg-black/30 border border-violet-500/10 rounded-xl p-5 text-sm leading-relaxed text-violet-100 whitespace-pre-wrap border-l-2 border-l-violet-500">
                            {doctorQuestionText}
                        </div>
                    </section>
                )}
            </main>

            {/* ── Sticky Bottom CTA ─────────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 w-full z-40 pointer-events-none">
                <div className="bg-gradient-to-t from-black via-black/90 to-transparent pb-6 pt-12 px-6">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="pointer-events-auto w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-4 px-8 rounded-full bg-[#00FF88] text-black font-black text-sm uppercase tracking-widest shadow-[0_10px_40px_rgba(0,255,136,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Shield className="w-4 h-4" />
                        <span>의사 매칭 대기자 등록</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <UnlockModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                language={language as LanguageCode}
                reportId={typeof id === 'string' ? id : undefined}
            />

            <DeepDiveModal
                isOpen={deepDiveConfig.isOpen}
                onClose={() => setDeepDiveConfig({ isOpen: false, rankData: null })}
                rankData={deepDiveConfig.rankData}
                language={language}
                runId={typeof id === 'string' ? id : undefined}
                overallDirectionText={data?.overallDirection?.ko || ''}
            />

        </div>
    );
}
