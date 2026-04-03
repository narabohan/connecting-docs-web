// ═══════════════════════════════════════════════════════════════
//  Report v7 — EBDCard (Category-First 2-Layer Layout)
//  Layer 1: Category info + protocol slot badge
//  Layer 2: Representative device with 4 patient indicators
//  Collapsible: Alternative devices + detail (radar, skin layer, etc.)
//  Props ≤ 4: recommendation, isExpanded, onToggle, lang
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { SurveyLang, EBDRecommendation, EBDAlternativeDevice } from '@/types/report-v7';
import { useReportI18n } from './ReportI18nContext';
import { RadarChart5Axis } from './RadarChart5Axis';
import { SkinLayer3D } from './SkinLayer3D';

// ─── Protocol Slot Badge ─────────────────────────────────────

const SLOT_CONFIG: Record<string, { label_ko: string; label_en: string; color: string; bg: string }> = {
  premium: { label_ko: 'Best Premium', label_en: 'Best Premium', color: '#FFD700', bg: 'rgba(255, 215, 0, 0.12)' },
  trending: { label_ko: 'Trending Choice', label_en: 'Trending Choice', color: '#00E5FF', bg: 'rgba(0, 229, 255, 0.12)' },
  value: { label_ko: 'Smart Value', label_en: 'Smart Value', color: '#69F0AE', bg: 'rgba(105, 240, 174, 0.12)' },
};

function SlotBadge({ slot, lang }: { slot: string | null; lang: SurveyLang }) {
  if (!slot) return null;
  const config = SLOT_CONFIG[slot];
  if (!config) return null;
  const label = lang === 'KO' ? config.label_ko : config.label_en;
  return (
    <span
      className="rv7-slot-badge"
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}33`,
      }}
    >
      {label}
    </span>
  );
}

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
    clampedScore >= 85 ? '#00E5FF' :
    clampedScore >= 70 ? '#69F0AE' :
    clampedScore >= 50 ? '#FFD740' : '#FF6E40';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div
        style={{
          flex: 1,
          height: '6px',
          borderRadius: '3px',
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clampedScore}%`,
            height: '100%',
            borderRadius: '3px',
            background: barColor,
            transition: 'width 0.4s ease',
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
            width: '8px',
            height: '8px',
            borderRadius: '50%',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: compact ? '3px 0' : '5px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: compact ? '10px' : '11px',
    color: 'var(--text-2, #94a3b8)',
    minWidth: compact ? '48px' : '56px',
  };

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        padding: compact ? '6px 10px' : '8px 14px',
        marginTop: compact ? '4px' : '10px',
      }}
    >
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

// ─── Alternative Device Row ──────────────────────────────────

function AlternativeDeviceRow({ device, lang }: { device: EBDAlternativeDevice; lang: SurveyLang }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-hi, #e2e8f0)' }}>
          {device.name}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-2, #94a3b8)', marginBottom: '6px', lineHeight: 1.5 }}>
        {device.oneLiner}
      </div>
      <FourIndicatorGrid
        matchScore={device.matchScore}
        downtimeDisplay={device.downtimeDisplay}
        painLevel={device.painLevel}
        priceTier={device.priceTier}
        lang={lang}
        compact
      />
    </div>
  );
}

// ─── Practical info grid ──────────────────────────────────────

function PracticalGrid({ rec, lang }: { rec: EBDRecommendation; lang: SurveyLang }) {
  const { t } = useReportI18n();
  const items = [
    { label: t('practical.sessions'), value: rec.practical.sessions },
    { label: t('practical.interval'), value: rec.practical.interval },
    { label: t('practical.duration'), value: rec.practical.duration },
    { label: t('practical.onset'), value: rec.practical.onset },
    { label: t('practical.maintain'), value: rec.practical.maintain },
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

// ─── i18n labels ──────────────────────────────────────────────

const ALT_LABELS: Record<SurveyLang, { show: string; hide: string }> = {
  KO: { show: '다른 옵션 보기', hide: '접기' },
  EN: { show: 'Other options', hide: 'Collapse' },
  JP: { show: '他のオプション', hide: '閉じる' },
  'ZH-CN': { show: '其他选项', hide: '收起' },
};

// ─── Component ────────────────────────────────────────────────

export function EBDCard({ recommendation: rec, isExpanded, onToggle, lang }: EBDCardProps) {
  const { t } = useReportI18n();
  const [altExpanded, setAltExpanded] = useState(false);
  const targetLayers = rec.skinLayer ? rec.skinLayer.split(',').map((s) => s.trim()) : [];
  const hasAlternatives = rec.alternativeDevices.length > 0;
  const categoryName = lang === 'KO' ? rec.categoryNameKo : rec.categoryNameEn;
  const altLabels = ALT_LABELS[lang] || ALT_LABELS.EN;

  return (
    <div className={`rv7-rec-card rv7-ebd-card${isExpanded ? ' rv7-active' : ''}`}>
      {/* ═══ Top Badge Row: Slot + Rank + Evidence ═══ */}
      <div className="rv7-rec-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <SlotBadge slot={rec.slot} lang={lang} />
        <span className="rv7-neon-tag rv7-cyan">#{rec.rank}</span>
        <EvidenceBadge level={rec.evidenceLevel} />
      </div>

      {/* ═══ Layer 1: Category ═══ */}
      <div style={{ padding: '6px 18px 0' }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#00E5FF',
            letterSpacing: '-0.3px',
            lineHeight: 1.4,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {categoryName || rec.moaCategoryLabel}
        </div>
        {rec.categoryReason && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-2, #94a3b8)',
              lineHeight: 1.6,
              marginTop: '4px',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {rec.categoryReason}
          </div>
        )}
      </div>

      {/* ═══ Layer 2: Representative Device ═══ */}
      <div className="rv7-rec-head">
        <div className="rv7-rec-title-area" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#00E5FF', opacity: 0.7, flexShrink: 0 }}>&#9733;</span>
            <div className="rv7-rec-name" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>{rec.deviceName}</div>
          </div>
          <div className="rv7-rec-sub">{rec.subtitle}</div>
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

      {/* Target tags */}
      {rec.targetTags.length > 0 && (
        <div className="rv7-rec-targets" style={{ padding: '0 18px 8px' }}>
          {rec.targetTags.map((tag) => (
            <span key={tag} className="rv7-rec-target">{tag}</span>
          ))}
        </div>
      )}

      {/* ═══ Collapsible: Alternative Devices ═══ */}
      {hasAlternatives && (
        <div style={{ padding: '0 18px 8px' }}>
          <button
            onClick={() => setAltExpanded(!altExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-2, #94a3b8)',
              padding: '4px 0',
            }}
          >
            <span style={{
              transform: altExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}>
              &#9656;
            </span>
            {altExpanded ? altLabels.hide : altLabels.show}
            <span style={{ opacity: 0.5, marginLeft: '4px' }}>
              ({rec.alternativeDevices.length})
            </span>
          </button>
          {altExpanded && (
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                marginTop: '6px',
                overflow: 'hidden',
              }}
            >
              {rec.alternativeDevices.slice(0, 3).map((alt) => (
                <AlternativeDeviceRow key={alt.name} device={alt} lang={lang} />
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
            <div className="rv7-why-fit-title">{rec.moaCategoryLabel}</div>
            <div
              className="rv7-why-fit-content"
              dangerouslySetInnerHTML={{ __html: rec.whyFitHtml }}
            />
          </div>

          {/* MOA inline summary + description */}
          {(rec.moaSummaryShort || rec.moaDescriptionHtml) && (
            <div className="rv7-moa-section">
              {rec.moaSummaryShort && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-hi)', marginBottom: '4px' }}>
                    {rec.moaSummaryTitle || t('label.moa')}
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
          <PracticalGrid rec={rec} lang={lang} />
        </div>
      </div>
    </div>
  );
}
