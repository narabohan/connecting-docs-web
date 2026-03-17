// ═══════════════════════════════════════════════════════════════
//  DoctorOverview — Phase 2 (G-3)
//  의사 대시보드 통계 카드 4종
//
//  Cards:
//  1. Today's Patients (오늘 생성된 Plan)
//  2. Pending Plans (draft + doctor_review)
//  3. Approved (승인 완료)
//  4. Total Patients (전체 배정 수)
//
//  Uses useDoctorStats hook → GET /api/treatment-plan/doctor-stats
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import {
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { DoctorStats } from '@/hooks/useDoctorStats';

// ─── Types ───────────────────────────────────────────────────

interface DoctorOverviewProps {
  stats: DoctorStats;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  loading: boolean;
}

// ─── StatCard ────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bgColor, loading }: StatCardProps) {
  return (
    <div className="bg-[#12121f] border border-white/10 rounded-xl p-5 flex flex-col gap-3 hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-white/5 rounded animate-pulse" />
      ) : (
        <span className="text-2xl font-bold text-white tabular-nums">
          {value}
        </span>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────

export function DoctorOverview({ stats, loading, error, onRefresh }: DoctorOverviewProps) {
  const cards: Omit<StatCardProps, 'loading'>[] = [
    {
      label: "Today's Patients",
      value: stats.todayCount,
      icon: Calendar,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/15',
    },
    {
      label: 'Pending Plans',
      value: stats.pendingCount,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/15',
    },
    {
      label: 'Approved',
      value: stats.approvedCount,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15',
    },
    {
      label: 'Total Patients',
      value: stats.totalCount,
      icon: Users,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/15',
    },
  ];

  return (
    <section>
      {/* Header with refresh */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Overview
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>
    </section>
  );
}
