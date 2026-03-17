// ═══════════════════════════════════════════════════════════════
//  PatientDetail — Phase 2 (G-3)
//  의사 대시보드 환자 상세 페이지
//
//  Sections:
//  1. Patient info header + status badge
//  2. Concerns list (from Treatment Plan)
//  3. Recommendations summary (EBD + Injectable inline cards)
//  4. Timeline phases (read-only inline view)
//  5. Cost estimate (if available)
//  6. Back navigation
//
//  Reuses visual patterns from Phase 0 report components (read-only)
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Globe,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Crosshair,
  Beaker,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  Shield,
} from 'lucide-react';
import type { TreatmentPlanData, PlanStatus, Concern, PlanPhase } from '@/schemas/treatment-plan';
import { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────

interface PatientDetailProps {
  plan: TreatmentPlanData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

// ─── Status Config ───────────────────────────────────────────

const STATUS_CONFIG: Record<PlanStatus, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/15', border: 'border-gray-500/30' },
  doctor_review: { label: 'In Review', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  approved: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  sent: { label: 'Sent to Patient', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  mild: { color: 'text-green-400', bg: 'bg-green-500/10' },
  moderate: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
  severe: { color: 'text-red-400', bg: 'bg-red-500/10' },
};

// ─── Format Date ─────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

// ─── Section Card Wrapper ────────────────────────────────────

function SectionCard({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[#12121f] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

// ─── Concern Card ────────────────────────────────────────────

function ConcernCard({ concern, index }: { concern: Concern; index: number }) {
  const sev = SEVERITY_CONFIG[concern.severity] ?? SEVERITY_CONFIG.moderate;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-bold flex items-center justify-center mt-0.5">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white">{concern.concern || 'Unnamed concern'}</span>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${sev.color} ${sev.bg}`}>
            {concern.severity}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          {concern.area && <span>Area: {concern.area}</span>}
          <span>Priority: {concern.patientPriority}/5</span>
        </div>
      </div>
    </div>
  );
}

// ─── EBD Device Card (inline) ────────────────────────────────

function EBDDeviceCard({ device }: {
  device: { rank: number; deviceName: string; deviceId: string; confidence: number; painLevel: number; downtimeLevel: number };
}) {
  return (
    <div className="p-4 rounded-lg bg-white/[0.02] border border-cyan-500/10 hover:border-cyan-500/25 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-sm font-medium text-white">{device.deviceName}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-medium">
          {device.confidence}%
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-gray-500">
        <span>Rank #{device.rank}</span>
        <span>Pain: {device.painLevel}/5</span>
        <span>Downtime: {device.downtimeLevel}/5</span>
      </div>
    </div>
  );
}

// ─── Injectable Card (inline) ────────────────────────────────

function InjectableCard({ injectable }: {
  injectable: { rank: number; name: string; injectableId: string; category: string; confidence: number };
}) {
  return (
    <div className="p-4 rounded-lg bg-white/[0.02] border border-rose-500/10 hover:border-rose-500/25 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Beaker className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-sm font-medium text-white">{injectable.name}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-medium">
          {injectable.confidence}%
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-gray-500">
        <span>Rank #{injectable.rank}</span>
        <span>{injectable.category}</span>
      </div>
    </div>
  );
}

// ─── Phase Card (timeline) ───────────────────────────────────

function PhaseCard({ phase }: { phase: PlanPhase }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-bold flex items-center justify-center">
            {phase.phaseNumber}
          </span>
          <div className="text-left">
            <span className="text-sm font-medium text-white">{phase.timingLabel || `Phase ${phase.phaseNumber}`}</span>
            {phase.timing && (
              <span className="ml-2 text-[11px] text-gray-500">{phase.timing}</span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 py-3 space-y-3 border-t border-white/5">
          {/* Phase Goal */}
          {phase.phaseGoal && (
            <div>
              <span className="text-[11px] text-gray-500 uppercase tracking-wider">Goal</span>
              <p className="text-sm text-gray-300 mt-1">{phase.phaseGoal}</p>
            </div>
          )}

          {/* Procedures */}
          {phase.procedures.length > 0 && (
            <div>
              <span className="text-[11px] text-gray-500 uppercase tracking-wider">Procedures</span>
              <div className="mt-1.5 space-y-2">
                {phase.procedures.map((proc, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-white">{proc.deviceOrInjectable}</span>
                      {proc.reasonWhy && (
                        <p className="text-[11px] text-gray-500 mt-0.5">{proc.reasonWhy}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 pt-1">
            {phase.totalDowntime && <span>Downtime: {phase.totalDowntime}</span>}
            {phase.estimatedCost && <span>Cost: {phase.estimatedCost}</span>}
            {phase.lifestyleNote && <span>Note: {phase.lifestyleNote}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loading State ───────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-[#12121f] border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
      {/* Section skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-[#12121f] border border-white/10 rounded-xl p-5">
          <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
      <p className="text-sm text-red-400 mb-4">{error}</p>
      <Link
        href="/dashboard/doctor"
        className="px-4 py-2 rounded-lg bg-white/5 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function PatientDetail({ plan, loading, error, onRefresh }: PatientDetailProps) {
  if (loading) return <LoadingSkeleton />;
  if (error || !plan) return <ErrorState error={error ?? 'Treatment plan not found'} />;

  const statusCfg = STATUS_CONFIG[plan.status];
  const recs = plan.recommendations;
  const timeline = plan.timeline;
  const cost = plan.estimatedCost;

  return (
    <div className="space-y-6">
      {/* ── Back Navigation + Refresh ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/doctor"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Patient Info Header ── */}
      <section className="bg-[#12121f] border border-white/10 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-white">
                  {plan.patientId || 'Unknown Patient'}
                </h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color} ${statusCfg.bg} border ${statusCfg.border}`}>
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {plan.planId}
                </span>
                {plan.reportId && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Report: {plan.reportId.slice(0, 16)}...
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(plan.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/5">
          <div className="text-center">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider block">Concerns</span>
            <span className="text-lg font-bold text-white">{plan.concerns.length}</span>
          </div>
          <div className="text-center">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider block">EBD Devices</span>
            <span className="text-lg font-bold text-cyan-400">{recs.ebdDevices.length}</span>
          </div>
          <div className="text-center">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider block">Injectables</span>
            <span className="text-lg font-bold text-rose-400">{recs.injectables.length}</span>
          </div>
          <div className="text-center">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider block">Phases</span>
            <span className="text-lg font-bold text-white">{timeline.phases.length}</span>
          </div>
        </div>
      </section>

      {/* ── Concerns ── */}
      {plan.concerns.length > 0 && (
        <SectionCard
          title={`Patient Concerns (${plan.concerns.length})`}
          icon={<AlertCircle className="w-4 h-4 text-amber-400" />}
        >
          <div className="space-y-2">
            {plan.concerns.map((concern, i) => (
              <ConcernCard key={i} concern={concern} index={i} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Recommendations (Inline Report View) ── */}
      {(recs.ebdDevices.length > 0 || recs.injectables.length > 0) && (
        <SectionCard
          title="Recommendations Summary"
          icon={<Zap className="w-4 h-4 text-cyan-400" />}
        >
          <div className="space-y-4">
            {/* EBD Devices */}
            {recs.ebdDevices.length > 0 && (
              <div>
                <h4 className="text-[11px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Crosshair className="w-3 h-3 text-cyan-400" />
                  EBD Devices ({recs.ebdDevices.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recs.ebdDevices.map((device) => (
                    <EBDDeviceCard key={device.deviceId || device.deviceName} device={device} />
                  ))}
                </div>
              </div>
            )}

            {/* Injectables */}
            {recs.injectables.length > 0 && (
              <div>
                <h4 className="text-[11px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Beaker className="w-3 h-3 text-rose-400" />
                  Injectables ({recs.injectables.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recs.injectables.map((inj) => (
                    <InjectableCard key={inj.injectableId || inj.name} injectable={inj} />
                  ))}
                </div>
              </div>
            )}

            {/* Signature Solutions */}
            {recs.signatureSolutions.length > 0 && (
              <div>
                <h4 className="text-[11px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-violet-400" />
                  Signature Solutions ({recs.signatureSolutions.length})
                </h4>
                <div className="space-y-2">
                  {recs.signatureSolutions.map((sol, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-violet-500/10">
                      <span className="text-sm font-medium text-white">{sol.name}</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {sol.devices.map((d, j) => (
                          <span key={`d-${j}`} className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400">
                            {d}
                          </span>
                        ))}
                        {sol.injectables.map((inj, j) => (
                          <span key={`i-${j}`} className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400">
                            {inj}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Timeline (Treatment Phases) ── */}
      {timeline.phases.length > 0 && (
        <SectionCard
          title={`Treatment Timeline — ${timeline.planTypeLabel || timeline.planType}`}
          icon={<Clock className="w-4 h-4 text-emerald-400" />}
        >
          <div className="space-y-3">
            {/* Duration + rationale */}
            {(timeline.duration || timeline.planRationale) && (
              <div className="pb-3 border-b border-white/5 space-y-1">
                {timeline.duration && (
                  <p className="text-sm text-gray-400">
                    <span className="text-gray-500">Duration:</span> {timeline.duration}
                  </p>
                )}
                {timeline.planRationale && (
                  <p className="text-sm text-gray-400">
                    <span className="text-gray-500">Rationale:</span> {timeline.planRationale}
                  </p>
                )}
                {timeline.seasonalNote && (
                  <p className="text-sm text-gray-400">
                    <span className="text-gray-500">Seasonal:</span> {timeline.seasonalNote}
                  </p>
                )}
              </div>
            )}

            {/* Phase cards */}
            {timeline.phases.map((phase) => (
              <PhaseCard key={phase.phaseNumber} phase={phase} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Cost Estimate ── */}
      {cost && cost.budgetTotal && (
        <SectionCard
          title="Estimated Cost"
          icon={<FileText className="w-4 h-4 text-violet-400" />}
        >
          <div className="space-y-3">
            <div className="text-xl font-bold text-white">{cost.budgetTotal}</div>

            {cost.breakdown && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                  <span className="text-[11px] text-gray-500 block">Foundation</span>
                  <span className="text-sm font-bold text-white">{cost.breakdown.foundationPct}%</span>
                  {cost.breakdown.foundationLabel && (
                    <p className="text-[10px] text-gray-500 mt-0.5">{cost.breakdown.foundationLabel}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                  <span className="text-[11px] text-gray-500 block">Main</span>
                  <span className="text-sm font-bold text-white">{cost.breakdown.mainPct}%</span>
                  {cost.breakdown.mainLabel && (
                    <p className="text-[10px] text-gray-500 mt-0.5">{cost.breakdown.mainLabel}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                  <span className="text-[11px] text-gray-500 block">Maintenance</span>
                  <span className="text-sm font-bold text-white">{cost.breakdown.maintenancePct}%</span>
                  {cost.breakdown.maintenanceLabel && (
                    <p className="text-[10px] text-gray-500 mt-0.5">{cost.breakdown.maintenanceLabel}</p>
                  )}
                </div>
              </div>
            )}

            {cost.breakdown?.roiNote && (
              <p className="text-xs text-gray-500 italic">{cost.breakdown.roiNote}</p>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Modification History ── */}
      {plan.doctorModifications.length > 0 && (
        <SectionCard
          title={`Modification History (${plan.doctorModifications.length})`}
          icon={<FileText className="w-4 h-4 text-gray-400" />}
        >
          <div className="space-y-2">
            {plan.doctorModifications.map((mod, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <Clock className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <div className="text-gray-300">
                    <span className="text-white font-medium">{mod.field}</span>
                    {': '}
                    <span className="text-gray-500 line-through">{mod.previousValue}</span>
                    {' → '}
                    <span className="text-emerald-400">{mod.newValue}</span>
                  </div>
                  {mod.reason && (
                    <p className="text-[11px] text-gray-500 mt-0.5">{mod.reason}</p>
                  )}
                  <p className="text-[11px] text-gray-600 mt-0.5">{formatDate(mod.modifiedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
