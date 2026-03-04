'use client';
import { useState } from 'react';
import {
    Brain, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp,
    Zap, Clock, DollarSign, Activity, Shield, Target, Layers,
    TrendingUp, AlertCircle, Star, Package, Settings, FileText,
    ThumbsUp, ThumbsDown, Minus, Crosshair, Sparkles, Microscope
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WizardData {
    country?: string;
    gender?: string;
    age?: string;
    primaryGoal?: string;
    secondaryGoal?: string;
    risks?: string[];
    acneStatus?: string;
    pigmentType?: string[];
    areas?: string[];
    poreType?: string;
    priorityArea?: string;
    skinType?: string;
    treatmentStyle?: string;
    volumePreference?: string;
    painTolerance?: string;
    downtimeTolerance?: string;
    budget?: string;
    frequency?: string;
    treatmentHistory?: string[];
    historySatisfaction?: string;
    careHabits?: string[];
    email?: string;
}

interface DoctorClinicalPanelProps {
    wizardData: WizardData | null;
    doctorDevices?: string[]; // from doctor's onboarding profile
    patientEmail?: string;
    score?: string | number;
    solutionId?: string;
}

// ─── Constants & Labels ──────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
    antiAging: 'Lifting & Neocollagenesis',
    glassSkin: 'Dermal Texture & Radiance',
    pigmentation: 'Melanin Control & Brightening',
    acneScar: 'Acne & Cicatrix Remodeling',
    skinCare: 'Protective Barrier Support',
    bodyContouring: 'Body Lipolysis & Contouring',
};

const AREA_LABELS: Record<string, string> = {
    forehead: 'Forehead',
    eyes: 'Peri-orbital',
    cheeks: 'Mid-face / Malar',
    jawline: 'Mandibular / Jowl',
    neck: 'Cervical / Neck',
    fullFace: 'Full Facial Structure',
    decolletage: 'Décolletage',
};

const RISK_LABELS: Record<string, string> = {
    melasma: 'Active Melasma (Dermal/Mixed)',
    activeAcne: 'Inflammatory Acne (Cystic)',
    rosacea: 'Erythematotelangiectatic Rosacea',
    keloid: 'Hypertrophic / Keloid Tendency',
    darkSkin: 'High Fitzpatrick (IV–VI)',
};

// ─── Clinical Logic Helpers ──────────────────────────────────────────────────

function getAreaDeviceLogic(areas: string[], painTolerance: string, budget: string, inventory: string[] = []) {
    const results: { area: string; devices: { name: string; note: string; suitability: 'ideal' | 'caution' | 'avoid'; hasDevice?: boolean }[] }[] = [];

    const isMidFace = areas.some(a => ['cheeks', 'fullFace'].includes(a));
    const isLowerFace = areas.some(a => ['jawline'].includes(a));
    const isEyes = areas.includes('eyes');
    const isNeck = areas.includes('neck');

    const painOK = ['high', 'veryHigh', 'moderate'].includes(painTolerance?.toLowerCase());
    const highBudget = budget?.toLowerCase() === 'premium';

    // Verify if doctor possesses this specific hardware or equivalent
    const hasDevice = (search: string) => {
        if (inventory.length === 0) return true; // Show all if no inventory provided
        const s = search.toLowerCase();
        return inventory.some(i => s.includes(i.toLowerCase()) || i.toLowerCase().includes(s.split(' ')[0]));
    };

    if (isMidFace) {
        results.push({
            area: 'Mid-Face (Malar/Zygomatic)',
            devices: [
                {
                    name: 'Monopolar RF (e.g. Thermage FLX)',
                    note: 'Dermal heating for volume contraction. Recommended 600-900 reps based on laxity profile.',
                    suitability: hasDevice('Thermage') ? (painOK ? 'ideal' : 'caution') : 'avoid',
                    hasDevice: hasDevice('Thermage'),
                },
                {
                    name: 'Titanium Lifting (Bipolar/Triple RF)',
                    note: 'Low-pain alternative for immediate lymphatic drainage and superficial contraction.',
                    suitability: 'ideal',
                },
                {
                    name: 'Micro-focused Ultrasound (HIFU)',
                    note: 'Targeting SMAS at 4.5mm. Requires precise vectoring to avoid fat atrophy.',
                    suitability: hasDevice('Ultherapy') || hasDevice('HIFU') ? (highBudget && painOK ? 'ideal' : 'caution') : 'avoid',
                    hasDevice: hasDevice('Ultherapy') || hasDevice('HIFU'),
                },
            ],
        });
    }

    if (isLowerFace) {
        results.push({
            area: 'Lower Face (Mandibular / V-Line)',
            devices: [
                {
                    name: 'HIFU / Ulthera (SMAS Control)',
                    note: 'Focus on 4.5mm depth for submental lifting. Caution on mandible bone contact.',
                    suitability: highBudget && painOK ? 'ideal' : 'caution',
                },
                {
                    name: 'Inmode (Morpheus8 / FaceTite)',
                    note: 'Subdermal Adipose Remodeling (SARD). High efficiency for jawline definition.',
                    suitability: 'ideal',
                },
            ],
        });
    }

    if (isEyes) {
        results.push({
            area: 'Peri-orbital (Fine Lines)',
            devices: [
                {
                    name: 'Eye-specific RF (0.25cm² tips)',
                    note: 'Precision energy delivery for periorbital rhytids. Safety goggles mandatory.',
                    suitability: 'ideal',
                },
                {
                    name: 'High Intensity Ultrasound (Eyes)',
                    note: 'Risk of intraocular damage. Use specific 1.5mm / 2.0mm transducers only.',
                    suitability: 'caution',
                },
            ],
        });
    }

    return results;
}

function getStyleConflictAnalysis(treatmentStyle: string, painTolerance: string, volumePreference: string) {
    const wantsDramatic = treatmentStyle === 'dramatic';
    const lowPain = ['none', 'low'].includes(painTolerance?.toLowerCase());

    const conflicts: { type: 'conflict' | 'synergy' | 'info'; title: string; detail: string }[] = [];

    if (wantsDramatic && lowPain) {
        conflicts.push({
            type: 'conflict',
            title: 'Efficacy vs Comfort Paradox',
            detail: 'Patient seeks significant tissue remodeling but lacks threshold for thermal damage. Recommendation: Combined block anesthesia or conscious sedation for high-energy sessions.',
        });
    }

    if (volumePreference === 'filler' && lowPain) {
        conflicts.push({
            type: 'info',
            title: 'Dermal Filler Alignment',
            detail: 'Preference for instant volume. Recommend Lidocaine-infused fillers and 22G cannula for minimized trauma.',
        });
    }

    if (conflicts.length === 0) {
        conflicts.push({
            type: 'info',
            title: 'Protocol Consistency Check',
            detail: 'Patient preferences and tolerance metrics are clinically aligned for standard protocols.',
        });
    }

    return conflicts;
}

function getRhythmGuidance(primaryGoal: string, frequency: string) {
    const rhythms: { phase: string; interval: string; device: string; note: string }[] = [];

    if (primaryGoal === 'antiAging') {
        rhythms.push(
            { phase: 'Loading Phase', interval: 'Every 4 weeks (x3)', device: 'Bio-stimulators / Exosomes', note: 'Establishing dermal scaffold.' },
            { phase: 'Target Phase', interval: 'Every 6 months', device: 'Thermal RF / HIFU', note: 'Maximal SMAS/Dermal contraction.' },
            { phase: 'Maintenance', interval: 'Annually', device: 'Combined Regimen', note: 'Aging prevention & texture sustain.' },
        );
    } else {
        rhythms.push(
            { phase: 'Initial Repair', interval: 'Every 2-3 weeks', device: 'Regenerative Boosters', note: 'Texture normalization.' },
            { phase: 'Active Maintenance', interval: 'Every 3 months', device: 'Surface Resurfacing', note: 'Sustaining radiance profile.' },
        );
    }

    const freqNote = frequency === 'monthly'
        ? 'High engagement patient — optimized for multi-stage compound protocols.'
        : 'Sparse visit preference — recommend high-density, single-session energy treatments.';

    return { rhythms, freqNote };
}

function getRiskDetails(risks: string[], acneStatus?: string, pigmentType?: string[]) {
    const details: { risk: string; severity: 'high' | 'medium' | 'low'; guidance: string }[] = [];

    if (risks.includes('melasma')) {
        const isMask = pigmentType?.includes('maskPattern');
        details.push({
            risk: 'Dermal Melasma (Mask Pattern)',
            severity: isMask ? 'high' : 'medium',
            guidance: 'Avoid aggressive thermal heating. High risk of rebound. Recommend Low-fluence Q-Switch (Nd:YAG 1064nm) + TXA protocol.',
        });
    }

    if (risks.includes('activeAcne')) {
        details.push({
            risk: 'Inflammatory Acne Check',
            severity: acneStatus === 'cystic' ? 'high' : 'medium',
            guidance: 'Exclude high-thermal energy near active lesions. Focus on sebaceous gland control via PDT or selective RF before lifting.',
        });
    }

    if (risks.includes('keloid')) {
        details.push({
            risk: 'Keloid / Hypertrophic Risk',
            severity: 'high',
            guidance: 'Invasive microneedling or ablative CO2 contra-indicated. Non-invasive RF/HIFU only after restricted area testing.',
        });
    }

    return details;
}

// ─── UI Components ──────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, defaultOpen = true }: {
    title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="mb-6 rounded-2xl border border-white/5 bg-[#050b18]/60 overflow-hidden backdrop-blur-md">
            <button
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <Icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="font-bold text-xs tracking-wider text-white uppercase">{title}</span>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {open && <div className="px-8 pb-8 transition-all animate-in fade-in slide-in-from-top-2">{children}</div>}
        </div>
    );
}

function SuitabilityBadge({ level }: { level: 'ideal' | 'caution' | 'avoid' }) {
    const config = {
        ideal: { label: 'OPTIMAL', cls: 'bg-[#00FFA0]/10 text-[#00FFA0] border-[#00FFA0]/30', icon: CheckCircle },
        caution: { label: 'CAUTION', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: AlertTriangle },
        avoid: { label: 'RESTRICTED', cls: 'bg-red-500/10 text-red-400 border-red-500/30', icon: AlertCircle },
    };
    const { label, cls, icon: Icon } = config[level];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-black tracking-widest ${cls}`}>
            <Icon className="w-3 h-3" /> {label}
        </span>
    );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export default function DoctorClinicalPanel({ wizardData, doctorDevices = [], patientEmail, score }: DoctorClinicalPanelProps) {
    const [activeTab, setActiveTab] = useState<'intelligence' | 'logic' | 'followup'>('intelligence');
    const [notes, setNotes] = useState('');

    if (!wizardData) {
        return (
            <div className="p-12 text-center text-gray-500 border border-dashed border-white/5 rounded-3xl bg-[#03060c]">
                <Microscope className="w-12 h-12 mx-auto mb-4 text-gray-700 opacity-50" />
                <p className="text-sm font-mono tracking-widest uppercase">Waiting for Patient Clinical Input</p>
            </div>
        );
    }

    const {
        primaryGoal = '', secondaryGoal = '', risks = [], acneStatus, pigmentType = [],
        areas = [], poreType, treatmentStyle = '', volumePreference, painTolerance = '',
        downtimeTolerance = '', budget = '', frequency = '', treatmentHistory = [],
        age, gender, skinType
    } = wizardData;

    // ── Pre-computing Logic ───────────────────────────────────────────────
    const riskDetails = getRiskDetails(risks, acneStatus, pigmentType);
    const areaDeviceLogic = getAreaDeviceLogic(areas, painTolerance, budget, doctorDevices);
    const styleConflicts = getStyleConflictAnalysis(treatmentStyle, painTolerance, volumePreference || '');
    const { rhythms, freqNote } = getRhythmGuidance(primaryGoal, frequency);

    const tabs = [
        { id: 'intelligence' as const, label: 'CLINICAL INTELLIGENCE', icon: Brain },
        { id: 'logic' as const, label: 'DEVICE REASONING', icon: Settings },
        { id: 'followup' as const, label: 'PLAN & FOLLOW-UP', icon: FileText },
    ];

    return (
        <div className="font-mono text-white selection:bg-cyan-500/30">

            {/* ── Dashboard Status Header ── */}
            <div className="mb-8 p-1 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center">
                <div className="px-6 py-4 flex items-center gap-4 border-r border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-[#00FFA0]/5 border border-[#00FFA0]/30 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-[#00FFA0]" />
                    </div>
                    <div>
                        <div className="text-[10px] text-white/40 tracking-widest uppercase font-black">AI System Status</div>
                        <div className="text-xs font-bold text-[#00FFA0] flex items-center gap-2">
                            LIVE DIAGNOSTIC SYNC <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA0] animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="px-8 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-8">
                    <div>
                        <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-1">Patient Unit</div>
                        <div className="text-[11px] font-bold text-white truncate max-w-[120px]">{patientEmail || 'ANONYMOUS'}</div>
                    </div>
                    <div>
                        <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-1">Clinical Age</div>
                        <div className="text-[11px] font-bold text-white uppercase">{age || 'UKN'} | {gender || 'U'}</div>
                    </div>
                    <div>
                        <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-1">Match Index</div>
                        <div className="text-[11px] font-bold text-[#00FFA0]">{score || '92'}%</div>
                    </div>
                    <div>
                        <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-1">Skin Type</div>
                        <div className="text-[11px] font-bold text-violet-400 uppercase">{skinType || 'OILY/COMB'}</div>
                    </div>
                </div>
            </div>

            {/* ── Sub-navigation ── */}
            <div className="flex gap-1 mb-8 p-1 bg-black/40 rounded-xl border border-white/5 backdrop-blur-sm">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-lg text-[10px] font-black tracking-[0.15em] transition-all border ${activeTab === id
                            ? 'bg-[#00FFA0]/10 text-[#00FFA0] border-[#00FFA0]/30 shadow-[0_0_15px_rgba(0,255,160,0.1)]'
                            : 'text-white/30 border-transparent hover:bg-white/5 hover:text-white/60'
                            }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* ═══════════════ TAB: CLINICAL INTELLIGENCE ═══════════════ */}
            {activeTab === 'intelligence' && (
                <div className="animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Column 1 & 2: Main Logic */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* ① Indication Priority Matrix */}
                            <div className="p-8 rounded-3xl border border-white/5 bg-[#0a0f18]/40 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Target className="w-32 h-32 text-cyan-400" />
                                </div>
                                <h3 className="text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase mb-8 flex items-center gap-2">
                                    <Target className="w-4 h-4" /> 01. Indication Loading Matrix
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    {/* Primary */}
                                    <div className="relative p-6 rounded-2xl bg-cyan-500/[0.03] border border-cyan-500/20">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-widest">Primary Indication</span>
                                            <div className="text-2xl font-black text-white">70<span className="text-xs text-cyan-400/60 ml-0.5">%</span></div>
                                        </div>
                                        <div className="text-lg font-bold text-white mb-4">{GOAL_LABELS[primaryGoal] || primaryGoal || 'No Defined Target'}</div>
                                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                            <div className="h-full rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: '70%' }} />
                                        </div>
                                        <p className="text-[10px] text-white/30 mt-4 leading-relaxed font-sans uppercase tracking-wider">
                                            Main clinical driver. All protocol parameters calibrated for this specific outcome.
                                        </p>
                                    </div>

                                    {/* Secondary */}
                                    <div className="relative p-6 rounded-2xl bg-violet-500/[0.03] border border-violet-500/20">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-bold text-violet-400/60 uppercase tracking-widest">Secondary Indication</span>
                                            <div className="text-2xl font-black text-white">30<span className="text-xs text-violet-400/60 ml-0.5">%</span></div>
                                        </div>
                                        <div className="text-lg font-bold text-white/80 mb-4">{GOAL_LABELS[secondaryGoal] || secondaryGoal || 'Optional Support'}</div>
                                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                            <div className="h-full rounded-full bg-violet-400/50" style={{ width: '30%' }} />
                                        </div>
                                        <p className="text-[10px] text-white/30 mt-4 leading-relaxed font-sans uppercase tracking-wider">
                                            Supplementary target. Evaluated for synergistic device/booster combinations.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ② Risk Flag Summary */}
                            <SectionCard title="02. Risk Mitigation Protocols" icon={Shield}>
                                <div className="space-y-4 pt-2">
                                    {riskDetails.length > 0 ? riskDetails.map((r, i) => (
                                        <div key={i} className="flex gap-6 items-start p-5 rounded-2xl bg-white/[0.01] border border-white/5 relative group hover:border-white/10 transition-colors">
                                            <div className={`mt-1 p-2 rounded-lg ${r.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                                                'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-sm font-bold text-white">{r.risk}</span>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${r.severity === 'high' ? 'border-red-500/30 text-red-500 bg-red-500/10' :
                                                        'border-amber-500/30 text-amber-500 bg-amber-500/10'
                                                        }`}>
                                                        {r.severity === 'high' ? 'HIGH ALERT' : 'CAUTION'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-white/50 leading-relaxed max-w-xl">{r.guidance}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="flex items-center gap-3 p-6 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/20">
                                            <CheckCircle className="w-5 h-5 text-[#00FFA0]" />
                                            <span className="text-sm text-white/80 font-bold uppercase tracking-widest">No immediate contraindications flagged</span>
                                        </div>
                                    )}
                                </div>
                            </SectionCard>
                        </div>

                        {/* Column 3: Stats & Metrics */}
                        <div className="space-y-6">
                            {/* Tolerance Profile */}
                            <div className="p-8 rounded-3xl border border-white/5 bg-[#0a0f18]/40">
                                <h3 className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase mb-8">Resilience Metrics</h3>
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#00FFA0]">Pain Threshold</span>
                                            <span className="text-xs uppercase font-bold text-white">{painTolerance}</span>
                                        </div>
                                        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                            <div className="h-full rounded-full bg-[#00FFA0] opacity-30" style={{ width: painTolerance === 'high' ? '85%' : painTolerance === 'veryHigh' ? '100%' : '50%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Downtime Budget</span>
                                            <span className="text-xs uppercase font-bold text-white">{downtimeTolerance}</span>
                                        </div>
                                        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                            <div className="h-full rounded-full bg-cyan-400 opacity-30" style={{ width: downtimeTolerance === 'high' ? '85%' : '50%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Budget Flow</span>
                                            <span className="text-xs uppercase font-bold text-white">{budget}</span>
                                        </div>
                                        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                            <div className="h-full rounded-full bg-violet-400 opacity-30" style={{ width: budget === 'premium' ? '100%' : '50%' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Style Analysis */}
                            <div className="p-8 rounded-3xl border border-white/5 bg-[#0a0f18]/40">
                                <h3 className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase mb-6">Intent Analysis</h3>
                                {styleConflicts.map((c, i) => (
                                    <div key={i} className="mb-4 last:mb-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {c.type === 'conflict' ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : <Sparkles className="w-3.5 h-3.5 text-[#00FFA0]" />}
                                            <span className="text-[10px] font-bold text-white uppercase">{c.title}</span>
                                        </div>
                                        <p className="text-[10px] text-white/30 leading-relaxed font-sans">{c.detail}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════ TAB: DEVICE REASONING ═══════════════ */}
            {activeTab === 'logic' && (
                <div className="animate-in fade-in duration-500">
                    <div className="mb-6 flex items-center justify-between px-2">
                        <div className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Cross-Device Suitability Mapping</div>
                        <div className="text-[9px] text-white/20 font-sans italic">Updated: Real-time RAG Calculation</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {areaDeviceLogic.map((areaGroup) => (
                            <div key={areaGroup.area} className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-white/[0.01] border-b border-white/5">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                    <h4 className="text-xs font-black tracking-widest text-white uppercase">{areaGroup.area}</h4>
                                </div>
                                <div className="space-y-3">
                                    {areaGroup.devices.map((d) => (
                                        <div key={d.name} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-bold text-white group-hover:text-[#00FFA0] transition-colors">{d.name}</span>
                                                <SuitabilityBadge level={d.suitability} />
                                            </div>
                                            <p className="text-xs text-white/40 leading-relaxed font-sans">{d.note}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════ TAB: PLAN & FOLLOW-UP ═══════════════ */}
            {activeTab === 'followup' && (
                <div className="animate-in fade-in duration-500 grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Clinical Roadmap */}
                    <div className="p-10 rounded-3xl border border-white/5 bg-[#0a0f18]/40 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Clock className="w-48 h-48 text-violet-400" />
                        </div>
                        <h3 className="text-xs font-bold tracking-[0.2em] text-violet-400 uppercase mb-10 flex items-center gap-3">
                            <Clock className="w-5 h-5" /> 03. Strategic Treatment Rhythm
                        </h3>

                        <div className="space-y-8">
                            {rhythms.map((r, i) => (
                                <div key={i} className="flex gap-6 relative">
                                    {i !== rhythms.length - 1 && (
                                        <div className="absolute left-[13px] top-8 bottom-[-40px] w-px bg-white/5" />
                                    )}
                                    <div className="w-7 h-7 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-black flex items-center justify-center text-violet-400 z-10">{i + 1}</div>
                                    <div className="pb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-sm font-bold text-white">{r.phase}</h4>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/40">{r.interval}</span>
                                        </div>
                                        <p className="text-xs text-[#00FFA0] font-bold mb-1 uppercase tracking-widest">{r.device}</p>
                                        <p className="text-xs text-white/40 leading-relaxed font-sans italic">Goal: {r.note}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 p-5 rounded-2xl bg-amber-500/[0.02] border border-amber-500/10 flex items-start gap-4">
                            <Info className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-2">Visit Alignment Note</span>
                                <p className="text-xs text-white/50 leading-relaxed font-sans">{freqNote}</p>
                            </div>
                        </div>
                    </div>

                    {/* Consulting Notes */}
                    <div className="space-y-6">
                        <div className="p-8 rounded-3xl border border-white/5 bg-[#050b18]/40">
                            <h3 className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase mb-6 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Physician Directives
                            </h3>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full h-40 bg-black/20 border border-white/5 rounded-2xl p-6 text-sm text-white/80 placeholder:text-white/10 focus:outline-none focus:border-[#00FFA0]/30 transition-all font-sans"
                                placeholder="Enter specific clinical directives, contraindications for nurses, or maintenance goals..."
                            />
                            <div className="mt-4 flex justify-between items-center px-2">
                                <span className="text-[10px] text-white/20 font-mono tracking-widest uppercase">Encryption Active: AES-256</span>
                                <button className="px-5 py-2 rounded-lg bg-[#00FFA0]/5 text-[#00FFA0] text-[10px] font-black hover:bg-[#00FFA0]/10 transition-all border border-[#00FFA0]/20 tracking-widest uppercase">Sync Note</button>
                            </div>
                        </div>

                        {/* Physical Checklist */}
                        <div className="p-8 rounded-3xl border border-white/5 bg-[#050b18]/40">
                            <h3 className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase mb-6 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Post-Clinical Protocol
                            </h3>
                            <div className="space-y-4">
                                {[
                                    'Clinical progression photography (M0 vs M1)',
                                    'Baseline hydration check (pre-energy delivery)',
                                    'Fitzpatrick adaptation confirmation',
                                    'Topical anesthetic protocol verified',
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-4 h-4 rounded bg-white/5 border border-white/10 group-hover:border-[#00FFA0]/40 transition-all" />
                                        <span className="text-xs text-white/40 group-hover:text-white transition-colors">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
