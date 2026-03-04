import { motion, AnimatePresence } from 'framer-motion';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { X, ArrowRight, CheckCircle, Shield, Award, Sparkles, Loader2, RefreshCw, Download, Sliders, Settings2, MapPin, Star, Stethoscope, ChevronRight } from 'lucide-react';
import FaceMannequin from '@/components/simulation/FaceMannequin';
import SkinLayerSection from '@/components/simulation/SkinLayerSection';
import LiveRadar from '@/components/simulation/LiveRadar';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { jsPDF } from 'jspdf';
import DeviceDetailModal from '@/components/curation/DeviceDetailModal';

// ─── why_cat 폴링 훅: generate-report-content.ts가 Airtable에 쓰면 표시 ───
function useWhyCatPolling(runId: string | null, language: LanguageCode) {
    const [whyCat, setWhyCat] = useState<Record<string, string>>({});
    const [pollingDone, setPollingDone] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }, []);

    useEffect(() => {
        if (!runId || pollingDone) return;
        let attempts = 0;
        const MAX_ATTEMPTS = 12; // 최대 60초 (5초 * 12)

        const poll = async () => {
            try {
                attempts++;
                const res = await fetch(`/api/engine/get-run?runId=${runId}`);
                if (!res.ok) { if (attempts >= MAX_ATTEMPTS) { stopPolling(); setPollingDone(true); } return; }
                const data = await res.json();

                // 현재 언어의 rank1 why_cat이 채워지면 전체 가져옴
                const lang = language as string;
                const key1 = `why_cat1_${lang}`;
                if (data[key1]) {
                    setWhyCat({
                        rank1: data[`why_cat1_${lang}`] || '',
                        rank2: data[`why_cat2_${lang}`] || '',
                        rank3: data[`why_cat3_${lang}`] || '',
                    });
                    stopPolling();
                    setPollingDone(true);
                } else if (attempts >= MAX_ATTEMPTS) {
                    stopPolling();
                    setPollingDone(true);
                }
            } catch { if (attempts >= MAX_ATTEMPTS) { stopPolling(); setPollingDone(true); } }
        };

        intervalRef.current = setInterval(poll, 5000);
        poll(); // 즉시 1회 실행

        return () => stopPolling();
    }, [runId, language, pollingDone, stopPolling]);

    return whyCat;
}

interface DeepDiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    rank: 1 | 2 | 3 | null;
    language: LanguageCode;
    tallyData?: any; // Pass Tally data for analysis
}

// Fallback Data (Skeleton)
const SKELETON_DATA = {
    primaryZones: [],
    secondaryZones: [],
    activeLayers: [],
    painLevel: 0,
    radar: { lifting: 0, firmness: 0, texture: 0, glow: 0, safety: 0 }
};

export default function DeepDiveModal({ isOpen, onClose, rank, language, tallyData }: DeepDiveModalProps) {
    const t = (REPORT_TRANSLATIONS[language]?.curation || REPORT_TRANSLATIONS['EN'].curation);
    const tRadar = (REPORT_TRANSLATIONS[language]?.simulation || REPORT_TRANSLATIONS['EN'].simulation).radar;
    const td = (REPORT_TRANSLATIONS[language]?.deepDive || REPORT_TRANSLATIONS['EN'].deepDive)!;
    const { user } = useAuth();

    // State for API Data
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── why_cat 폴링: reportId 또는 runId (양쪽 호환) ──
    const runId = analysisData?.reportId || analysisData?.runId || null;
    const whyCat = useWhyCatPolling(runId, language);

    // Matching State
    const [matches, setMatches] = useState<any[]>([]);
    const [matchLoading, setMatchLoading] = useState(false);

    // Tuning State
    const [isTuning, setIsTuning] = useState(false);
    const [tuningParams, setTuningParams] = useState({
        painTolerance: 'Moderate',
        downtimeTolerance: 'Short (2-3 days)',
        budget: 'Standard'
    });

    // DeviceModal State
    const [deviceModal, setDeviceModal] = useState<{
        isOpen: boolean;
        type: 'device' | 'booster';
        itemId: string;
        itemName: string;
    } | null>(null);

    // AI Copilot Q&A State
    const [chatOpen, setChatOpen] = useState(false);
    const [chatQuestion, setChatQuestion] = useState('');
    const [chatAnswer, setChatAnswer] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    const handleAskCopilot = async () => {
        if (!chatQuestion.trim() || !runId) return;
        setChatLoading(true);
        setChatAnswer('');
        try {
            const res = await fetch('/api/report-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId, question: chatQuestion, language })
            });
            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
                for (const line of lines) {
                    try {
                        const payload = JSON.parse(line.replace('data: ', ''));
                        if (payload.done) break;
                        if (payload.text) setChatAnswer(prev => prev + payload.text);
                    } catch { }
                }
            }
        } catch (e) { console.error('[Copilot]', e); }
        finally { setChatLoading(false); }
    };

    // Fetch Analysis when Modal Opens
    // Fetch Analysis when Modal Opens
    useEffect(() => {
        if (isOpen) {
            if (tallyData) {
                // Initialize tuning params from tallyData if available
                setTuningParams({
                    painTolerance: tallyData.painTolerance || 'Moderate',
                    downtimeTolerance: tallyData.downtimeTolerance || 'Short (2-3 days)',
                    budget: tallyData.budget || 'Standard'
                });
                fetchAnalysis(tallyData);
            } else if (rank) {
                // Static mode: No API call needed, UI uses rankInfo
                setAnalysisData(null);
            }
        }
    }, [isOpen, rank, tallyData]);

    const fetchAnalysis = async (requestData: any) => {
        if (!requestData) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/engine/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...requestData,
                    userId: user?.uid,
                    userEmail: user?.email,
                    language,
                }),
            });

            if (!res.ok) throw new Error("Analysis Failed");

            const result = await res.json();
            setAnalysisData(result);

            // Fetch Matches if reportId exists
            if (result.reportId) {
                fetchMatches(result.reportId);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load AI analysis. Showing standard protocol.");
        } finally {
            setLoading(false);
        }
    };

    const fetchMatches = async (reportId: string) => {
        setMatchLoading(true);
        try {
            const res = await fetch('/api/engine/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId })
            });
            const data = await res.json();
            setMatches(data.matches || []);

            // Trigger Email (Mock)
            if (data.matches && data.matches.length > 0) {
                fetch('/api/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: 'patient@example.com', // Mock recipient
                        subject: 'Your ConnectingDocs Analysis & Matches',
                        data: {
                            reportId: reportId,
                            matchCount: data.matches.length,
                            topMatch: data.matches[0].doctorName
                        }
                    })
                }).catch(err => console.error("Email trigger failed", err));
            }
        } catch (e) {
            console.error("Match fetch failed", e);
        } finally {
            setMatchLoading(false);
        }
    };

    const handleReTune = () => {
        // Merge original tallyData with new tuning params
        const newRequest = {
            ...tallyData,
            ...tuningParams
        };
        fetchAnalysis(newRequest);
        setIsTuning(false);
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const primaryColor = [0, 255, 160]; // ConnectingDocs Green
        const bgColor = [5, 5, 26];

        // ── Header Background ──
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(0, 0, 210, 40, 'F');

        // ── Logo / Title ──
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("CONNECTING DOCS", 20, 20);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("CLINICAL INTELLIGENCE · SECURE REPORT", 20, 26);

        // ── Metadata ──
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        doc.text(`ID: ${analysisData?.reportId || 'PENDING'}`, 150, 18);
        doc.text(`DATE: ${new Date().toLocaleDateString()}`, 150, 22);
        doc.text(`USER: ${user?.email || 'GUEST'}`, 150, 26);

        // ── Content ──
        if (displayData) {
            // Rank Badge
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.roundedRect(20, 50, 40, 6, 1, 1, 'F');
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(7);
            doc.text(`RANK NO.0${effectiveRank} SELECTION`, 23, 54);

            // Protocol Title
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text(displayData.protocolName, 20, 65);

            // Divider
            doc.setDrawColor(230, 230, 230);
            doc.line(20, 72, 190, 72);

            // Analysis Section
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text("AI CLINICAL RATIONALE", 20, 82);

            doc.setFontSize(11);
            doc.setTextColor(50, 50, 50);
            doc.setFont("helvetica", "normal");
            const reason = doc.splitTextToSize(displayData.reason, 170);
            doc.text(reason, 20, 88);

            // Metrics Box
            let metricsY = 95 + (reason.length * 5);
            doc.setFillColor(245, 248, 250);
            doc.roundedRect(20, metricsY, 170, 25, 2, 2, 'F');

            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.text("DOWNTIME", 25, metricsY + 8);
            doc.text("PAIN LEVEL", 80, metricsY + 8);
            doc.text("SESSIONS", 135, metricsY + 8);

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text(displayData.downtime || "Minimal", 25, metricsY + 16);
            doc.text(`${displayData.painLevel}/3`, 80, metricsY + 16);
            doc.text("3-5 Sessions", 135, metricsY + 16);
        }

        // ── Footer ──
        doc.setDrawColor(240, 240, 240);
        doc.line(20, 275, 190, 275);
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text("connectingdocs.ai · Global Medical Intelligence Platform", 20, 282);
        doc.text("Disclaimer: Results based on AI clinical logic. Consult a professional physician.", 120, 282);

        doc.save(`ConnectingDocs_Report_${effectiveRank}.pdf`);
    };

    if (!isOpen || (!rank && !tallyData) || !t) return null;

    const effectiveRank = rank || 1;
    const rankInfo = t?.ranking?.[`rank${effectiveRank}` as keyof typeof t.ranking];

    // Determine which data to show (API > Static Translation)
    const currentRankKey = `rank${effectiveRank}`;
    const aiRankData = analysisData ? analysisData[currentRankKey] : null;

    // why_cat: 폴링으로 받은 4개국어 AI 설명, 없으면 aiRankData.reason, 없으면 번역 fallback
    const aiWhyCat = whyCat[`rank${effectiveRank}`] || '';

    const displayData = aiRankData ? {
        primaryZones: tallyData?.areas || ['Cheek', 'Jawline'],
        secondaryZones: tallyData?.areas?.length > 1 ? [tallyData.areas[1]] : [],
        activeLayers: aiRankData.protocol?.toLowerCase().includes('hifu') ? ['SMAS', 'Deep Dermis'] : ['Dermis', 'Epidermis'],
        radar: { lifting: aiRankData.score || 85, firmness: 82, texture: 78, glow: 75, safety: 95 },
        protocolName: aiRankData.protocol,
        // why_cat AI 설명 우선, 없으면 analyze.ts reason fallback
        reason: aiWhyCat || aiRankData.reason,
        downtime: aiRankData.downtime,
        painLevel: aiRankData.pain === 'High' ? 3 : aiRankData.pain === 'Moderate' ? 2 : 1
    } : {
        // Fallback to Static Data from Translations
        primaryZones: tallyData?.areas || ['Cheek', 'Jawline'],
        secondaryZones: [],
        activeLayers: ['Dermis'],
        radar: { lifting: 85, firmness: 80, texture: 75, glow: 70, safety: 95 },
        protocolName: (rankInfo?.title || "Unknown Protocol") + " (" + (rankInfo?.combo || "Custom") + ")",
        reason: aiWhyCat || rankInfo?.reason || "Loading clinical logic...",
        downtime: "N/A",
        painLevel: 2
    };


    // Standard Radar Data Construction
    const radarChartData = [
        { subject: tRadar.lifting, A: displayData.radar.lifting, fullMark: 100 },
        { subject: tRadar.firmness, A: displayData.radar.firmness, fullMark: 100 },
        { subject: tRadar.texture, A: displayData.radar.texture, fullMark: 100 },
        { subject: tRadar.glow, A: displayData.radar.glow, fullMark: 100 },
        { subject: tRadar.safety, A: displayData.radar.safety, fullMark: 100 },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden bg-[#0a0a0f] border border-white/10 rounded-3xl shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex-none flex items-start justify-between p-6 md:p-8 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/5 z-20">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-cyan-400 uppercase border border-cyan-400/30 rounded-full bg-cyan-400/10">
                                    {td.badge} No.0{effectiveRank}
                                </span>
                                {loading && <span className="flex items-center gap-1 text-xs text-blue-400"><Loader2 className="w-3 h-3 animate-spin" /> {td.analyzing}</span>}
                            </div>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                                {loading ? td.analyzing : (displayData.protocolName || rankInfo.title)}
                            </h2>
                            <p className="max-w-2xl text-gray-400 text-sm md:text-base leading-relaxed mt-2">
                                {loading ? td.analyzingDesc : (displayData.reason || rankInfo.reason)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsTuning(!isTuning)}
                                className={`p-2 rounded-full transition-colors ${isTuning ? 'bg-cyan-500 text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                                title="Tune Protocol"
                            >
                                <Settings2 className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                                title="Download PDF"
                            >
                                <Download className="w-6 h-6" />
                            </button>
                            <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Tuning Panel */}
                    <AnimatePresence>
                        {isTuning && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-[#111116] border-b border-white/10 overflow-hidden"
                            >
                                <div className="p-6 grid md:grid-cols-4 gap-6 items-end">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{td.painLevel}</label>
                                        <select
                                            value={tuningParams.painTolerance}
                                            onChange={(e) => setTuningParams(prev => ({ ...prev, painTolerance: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/20 rounded-lg p-2 text-white text-sm focus:border-cyan-500 outline-none"
                                        >
                                            <option value="Low">{td.painOptions[0]}</option>
                                            <option value="Moderate">{td.painOptions[1]}</option>
                                            <option value="High">{td.painOptions[2]}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{td.depthPenetration.split(' ')[0]}</label>
                                        <select
                                            value={tuningParams.downtimeTolerance}
                                            onChange={(e) => setTuningParams(prev => ({ ...prev, downtimeTolerance: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/20 rounded-lg p-2 text-white text-sm focus:border-cyan-500 outline-none"
                                        >
                                            <option value="None">{td.downtimeOptions[0]}</option>
                                            <option value="Short (2-3 days)">{td.downtimeOptions[1]}</option>
                                            <option value="Long (1 week+)">{td.downtimeOptions[2]}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Budget</label>
                                        <select
                                            value={tuningParams.budget}
                                            onChange={(e) => setTuningParams(prev => ({ ...prev, budget: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/20 rounded-lg p-2 text-white text-sm focus:border-cyan-500 outline-none"
                                        >
                                            <option value="Economy">{td.budgetOptions[0]}</option>
                                            <option value="Standard">{td.budgetOptions[1]}</option>
                                            <option value="Premium">{td.budgetOptions[2]}</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleReTune}
                                        disabled={loading}
                                        className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                        {td.updateProtocol}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-96 gap-4">
                                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                                <p className="text-gray-400">{td.analyzingDesc}</p>
                            </div>
                        ) : (
                            <div className="grid lg:grid-cols-2 gap-0 lg:divide-x divide-white/10">
                                {/* Left: Visual Simulation */}
                                <div className="p-6 md:p-8 space-y-8 bg-[#0a0a0f]">
                                    {/* Face Map */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <div className="w-1 h-5 bg-cyan-500 rounded-full" />
                                                {td.targetZones}
                                            </h3>
                                        </div>
                                        <div className="relative aspect-[3/4] bg-black/40 rounded-2xl overflow-hidden border border-white/5">
                                            <FaceMannequin
                                                primaryZones={displayData.primaryZones}
                                                secondaryZones={displayData.secondaryZones}
                                                language={language}
                                            />
                                            {/* Overlay Info */}
                                            <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
                                                <div className="flex gap-4 text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 bg-red-500/80 rounded-full animate-pulse" />
                                                        <span className="text-gray-300">{td.maxIntensity}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 bg-blue-400/80 rounded-full" />
                                                        <span className="text-gray-300">{td.collagenRemodeling}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skin Layers */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <div className="w-1 h-5 bg-purple-500 rounded-full" />
                                            {td.depthPenetration}
                                        </h3>
                                        <SkinLayerSection
                                            activeLayers={displayData.activeLayers}
                                            language={language}
                                        />
                                    </div>
                                </div>

                                {/* Right: Clinical Data */}
                                <div className="p-6 md:p-8 space-y-8 bg-[#0a0a0f/50]">
                                    {/* Radar Chart */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                                            {td.efficacyProfile}
                                        </h3>
                                        <div className="h-[320px] w-full flex items-center justify-center p-4 bg-black/20 rounded-2xl border border-white/5 overflow-visible">
                                            <LiveRadar data={radarChartData} language={language} />
                                        </div>
                                    </div>

                                    {/* Clinical Logic - AI Generated */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <div className="w-1 h-5 bg-amber-500 rounded-full" />
                                            Clinical Logic (AI)
                                        </h3>
                                        <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Sparkles className="w-24 h-24 text-white" />
                                            </div>

                                            <h4 className="text-xl font-bold text-white mb-2 relative z-10">
                                                {td.whyProtocol}
                                            </h4>
                                            <p className="text-gray-400 leading-relaxed mb-6 relative z-10">
                                                {displayData.reason}
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider">{td.estimatedDowntime}</span>
                                                    <div className="text-white font-medium mt-1">
                                                        {aiRankData?.downtime || "Minimal"}
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider">{td.painLevel}</span>
                                                    <div className="flex gap-1 mt-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`h-1.5 w-4 rounded-full ${i < (aiRankData?.pain === 'High' ? 4 : aiRankData?.pain === 'Moderate' ? 2 : 1)
                                                                    ? 'bg-red-500'
                                                                    : 'bg-gray-700'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-500 justify-end">
                                            <RefreshCw className="w-3 h-3" />
                                            <span>{td.poweredBy}</span>
                                        </div>
                                    </div>

                                    {/* Top Devices & Boosters */}
                                    {((aiRankData?.devices || aiRankData?.top_devices)?.length > 0) && (
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-1 h-4 bg-cyan-500 rounded-full" />
                                                {language === 'KO' ? '추천 디바이스' : language === 'JP' ? '推奨機器' : language === 'CN' ? '推荐设备' : 'Recommended Devices'}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(aiRankData.devices || aiRankData.top_devices).slice(0, 2).map((device: any, idx: number) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setDeviceModal({ isOpen: true, type: 'device', itemId: device?.device_id || device?.id || '', itemName: device?.device_name || device?.name || device })}
                                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 rounded-xl text-left transition-all group"
                                                    >
                                                        <div className="text-xs font-semibold text-white truncate">{device?.device_name || device?.name || device}</div>
                                                        <div className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1">
                                                            {language === 'KO' ? '상세 보기' : language === 'JP' ? '詳細を見る' : language === 'CN' ? '查看详情' : 'View Details'}
                                                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Matched Doctors Section */}
                    {!loading && (
                        <div className="p-6 md:p-8 border-t border-white/5 bg-[#0a0a0f]">
                            <div className="space-y-4 max-w-4xl mx-auto">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <div className="w-1 h-5 bg-blue-500 rounded-full" />
                                    {td.topSpecialists}
                                </h3>

                                {matchLoading ? (
                                    <div className="p-8 text-center text-gray-500 border border-white/5 rounded-2xl bg-white/5">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        {td.runningMatch}
                                    </div>
                                ) : matches.length > 0 ? (
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {matches.map((doc, idx) => (
                                            <div key={idx} className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-xl p-4 transition-all duration-300">
                                                {/* Badge */}
                                                {doc.score >= 90 && (
                                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-yellow-300/30 flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-white" />
                                                        {doc.score}% MATCH
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-white text-base">{doc.doctorName}</h4>
                                                        <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                                                            <MapPin className="w-3 h-3" />
                                                            {doc.hospitalName}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-cyan-400 font-bold text-sm tracking-wide">{doc.solutionTitle}</div>
                                                        <div className="text-gray-500 text-xs">{doc.priceRange}</div>
                                                    </div>
                                                </div>

                                                {/* Match Details */}
                                                <div className="space-y-1 mb-3">
                                                    {doc.matchDetails.slice(0, 2).map((detail: string, i: number) => (
                                                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                                            <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                            {detail}
                                                        </div>
                                                    ))}
                                                </div>

                                                <button className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-lg border border-cyan-500/30 transition-colors flex items-center justify-center gap-1 group-hover:text-cyan-300">
                                                    View Clinical Profile <ChevronRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-gray-500 border border-white/5 rounded-2xl bg-white/5 text-sm">
                                        {td.noMatches}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI Copilot Q&A */}
                    <div className="border-t border-white/5 bg-[#0a0a0f]">
                        <button
                            onClick={() => setChatOpen(!chatOpen)}
                            className="w-full flex items-center justify-between px-6 md:px-8 py-4 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-500" />
                                {language === 'KO' ? 'AI에게 질문하기' : language === 'JP' ? 'AI에に質問する' : language === 'CN' ? '向AI提问' : 'Ask AI Copilot'}
                            </span>
                            <ChevronRight className={`w-4 h-4 transition-transform ${chatOpen ? 'rotate-90' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {chatOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-6 md:px-8 pb-4 space-y-3">
                                        {/* 예시 질문 버튼 */}
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                language === 'KO' ? '이 시술 주의사항은?' : 'What are the contraindications?',
                                                language === 'KO' ? '회복 기간은 얼마나 되나요?' : 'How long is recovery?',
                                                language === 'KO' ? '비용은 어느 정도인가요?' : 'What\'s the typical cost?',
                                            ].map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { setChatQuestion(q); }}
                                                    className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 transition-colors"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                        {/* 입력창 */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={chatQuestion}
                                                onChange={e => setChatQuestion(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAskCopilot()}
                                                placeholder={language === 'KO' ? '시술에 대해 궁금한 점을 물어보세요...' : 'Ask anything about this treatment...'}
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                                            />
                                            <button
                                                onClick={handleAskCopilot}
                                                disabled={chatLoading || !chatQuestion.trim() || !runId}
                                                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold rounded-xl transition-colors flex items-center gap-1.5 text-sm"
                                            >
                                                {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {/* 응답 */}
                                        {chatAnswer && (
                                            <div className="p-4 bg-gradient-to-br from-cyan-950/30 to-black border border-cyan-500/20 rounded-xl text-sm text-gray-300 leading-relaxed">
                                                {chatAnswer}
                                                {chatLoading && <span className="inline-block w-1.5 h-4 bg-cyan-500 ml-1 animate-pulse rounded-sm" />}
                                            </div>
                                        )}
                                        {!runId && (
                                            <p className="text-xs text-gray-600">
                                                {language === 'KO' ? '* 설문 완료 후 AI 코파일럿이 활성화됩니다' : '* Complete the survey to activate AI Copilot'}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="flex-none p-6 md:p-8 border-t border-white/5 bg-[#0a0a0f] flex flex-col sm:flex-row justify-between items-center gap-4 z-20">
                        <div className="text-sm text-gray-500 text-center sm:text-left">
                            {td.resultsDisclaimer}
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={onClose}
                                className="flex-1 sm:flex-none border border-white/10 text-white px-6 py-3 rounded-full font-bold hover:bg-white/5 transition-colors"
                            >
                                {td.closeAnalysis}
                            </button>
                            <button
                                onClick={() => {
                                    if (user) {
                                        // If reportId exists, redirect to permanent report page
                                        if (analysisData?.reportId) {
                                            window.location.href = `/report/${analysisData.reportId}`;
                                        } else {
                                            onClose();
                                        }
                                    } else {
                                        // Trigger Auth Modal via parent
                                        (window as any).dispatchEvent(new CustomEvent('open-auth-modal'));
                                        onClose();
                                    }
                                }}
                                className="flex-1 sm:flex-none bg-cyan-500 text-black px-8 py-3 rounded-full font-bold hover:bg-cyan-400 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                            >
                                <Shield className="w-5 h-5" />
                                {language === 'KO' ? '리포트 저장 & 상담 예약' :
                                    language === 'JP' ? 'レポート保存 & 相談予約' :
                                        'Save Report & Book'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {deviceModal && (
                <DeviceDetailModal
                    isOpen={deviceModal.isOpen}
                    onClose={() => setDeviceModal(null)}
                    type={deviceModal.type}
                    itemId={deviceModal.itemId}
                    itemName={deviceModal.itemName}
                    patientContext={{
                        primaryGoal: tallyData?.primaryGoal || '',
                        budget: tallyData?.budget || '',
                        language
                    }}
                />
            )}
        </AnimatePresence>
    );
}
