// ═══════════════════════════════════════════════════════════════
//  Report v7 — InjectableCard (Depth 0 collapsed + Depth 1 expanded)
//  Same pattern as EBDCard but with rose color theme.
//  Props ≤ 4: recommendation, isExpanded, onToggle, lang
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang, InjectableRecommendation } from '@/types/report-v7';
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

// ─── Props ────────────────────────────────────────────────────
interface InjectableCardProps {
  recommendation: InjectableRecommendation;
  isExpanded: boolean;
  onToggle: () => void;
  lang: SurveyLang;
}

// ─── Component ────────────────────────────────────────────────
export function InjectableCard({ recommendation: rec, isExpanded, onToggle }: InjectableCardProps) {
  const { t } = useReportI18n();
  const targetLayers = rec.skinLayer ? rec.skinLayer.split(',').map((s) => s.trim()) : [];

  return (
    <div className={`rv7-rec-card rv7-inj-card${isExpanded ? ' active' : ''}`}>
      {/* Badge */}
      <div className="rv7-rec-badge">
        <span className="rv7-neon-tag rv7-rose">#{rec.rank}</span>
        <EvidenceBadge level={rec.evidenceLevel} />
      </div>

      {/* Head */}
      <div className="rv7-rec-head">
        <div className="rv7-rec-title-area">
          <div className="rv7-rec-name">{rec.name}</div>
          <div className="rv7-rec-sub">{rec.subtitle}</div>
        </div>
      </div>

      {/* Summary (Depth 0) */}
      <div
        className="rv7-rec-summary"
        dangerouslySetInnerHTML={{ __html: rec.summaryHtml }}
      />

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
            <div className="rv7-why-fit-title" style={{ color: 'var(--rose)' }}>
              {rec.categoryLabel}
            </div>
            <div
              className="rv7-why-fit-content"
              dangerouslySetInnerHTML={{ __html: rec.whyFitHtml }}
            />
          </div>

          {/* MOA inline */}
          {rec.moaSummaryShort && (
            <div className="rv7-moa-section">
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-hi)', marginBottom: '4px' }}>
                {rec.moaSummaryTitle}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-2)', lineHeight: 1.7 }}>
                {rec.moaSummaryShort}
              </div>
            </div>
          )}

          {/* Radar Chart (5-axis) */}
          <div style={{ marginTop: '16px' }}>
            <RadarChart5Axis
              scores={rec.scores}
              painLevel={0}
              downtimeLevel={0}
              lang="KO"
            />
          </div>

          {/* Skin Layer 3D */}
          {targetLayers.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <SkinLayer3D
                targetLayers={targetLayers}
                deviceCategory={rec.category}
                lang="KO"
              />
            </div>
          )}

          {/* Practical info */}
          {rec.practical.sessions && (
            <div className="rv7-rec-gauges" style={{ flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {[
                { label: 'Sessions', value: rec.practical.sessions },
                { label: 'Interval', value: rec.practical.interval },
                { label: 'Onset', value: rec.practical.onset },
                { label: 'Maintain', value: rec.practical.maintain },
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.label} className="rv7-rec-gauge">
                    <span className="rv7-rec-gauge-label">{item.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-hi)' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
