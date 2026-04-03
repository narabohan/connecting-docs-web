// ═══════════════════════════════════════════════════════════════
//  BudgetSection — Depth 2
//  Phase 3-C Task 5: Enhanced with line items + tier guides
//  Props ≤ 7 | CSS rv7- prefix | NO any/unknown
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang, BudgetEstimate, BudgetLineItem, BudgetTierGuide } from '@/types/report-v7';

// ─── Status type ──────────────────────────────────────────────
type SectionStatus = 'idle' | 'loading' | 'done' | 'error';

// ─── Status messages (4 languages) ───────────────────────────
const STATUS_MSG: Record<string, Record<SurveyLang, string>> = {
  loading: { KO: '예산 분석을 준비하고 있습니다…', EN: 'Preparing budget estimate…', JP: '予算分析を準備中…', 'ZH-CN': '正在准备预算分析…' },
  idle: { KO: '예산 분석을 불러오는 중…', EN: 'Loading budget estimate…', JP: '予算分析を読み込み中…', 'ZH-CN': '正在加载预算分析…' },
  error: { KO: '예산 분석을 불러오지 못했습니다.', EN: 'Failed to load budget estimate.', JP: '予算分析の読み込みに失敗しました。', 'ZH-CN': '加载预算分析失败。' },
  retry: { KO: '다시 시도', EN: 'Retry', JP: '再試行', 'ZH-CN': '重试' },
  empty: { KO: '예산 분석이 아직 생성되지 않았습니다.', EN: 'Budget estimate has not been generated yet.', JP: '予算分析はまだ作成されていません。', 'ZH-CN': '预算分析尚未生成。' },
  title: { KO: '예상 비용', EN: 'Budget Estimate', JP: '費用見積もり', 'ZH-CN': '费用预估' },
  breakdown: { KO: '상세 내역', EN: 'Breakdown', JP: '内訳', 'ZH-CN': '明细' },
  tierGuide: { KO: '세그먼트별 가이드', EN: 'Budget Tier Guide', JP: 'セグメント別ガイド', 'ZH-CN': '预算层级指南' },
};

function msg(key: string, lang: SurveyLang): string {
  return STATUS_MSG[key]?.[lang] ?? STATUS_MSG[key]?.KO ?? key;
}

// ─── Category labels ──────────────────────────────────────────
const CATEGORY_LABELS: Record<string, Record<SurveyLang, string>> = {
  foundation: { KO: '기초 시술', EN: 'Foundation', JP: '基礎施術', 'ZH-CN': '基础项目' },
  main: { KO: '핵심 시술', EN: 'Main', JP: 'メイン施術', 'ZH-CN': '核心项目' },
  maintenance: { KO: '유지 관리', EN: 'Maintenance', JP: 'メンテナンス', 'ZH-CN': '维护项目' },
};

// ─── Tier colors ──────────────────────────────────────────────
const TIER_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  premium: { color: '#FFD700', bg: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)' },
  standard: { color: '#00E5FF', bg: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)' },
  value: { color: '#69F0AE', bg: 'rgba(105,240,174,0.06)', border: '1px solid rgba(105,240,174,0.15)' },
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
      <div className="rv7-skeleton-loading" style={{ height: '6px', borderRadius: '3px', marginBottom: '12px' }} />
      <div className="rv7-skeleton-loading" style={{ height: '32px', borderRadius: '8px', width: '60%' }} />
      <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-3)', marginTop: '8px' }}>
        {msg('loading', lang)}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────
export function BudgetSection({ budget, status, lang, onRetry }: BudgetSectionProps) {
  if (status === 'idle' || status === 'loading') {
    return <BudgetSkeleton lang={lang} />;
  }

  if (status === 'error') {
    return (
      <div className="rv7-glass" style={{ padding: '24px', textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.6 }}>&#9888;&#65039;</div>
        <div style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '12px' }}>{msg('error', lang)}</div>
        {onRetry && (
          <button onClick={onRetry} style={{
            padding: '6px 16px', borderRadius: '8px', background: 'var(--cyan-dim)',
            border: '1px solid var(--cyan-border)', color: 'var(--cyan)', fontSize: '10px', fontWeight: 600, cursor: 'pointer',
          }}>
            {msg('retry', lang)}
          </button>
        )}
      </div>
    );
  }

  if (!budget || (budget.segments.length === 0 && budget.lineItems.length === 0)) {
    return (
      <div className="rv7-glass" style={{ padding: '24px', textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.5 }}>&#128176;</div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{msg('empty', lang)}</div>
      </div>
    );
  }

  return (
    <div className="rv7-glass" style={{ padding: '16px 20px', marginBottom: '20px' }}>
      {/* Header + Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-3)' }}>
          {msg('title', lang)}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-hi)' }}>
          {budget.totalRange}
        </span>
      </div>

      {/* Segmented bar */}
      {budget.segments.length > 0 && (
        <>
          <div className="rv7-budget-bar">
            {budget.segments.map((seg) => (
              <div key={seg.category} className={`rv7-budget-segment ${seg.category}`} style={{ flex: seg.percentage }} />
            ))}
          </div>
          <div className="rv7-budget-labels">
            {budget.segments.map((seg) => (
              <div key={seg.category} style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                <span style={{ fontWeight: 600 }}>{CATEGORY_LABELS[seg.category]?.[lang] ?? seg.label}</span>
                {' '}
                <span style={{ color: 'var(--text-3)' }}>{seg.amount} ({seg.percentage}%)</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Line items table */}
      {budget.lineItems.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
            {msg('breakdown', lang)}
          </div>
          <div style={{
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            {budget.lineItems.map((item, i) => (
              <div
                key={`${item.treatment}-${i}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto',
                  gap: '8px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  borderBottom: i < budget.lineItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-hi, #e2e8f0)', fontWeight: 500 }}>{item.treatment}</span>
                  {item.category && (
                    <span style={{ color: 'var(--text-3, #64748b)', marginLeft: '4px', fontSize: '9px' }}>
                      ({item.category})
                    </span>
                  )}
                </div>
                <span style={{ color: 'var(--text-3)', textAlign: 'right' }}>{item.sessions}x</span>
                <span style={{ color: 'var(--text-2)', textAlign: 'right' }}>{item.unitPrice}</span>
                <span style={{ color: 'var(--text-hi)', fontWeight: 600, textAlign: 'right' }}>{item.subtotal}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tier guides */}
      {budget.tierGuides.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
            &#128161; {msg('tierGuide', lang)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {budget.tierGuides.map((guide) => {
              const style = TIER_STYLES[guide.tier] || TIER_STYLES.standard;
              return (
                <div
                  key={guide.tier}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: style.bg,
                    border: style.border,
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: style.color, minWidth: '70px', textTransform: 'capitalize' }}>
                    {guide.tier}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-hi)', minWidth: '100px' }}>
                    {guide.range}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-2)', flex: 1 }}>
                    {guide.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ROI note */}
      {budget.roiNote && (
        <div className="rv7-budget-roi-note">{budget.roiNote}</div>
      )}
    </div>
  );
}
