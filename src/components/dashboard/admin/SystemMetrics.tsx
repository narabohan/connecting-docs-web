// ═══════════════════════════════════════════════════════════════
//  SystemMetrics — Phase 2 (G-5)
//  관리자 대시보드 8종 KPI 카드
//  G-3 DoctorOverview 패턴 복사 → 8 stat cards로 확장
//
//  Cards:
//  1. Total Users           5. Total Plans
//  2. Today's Signups       6. Approval Rate
//  3. Total Reports         7. Email Success Rate
//  4. Today's Reports       8. Active Sessions
//
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import {
  Users,
  UserPlus,
  FileText,
  FilePlus,
  ClipboardCheck,
  CheckCircle2,
  Mail,
  Activity,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { SystemStats } from '@/hooks/useSystemStats';

// ─── Types ───────────────────────────────────────────────────

interface SystemMetricsProps {
  stats: SystemStats;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  loading: boolean;
  suffix?: string;
}

// ─── StatCard ────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bgColor, loading, suffix }: StatCardProps) {
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
          {value}{suffix ?? ''}
        </span>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────

export function SystemMetrics({ stats, loading, error, onRefresh }: SystemMetricsProps) {
  const cards: Omit<StatCardProps, 'loading'>[] = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/15',
    },
    {
      label: "Today's Signups",
      value: stats.todaySignups,
      icon: UserPlus,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/15',
    },
    {
      label: 'Total Reports',
      value: stats.totalReports,
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/15',
    },
    {
      label: "Today's Reports",
      value: stats.todayReports,
      icon: FilePlus,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15',
    },
    {
      label: 'Total Plans',
      value: stats.totalPlans,
      icon: ClipboardCheck,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/15',
    },
    {
      label: 'Approval Rate',
      value: stats.approvalRate,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15',
      suffix: '%',
    },
    {
      label: 'Email Success',
      value: stats.emailSuccessRate,
      icon: Mail,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/15',
      suffix: '%',
    },
    {
      label: 'Active Sessions',
      value: stats.activeSessionCount,
      icon: Activity,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/15',
    },
  ];

  return (
    <section>
      {/* Header with refresh */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          System Overview
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

      {/* Stats Grid — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>
    </section>
  );
}
