// ═══════════════════════════════════════════════════════════════
//  BudgetSection — Depth 2
//  Budget estimate with segmented bar (foundation/main/maintenance).
//  Same 4-status pattern as TreatmentPlanSection.
//  Props ≤ 7 | CSS rv7- prefix | NO any/unknown
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang, BudgetEstimate } from '@/types/report-v7';

// ─── Status type ──────────────────────────────────────────────
type SectionStatus = 'idle' | 'loading' | 'done' | 'error';

// ─── Status messages (4 languages) ───────────────────────────
const STATUS_MSG: Record<string, Record<SurveyLang, string>> = {
  loading: {
    KO: '예산 분석을 준비하고 있습니다…',
    EN: 'Preparing budget estimate…',
    JP: '予算分析を準備中…',
    'ZH-CN': '正在准备预算分析…',
  },
  idle: {
    KO: '예산 분석을 불러오는 중…',
    EN: 'Loading budget estimate…',
    JP: '予算分析を読み込み中…',
    'ZH-CN': '正在加载预算分析…',
  },
  error: {
    KO: '예산 분석을 불러오지 못했습니다.',
    EN: 'Failed to load budget estimate.',
    JP: '予算分析の読み込みに失敗しました。',
    'ZH-CN': '加载预算分析失败。',
  },
  retry: {
    KO: '다시 시도',
    EN: 'Retry',
    JP: '再試行',
    'ZH-CN': '重试',
  },
  empty: {
    KO: '예산 분석이 아직 생성되지 않았습니다.',
    EN: 'Budget estimate has not been generated yet.',
    JP: '予算分析はまだ作成されていません。',
    'ZH-CN': '预算分析尚未生成。',
  },
  title: {
    KO: '예상 비용',
    EN: 'Budget Estimate',
    JP: '費用見積もり',
    'ZH-CN': '费用预估',
  },
};

function msg(key: string, lang: SurveyLang): string {
  return STATUS_MSG[key]?.[lang] ?? STATUS_MSG[key]?.KO ?? key;
}

// ─── Category labels ──────────────────────────────────────────
const CATEGORY_LABELS: Record<string, Record<SurveyLang, string>> = {
  foundation: {
    KO: '기초 시술',
    EN: 'Foundation',
    JP: '基礎施術',
    'ZH-CN': '基础项目',
  },
  main: {
    KO: '핵심 시술',
    EN: 'Main',
    JP: 'メイン施術',
    'ZH-CN': '核心项目',
  },
  maintenance: {
    KO: '유지 관리',
    EN: 'Maintenance',
    JP: 'メンテナンス',
    'ZH-CN': '维护项目',
  },
};

// ─── Props ────────────────────────────────────────────────────
interface BudgetSectionProps {
  budget: BudgetEstimate | null;
  status: SectionStatus;
  lang: SurveyLang;
  onRetry?: () => void;
}

// ─── Skeleton ─────────────────────────────────────────────────
function BudgetSkeleton({ lang }: { lang: SurveyLang }) {
  return (
    <div className="rv7-glass" style={{ padding: '16px 20px', marginBottom: '20px' }}>
      <div
        className="rv7-skeleton-loading"
        style={{ height: '6px', borderRadius: '3px', marginBottom: '12px' }}
      />
      <div
        className="rv7-skeleton-loading"
        style={{ height: '32px', borderRadius: '8px', width: '60%' }}
      />
      <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-3)', marginTop: '8px' }}>
        {msg('loading', lang)}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────
export function BudgetSection({ budget, status, lang, onRetry }: BudgetSectionProps) {
  // idle / loading → skeleton
  if (status === 'idle' || status === 'loading') {
    return <BudgetSkeleton lang={lang} />;
  }

  // error → retry
  if (status === 'error') {
    return (
      <div className="rv7-glass" style={{ padding: '24px', textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.6 }}>⚠️</div>
        <div style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '12px' }}>
          {msg('error', lang)}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              background: 'var(--cyan-dim)',
              border: '1px solid var(--cyan-border)',
              color: 'var(--cyan)',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {msg('retry', lang)}
          </button>
        )}
      </div>
    );
  }

  // done but no data
  if (!budget || budget.segments.length === 0) {
    return (
      <div className="rv7-glass" style={{ padding: '24px', textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.5 }}>💰</div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
          {msg('empty', lang)}
        </div>
      </div>
    );
  }

  // done → render budget
  return (
    <div className="rv7-glass" style={{ padding: '16px 20px', marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: 'var(--text-3)',
        }}>
          {msg('title', lang)}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-hi)' }}>
          {budget.totalRange}
        </span>
      </div>

      {/* Segmented bar */}
      <div className="rv7-budget-bar">
        {budget.segments.map((seg) => (
          <div
            key={seg.category}
            className={`rv7-budget-segment ${seg.category}`}
            style={{ flex: seg.percentage }}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="rv7-budget-labels">
        {budget.segments.map((seg) => (
          <div key={seg.category} style={{ fontSize: '9px', color: 'var(--text-2)' }}>
            <span style={{ fontWeight: 600 }}>
              {CATEGORY_LABELS[seg.category]?.[lang] ?? seg.label}
            </span>
            {' '}
            <span style={{ color: 'var(--text-3)' }}>
              {seg.amount} ({seg.percentage}%)
            </span>
          </div>
        ))}
      </div>

      {/* ROI note */}
      {budget.roiNote && (
        <div className="rv7-budget-roi-note">{budget.roiNote}</div>
      )}
    </div>
  );
}
