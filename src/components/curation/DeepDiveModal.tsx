import { motion, AnimatePresence } from 'framer-motion';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { X, ArrowRight, CheckCircle, Shield, Award, Sparkles } from 'lucide-react';
import FaceMannequin from '@/components/simulation/FaceMannequin';
import SkinLayerSection from '@/components/simulation/SkinLayerSection';
import LiveRadar from '@/components/simulation/LiveRadar';
import Image from 'next/image';

interface DeepDiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    rank: 1 | 2 | 3 | null;
    language: LanguageCode;
}

// Preset Data for Curated Solutions
const RANK_DATA = {
    1: {
        primaryZones: ['Cheek', 'Forehead'],
        secondaryZones: ['EyeArea'],
        activeLayers: ['Dermis', 'Epidermis'],
        painLevel: 1,
        // Glass Skin: Max Glow & Texture, High Firmware (Booster effect), Moderate Lifting
        radar: { lifting: 60, firmness: 85, texture: 95, glow: 98, safety: 95 }
    },
    2: {
        primaryZones: ['Jawline'], // V-Line specific (Chin not supported, mapping to Jawline covers it)
        secondaryZones: ['Cheek'],
        activeLayers: ['SMAS', 'Muscle'], // Deep lifting
        painLevel: 2,
        // V-Line: Max Lifting, High Firmness, Moderate Texture/Glow
        radar: { lifting: 98, firmness: 90, texture: 60, glow: 70, safety: 85 }
    },
    3: {
        primaryZones: ['Nose', 'Cheek'], // Pores
        secondaryZones: ['Forehead'],
        activeLayers: ['Epidermis', 'Dermis'], // Surface texture
        painLevel: 1,
        // Texture: Max Texture, High Glow, Moderate Lifting
        radar: { lifting: 50, firmness: 80, texture: 98, glow: 85, safety: 90 }
    }
};

export default function DeepDiveModal({ isOpen, onClose, rank, language }: DeepDiveModalProps) {
    const t = (REPORT_TRANSLATIONS[language]?.curation || REPORT_TRANSLATIONS['EN'].curation);
    const tRadar = (REPORT_TRANSLATIONS[language]?.simulation || REPORT_TRANSLATIONS['EN'].simulation).radar;

    if (!isOpen || !rank || !t) return null;

    // Type assertion to ensure keys match FaceMannequin props
    const data = RANK_DATA[rank] as {
        primaryZones: string[];
        secondaryZones: string[];
        activeLayers: string[];
        painLevel: number;
        radar: { lifting: number; firmness: number; texture: number; glow: number; safety: number; };
    };

    const rankInfo = t.ranking[`rank${rank}` as keyof typeof t.ranking];

    const radarChartData = [
        { subject: tRadar.lifting, A: data.radar.lifting, fullMark: 100 },
        { subject: tRadar.firmness, A: data.radar.firmness, fullMark: 100 },
        { subject: tRadar.texture, A: data.radar.texture, fullMark: 100 },
        { subject: tRadar.glow, A: data.radar.glow, fullMark: 100 },
        { subject: tRadar.safety, A: data.radar.safety, fullMark: 100 },
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
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
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
                                <div className="flex gap-1">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < (4 - rank) ? 'bg-cyan-500' : 'bg-gray-800'}`} />
                                    ))}
                                </div>
                            </div>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                                {rankInfo.title}
                            </h2>
                            <p className="mt-1 text-base md:text-lg text-gray-400 font-light">{rankInfo.combo}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 rounded-full hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* LEFT COLUMN: Visual Intelligence (7 cols) */}
                            <div className="lg:col-span-7 flex flex-col gap-6">

                                {/* Clinical Logic Box */}
                                <div className="p-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 rounded-2xl border border-blue-500/20 relative overflow-hidden group min-h-[160px]">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-all duration-700" />
                                    <div className="relative z-10">
                                        <h3 className="flex items-center gap-2 mb-3 text-sm font-bold text-cyan-400 uppercase tracking-widest">
                                            <Sparkles size={14} />
                                            {t.modal.logicTitle}
                                        </h3>
                                        <p className="text-base md:text-lg leading-relaxed text-gray-200">
                                            {rankInfo.reason}
                                        </p>
                                    </div>
                                </div>

                                {/* Visual Simulation Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Face Map */}
                                    <div className="relative aspect-square bg-black/40 rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                                        <div className="absolute top-4 left-4 z-10 text-[10px] text-gray-500 font-mono">
                                            {t.modal.visualTitle}
                                        </div>
                                        <div className="flex-1 relative">
                                            <FaceMannequin
                                                primaryZones={data.primaryZones}
                                                secondaryZones={data.secondaryZones}
                                                language={language}
                                            />
                                        </div>
                                    </div>

                                    {/* Skin Layers */}
                                    <div className="relative aspect-square bg-black/40 rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                                        <div className="absolute top-4 left-4 z-10 text-[10px] text-gray-500 font-mono">
                                            {t.modal.layersTitle}
                                        </div>
                                        <div className="flex-1 flex items-center justify-center p-4">
                                            <SkinLayerSection
                                                activeLayers={data.activeLayers}
                                                painLevel={data.painLevel}
                                                language={language}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Metrics & Doctors (5 cols) */}
                            <div className="lg:col-span-5 flex flex-col gap-6">

                                {/* Radar Chart Section */}
                                <div className="relative h-[320px] bg-black/40 rounded-2xl border border-white/5 p-2 overflow-visible">
                                    <LiveRadar data={radarChartData} language={language} />
                                    <div className="absolute top-4 right-4 flex items-center gap-2 text-[10px] text-cyan-400/80">
                                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                        {t.modal.radarTitle}
                                    </div>
                                </div>

                                {/* Doctor Matching */}
                                <div className="bg-white/5 rounded-2xl border border-white/10 p-5 flex flex-col gap-4">
                                    <h3 className="flex items-center gap-2 text-xs font-bold text-green-400 uppercase tracking-widest">
                                        <Award size={14} />
                                        {t.modal.doctorTitle}
                                    </h3>

                                    <div className="flex flex-col gap-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black/20 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer group">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                                                    Dr
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-gray-200 group-hover:text-white">Dr. Name {i}</div>
                                                    <div className="text-[10px] text-gray-500">Signature Logic Verified</div>
                                                </div>
                                                <ArrowRight size={14} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                                            </div>
                                        ))}
                                    </div>

                                    <button className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                                        {t.modal.doctorCta}
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}


