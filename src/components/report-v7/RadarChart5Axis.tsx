// ═══════════════════════════════════════════════════════════════
//  Report v7 — RadarChart5Axis (dynamic-axis implementation)
//
//  Supports both EBD axes (tightening/lifting/volume/brightening/texture)
//  and Injectable axes (hydration/repair/collagen/brightening/elasticity).
//
//  When `axisKeys` prop is omitted, the component auto-detects:
//    - scores contain "tightening" → EBD preset
//    - scores contain "hydration"  → Injectable preset
//    - fallback: first 5 keys from scores object
//
//  SVG pentagon with cyan/rose polygon, pain/downtime indicators.
//  Props: scores, painLevel?, downtimeLevel?, lang, axisKeys?, accentColor?
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import type { SurveyLang } from '@/types/report-v7';

// ─── Preset axis sets ────────────────────────────────────────
const EBD_AXES = ['tightening', 'lifting', 'volume', 'brightening', 'texture'] as const;
const INJ_AXES = ['hydration', 'repair', 'collagen', 'brightening', 'elasticity'] as const;

// ─── i18n labels for ALL known axis keys ─────────────────────
const ALL_AXIS_LABELS: Record<SurveyLang, Record<string, string>> = {
  KO: {
    tightening: '탄력', lifting: '리프팅', volume: '볼륨', brightening: '브라이트닝', texture: '텍스처',
    hydration: '수분', repair: '재생', collagen: '콜라겐', elasticity: '탄성',
  },
  EN: {
    tightening: 'Tightening', lifting: 'Lifting', volume: 'Volume', brightening: 'Brightening', texture: 'Texture',
    hydration: 'Hydration', repair: 'Repair', collagen: 'Collagen', elasticity: 'Elasticity',
  },
  JP: {
    tightening: '引き締め', lifting: 'リフティング', volume: 'ボリューム', brightening: 'ブライトニング', texture: 'テクスチャー',
    hydration: '水分', repair: '再生', collagen: 'コラーゲン', elasticity: '弾力',
  },
  'ZH-CN': {
    tightening: '紧致', lifting: '提升', volume: '丰盈', brightening: '亮白', texture: '质地',
    hydration: '水分', repair: '修复', collagen: '胶原蛋白', elasticity: '弹性',
  },
};

// ─── Pain/Downtime labels ─────────────────────────────────────
const PD_LABELS: Record<SurveyLang, { pain: string; downtime: string }> = {
  KO: { pain: '통증', downtime: '다운타임' },
  EN: { pain: 'Pain', downtime: 'Downtime' },
  JP: { pain: '痛み', downtime: 'ダウンタイム' },
  'ZH-CN': { pain: '疼痛', downtime: '恢复期' },
};

// ─── Non-visual keys to exclude from auto-detection ──────────
const META_KEYS = new Set(['evidence', 'synergy', 'longevity', 'roi', 'trend', 'popularity']);

// ─── SVG geometry ─────────────────────────────────────────────
const CX = 100;
const CY = 100;
const RADIUS = 75;
const RINGS = 5;

function axisPoint(axisIndex: number, value: number, total: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * axisIndex) / total - Math.PI / 2;
  const r = (value / 100) * RADIUS;
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

function buildPolygon(axes: string[], scores: Record<string, number>): string {
  const total = axes.length;
  return axes.map((axis, i) => {
    // Scores arrive on a 0-10 scale; axisPoint expects 0-100
    const raw = scores[axis] ?? 0;
    const val = Math.min(100, Math.max(0, raw * 10));
    const pt = axisPoint(i, val, total);
    return `${pt.x},${pt.y}`;
  }).join(' ');
}

function levelColor(level: number): string {
  if (level <= 1) return 'var(--green)';
  if (level <= 2) return 'var(--cyan)';
  if (level <= 3) return 'var(--amber)';
  if (level <= 4) return 'var(--orange)';
  return 'var(--red)';
}

// ─── Auto-detect axis preset from scores keys ────────────────
function detectAxes(scores: Record<string, number>): string[] {
  if ('tightening' in scores) return [...EBD_AXES];
  if ('hydration' in scores) return [...INJ_AXES];
  // Fallback: first 5 non-meta keys
  return Object.keys(scores).filter((k) => !META_KEYS.has(k)).slice(0, 5);
}

// ─── Props ────────────────────────────────────────────────────
interface RadarChart5AxisProps {
  scores: Record<string, number>;
  painLevel?: number;
  downtimeLevel?: number;
  lang: SurveyLang;
  /** Override axes — if omitted, auto-detected from scores keys */
  axisKeys?: string[];
  /** Polygon & dot accent color, default "var(--cyan)" */
  accentColor?: string;
}

// ─── Component ────────────────────────────────────────────────
export function RadarChart5Axis({
  scores,
  painLevel = 0,
  downtimeLevel = 0,
  lang,
  axisKeys,
  accentColor = 'var(--cyan)',
}: RadarChart5AxisProps) {
  const axes = useMemo(() => axisKeys ?? detectAxes(scores), [axisKeys, scores]);
  const total = axes.length;

  const labelMap = ALL_AXIS_LABELS[lang] ?? ALL_AXIS_LABELS.KO;
  const pdLabels = PD_LABELS[lang] ?? PD_LABELS.KO;

  // Grid rings (20%, 40%, 60%, 80%, 100%)
  const rings = useMemo(() => {
    return Array.from({ length: RINGS }, (_, ringIdx) => {
      const pct = ((ringIdx + 1) / RINGS) * 100;
      return axes.map((_, i) => {
        const pt = axisPoint(i, pct, total);
        return `${pt.x},${pt.y}`;
      }).join(' ');
    });
  }, [axes, total]);

  // Axis lines from center to edge
  const axisLines = useMemo(() => axes.map((_, i) => axisPoint(i, 100, total)), [axes, total]);

  // Label positions (slightly beyond the outer ring)
  const labelPositions = useMemo(() => axes.map((_, i) => axisPoint(i, 120, total)), [axes, total]);

  // Data polygon
  const polygon = useMemo(() => buildPolygon(axes, scores), [axes, scores]);

  // Score values for display (scale: 0-10 shown as-is)
  const scoreValues = axes.map((axis) => Math.round(scores[axis] ?? 0));

  // Accent CSS variable for fill
  const fillColor = accentColor === 'var(--cyan)'
    ? 'rgba(34,211,238,0.15)'
    : accentColor === 'var(--rose)'
      ? 'rgba(251,113,133,0.15)'
      : 'rgba(34,211,238,0.15)';

  return (
    <div className="rv7-radar-card rv7-glass">
      {/* SVG Radar */}
      <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: '240px', margin: '0 auto', display: 'block' }}>
        {/* Grid rings */}
        {rings.map((points, i) => (
          <polygon
            key={`ring-${i}`}
            points={points}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={i === RINGS - 1 ? 1 : 0.5}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((pt, i) => (
          <line
            key={`axis-${i}`}
            x1={CX}
            y1={CY}
            x2={pt.x}
            y2={pt.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={0.5}
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={polygon}
          fill={fillColor}
          stroke={accentColor}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {axes.map((axis, i) => {
          const raw = scores[axis] ?? 0;
          const val = Math.min(100, Math.max(0, raw * 10));
          const pt = axisPoint(i, val, total);
          return (
            <circle
              key={`dot-${axis}`}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill={accentColor}
              stroke="var(--bg)"
              strokeWidth={1}
            />
          );
        })}

        {/* Axis labels */}
        {labelPositions.map((pt, i) => (
          <text
            key={`label-${i}`}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(228,228,231,0.85)"
            fontSize={13}
            fontWeight={600}
          >
            {labelMap[axes[i]] ?? axes[i]}
          </text>
        ))}
      </svg>

      {/* Score numbers grid */}
      <div className="rv7-radar-scores">
        {axes.map((axis, i) => (
          <div key={axis} className="rv7-rs-item">
            <div className="rv7-rs-num">{scoreValues[i]}</div>
            <div className="rv7-rs-label">{labelMap[axis] ?? axis}</div>
          </div>
        ))}
      </div>

      {/* Pain / Downtime indicators */}
      {(painLevel > 0 || downtimeLevel > 0) && (
        <div className="rv7-radar-pd-indicators">
          {painLevel > 0 && (
            <div className="rv7-pd-indicator">
              <div className="rv7-pd-dot" style={{ background: levelColor(painLevel) }} />
              <span className="rv7-pd-label">{pdLabels.pain}</span>
              <span className="rv7-pd-score" style={{ color: levelColor(painLevel) }}>
                {painLevel}/5
              </span>
              <div className="rv7-pd-bar">
                <span
                  className="rv7-pd-fill"
                  style={{
                    width: `${(painLevel / 5) * 100}%`,
                    background: levelColor(painLevel),
                  }}
                />
              </div>
            </div>
          )}
          {downtimeLevel > 0 && (
            <div className="rv7-pd-indicator">
              <div className="rv7-pd-dot" style={{ background: levelColor(downtimeLevel) }} />
              <span className="rv7-pd-label">{pdLabels.downtime}</span>
              <span className="rv7-pd-score" style={{ color: levelColor(downtimeLevel) }}>
                {downtimeLevel}/5
              </span>
              <div className="rv7-pd-bar">
                <span
                  className="rv7-pd-fill"
                  style={{
                    width: `${(downtimeLevel / 5) * 100}%`,
                    background: levelColor(downtimeLevel),
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
