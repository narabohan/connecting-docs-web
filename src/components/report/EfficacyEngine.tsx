'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Lightbulb, Zap, Database, ChevronRight, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Device {
    name: string;
    suitability: number;
    area: string;
    layer: string;
    pain: string;
    downtime: string;
}

interface EfficacyEngineProps {
    radarData: any[];     // For the radar chart (Patient + Device alignment)
    devices: Device[];    // List of matched devices
    onSelectDevice: (d: Device) => void;
    activeDeviceName?: string;
    language?: string;
}

export default function EfficacyEngine({ radarData, devices, onSelectDevice, activeDeviceName, language = 'EN' }: EfficacyEngineProps) {
    const [activeRadarData, setActiveRadarData] = useState(radarData);

    // Predictable hash function to generate deterministic charts per device
    const hashString = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    };

    // Auto-select the first device if none is selected
    useEffect(() => {
        if (!activeDeviceName && devices.length > 0) {
            onSelectDevice(devices[0]);
        }

        // Update radar chart when active device changes
        if (activeDeviceName) {
            const hash = hashString(activeDeviceName);
            const alteredData = radarData.map((item, index) => {
                // Vary by +/- 30 points deterministically
                const varAmount = (hash % (index + 2)) * 15 - 20;
                let newScore = item.A + varAmount;
                if (newScore > 100) newScore = 100;
                if (newScore < 20) newScore = 20;

                // Special overrides if Ulthera
                if (activeDeviceName.toLowerCase().includes('ulthera')) {
                    if (item.subject === 'Pain Tolerance') newScore = 20; // Needs high pain tolerance, so the 'fit' score is low if patient has low tolerance
                    if (item.subject === 'Efficacy') newScore = 98;
                }

                return { ...item, A: newScore };
            });
            setActiveRadarData(alteredData);
        }
    }, [activeDeviceName, devices, onSelectDevice, radarData]);

    const getStatusColor = (suitability: number) => {
        if (suitability >= 80) return 'text-[#00FFA0] bg-[#00FFA0]/10 border-[#00FFA0]/20';
        if (suitability >= 60) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        return 'text-red-400 bg-red-400/10 border-red-400/20';
    };

    const getStatusIcon = (suitability: number) => {
        if (suitability >= 80) return <CheckCircle className="w-4 h-4 ml-1" />;
        if (suitability >= 60) return <AlertTriangle className="w-4 h-4 ml-1" />;
        return <AlertCircle className="w-4 h-4 ml-1" />;
    };

    const getStatusLabel = (suitability: number) => {
        if (suitability >= 80) return language === 'KO' ? '적합' : 'Suitable';
        if (suitability >= 60) return language === 'KO' ? '주의' : 'Caution';
        return language === 'KO' ? '부적합' : 'Unsuitable';
    };

    return (
        <section className="py-12 bg-[#050505] relative overflow-hidden mb-12 border-b border-white/10" id="efficacy-engine">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto relative z-10 max-w-7xl">
                {/* Section Header */}
                <div className="mb-12 text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mb-4 justify-center md:justify-start"
                    >
                        <Database className="w-5 h-5 text-[#00FFA0]" />
                        <span className="text-[#00FFA0] font-mono text-xs tracking-widest uppercase">Clinical OS Engine</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-tight italic">
                        Efficacy Profile <span className="text-slate-500">Engine</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl text-lg leading-relaxed">
                        {language === 'KO'
                            ? '귀하의 임상 변수를 바탕으로 가장 안전하고 효과적인 장비를 스캔합니다. 통증, 회복기간, 효과를 기준으로 최적의 매칭 이유를 확인하세요.'
                            : 'We analyze your clinical variables to find the safest, most effective protocol. Understand exactly why a treatment fits you best based on pain, downtime, and efficacy.'}
                    </p>
                </div>

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[650px]">

                    {/* 1. Large Visualization Block (Cyber Radar Chart) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="lg:col-span-12 xl:col-span-7 bg-[#02050A] border border-[#00FFA0]/30 rounded-3xl p-8 relative overflow-hidden min-h-[500px] flex flex-col shadow-[0_0_80px_rgba(0,255,160,0.08)_inset]"
                    >
                        {/* High-Tech Decor Layer */}
                        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none overflow-hidden">
                            {/* Rotating crosshairs */}
                            <div className="w-[120%] aspect-square absolute border-l border-r border-[#00FFA0]/10 animate-[spin_60s_linear_infinite]" />
                            <div className="w-[120%] aspect-square absolute border-t border-b border-[#00FFA0]/10 animate-[spin_80s_linear_infinite_reverse]" />
                            {/* Scanning blips */}
                            <div className="w-1 h-1 rounded-full bg-[#00FFA0] absolute top-[30%] left-[30%] shadow-[0_0_10px_#00FFA0] animate-[ping_3s_ease-out_infinite]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00FFA0] absolute top-[60%] right-[30%] shadow-[0_0_10px_#00FFA0] animate-[ping_5s_ease-out_infinite]" />

                            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#00FFA0]/40" />
                            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#00FFA0]/40" />
                            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#00FFA0]/40" />
                            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#00FFA0]/40" />
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-4 relative z-10">
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
                                        key={activeDeviceName}
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="text-white font-mono text-xs tracking-wider font-bold"
                                    >
                                        Tracking: {activeDeviceName || 'System'}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="w-full flex-1 relative z-10">
                            <ResponsiveContainer width="100%" height={450}>
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={activeRadarData}>
                                    <PolarGrid stroke="#00FFA0" strokeOpacity={0.25} gridType="circle" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#00FFA0', fontSize: 11, fontWeight: 500, opacity: 0.9 }} />
                                    <Radar
                                        name="Clinical Profile"
                                        dataKey="A"
                                        stroke="#00FFA0"
                                        strokeWidth={2}
                                        fill="#00FFA0"
                                        fillOpacity={0.2}
                                        animationDuration={800}
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
                                <span className="text-xs text-[#888888] font-mono">Found {devices.length} Matches</span>
                            </div>

                            <div className="overflow-y-auto pr-2 flex-1 space-y-4 scrollbar-thin scrollbar-thumb-[#1F1F1F] scrollbar-track-transparent">
                                {devices.map((device, index) => {
                                    const statusStyle = getStatusColor(device.suitability);
                                    const isSelected = activeDeviceName === device.name;

                                    return (
                                        <motion.div
                                            key={device.name}
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => onSelectDevice(device)}
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
                                                        {device.suitability}% {getStatusLabel(device.suitability)}
                                                        {getStatusIcon(device.suitability)}
                                                    </span>
                                                </div>
                                                <button className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0", isSelected ? "bg-[#00FFA0]/20 text-[#00FFA0]" : "bg-[#111111] text-[#888888] group-hover:text-[#00FFA0] group-hover:bg-[#00FFA0]/10")}>
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                                                <div className="flex flex-col">
                                                    <span className="text-[#666666] font-mono mb-0.5 uppercase tracking-wider text-[10px]">Target Area</span>
                                                    <span className="text-slate-300 font-medium truncate">{device.area}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[#666666] font-mono mb-0.5 uppercase tracking-wider text-[10px]">Layer</span>
                                                    <span className="text-slate-300 font-medium truncate">{device.layer}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[#666666] font-mono mb-0.5 uppercase tracking-wider text-[10px]">Pain</span>
                                                    <span className={cn("font-medium capitalize", device.pain === 'High' ? 'text-amber-400' : 'text-green-400')}>{device.pain}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[#666666] font-mono mb-0.5 uppercase tracking-wider text-[10px]">Downtime</span>
                                                    <span className="text-slate-300 font-medium capitalize">{device.downtime}</span>
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
                                    <h3 className="text-black font-black text-xl mb-1 uppercase tracking-tighter italic">Analyze Skin Fit</h3>
                                    <p className="text-black/70 text-xs font-medium">
                                        Review detailed anatomical logic.
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
