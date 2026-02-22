import { motion, AnimatePresence } from 'framer-motion';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { X, ArrowRight, CheckCircle, Shield, Award, Sparkles, Loader2, RefreshCw, Download, Sliders, Settings2, MapPin, Star, Stethoscope, ChevronRight } from 'lucide-react';
import FaceMannequin from '@/components/simulation/FaceMannequin';
import SkinLayerSection from '@/components/simulation/SkinLayerSection';
import LiveRadar from '@/components/simulation/LiveRadar';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { jsPDF } from 'jspdf';

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
                    userId: user?.id,
                    userEmail: user?.email
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

        // Header
        doc.setFontSize(20);
        doc.text("Connecting Docs - Clinical Report", 20, 20);

        doc.setFontSize(12);
        doc.text(`Generated for: ${user?.email || 'Guest'}`, 20, 30);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 36);

        // Protocol
        if (displayData) {
            doc.setFontSize(16);
            doc.setTextColor(0, 100, 200);
            doc.text(`Recommended Protocol: ${displayData.protocolName}`, 20, 50);

            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            const splitReason = doc.splitTextToSize(`Clinical Logic: ${displayData.reason}`, 170);
            doc.text(splitReason, 20, 60);

            // Specs
            let yPos = 60 + (splitReason.length * 5) + 10;
            doc.text(`Downtime: ${displayData.downtime || 'N/A'}`, 20, yPos);
            doc.text(`Pain Level: ${displayData.painLevel}/3`, 20, yPos + 6);
        }

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("This report is generated by AI Key Doctor Logic.", 20, 280);

        doc.save("ConnectingDocs_Report.pdf");
    };

    if (!isOpen || (!rank && !tallyData) || !t) return null;

    const effectiveRank = rank || 1;
    const rankInfo = t?.ranking?.[`rank${effectiveRank}` as keyof typeof t.ranking];

    // Determine which data to show (API > Static Translation)
    const currentRankKey = `rank${effectiveRank}`;
    const aiRankData = analysisData ? analysisData[currentRankKey] : null;

    const displayData = aiRankData ? {
        primaryZones: ['Cheek', 'Jawline'], // AI placeholder
        secondaryZones: ['EyeArea'],
        activeLayers: ['SMAS', 'Dermis'],
        radar: { lifting: aiRankData.score, firmness: 80, texture: 70, glow: 60, safety: 90 },
        protocolName: aiRankData.protocol,
        reason: aiRankData.reason,
        downtime: aiRankData.downtime,
        painLevel: aiRankData.pain === 'High' ? 3 : aiRankData.pain === 'Moderate' ? 2 : 1
    } : {
        // Fallback to Static Data from Translations
        primaryZones: ['Cheek', 'Jawline'],
        secondaryZones: ['EyeArea'],
        activeLayers: ['SMAS', 'Dermis'],
        radar: { lifting: 85, firmness: 80, texture: 75, glow: 70, safety: 95 },
        protocolName: (rankInfo?.title || "Unknown Protocol") + " (" + (rankInfo?.combo || "Custom") + ")",
        reason: rankInfo?.reason || "Loading clinical logic...",
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
                                            painLevel={displayData.painLevel}
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
                                </div>

                                {/* Matched Doctors Section */}
                                <div className="space-y-4">
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
                                        <div className="space-y-3">
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
                    </div>

                    {/* Footer */}
                    <div className="flex-none p-6 md:p-8 border-t border-white/5 bg-[#0a0a0f] flex justify-between items-center z-20">
                        <div className="text-sm text-gray-500">
                            {td.resultsDisclaimer}
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            {td.closeAnalysis}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence >
    );
}
