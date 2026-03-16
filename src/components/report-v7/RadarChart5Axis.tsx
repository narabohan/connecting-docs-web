// ═══════════════════════════════════════════════════════════════
//  Report v7 — RadarChart5Axis (NEW implementation)
//
//  5 axes: Tightening / Lifting / Volume / Brightening / Texture
//  SVG pentagon with optional 2-polygon overlay (EBD cyan + Injectable rose)
//  Pain/Downtime 5-level indicators included.
//
//  ⚠️  NOT the existing 8-dimension RadarChart.tsx — completely new.
//  Props ≤ 4: scores, painLevel, downtimeLevel, lang
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import type { SurveyLang } from '@/types/report-v7';

// ─── 5-axis definitions (matching report-v7-premium.html) ─────
const AXES = ['tightening', 'lifting', 'volume', 'brightening', 'texture'] as const;
type AxisKey = (typeof AXES)[number];

const AXIS_LABELS: Record<SurveyLang, Record<AxisKey, string>> = {
  KO: { tightening: '탄력', lifting: '리프팅', volume: '볼륨', brightening: '브라이트닝', texture: '텍스처' },
  EN: { tightening: 'Tightening', lifting: 'Lifting', volume: 'Volume', brightening: 'Brightening', texture: 'Texture' },
  JP: { tightening: '引き締め', lifting: 'リフティング', volume: 'ボリューム', brightening: 'ブライトニング', texture: 'テクスチャー' },
  'ZH-CN': { tightening: '紧致', lifting: '提升', volume: '丰盈', brightening: '亮白', texture: '质地' },
};

// ─── Pain/Downtime labels ─────────────────────────────────────
const PD_LABELS: Record<SurveyLang, { pain: string; downtime: string }> = {
  KO: { pain: '통증', downtime: '다운타임' },
  EN: { pain: 'Pain', downtime: 'Downtime' },
  JP: { pain: '痛み', downtime: 'ダウンタイム' },
  'ZH-CN': { pain: '疼痛', downtime: '恢复期' },
};

// ─── SVG geometry ─────────────────────────────────────────────
const CX = 100;
const CY = 100;
const RADIUS = 75;
const RINGS = 5; // concentric rings

/** Convert axis index + value (0-100) to SVG x,y coordinate */
function axisPoint(axisIndex: number, value: number, total: number = 5): { x: number; y: number } {
  const angle = (Math.PI * 2 * axisIndex) / total - Math.PI / 2; // start from top
  const r = (value / 100) * RADIUS;
  return {
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  };
}

/** Build polygon points string from axis scores */
function buildPolygon(scores: Record<string, number>): string {
  return AXES.map((axis, i) => {
    const val = Math.min(100, Math.max(0, scores[axis] ?? 0));
    const pt = axisPoint(i, val);
    return `${pt.x},${pt.y}`;
  }).join(' ');
}

// ─── Color for pain/downtime level ────────────────────────────
function levelColor(level: number): string {
  if (level <= 1) return 'var(--green)';
  if (level <= 2) return 'var(--cyan)';
  if (level <= 3) return 'var(--amber)';
  if (level <= 4) return 'var(--orange)';
  return 'var(--red)';
}

// ─── Props ────────────────────────────────────────────────────
interface RadarChart5AxisProps {
  scores: Record<string, number>;
  painLevel: number;
  downtimeLevel: number;
  lang: SurveyLang;
}

// ─── Component ────────────────────────────────────────────────
export function RadarChart5Axis({ scores, painLevel, downtimeLevel, lang }: RadarChart5AxisProps) {
  const labels = AXIS_LABELS[lang] ?? AXIS_LABELS.KO;
  const pdLabels = PD_LABELS[lang] ?? PD_LABELS.KO;

  // Grid rings (20%, 40%, 60%, 80%, 100%)
  const rings = useMemo(() => {
    return Array.from({ length: RINGS }, (_, ringIdx) => {
      const pct = ((ringIdx + 1) / RINGS) * 100;
      const points = AXES.map((_, i) => {
        const pt = axisPoint(i, pct);
        return `${pt.x},${pt.y}`;
      }).join(' ');
      return points;
    });
  }, []);

  // Axis lines from center to edge
  const axisLines = useMemo(() => {
    return AXES.map((_, i) => axisPoint(i, 100));
  }, []);

  // Label positions (slightly beyond the outer ring)
  const labelPositions = useMemo(() => {
    return AXES.map((_, i) => axisPoint(i, 120));
  }, []);

  // Data polygon
  const polygon = useMemo(() => buildPolygon(scores), [scores]);

  // Score values for display
  const scoreValues = AXES.map((axis) => Math.round(scores[axis] ?? 0));

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
            stroke="rgba(255,255,255,0.06)"
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

        {/* Data polygon — cyan fill */}
        <polygon
          points={polygon}
          fill="rgba(34,211,238,0.15)"
          stroke="var(--cyan)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {AXES.map((axis, i) => {
          const val = Math.min(100, Math.max(0, scores[axis] ?? 0));
          const pt = axisPoint(i, val);
          return (
            <circle
              key={`dot-${axis}`}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill="var(--cyan)"
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
            fill="var(--text-3)"
            fontSize={7}
            fontWeight={500}
          >
            {labels[AXES[i]]}
          </text>
        ))}
      </svg>

      {/* Score numbers grid (5 columns) */}
      <div className="rv7-radar-scores">
        {AXES.map((axis, i) => (
          <div key={axis} className="rv7-rs-item">
            <div className="rv7-rs-num">{scoreValues[i]}</div>
            <div className="rv7-rs-label">{labels[axis]}</div>
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
