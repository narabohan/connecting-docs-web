// ═══════════════════════════════════════════════════════════════
//  SessionLog — Phase 2 (G-5)
//  관리자 세션 로그: 최근 설문 세션 목록
//  G-3 PatientQueue 패턴 복사 → 세션 목록으로 확장
//
//  Features:
//  - 검색: runId, 목표, 국가
//  - 필터: 완료/미완료
//  - 정렬: 시간순
//  - 위험 플래그 표시
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Filter,
  Activity,
  Inbox,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

interface AdminSession {
  id: string;
  runId: string;
  createdAt: string;
  country: string;
  language: string;
  aestheticGoal: string;
  hasDangerFlag: boolean;
  topDevice: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  completed: boolean;
}

type CompletionFilter = 'all' | 'completed' | 'incomplete';
type SortField = 'date' | 'tokens';

interface SessionLogProps {
  sessions: AdminSession[];
  loading: boolean;
  error: string | null;
}

// ─── Filter Options ──────────────────────────────────────────

const FILTER_OPTIONS: { value: CompletionFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'incomplete', label: 'Incomplete' },
];

// ─── Completion Badge ────────────────────────────────────────

function CompletionBadge({ completed }: { completed: boolean }) {
  return completed ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-emerald-400 bg-emerald-500/15">
      <CheckCircle2 className="w-3 h-3" />
      Done
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-amber-400 bg-amber-500/15">
      <Clock className="w-3 h-3" />
      In Progress
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

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

// ─── Format Tokens ───────────────────────────────────────────

function formatTokens(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

// ─── Component ───────────────────────────────────────────────

export function SessionLog({ sessions, loading, error }: SessionLogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const dangerCount = sessions.filter((s) => s.hasDangerFlag).length;
    return { total, completed, rate, dangerCount };
  }, [sessions]);

  // Filter + sort
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Completion filter
    if (completionFilter === 'completed') {
      result = result.filter((s) => s.completed);
    } else if (completionFilter === 'incomplete') {
      result = result.filter((s) => !s.completed);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.runId.toLowerCase().includes(q) ||
          s.aestheticGoal.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.topDevice.toLowerCase().includes(q),
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp: number;
      if (sortField === 'tokens') {
        cmp = (a.inputTokens + a.outputTokens) - (b.inputTokens + b.outputTokens);
      } else {
        cmp = (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [sessions, completionFilter, searchQuery, sortField, sortAsc]);

  return (
    <section className="space-y-4">
      {/* Stats Row */}
      {!loading && sessions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#12121f] border border-white/10 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">Total</p>
            <p className="text-lg font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-[#12121f] border border-white/10 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">Completed</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">{stats.completed}</p>
          </div>
          <div className="bg-[#12121f] border border-white/10 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">Completion Rate</p>
            <p className="text-lg font-bold text-cyan-400 mt-1">{stats.rate}%</p>
          </div>
          <div className="bg-[#12121f] border border-white/10 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">Danger Flags</p>
            <p className={`text-lg font-bold mt-1 ${stats.dangerCount > 0 ? 'text-red-400' : 'text-gray-500'}`}>
              {stats.dangerCount}
            </p>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-[#12121f] border border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Session Log</h2>
            <span className="text-xs text-gray-500">
              {filteredSessions.length === sessions.length
                ? `${sessions.length} sessions`
                : `${filteredSessions.length} of ${sessions.length}`}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Filters + Sort */}
        <div className="px-5 py-3 border-b border-white/5 flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCompletionFilter(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${completionFilter === opt.value
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                }
              `}
            >
              {opt.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setSortField(sortField === 'date' ? 'tokens' : 'date')}
              className="px-2 py-1 rounded text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              Sort: {sortField === 'date' ? 'Date' : 'Tokens'}
            </button>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
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
        ) : filteredSessions.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-500">
            <Inbox className="w-10 h-10 text-gray-600" />
            <p className="text-sm">No sessions found</p>
            {completionFilter !== 'all' && (
              <button
                onClick={() => setCompletionFilter('all')}
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
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Session</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Goal</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Top Device</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Tokens</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white font-mono">
                              {session.runId ? session.runId.slice(0, 16) : session.id.slice(0, 12)}
                            </span>
                            {session.hasDangerFlag && (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 mt-0.5">
                            {session.country || '—'} · {session.language || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <CompletionBadge completed={session.completed} />
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400">
                        {session.aestheticGoal || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400">
                        {session.topDevice || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-400 tabular-nums">
                          {formatTokens(session.inputTokens + session.outputTokens)}
                        </span>
                        <span className="text-[11px] text-gray-600 ml-1">
                          ({formatTokens(session.inputTokens)}+{formatTokens(session.outputTokens)})
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {formatDate(session.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredSessions.map((session) => (
                <div key={session.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-medium text-white font-mono truncate">
                        {session.runId ? session.runId.slice(0, 16) : session.id.slice(0, 12)}
                      </span>
                      {session.hasDangerFlag && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      )}
                    </div>
                    <CompletionBadge completed={session.completed} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      {session.aestheticGoal || 'No goal'} · {session.country || '—'}
                    </span>
                    <span>{formatDate(session.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
