import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Lightbulb, Zap, Database, ChevronRight, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { LanguageCode, REPORT_TRANSLATIONS } from '@/utils/translations';
import { cn } from '@/utils/cn';

interface IntelligenceEngineProps {
    readonly language: LanguageCode;
}

const MOCK_DEVICES = [
    {
        name: "Ultherapy",
        targetArea: "Jawline / Lower Face",
        layer: "SMAS",
        pain: "high",
        downtime: "low",
        suitability: 96,
        status: "suitable",
        radar: { pain: 140, skinFit: 120, aging: 150, efficacy: 140, pigment: 60, budget: 150 }
    },
    {
        name: "Thermage FLX",
        targetArea: "Mid-face / Eyes",
        layer: "Upper & Mid Dermis",
        pain: "medium",
        downtime: "low",
        suitability: 88,
        status: "suitable",
        radar: { pain: 90, skinFit: 140, aging: 120, efficacy: 130, pigment: 50, budget: 140 }
    },
    {
        name: "Rejuran Healer",
        targetArea: "Full Face",
        layer: "Epidermis / Upper Dermis",
        pain: "high",
        downtime: "medium",
        suitability: 55,
        status: "caution",
        radar: { pain: 130, skinFit: 150, aging: 90, efficacy: 110, pigment: 40, budget: 100 }
    },
    {
        name: "Inmode FX",
        targetArea: "Double Chin",
        layer: "Fat Layer",
        pain: "medium",
        downtime: "medium",
        suitability: 20,
        status: "unsuitable",
        radar: { pain: 100, skinFit: 70, aging: 60, efficacy: 120, pigment: 30, budget: 80 }
    },
    {
        name: "PicoSure Pro",
        targetArea: "Pigmentation Spots",
        layer: "Epidermis / Dermis",
        pain: "low",
        downtime: "low",
        suitability: 92,
        status: "suitable",
        radar: { pain: 40, skinFit: 110, aging: 80, efficacy: 150, pigment: 150, budget: 110 }
    },
    {
        name: "Titan",
        targetArea: "Neck & Jawline",
        layer: "Deep Dermis",
        pain: "low",
        downtime: "low",
        suitability: 85,
        status: "suitable",
        radar: { pain: 50, skinFit: 130, aging: 110, efficacy: 100, pigment: 40, budget: 70 }
    },
    {
        name: "Juvelook Volume",
        targetArea: "Sunken Cheeks",
        layer: "Subcutaneous",
        pain: "medium",
        downtime: "medium",
        suitability: 89,
        status: "suitable",
        radar: { pain: 80, skinFit: 140, aging: 140, efficacy: 130, pigment: 30, budget: 120 }
    },
    {
        name: "LDM Triple",
        targetArea: "Full Face",
        layer: "All Layers",
        pain: "low",
        downtime: "low",
        suitability: 98,
        status: "suitable",
        radar: { pain: 10, skinFit: 150, aging: 60, efficacy: 90, pigment: 20, budget: 60 }
    },
    {
        name: "Potenza",
        targetArea: "Pores / Scars",
        layer: "Dermis",
        pain: "medium",
        downtime: "medium",
        suitability: 75,
        status: "caution",
        radar: { pain: 110, skinFit: 100, aging: 80, efficacy: 120, pigment: 70, budget: 90 }
    },
    {
        name: "Shurink Universe",
        targetArea: "V-Line Contour",
        layer: "SMAS",
        pain: "medium",
        downtime: "low",
        suitability: 82,
        status: "suitable",
        radar: { pain: 95, skinFit: 110, aging: 130, efficacy: 120, pigment: 40, budget: 85 }
    }
];

export default function IntelligenceEngine({ language }: IntelligenceEngineProps) {
    const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);

    const t = (REPORT_TRANSLATIONS[language]?.landing || REPORT_TRANSLATIONS['EN'].landing).judgment;
    const dt = t.deviceSuitability;

    const selectedDevice = MOCK_DEVICES[selectedDeviceIndex];

    const clinicalData = [
        { subject: REPORT_TRANSLATIONS[language]?.radar?.axes?.pain || 'Pain', A: selectedDevice.radar.pain, fullMark: 150 },
        { subject: REPORT_TRANSLATIONS[language]?.radar?.axes?.skinFit || 'Elasticity', A: selectedDevice.radar.skinFit, fullMark: 150 },
        { subject: REPORT_TRANSLATIONS[language]?.report?.hero?.axes?.aging || 'Density', A: selectedDevice.radar.aging, fullMark: 150 },
        { subject: REPORT_TRANSLATIONS[language]?.radar?.axes?.efficacy || 'Efficacy', A: selectedDevice.radar.efficacy, fullMark: 150 },
        { subject: REPORT_TRANSLATIONS[language]?.report?.hero?.axes?.pigment || 'Risk', A: selectedDevice.radar.pigment, fullMark: 150 },
        { subject: REPORT_TRANSLATIONS[language]?.radar?.axes?.budget || 'Budget', A: selectedDevice.radar.budget, fullMark: 150 },
    ];

    const getStatusColor = (status: string) => {
        if (status === 'suitable') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        if (status === 'caution') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        return 'text-red-400 bg-red-400/10 border-red-400/20';
    };

    const getStatusIcon = (status: string) => {
        if (status === 'suitable') return <CheckCircle className="w-4 h-4 ml-1" />;
        if (status === 'caution') return <AlertTriangle className="w-4 h-4 ml-1" />;
        return <AlertCircle className="w-4 h-4 ml-1" />;
    };

    const getStatusLabel = (status: string) => {
        if (status === 'suitable') return dt?.status?.suitable || 'Suitable';
        if (status === 'caution') return dt?.status?.caution || 'Caution';
        return dt?.status?.unsuitable || 'Unsuitable';
    };

    const getLevelLabel = (level: string) => {
        if (level === 'high') return dt?.levels?.high || 'High';
        if (level === 'medium') return dt?.levels?.medium || 'Medium';
        return dt?.levels?.low || 'Low';
    };

    return (
        <section className="py-32 bg-[#050505] relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                {/* Section Header */}
                <div className="mb-20 text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mb-4 justify-center md:justify-start"
                    >
                        <Database className="w-5 h-5 text-[#00FFA0]" />
                        <span className="text-[#00FFA0] font-mono text-xs tracking-widest uppercase">{t.badge || "Clinical OS Engine"}</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 uppercase tracking-tight italic">
                        {t.title} <span className="text-slate-500">{t.titleHighlight}</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl text-lg leading-relaxed">
                        {t.desc}
                    </p>
                </div>

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[700px]">

                    {/* 1. Large Visualization Block (Cyber Radar Chart) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="lg:col-span-12 xl:col-span-7 bg-[#02050A] border border-[#00FFA0]/30 rounded-3xl p-8 relative overflow-hidden min-h-[500px] flex flex-col shadow-[0_0_80px_rgba(0,255,160,0.08)_inset]"
                    >
                        {/* Radar Background Image */}
                        <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none flex items-center justify-center p-10">
                            <img
                                src="/images/concepts/radar_bg.png"
                                alt="Radar Cybernetic Background"
                                className="w-full h-full object-contain object-center animate-[spin_120s_linear_infinite]"
                            />
                        </div>

                        {/* High-Tech Decor Layer */}
                        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none overflow-hidden">
                            {/* Rotating crosshairs */}
                            <div className="w-[120%] aspect-square absolute border-l border-r border-[#00FFA0]/10 animate-[spin_60s_linear_infinite]" />
                            <div className="w-[120%] aspect-square absolute border-t border-b border-[#00FFA0]/10 animate-[spin_80s_linear_infinite_reverse]" />
                            {/* Scanning blips */}
                            <div className="w-1 h-1 rounded-full bg-[#00FFA0] absolute top-[30%] left-[30%] shadow-[0_0_10px_#00FFA0] animate-[ping_3s_ease-out_infinite]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00FFA0] absolute top-[60%] right-[30%] shadow-[0_0_10px_#00FFA0] animate-[ping_5s_ease-out_infinite]" />

                            {/* Corner brackets simulating the octagonal frame */}
                            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#00FFA0]/40" />
                            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#00FFA0]/40" />
                            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#00FFA0]/40" />
                            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#00FFA0]/40" />
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4 relative z-10">
                            <div>
                                <h3 className="text-[#00FFA0] font-bold text-xl mb-1 uppercase tracking-tighter italic">Efficacy Profile Engine</h3>
                                <p className="text-[#00FFA0]/50 text-xs font-mono uppercase">System: TGT-VAR-MAP</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 rounded bg-[#00FFA0]/10 text-[#00FFA0] text-[10px] font-mono border border-[#00FFA0]/30 shadow-[0_0_10px_rgba(0,255,160,0.2)]">REAL_TIME</span>
                                    <span className="px-2 py-1 rounded bg-black/50 text-[#00FFA0]/60 text-[10px] font-mono border border-[#00FFA0]/20">SCAN_ACTIVE</span>
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedDevice.name}
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="text-white font-mono text-xs tracking-wider font-bold"
                                    >
                                        Tracking: {selectedDevice.name}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="w-full flex-1 relative z-10">
                            <ResponsiveContainer width="100%" height={400}>
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={clinicalData}>
                                    <PolarGrid stroke="#00FFA0" strokeOpacity={0.25} gridType="circle" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#00FFA0', fontSize: 11, fontWeight: 500, opacity: 0.9 }} />
                                    <Radar
                                        name="Clinical Profile"
                                        dataKey="A"
                                        stroke="#00FFA0"
                                        strokeWidth={2}
                                        fill="#00FFA0"
                                        fillOpacity={0.2}
                                        animationDuration={1000}
                                        activeDot={{ r: 4, fill: '#00FFA0', stroke: '#fff', strokeWidth: 1 }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* 2. Device Suitability List Block */}
                    <div className="lg:col-span-12 xl:col-span-5 grid grid-cols-1 gap-6 h-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="bg-[#111111] border border-[#1F1F1F] rounded-3xl p-6 flex flex-col overflow-hidden h-full max-h-[500px] lg:max-h-full"
                        >
                            <div className="flex items-center justify-between mb-6 shrink-0 border-b border-[#1F1F1F] pb-4">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-[#00FFA0]" />
                                    <h3 className="text-white font-bold text-lg font-mono uppercase tracking-tighter italic">
                                        Device AI Match
                                    </h3>
                                </div>
                                <span className="text-xs text-[#888888] font-mono">Found {MOCK_DEVICES.length} Matches</span>
                            </div>

                            <div className="overflow-y-auto pr-2 flex-1 space-y-4 scrollbar-thin scrollbar-thumb-[#1F1F1F] scrollbar-track-transparent">
                                {MOCK_DEVICES.map((device, index) => {
                                    const statusStyle = getStatusColor(device.status);
                                    const isSelected = selectedDeviceIndex === index;

                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => setSelectedDeviceIndex(index)}
                                            className={cn(
                                                "bg-[#050505] rounded-2xl p-4 transition-all group cursor-pointer border",
                                                isSelected ? "border-[#00FFA0]" : "border-[#1F1F1F] hover:border-[#00FFA0]/30",
                                                isSelected && "shadow-[0_0_15px_rgba(0,240,255,0.1)] bg-[#00FFA0]/5"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className={cn("font-bold text-base mb-1 transition-colors", isSelected ? "text-[#00FFA0]" : "text-white group-hover:text-[#00FFA0]")}>{device.name}</h4>
                                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", statusStyle)}>
                                                        {device.suitability}% {getStatusLabel(device.status)}
                                                        {getStatusIcon(device.status)}
                                                    </span>
                                                </div>
                                                <button className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0", isSelected ? "bg-[#00FFA0]/20 text-[#00FFA0]" : "bg-[#111111] text-[#888888] group-hover:text-[#00FFA0] group-hover:bg-[#00FFA0]/10")}>
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                                                <div className="flex flex-col">
                                                    <span className="text-[#666666] font-mono mb-0.5 uppercase tracking-wider text-[10px]">{dt?.targetArea || 'Target'}</span>
                                                    <span className="text-slate-300 font-medium truncate">{device.targetArea}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[#666666] font-mono mb-0.5 uppercase tracking-wider text-[10px]">{dt?.layer || 'Layer'}</span>
                                                    <span className="text-slate-300 font-medium truncate">{device.layer}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[#666666] font-mono mb-0.5 uppercase tracking-wider text-[10px]">{dt?.pain || 'Pain'}</span>
                                                    <span className="text-slate-300 font-medium capitalize">{getLevelLabel(device.pain)}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[#666666] font-mono mb-0.5 uppercase tracking-wider text-[10px]">{dt?.downtime || 'Downtime'}</span>
                                                    <span className="text-slate-300 font-medium capitalize">{getLevelLabel(device.downtime)}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white text-black rounded-3xl p-6 relative overflow-hidden group cursor-pointer hover:bg-[#00FFA0] transition-colors shrink-0 flex-grow-0"
                            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                        >
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-black font-black text-xl mb-1 uppercase tracking-tighter italic">{t.cta}</h3>
                                    <p className="text-black/70 text-xs font-medium">
                                        Analyze your unique skin logic.
                                    </p>
                                </div>
                                <div className="p-3 bg-black/5 rounded-full border border-black/10 text-black">
                                    <Lightbulb className="w-5 h-5" />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
