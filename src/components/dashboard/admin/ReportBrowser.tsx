// ═══════════════════════════════════════════════════════════════
//  ReportBrowser — Phase 2 (G-5)
//  관리자 리포트 브라우저: 검색 + 필터 + 미리보기
//  G-3 PatientQueue 패턴 복사 → 리포트 목록으로 확장
//
//  Features:
//  - 검색: 리포트 ID, 추천 프로토콜, 목표
//  - 필터: 상태별 (all, completed, pending)
//  - 정렬: 날짜순, 목표순
//  - 리포트 클릭 → 미리보기 모달
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import {
  Search,
  ArrowUpDown,
  Filter,
  FileText,
  Inbox,
  Eye,
  X,
  AlertCircle,
  Star,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

interface AdminReport {
  id: string;
  date: string;
  status: string;
  title: string;
  primaryGoal: string;
  skinType: string;
  topRecommendation: string;
  matchScore: number | null;
}

type StatusFilter = 'all' | 'completed' | 'pending';
type SortField = 'date' | 'goal';

interface ReportBrowserProps {
  reports: AdminReport[];
  loading: boolean;
  error: string | null;
}

// ─── Status Config ───────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/15' },
};

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
];

// ─── Status Badge ────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.completed;
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

// ─── Preview Modal ───────────────────────────────────────────

interface PreviewModalProps {
  report: AdminReport;
  onClose: () => void;
}

function PreviewModal({ report, onClose }: PreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#1a1a2e] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-violet-400" />
            Report Preview
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider">ID</span>
            <span className="text-xs text-gray-300 font-mono">{report.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider">Date</span>
            <span className="text-xs text-gray-300">{formatDate(report.date)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider">Status</span>
            <StatusBadge status={report.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider">Primary Goal</span>
            <span className="text-xs text-gray-300">{report.primaryGoal || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider">Skin Type</span>
            <span className="text-xs text-gray-300">{report.skinType || '—'}</span>
          </div>

          {report.topRecommendation && (
            <div className="mt-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[11px] text-violet-400 uppercase tracking-wider font-medium">
                  Top Recommendation
                </span>
              </div>
              <p className="text-sm text-white">{report.topRecommendation}</p>
              {report.matchScore !== null && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Match Score: {report.matchScore}%
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────

export function ReportBrowser({ reports, loading, error }: ReportBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [previewReport, setPreviewReport] = useState<AdminReport | null>(null);

  // Filter + sort
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.primaryGoal.toLowerCase().includes(q) ||
          r.topRecommendation.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q),
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp: number;
      if (sortField === 'goal') {
        cmp = a.primaryGoal.localeCompare(b.primaryGoal);
      } else {
        cmp = (a.date || '').localeCompare(b.date || '');
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [reports, statusFilter, searchQuery, sortField, sortAsc]);

  const handlePreview = useCallback((report: AdminReport) => {
    setPreviewReport(report);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewReport(null);
  }, []);

  return (
    <>
      <section className="bg-[#12121f] border border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Report Browser</h2>
            <span className="text-xs text-gray-500">
              {filteredReports.length === reports.length
                ? `${reports.length} reports`
                : `${filteredReports.length} of ${reports.length}`}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search reports..."
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

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setSortField(sortField === 'date' ? 'goal' : 'date')}
              className="px-2 py-1 rounded text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              Sort: {sortField === 'date' ? 'Date' : 'Goal'}
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
        ) : filteredReports.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-500">
            <Inbox className="w-10 h-10 text-gray-600" />
            <p className="text-sm">No reports found</p>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
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
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Report</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Goal</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Top Recommendation</th>
                    <th className="px-5 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium">Date</th>
                    <th className="px-5 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {report.title}
                          </span>
                          <span className="text-[11px] text-gray-500 mt-0.5 font-mono">
                            {report.id.slice(0, 12)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400">
                        {report.primaryGoal || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-400">
                            {report.topRecommendation || '—'}
                          </span>
                          {report.matchScore !== null && (
                            <span className="text-[11px] text-gray-500 mt-0.5">
                              Score: {report.matchScore}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {formatDate(report.date)}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handlePreview(report)}
                          className="p-1 rounded text-gray-600 hover:text-violet-400 transition-colors"
                          aria-label="Preview report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => handlePreview(report)}
                  className="w-full text-left px-5 py-4 space-y-2 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white truncate block">
                        {report.title}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {report.primaryGoal || 'No goal'}
                      </span>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      {formatDate(report.date)}
                    </span>
                    {report.topRecommendation && (
                      <span className="text-[11px] text-violet-400 truncate max-w-[180px]">
                        {report.topRecommendation}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Preview Modal */}
      {previewReport && (
        <PreviewModal report={previewReport} onClose={handleClosePreview} />
      )}
    </>
  );
}
