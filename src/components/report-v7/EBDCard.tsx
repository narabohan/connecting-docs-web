// ═══════════════════════════════════════════════════════════════
//  Report v7 — EBDCard (Depth 0 collapsed + Depth 1 expanded)
//  Single device card with expand/collapse toggle.
//  Props ≤ 4: recommendation, isExpanded, onToggle, lang
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang, EBDRecommendation } from '@/types/report-v7';
import { useReportI18n } from './ReportI18nContext';
import { RadarChart5Axis } from './RadarChart5Axis';
import { SkinLayer3D } from './SkinLayer3D';

// ─── Evidence stars ───────────────────────────────────────────
function EvidenceBadge({ level }: { level: number }) {
  const stars = '★'.repeat(Math.min(level, 5));
  const evClass =
    level >= 5 ? 'rv7-ev-5' :
    level >= 4 ? 'rv7-ev-4' :
    level >= 3 ? 'rv7-ev-3' : 'rv7-ev-2';

  return (
    <span className={`rv7-evidence-badge ${evClass}`}>
      <span className="rv7-ev-stars">{stars}</span>
      <span className="rv7-ev-label">L{level}</span>
    </span>
  );
}

// ─── Practical info grid ──────────────────────────────────────
function PracticalGrid({ rec }: { rec: EBDRecommendation }) {
  const { t } = useReportI18n();
  const items = [
    { label: 'Sessions', value: rec.practical.sessions },
    { label: 'Interval', value: rec.practical.interval },
    { label: 'Duration', value: rec.practical.duration },
    { label: 'Onset', value: rec.practical.onset },
    { label: 'Maintain', value: rec.practical.maintain },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <div className="rv7-rec-gauges" style={{ flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
      {items.map((item) => (
        <div key={item.label} className="rv7-rec-gauge">
          <span className="rv7-rec-gauge-label">{item.label}</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-hi)' }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────
interface EBDCardProps {
  recommendation: EBDRecommendation;
  isExpanded: boolean;
  onToggle: () => void;
  lang: SurveyLang;
}

// ─── Component ────────────────────────────────────────────────
export function EBDCard({ recommendation: rec, isExpanded, onToggle, lang }: EBDCardProps) {
  const { t } = useReportI18n();
  const targetLayers = rec.skinLayer ? rec.skinLayer.split(',').map((s) => s.trim()) : [];

  return (
    <div className={`rv7-rec-card rv7-ebd-card${isExpanded ? ' rv7-active' : ''}`}>
      {/* Badge */}
      <div className="rv7-rec-badge">
        <span className="rv7-neon-tag rv7-cyan">#{rec.rank}</span>
        <EvidenceBadge level={rec.evidenceLevel} />
      </div>

      {/* Head: device name + subtitle */}
      <div className="rv7-rec-head">
        <div className="rv7-rec-title-area">
          <div className="rv7-rec-name">{rec.deviceName}</div>
          <div className="rv7-rec-sub">{rec.subtitle}</div>
          {/* Card badges */}
          {rec.badge && (
            <div className="rv7-card-badges" style={{ marginTop: '4px' }}>
              <span
                className="rv7-card-badge rv7-badge-trend"
                style={rec.badgeColor ? { color: rec.badgeColor } : undefined}
              >
                {rec.badge}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary (always visible — Depth 0) */}
      <div
        className="rv7-rec-summary"
        dangerouslySetInnerHTML={{ __html: rec.summaryHtml }}
      />

      {/* Target tags */}
      {rec.targetTags.length > 0 && (
        <div className="rv7-rec-targets" style={{ padding: '0 18px 8px' }}>
          {rec.targetTags.map((tag) => (
            <span key={tag} className="rv7-rec-target">{tag}</span>
          ))}
        </div>
      )}

      {/* Expand button */}
      <button
        className={`rv7-rec-expand-btn${isExpanded ? ' open' : ''}`}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        {isExpanded ? t('action.collapse') : t('action.viewDetail')}
        <span className="rv7-arrow">▼</span>
      </button>

      {/* ─── Depth 1: Expanded detail ─── */}
      <div className={`rv7-rec-detail${isExpanded ? ' open' : ''}`}>
        <div className="rv7-rec-detail-inner">
          {/* Why fit */}
          <div className="rv7-why-fit">
            <div className="rv7-why-fit-title">{rec.moaCategoryLabel}</div>
            <div
              className="rv7-why-fit-content"
              dangerouslySetInnerHTML={{ __html: rec.whyFitHtml }}
            />
          </div>

          {/* MOA inline summary */}
          {rec.moaSummaryShort && (
            <div className="rv7-moa-section">
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-hi)', marginBottom: '4px' }}>
                {rec.moaSummaryTitle}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: 1.7 }}>
                {rec.moaSummaryShort}
              </div>
            </div>
          )}

          {/* Radar Chart (5-axis) */}
          <div style={{ marginTop: '16px' }}>
            <RadarChart5Axis
              scores={rec.scores}
              painLevel={rec.painLevel}
              downtimeLevel={rec.downtimeLevel}
              lang={lang}
            />
          </div>

          {/* Skin Layer 3D */}
          {targetLayers.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <SkinLayer3D
                targetLayers={targetLayers}
                deviceCategory={rec.moaCategory}
                lang={lang}
              />
            </div>
          )}

          {/* Practical info */}
          <PracticalGrid rec={rec} />
        </div>
      </div>
    </div>
  );
}
