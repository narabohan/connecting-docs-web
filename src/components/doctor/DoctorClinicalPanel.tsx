import React, { useState } from 'react';
import { Activity, Beaker, FileText, AlertTriangle, Crosshair, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { LanguageCode } from '@/utils/translations';

interface DoctorClinicalPanelProps {
    data: any; // Full AI wizard/report dataset
    language: LanguageCode;
}

export default function DoctorClinicalPanel({ data, language }: DoctorClinicalPanelProps) {
    const [activeTab, setActiveTab] = useState<'intelligence' | 'logic' | 'notes'>('intelligence');

    // Safe extraction of patient variables
    const patientData = data?.patient || {};
    const primaryIndication = patientData.target_area || patientData.primary_indication || 'Undefined';
    const secondaryIndication = patientData.secondary_indication || 'Undefined';

    // Risk flags
    const hasMelasma = patientData.has_melasma;
    const acneStatus = patientData.acne_type;
    const poreType = patientData.pore_type;

    return (
        <div className="bg-[#0A0A0A] border border-[#00FFA0]/30 rounded-2xl overflow-hidden mb-8 shadow-[0_0_30px_rgba(0,255,160,0.1)]">
            {/* Header */}
            <div className="bg-[#00FFA0]/10 border-b border-[#00FFA0]/20 px-6 py-4 flex items-center gap-3">
                <Activity className="w-6 h-6 text-[#00FFA0]" />
                <h2 className="text-xl font-bold font-mono text-[#00FFA0] tracking-tight">Clinical Intelligence Panel</h2>
                <div className="ml-auto flex items-center gap-2">
                    <span className="px-3 py-1 bg-[#00FFA0]/20 text-[#00FFA0] text-xs font-bold rounded border border-[#00FFA0]/30">DOCTOR VIEW</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-[#0A0A0A]">
                {[
                    { id: 'intelligence', label: 'Clinical Intelligence', icon: <Beaker className="w-4 h-4" /> },
                    { id: 'logic', label: 'Device Logic Mapping', icon: <Crosshair className="w-4 h-4" /> },
                    { id: 'notes', label: 'Follow-up / Notes', icon: <FileText className="w-4 h-4" /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 text-sm font-bold font-mono transition-colors",
                            activeTab === tab.id
                                ? "bg-white/5 border-b-2 border-[#00FFA0] text-[#00FFA0]"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="p-6">
                {activeTab === 'intelligence' && (
                    <div className="space-y-6">
                        {/* Indication Matrix */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#111111] p-5 rounded-xl border border-white/5">
                                <h3 className="text-sm font-mono text-gray-400 mb-1">Primary Indication (70%)</h3>
                                <p className="text-xl font-bold text-white capitalize">{primaryIndication}</p>
                            </div>
                            <div className="bg-[#111111] p-5 rounded-xl border border-white/5">
                                <h3 className="text-sm font-mono text-gray-400 mb-1">Secondary Indication (30%)</h3>
                                <p className="text-xl font-bold text-white capitalize">{secondaryIndication}</p>
                            </div>
                        </div>

                        {/* Risk Factors */}
                        <div className="bg-[#1A1510] border border-[#FFA000]/30 rounded-xl p-5">
                            <h3 className="flex items-center gap-2 text-[#FFA000] font-bold mb-4">
                                <AlertTriangle className="w-5 h-5" />
                                Precautionary Risk Flags
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-black/40 p-3 rounded text-sm text-gray-300">
                                    <strong className="block text-white mb-1">Pigmentation / Melasma</strong>
                                    {hasMelasma ? 'Flagged: Modify heat delivery to prevent PIH.' : 'Clear'}
                                </div>
                                <div className="bg-black/40 p-3 rounded text-sm text-gray-300">
                                    <strong className="block text-white mb-1">Acne Profile</strong>
                                    {acneStatus || 'Not specified'}
                                </div>
                                <div className="bg-black/40 p-3 rounded text-sm text-gray-300">
                                    <strong className="block text-white mb-1">Pore Type</strong>
                                    {poreType || 'Not specified'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'logic' && (
                    <div className="space-y-6 text-gray-300">
                        <p className="text-sm">Hardware logic mapping is dynamically derived from patient pain tolerance and severity.</p>

                        <div className="space-y-3">
                            {['Mid-Face / Bulk Heating (e.g., Monopolar RF)', 'Lower-Face Lifting (e.g., HIFU, Inmode)'].map((zone, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-[#111111] border border-white/5 rounded-xl">
                                    <span className="font-bold">{zone}</span>
                                    <ChevronRight className="w-5 h-5 text-gray-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="space-y-4">
                        <textarea
                            className="w-full h-32 bg-[#111111] border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFA0]"
                            placeholder="Add clinical coordination notes, package recommendations, or follow-up schedules..."
                        />
                        <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg border border-white/10 transition-colors">
                            Save Notes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
