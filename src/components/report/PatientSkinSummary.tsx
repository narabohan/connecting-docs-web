'use client';
import React from 'react';
import { Microscope, Activity, Tag, Layers, AlertCircle } from 'lucide-react';

interface PatientSkinSummaryProps {
    data: {
        thickness: string;
        sensitivity: string;
        primaryConcern: string;
        secondaryConcern?: string;
        clinicalNote: string;
        country?: string;
    };
    language?: string;
}

export default function PatientSkinSummary({ data, language = 'EN' }: PatientSkinSummaryProps) {
    const isKO = language === 'KO';

    return (
        <section className="mb-12">
            <div className="flex items-center gap-2 mb-6 px-1">
                <Microscope className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black tracking-widest text-white uppercase">
                    {isKO ? '피부 분석 통합 진단서' : 'INTEGRATED SKIN DIAGNOSIS REPORT'}
                </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Left Panel: Stats */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                        <p className="text-[10px] font-black tracking-widest text-white/30 uppercase mb-4">Patient Profile</p>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] text-white/40 uppercase mb-1">Thickness</p>
                                <p className="text-sm font-bold text-emerald-400">{data.thickness}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-white/40 uppercase mb-1">Sensitivity</p>
                                <p className="text-sm font-bold text-amber-400">{data.sensitivity}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-white/40 uppercase mb-1">Primary Concern</p>
                                <p className="text-sm font-bold text-cyan-400">{data.primaryConcern}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Clinical Note */}
                <div className="lg:col-span-3">
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 h-full relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                            <Layers className="w-48 h-48 text-emerald-400" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <p className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Clinical Evaluation</p>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-white/40">
                                    {isKO ? 'AI 정밀 분석' : 'AI Analysis: Verified'}
                                </div>
                            </div>

                            <p className="text-sm text-white/80 leading-relaxed font-medium mb-6">
                                {data.clinicalNote}
                            </p>

                            <div className="flex gap-2 flex-wrap pb-4">
                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-3 py-1 rounded-full border border-emerald-500/20">
                                    Protocol Targeted
                                </span>
                                <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-3 py-1 rounded-full border border-cyan-500/20">
                                    Match High
                                </span>
                                <span className="bg-amber-500/10 text-amber-400 text-[10px] px-3 py-1 rounded-full border border-amber-500/20">
                                    Sensitivity Cleared
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
