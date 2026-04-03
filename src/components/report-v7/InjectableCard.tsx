// ═══════════════════════════════════════════════════════════════
//  Report v7 — InjectableCard (Category-First 2-Layer Layout)
//  Phase 3-C Task 7: Mirrors EBDCard pattern with rose theme
//  Layer 1: Category info (injectable category)
//  Layer 2: Representative product with 4 patient indicators
//  Collapsible: Alternative products + detail (radar, skin layer)
//  Props ≤ 4: recommendation, isExpanded, onToggle, lang
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { SurveyLang, InjectableRecommendation, InjectableAlternative } from '@/types/report-v7';
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

// ─── Match Score Bar ─────────────────────────────────────────

function MatchScoreBar({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const barColor =
    clampedScore >= 85 ? '#FF6B9D' :
    clampedScore >= 70 ? '#FF9BBB' :
    clampedScore >= 50 ? '#FFD740' : '#FF6E40';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div
        style={{
          flex: 1, height: '6px', borderRadius: '3px',
          background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clampedScore}%`, height: '100%', borderRadius: '3px',
            background: barColor, transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color: barColor, minWidth: '32px', textAlign: 'right' }}>
        {clampedScore}%
      </span>
    </div>
  );
}

// ─── Pain Dots ───────────────────────────────────────────────

function PainDots({ level }: { level: number }) {
  const clamped = Math.max(1, Math.min(5, level));
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: i <= clamped ? '#FF6E40' : 'rgba(255,255,255,0.12)',
            transition: 'background 0.2s',
          }}
        />
      ))}
    </span>
  );
}

// ─── Price Tier ──────────────────────────────────────────────

function PriceTierDisplay({ tier }: { tier: number }) {
  const clamped = Math.max(1, Math.min(5, tier));
  const symbols = '$'.repeat(clamped);
  const faded = '$'.repeat(5 - clamped);
  return (
    <span style={{ fontSize: '12px', fontWeight: 600 }}>
      <span style={{ color: '#FFD740' }}>{symbols}</span>
      <span style={{ color: 'rgba(255,255,255,0.15)' }}>{faded}</span>
    </span>
  );
}

// ─── 4-Indicator Grid ────────────────────────────────────────

interface FourIndicatorProps {
  matchScore: number;
  downtimeDisplay: string;
  painLevel: number;
  priceTier: number;
  lang: SurveyLang;
  compact?: boolean;
}

const INDICATOR_LABELS: Record<SurveyLang, { match: string; downtime: string; pain: string; price: string }> = {
  KO: { match: '적합도', downtime: '다운타임', pain: '통증', price: '가격대' },
  EN: { match: 'Match', downtime: 'Downtime', pain: 'Pain', price: 'Price' },
  JP: { match: '適合度', downtime: 'ダウンタイム', pain: '痛み', price: '価格帯' },
  'ZH-CN': { match: '匹配度', downtime: '恢复期', pain: '疼痛', price: '价格' },
};

function FourIndicatorGrid({ matchScore, downtimeDisplay, painLevel, priceTier, lang, compact }: FourIndicatorProps) {
  const labels = INDICATOR_LABELS[lang] || INDICATOR_LABELS.EN;
  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: compact ? '3px 0' : '5px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: compact ? '10px' : '11px',
    color: 'var(--text-2, #94a3b8)',
    minWidth: compact ? '48px' : '56px',
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
      padding: compact ? '6px 10px' : '8px 14px',
      marginTop: compact ? '4px' : '10px',
    }}>
      <div style={rowStyle}>
        <span style={labelStyle}>{labels.match}</span>
        <MatchScoreBar score={matchScore} />
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>{labels.downtime}</span>
        <span style={{ fontSize: compact ? '11px' : '12px', fontWeight: 600, color: 'var(--text-hi, #e2e8f0)' }}>
          {downtimeDisplay || '-'}
        </span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>{labels.pain}</span>
        <PainDots level={painLevel} />
      </div>
      <div style={{ ...rowStyle, borderBottom: 'none' }}>
        <span style={labelStyle}>{labels.price}</span>
        <PriceTierDisplay tier={priceTier} />
      </div>
    </div>
  );
}

// ─── Alternative Product Row ─────────────────────────────────

function AlternativeProductRow({ product, lang }: { product: InjectableAlternative; lang: SurveyLang }) {
  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-hi, #e2e8f0)' }}>
          {product.name}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-2, #94a3b8)', marginBottom: '6px', lineHeight: 1.5 }}>
        {product.oneLiner}
      </div>
      <FourIndicatorGrid
        matchScore={product.matchScore}
        downtimeDisplay={product.downtimeDisplay}
        painLevel={product.painLevel}
        priceTier={product.priceTier}
        lang={lang}
        compact
      />
    </div>
  );
}

// ─── Practical info grid ─────────────────────────────────────

function PracticalGrid({ rec }: { rec: InjectableRecommendation }) {
  const items = [
    { label: 'Sessions', value: rec.practical.sessions },
    { label: 'Interval', value: rec.practical.interval },
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

// ─── i18n labels ──────────────────────────────────────────────

const ALT_LABELS: Record<SurveyLang, { show: string; hide: string }> = {
  KO: { show: '다른 제품 보기', hide: '접기' },
  EN: { show: 'Other products', hide: 'Collapse' },
  JP: { show: '他の製品', hide: '閉じる' },
  'ZH-CN': { show: '其他产品', hide: '收起' },
};

// ─── Props ────────────────────────────────────────────────────

interface InjectableCardProps {
  recommendation: InjectableRecommendation;
  isExpanded: boolean;
  onToggle: () => void;
  lang: SurveyLang;
}

// ─── Component ────────────────────────────────────────────────

export function InjectableCard({ recommendation: rec, isExpanded, onToggle, lang }: InjectableCardProps) {
  const { t } = useReportI18n();
  const [altExpanded, setAltExpanded] = useState(false);
  const targetLayers = rec.skinLayer ? rec.skinLayer.split(',').map((s) => s.trim()) : [];
  const hasAlternatives = rec.alternativeProducts.length > 0;
  const categoryName = lang === 'KO' ? rec.categoryNameKo : rec.categoryNameEn;
  const altLabels = ALT_LABELS[lang] || ALT_LABELS.EN;

  return (
    <div className={`rv7-rec-card rv7-inj-card${isExpanded ? ' rv7-active' : ''}`}>
      {/* ═══ Top Badge Row: Rank + Evidence ═══ */}
      <div className="rv7-rec-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span className="rv7-neon-tag rv7-rose">#{rec.rank}</span>
        <EvidenceBadge level={rec.evidenceLevel} />
      </div>

      {/* ═══ Layer 1: Category ═══ */}
      <div style={{ padding: '10px 18px 0' }}>
        <div
          style={{
            fontSize: '17px', fontWeight: 700,
            color: '#FF6B9D',
            letterSpacing: '-0.3px', lineHeight: 1.3,
            wordWrap: 'break-word', overflowWrap: 'break-word', minHeight: '24px',
          }}
        >
          {categoryName || rec.categoryLabel}
        </div>
        {rec.categoryReason && (
          <div
            style={{
              fontSize: '12px', color: 'var(--text-2, #94a3b8)',
              lineHeight: 1.6, marginTop: '4px',
              wordWrap: 'break-word', overflowWrap: 'break-word',
            }}
          >
            {rec.categoryReason}
          </div>
        )}
      </div>

      {/* ═══ Layer 2: Representative Product ═══ */}
      <div className="rv7-rec-head" style={{ paddingTop: '10px' }}>
        <div className="rv7-rec-title-area" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#FF6B9D', opacity: 0.7, flexShrink: 0, marginTop: '4px' }}>&#9733;</span>
            <div className="rv7-rec-name" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>{rec.name}</div>
          </div>
          <div className="rv7-rec-sub">{rec.subtitle}</div>
        </div>
      </div>

      {/* 4 Patient Indicators */}
      <div style={{ padding: '0 18px' }}>
        <FourIndicatorGrid
          matchScore={rec.matchScore}
          downtimeDisplay={rec.downtimeDisplay}
          painLevel={rec.painLevel}
          priceTier={rec.priceTier}
          lang={lang}
        />
      </div>

      {/* Summary (always visible — Depth 0) */}
      <div
        className="rv7-rec-summary"
        dangerouslySetInnerHTML={{ __html: rec.summaryHtml }}
      />

      {/* ═══ Collapsible: Alternative Products ═══ */}
      {hasAlternatives && (
        <div style={{ padding: '0 18px 8px' }}>
          <button
            onClick={() => setAltExpanded(!altExpanded)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 600,
              color: 'var(--text-2, #94a3b8)', padding: '4px 0',
            }}
          >
            <span style={{
              transform: altExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s', display: 'inline-block',
            }}>
              &#9656;
            </span>
            {altExpanded ? altLabels.hide : altLabels.show}
            <span style={{ opacity: 0.5, marginLeft: '4px' }}>
              ({rec.alternativeProducts.length})
            </span>
          </button>
          {altExpanded && (
            <div
              style={{
                background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                marginTop: '6px', overflow: 'hidden',
              }}
            >
              {rec.alternativeProducts.slice(0, 3).map((alt) => (
                <AlternativeProductRow key={alt.name} product={alt} lang={lang} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expand button (detail) */}
      <button
        className={`rv7-rec-expand-btn${isExpanded ? ' open' : ''}`}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        {isExpanded ? t('action.collapse') : t('action.viewDetail')}
        <span className="rv7-arrow">&#9660;</span>
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

          {/* MOA inline + description */}
          {(rec.moaSummaryShort || rec.moaDescriptionHtml) && (
            <div className="rv7-moa-section">
              {rec.moaSummaryShort && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-hi)', marginBottom: '4px' }}>
                    {rec.moaSummaryTitle || 'Mechanism of Action'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: 1.7 }}>
                    {rec.moaSummaryShort}
                  </div>
                </>
              )}
              {rec.moaDescriptionHtml && (
                <div
                  className="rv7-moa-desc"
                  dangerouslySetInnerHTML={{ __html: rec.moaDescriptionHtml }}
                />
              )}
            </div>
          )}

          {/* Radar Chart (5-axis) */}
          <div style={{ marginTop: '16px' }}>
            <RadarChart5Axis
              scores={rec.scores}
              lang={lang}
              accentColor="var(--rose)"
            />
          </div>

          {/* Skin Layer 3D */}
          {targetLayers.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <SkinLayer3D
                targetLayers={targetLayers}
                deviceCategory={rec.category}
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
