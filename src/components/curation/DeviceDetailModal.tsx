'use client';
/**
 * DeviceDetailModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Deep-dive modal for a single device or booster.
 *
 * Layer 1 — Airtable data rendered immediately (key_value, Mechanism, etc.)
 * Layer 2 — Optional Claude enrichment (1-2 sentences tailored to this patient)
 *
 * Usage:
 *   <DeviceDetailModal
 *     type="device"          // "device" | "booster"
 *     itemId="recXXX"        // Airtable record ID
 *     patientContext={{       // Optional: personalizes Layer 2 enrichment
 *       primaryGoal: "texture",
 *       skinType: "normal",
 *       language: "EN"
 *     }}
 *     isOpen={isOpen}
 *     onClose={() => setOpen(false)}
 *   />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ChevronDown, ChevronUp, Sparkles, Star, Clock, DollarSign, Shield } from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────

export type DetailItemType = 'device' | 'booster';

export interface PatientContext {
    primaryGoal?: string;
    skinType?: string;
    language?: string;
    budget?: string;
}

export interface DeviceDetailModalProps {
    type: DetailItemType;
    itemId: string;
    itemName?: string; // Optimistic display while loading
    patientContext?: PatientContext;
    isOpen: boolean;
    onClose: () => void;
}

interface DeviceDetail {
    device_name: string;
    category_name?: string;
    key_value?: string;
    budget_tier?: string;
    brand_tier?: string;
    avg_pain_level?: string;
    launch_year?: number;
    clinical_evidence_score?: number;
    evidence_basis?: string;
    patient_review_summary?: string;
    trend_score?: number;
    skin_depth_fit?: string;
}

interface BoosterDetail {
    booster_name: string;
    canonical_role?: string;
    Mechanism?: string;
    Indication?: string;
    Protocol?: string;
    Description?: string;
    injection_target_layer?: string;
    key_value?: string;
}

type ItemDetail = DeviceDetail | BoosterDetail;

// ─── Data Fetcher ─────────────────────────────────────────────────────────

async function fetchItemDetail(
    type: DetailItemType,
    itemId: string
): Promise<ItemDetail | null> {
    const endpoint = type === 'device'
        ? `/api/detail/device?id=${encodeURIComponent(itemId)}`
        : `/api/detail/booster?id=${encodeURIComponent(itemId)}`;

    try {
        const res = await fetch(endpoint);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function fetchAIEnrichment(
    type: DetailItemType,
    itemName: string,
    patientContext: PatientContext,
    language: string
): Promise<string | null> {
    try {
        const res = await fetch('/api/detail/enrich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, itemName, patientContext, language }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.enrichment || null;
    } catch {
        return null;
    }
}

// ─── Sub-components ───────────────────────────────────────────────────────

function InfoBadge({ label, value, icon: Icon }: { label: string; value: string | number | undefined; icon?: any }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
            {Icon && <Icon className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
            <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm text-white font-medium">{value}</p>
            </div>
        </div>
    );
}

function TrendBar({ score }: { score: number | undefined }) {
    if (!score) return null;
    const pct = Math.round((score / 10) * 100);
    const color = score >= 8 ? 'bg-green-500' : score >= 5 ? 'bg-blue-500' : 'bg-gray-500';
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
                <span>Trend Score</span>
                <span>{score}/10</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', color)}
                />
            </div>
        </div>
    );
}

function EvidenceStars({ score }: { score: number | undefined }) {
    if (!score) return null;
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    className={cn('w-3.5 h-3.5', i <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600')}
                />
            ))}
            <span className="text-xs text-gray-400 ml-1">Clinical Evidence</span>
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────

export default function DeviceDetailModal({
    type,
    itemId,
    itemName,
    patientContext = {},
    isOpen,
    onClose,
}: DeviceDetailModalProps) {
    const [detail, setDetail] = useState<ItemDetail | null>(null);
    const [aiEnrichment, setAiEnrichment] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingAI, setLoadingAI] = useState(false);
    const [showFullText, setShowFullText] = useState<Record<string, boolean>>({});
    const language = patientContext?.language || 'EN';

    const load = useCallback(async () => {
        if (!itemId) return;
        setLoading(true);
        setDetail(null);
        setAiEnrichment(null);

        const data = await fetchItemDetail(type, itemId);
        setDetail(data);
        setLoading(false);

        // Layer 2: AI enrichment (non-blocking)
        if (data) {
            const name = (data as DeviceDetail).device_name || (data as BoosterDetail).booster_name || itemName || '';
            setLoadingAI(true);
            const enrichment = await fetchAIEnrichment(type, name, patientContext, language);
            setAiEnrichment(enrichment);
            setLoadingAI(false);
        }
    }, [itemId, type, patientContext, language, itemName]);

    useEffect(() => {
        if (isOpen) load();
        else {
            setDetail(null);
            setAiEnrichment(null);
        }
    }, [isOpen, load]);

    const toggle = (key: string) => setShowFullText(prev => ({ ...prev, [key]: !prev[key] }));

    const displayName = detail
        ? ((detail as DeviceDetail).device_name || (detail as BoosterDetail).booster_name)
        : (itemName || '...');

    // ── DEVICE view ────────────────────────────────────────────────────────
    const renderDevice = (d: DeviceDetail) => (
        <div className="space-y-5">
            {/* Badges row */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <InfoBadge label="Budget Tier" value={d.budget_tier} icon={DollarSign} />
                <InfoBadge label="Brand Tier" value={d.brand_tier} icon={Shield} />
                <InfoBadge label="Pain Level" value={d.avg_pain_level} icon={Clock} />
                <InfoBadge label="Launch Year" value={d.launch_year} icon={Sparkles} />
            </div>

            {/* Trend + Evidence */}
            <div className="space-y-3 p-4 bg-white/3 rounded-xl border border-white/8">
                <TrendBar score={d.trend_score} />
                <EvidenceStars score={d.clinical_evidence_score} />
                {d.skin_depth_fit && (
                    <p className="text-xs text-gray-400">
                        Depth Fit: <span className="text-white font-medium">{d.skin_depth_fit}</span>
                    </p>
                )}
            </div>

            {/* Key Value / Clinical info */}
            {d.key_value && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Clinical Highlights</h4>
                    <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                        {showFullText.key_value || d.key_value.length < 280
                            ? d.key_value
                            : d.key_value.slice(0, 280) + '...'}
                    </div>
                    {d.key_value.length >= 280 && (
                        <button onClick={() => toggle('key_value')} className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                            {showFullText.key_value ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                        </button>
                    )}
                </div>
            )}

            {/* Evidence basis */}
            {d.evidence_basis && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-xs text-blue-300 font-medium mb-1">Evidence Basis</p>
                    <p className="text-xs text-gray-300">{d.evidence_basis}</p>
                </div>
            )}

            {/* Patient reviews */}
            {d.patient_review_summary && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Patient Feedback</h4>
                    <p className="text-sm text-gray-400 italic">&ldquo;{d.patient_review_summary}&rdquo;</p>
                </div>
            )}
        </div>
    );

    // ── BOOSTER view ───────────────────────────────────────────────────────
    const renderBooster = (b: BoosterDetail) => (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2">
                <InfoBadge label="Role" value={b.canonical_role} icon={Sparkles} />
                <InfoBadge label="Injection Layer" value={b.injection_target_layer} icon={Shield} />
            </div>

            {b.Mechanism && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">How It Works</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">{b.Mechanism}</p>
                </div>
            )}

            {b.Indication && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Best For</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">{b.Indication}</p>
                </div>
            )}

            {b.Protocol && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Typical Protocol</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">{b.Protocol}</p>
                </div>
            )}

            {b.key_value && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Values</h4>
                    <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                        {showFullText.key_value || b.key_value.length < 280
                            ? b.key_value
                            : b.key_value.slice(0, 280) + '...'}
                    </p>
                    {b.key_value.length >= 280 && (
                        <button onClick={() => toggle('key_value')} className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                            {showFullText.key_value ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-white/5">
                            <div className="flex-1 mr-4">
                                <span className="text-[10px] uppercase tracking-widest text-blue-400 font-medium">
                                    {type === 'device' ? '장비 상세' : '부스터 상세'}
                                </span>
                                <h2 className="text-xl font-bold text-white mt-1 leading-tight">
                                    {loading ? '...' : displayName}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white transition-colors p-1 shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-6">
                            {loading && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                </div>
                            )}

                            {!loading && detail && (
                                <>
                                    {type === 'device'
                                        ? renderDevice(detail as DeviceDetail)
                                        : renderBooster(detail as BoosterDetail)
                                    }

                                    {/* AI Enrichment (Layer 2) */}
                                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-white/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4 text-blue-400" />
                                            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                                                AI Insight for You
                                            </span>
                                        </div>
                                        {loadingAI ? (
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Personalizing analysis...
                                            </div>
                                        ) : aiEnrichment ? (
                                            <p className="text-sm text-gray-300 leading-relaxed">{aiEnrichment}</p>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">
                                                Personalized insight not available right now.
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {!loading && !detail && (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    Details not available. Please check clinic directly.
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5">
                            <p className="text-[10px] text-center text-gray-600">
                                Clinical data sourced from ConnectingDocs Intelligence DB · For reference only
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
