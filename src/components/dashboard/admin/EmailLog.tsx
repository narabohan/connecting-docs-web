// ═══════════════════════════════════════════════════════════════
//  EmailLog — Phase 2 (G-5)
//  관리자 이메일 발송 로그 뷰어
//  G-4 /api/email/log API 소비
//  G-3 PatientQueue 패턴 복사 → 이메일 목록으로 확장
//
//  Features:
//  - 필터: 상태 (all/sent/failed/queued/rate_limited)
//  - 필터: 템플릿 (all/report-ready/plan-ready/plan-approved/welcome)
//  - 정렬: 시간순
//  - 상태별 컬러 배지
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Filter,
  Mail,
  Inbox,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  RefreshCw,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

interface EmailLogEntry {
  id: string;
  emailId: string;
  recipient: string;
  template: string;
  locale: string;
  status: string;
  sentAt: string;
  error: string;
  retryCount: number;
  createdAt: string;
}

type StatusFilter = 'all' | 'sent' | 'failed' | 'queued' | 'rate_limited';
type TemplateFilter = 'all' | 'report-ready' | 'plan-ready' | 'plan-approved' | 'welcome';

interface EmailLogProps {
  logs: EmailLogEntry[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

// ─── Status Config ───────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: typeof CheckCircle2 }> = {
  sent: { label: 'Sent', color: 'text-emerald-400', bg: 'bg-emerald-500/15', Icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/15', Icon: XCircle },
  queued: { label: 'Queued', color: 'text-amber-400', bg: 'bg-amber-500/15', Icon: Clock },
  rate_limited: { label: 'Rate Limited', color: 'text-orange-400', bg: 'bg-orange-500/15', Icon: Ban },
};

const TEMPLATE_LABELS: Record<string, string> = {
  'report-ready': 'Report Ready',
  'plan-ready': 'Plan Ready',
  'plan-approved': 'Plan Approved',
  welcome: 'Welcome',
};

// ─── Filter Options ──────────────────────────────────────────

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'queued', label: 'Queued' },
  { value: 'rate_limited', label: 'Rate Limited' },
];

const TEMPLATE_FILTERS: { value: TemplateFilter; label: string }[] = [
  { value: 'all', label: 'All Templates' },
  { value: 'report-ready', label: 'Report Ready' },
  { value: 'plan-ready', label: 'Plan Ready' },
  { value: 'plan-approved', label: 'Plan Approved' },
  { value: 'welcome', label: 'Welcome' },
];

// ─── Status Badge ────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.queued;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.color} ${cfg.bg}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Template Badge ──────────────────────────────────────────

function TemplateBadge({ template }: { template: string }) {
  const label = TEMPLATE_LABELS[template] ?? template;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-violet-400 bg-violet-500/15">
      {label}
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

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

// ─── Mask Email ──────────────────────────────────────────────

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name}@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

// ─── Component ───────────────────────────────────────────────

export function EmailLog({ logs, loading, error, onRefresh }: EmailLogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>('all');
  const [sortAsc, setSortAsc] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = logs.length;
    const sent = logs.filter((l) => l.status === 'sent').length;
    const failed = logs.filter((l) => l.status === 'failed').length;
    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;
    return { total, sent, failed, successRate };
  }, [logs]);

  // Filter + sort
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter);
    }

    // Template filter
    if (templateFilter !== 'all') {
      result = result.filter((l) => l.template === templateFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.recipient.toLowerCase().includes(q) ||
          l.emailId.toLowerCase().includes(q) ||
          l.template.toLowerCase().includes(q) ||
          l.error.toLowerCase().includes(q),
      );
    }

    // Sort by createdAt
    result.sort((a, b) => {
      const cmp = (a.createdAt || '').localeCompare(b.createdAt || '');
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [logs, statusFilter, templateFilter, searchQuery, sortAsc]);

  return (
    <section className="space-y-4">
      {/* Stats Row */}
      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#12121f] border border-white/10 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">Total</p>
            <p className="text-lg font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-[#12121f] border border-white/10 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">Sent</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">{stats.sent}</p>
          </div>
          <div className="bg-[#12121f] border border-white/10 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">Failed</p>
            <p className={`text-lg font-bold mt-1 ${stats.failed > 0 ? 'text-red-400' : 'text-gray-500'}`}>
              {stats.failed}
            </p>
          </div>
          <div className="bg-[#12121f] border border-white/10 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">Success Rate</p>
            <p className="text-lg font-bold text-cyan-400 mt-1">{stats.successRate}%</p>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-[#12121f] border border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Email Log</h2>
            <span className="text-xs text-gray-500">
              {filteredLogs.length === logs.length
                ? `${logs.length} emails`
                : `${filteredLogs.length} of ${logs.length}`}
            </span>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1 rounded text-gray-500 hover:text-violet-400 transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-white/5 space-y-2">
          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            {STATUS_FILTERS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${statusFilter === opt.value
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Template filters + sort */}
          <div className="flex flex-wrap items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-gray-500" />
            {TEMPLATE_FILTERS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTemplateFilter(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${templateFilter === opt.value
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}

            <div className="ml-auto">
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                {sortAsc ? 'Oldest first' : 'Newest first'}
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-500">
            <Inbox className="w-10 h-10 text-gray-600" />
            <p className="text-sm">No email logs found</p>
            {(statusFilter !== 'all' || templateFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setTemplateFilter('all'); }}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
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
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Recipient</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Template</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Locale</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Time</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {maskEmail(log.recipient)}
                          </span>
                          <span className="text-[11px] text-gray-500 mt-0.5 font-mono">
                            {log.emailId.slice(0, 16)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <TemplateBadge template={log.template} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400">
                        {log.locale}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {formatDate(log.sentAt || log.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        {log.error ? (
                          <span className="text-xs text-red-400 truncate max-w-[200px] block" title={log.error}>
                            {log.error.slice(0, 40)}{log.error.length > 40 ? '...' : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <div key={log.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {maskEmail(log.recipient)}
                    </span>
                    <StatusBadge status={log.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <TemplateBadge template={log.template} />
                    <span className="text-[11px] text-gray-500">
                      {formatDate(log.sentAt || log.createdAt)}
                    </span>
                  </div>
                  {log.error && (
                    <p className="text-[11px] text-red-400 truncate">{log.error}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
