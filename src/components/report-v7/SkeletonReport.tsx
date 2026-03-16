// ═══════════════════════════════════════════════════════════════
//  Report v7 — Skeleton Loading UI
//  Uses rv7-skeletonWave animation from report-v7.css.
//  Props ≤ 1: lang (SurveyLang)
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang } from '@/types/report-v7';

// ─── i18n for loading text ────────────────────────────────────
const LOADING_TEXT: Record<SurveyLang, string> = {
  KO: '리포트를 준비하고 있습니다…',
  EN: 'Preparing your report…',
  JP: 'レポートを準備しています…',
  'ZH-CN': '正在准备您的报告…',
};

// ─── Skeleton Block ───────────────────────────────────────────
interface SkeletonBlockProps {
  width?: string;
  height?: string;
  borderRadius?: string;
}

function SkeletonBlock({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--radius-xs)',
}: SkeletonBlockProps) {
  return (
    <div
      className="rv7-skeleton-loading"
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--surface-2)',
      }}
    />
  );
}

// ─── Skeleton Card ────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rv7-glass"
      style={{
        minWidth: '260px',
        maxWidth: '300px',
        flexShrink: 0,
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        padding: '18px',
      }}
    >
      <SkeletonBlock width="60px" height="20px" borderRadius="20px" />
      <div style={{ marginTop: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <SkeletonBlock width="56px" height="56px" borderRadius="var(--radius-sm)" />
        <div style={{ flex: 1 }}>
          <SkeletonBlock width="80%" height="14px" />
          <div style={{ marginTop: '6px' }}>
            <SkeletonBlock width="50%" height="10px" />
          </div>
        </div>
      </div>
      <div style={{ marginTop: '14px' }}>
        <SkeletonBlock width="100%" height="10px" />
        <div style={{ marginTop: '6px' }}>
          <SkeletonBlock width="90%" height="10px" />
        </div>
        <div style={{ marginTop: '6px' }}>
          <SkeletonBlock width="70%" height="10px" />
        </div>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────
interface SkeletonReportProps {
  lang: SurveyLang;
}

// ─── Component ────────────────────────────────────────────────
export function SkeletonReport({ lang }: SkeletonReportProps) {
  return (
    <div className="rv7-report" style={{ maxWidth: '620px', margin: '0 auto', padding: '0 16px' }}>
      {/* Tab bar skeleton */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <SkeletonBlock width="50%" height="12px" />
        <SkeletonBlock width="50%" height="12px" />
      </div>

      {/* Loading indicator */}
      <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', letterSpacing: '0.02em' }}>
          {LOADING_TEXT[lang]}
        </div>
      </div>

      {/* Patient profile skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '24px 0 16px' }}>
        <SkeletonBlock width="52px" height="52px" borderRadius="50%" />
        <div style={{ flex: 1 }}>
          <SkeletonBlock width="120px" height="16px" />
          <div style={{ marginTop: '6px' }}>
            <SkeletonBlock width="180px" height="12px" />
          </div>
        </div>
      </div>

      {/* Chips skeleton */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <SkeletonBlock width="80px" height="30px" borderRadius="20px" />
        <SkeletonBlock width="100px" height="30px" borderRadius="20px" />
        <SkeletonBlock width="70px" height="30px" borderRadius="20px" />
        <SkeletonBlock width="90px" height="30px" borderRadius="20px" />
      </div>

      {/* Mirror layer skeleton */}
      <div
        className="rv7-glass"
        style={{
          padding: '32px 24px',
          marginBottom: '20px',
          borderRadius: 'var(--radius)',
        }}
      >
        <SkeletonBlock width="70%" height="22px" />
        <div style={{ marginTop: '16px' }}>
          <SkeletonBlock width="100%" height="12px" />
          <div style={{ marginTop: '8px' }}>
            <SkeletonBlock width="95%" height="12px" />
          </div>
          <div style={{ marginTop: '8px' }}>
            <SkeletonBlock width="60%" height="12px" />
          </div>
        </div>
      </div>

      {/* Section label skeleton */}
      <div style={{ marginBottom: '12px' }}>
        <SkeletonBlock width="140px" height="10px" />
      </div>

      {/* Recommendation cards skeleton (horizontal scroll) */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'hidden', paddingBottom: '8px' }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Radar chart skeleton */}
      <div
        className="rv7-glass"
        style={{
          marginTop: '24px',
          padding: '20px',
          borderRadius: 'var(--radius)',
          textAlign: 'center',
        }}
      >
        <SkeletonBlock width="120px" height="10px" />
        <div style={{ margin: '16px auto 0', width: '160px', height: '160px' }}>
          <SkeletonBlock width="160px" height="160px" borderRadius="50%" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
          <SkeletonBlock width="60px" height="8px" />
          <SkeletonBlock width="60px" height="8px" />
        </div>
      </div>

      {/* CTA skeleton */}
      <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
        <SkeletonBlock width="100%" height="48px" borderRadius="var(--radius)" />
      </div>
    </div>
  );
}
