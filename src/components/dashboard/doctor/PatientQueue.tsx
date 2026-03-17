// ═══════════════════════════════════════════════════════════════
//  PatientQueue — Phase 2 (G-3)
//  의사 대시보드 환자 대기열 테이블/카드
//
//  - 정렬: 날짜순(최신/오래된), 상태순
//  - 필터: status별 (all, draft, doctor_review, approved, sent)
//  - 검색: planId, patientId
//  - 환자 클릭 → 상세 페이지 이동
//  - 반응형: 태블릿+ 테이블, 모바일 카드
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import {
  Search,
  ArrowUpDown,
  Filter,
  ChevronRight,
  FileText,
  Inbox,
} from 'lucide-react';
import type { PlanSummary } from '@/hooks/useDoctorStats';
import { usePatientQueue, type StatusFilter } from '@/hooks/usePatientQueue';
import type { PlanStatus } from '@/schemas/treatment-plan';

// ─── Types ───────────────────────────────────────────────────

interface PatientQueueProps {
  plans: PlanSummary[];
  loading: boolean;
}

// ─── Status Badge Config ─────────────────────────────────────

const STATUS_CONFIG: Record<PlanStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/15' },
  doctor_review: { label: 'Review', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  approved: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  sent: { label: 'Sent', color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
};

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'doctor_review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
];

// ─── Status Badge ────────────────────────────────────────────

function StatusBadge({ status }: { status: PlanStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

// ─── Format Date ─────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) return `${Math.max(1, Math.floor(diffMs / 60000))}m ago`;
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 48) return 'Yesterday';

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

// ─── Component ───────────────────────────────────────────────

export function PatientQueue({ plans, loading }: PatientQueueProps) {
  const {
    filteredPlans,
    filters,
    setStatusFilter,
    setSortField,
    toggleSortDirection,
    setSearchQuery,
    filteredCount,
    totalCount,
  } = usePatientQueue(plans);

  return (
    <section className="bg-[#12121f] border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Patient Queue</h2>
          <span className="text-xs text-gray-500">
            {filteredCount === totalCount
              ? `${totalCount} patients`
              : `${filteredCount} of ${totalCount}`}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search patients..."
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-56 pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="px-5 py-3 border-b border-white/5 flex flex-wrap items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-gray-500" />
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${filters.statusFilter === opt.value
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
              }
            `}
          >
            {opt.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setSortField(filters.sortField === 'date' ? 'status' : 'date')}
            className="px-2 py-1 rounded text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sort: {filters.sortField === 'date' ? 'Date' : 'Status'}
          </button>
          <button
            onClick={toggleSortDirection}
            className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table (desktop) */}
      {loading ? (
        <div className="p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-gray-500">
          <Inbox className="w-10 h-10 text-gray-600" />
          <p className="text-sm">No patients found</p>
          {filters.statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Patient</th>
                  <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Concerns</th>
                  <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Phases</th>
                  <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Created</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr
                    key={plan.planId}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/doctor/patient/${plan.planId}`}
                        className="flex flex-col"
                      >
                        <span className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                          {plan.patientId || plan.planId}
                        </span>
                        <span className="text-[11px] text-gray-500 mt-0.5">
                          {plan.reportId ? `Report: ${plan.reportId.slice(0, 12)}...` : 'No report'}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={plan.status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 tabular-nums">
                      {plan.concernCount}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 tabular-nums">
                      {plan.phaseCount}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {formatDate(plan.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/doctor/patient/${plan.planId}`}
                        className="p-1 rounded text-gray-600 hover:text-cyan-400 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-white/5">
            {filteredPlans.map((plan) => (
              <Link
                key={plan.planId}
                href={`/dashboard/doctor/patient/${plan.planId}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">
                      {plan.patientId || plan.planId}
                    </span>
                    <StatusBadge status={plan.status} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span>{plan.concernCount} concerns</span>
                    <span>{plan.phaseCount} phases</span>
                    <span>{formatDate(plan.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
