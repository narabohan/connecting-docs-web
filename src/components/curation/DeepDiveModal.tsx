import { motion, AnimatePresence } from 'framer-motion';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { X, ArrowRight, CheckCircle, Shield, Award, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import FaceMannequin from '@/components/simulation/FaceMannequin';
import SkinLayerSection from '@/components/simulation/SkinLayerSection';
import LiveRadar from '@/components/simulation/LiveRadar';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

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
    const { user } = useAuth();

    // State for API Data
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch Analysis when Modal Opens
    useEffect(() => {
        if (isOpen && rank && tallyData) {
            fetchAnalysis();
        } else if (isOpen && rank && !tallyData) {
            // Static mode: No API call needed, UI uses rankInfo
            setAnalysisData(null);
        }
    }, [isOpen, rank, tallyData]);

    const fetchAnalysis = async () => {
        if (!tallyData) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/engine/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...tallyData,
                    userId: user?.id,
                    userEmail: user?.email
                }),
            });

            if (!res.ok) throw new Error("Analysis Failed");

            const result = await res.json();
            setAnalysisData(result);
        } catch (err) {
            console.error(err);
            setError("Failed to load AI analysis. Showing standard protocol.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !rank || !t) return null;

    const rankInfo = t.ranking[`rank${rank}` as keyof typeof t.ranking];

    // Determine which data to show (API > Static Translation)
    const currentRankKey = rank ? `rank${rank}` : 'rank1';
    const aiRankData = analysisData ? analysisData[currentRankKey] : null;

    const displayData = aiRankData ? {
        primaryZones: ['Cheek', 'Jawline'], // AI placeholder
        secondaryZones: ['EyeArea'],
        activeLayers: ['SMAS', 'Dermis'],
        radar: { lifting: aiRankData.score, firmness: 80, texture: 70, glow: 60, safety: 90 },
        protocolName: aiRankData.protocol,
        reason: aiRankData.reason,
        painLevel: aiRankData.pain === 'High' ? 3 : aiRankData.pain === 'Moderate' ? 2 : 1
    } : {
        // Fallback to Static Data from Translations
        primaryZones: ['Cheek', 'Jawline'],
        secondaryZones: ['EyeArea'],
        activeLayers: ['SMAS', 'Dermis'],
        radar: { lifting: 85, firmness: 80, texture: 75, glow: 70, safety: 95 },
        protocolName: rankInfo.title + " (" + rankInfo.combo + ")",
        reason: rankInfo.reason,
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
                                    Curated Solution No.0{rank}
                                </span>
                                {loading && <span className="flex items-center gap-1 text-xs text-blue-400"><Loader2 className="w-3 h-3 animate-spin" /> AI Analyzing...</span>}
                            </div>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                                {loading ? "Analyzing Protocol..." : (displayData.protocolName || rankInfo.title)}
                            </h2>
                            <p className="max-w-2xl text-gray-400 text-sm md:text-base leading-relaxed mt-2">
                                {loading ? "Claude AI is reviewing your skin profile to build a custom protocol." : (displayData.reason || rankInfo.reason)}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-96 gap-4">
                                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                                <p className="text-gray-400">Connecting to Clinical Intelligence Engine...</p>
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
                                                Target Zones
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
                                                        <span className="text-gray-300">Max Intensity</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 bg-blue-400/80 rounded-full" />
                                                        <span className="text-gray-300">Collagen Remodeling</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skin Layers */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <div className="w-1 h-5 bg-purple-500 rounded-full" />
                                            Depth Penetration
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
                                            Efficacy Profile
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
                                                Why This Protocol?
                                            </h4>
                                            <p className="text-gray-400 leading-relaxed mb-6 relative z-10">
                                                {displayData.reason}
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Estimated Downtime</span>
                                                    <div className="text-white font-medium mt-1">
                                                        {aiRankData?.downtime || "Minimal"}
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Pain Level</span>
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
                                            <span>Powered by Clinical Engine</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex-none p-6 md:p-8 border-t border-white/5 bg-[#0a0a0f] flex justify-between items-center z-20">
                        <div className="text-sm text-gray-500">
                            * Results may vary. Consultation required.
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            Close Analysis
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
