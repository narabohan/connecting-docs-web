// ═══════════════════════════════════════════════════════════════
//  Report v7 — SkinLayer3D (NEW implementation)
//
//  6 layers: Epidermis, Upper Dermis, Deep Dermis,
//            Subcutaneous Fat, SMAS, Muscle
//  3D perspective SVG with energy beam animation.
//
//  ⚠️  NOT the existing 4-layer SkinLayerDiagram.tsx — completely new.
//  Props ≤ 3: targetLayers, deviceCategory, lang
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import type { SurveyLang } from '@/types/report-v7';

// ─── 6 layer definitions (top to bottom) ──────────────────────
interface LayerDef {
  id: string;
  depth: number;      // 0-5 (top to bottom)
  color: string;       // fill color
  colorActive: string; // fill when targeted
  height: number;      // relative height in SVG units
}

const LAYERS: LayerDef[] = [
  { id: 'epidermis',         depth: 0, color: '#2a1f1a', colorActive: '#4a3020', height: 22 },
  { id: 'upper_dermis',      depth: 1, color: '#3d2216', colorActive: '#6b3a22', height: 35 },
  { id: 'deep_dermis',       depth: 2, color: '#4d1f1f', colorActive: '#7a2e2e', height: 45 },
  { id: 'subcutaneous_fat',  depth: 3, color: '#4a3a10', colorActive: '#7a6218', height: 40 },
  { id: 'smas',              depth: 4, color: '#3a1a2a', colorActive: '#6a2848', height: 28 },
  { id: 'muscle',            depth: 5, color: '#2a1020', colorActive: '#4a1a38', height: 30 },
];

// ─── Layer labels per language ────────────────────────────────
const LAYER_LABELS: Record<SurveyLang, Record<string, string>> = {
  KO: {
    epidermis: '표피', upper_dermis: '상부 진피', deep_dermis: '심부 진피',
    subcutaneous_fat: '피하지방', smas: 'SMAS', muscle: '근육',
  },
  EN: {
    epidermis: 'Epidermis', upper_dermis: 'Upper Dermis', deep_dermis: 'Deep Dermis',
    subcutaneous_fat: 'Subcutaneous Fat', smas: 'SMAS', muscle: 'Muscle',
  },
  JP: {
    epidermis: '表皮', upper_dermis: '上部真皮', deep_dermis: '深部真皮',
    subcutaneous_fat: '皮下脂肪', smas: 'SMAS', muscle: '筋肉',
  },
  'ZH-CN': {
    epidermis: '表皮', upper_dermis: '上层真皮', deep_dermis: '深层真皮',
    subcutaneous_fat: '皮下脂肪', smas: 'SMAS', muscle: '肌肉',
  },
};

// ─── Device category → beam color ─────────────────────────────
const BEAM_COLORS: Record<string, { stroke: string; glow: string }> = {
  hifu:   { stroke: '#38bdf8', glow: 'rgba(56,189,248,0.3)' },
  laser:  { stroke: '#a78bfa', glow: 'rgba(167,139,250,0.3)' },
  rf:     { stroke: '#f87171', glow: 'rgba(248,113,113,0.3)' },
  mnrf:   { stroke: '#fb923c', glow: 'rgba(251,146,60,0.3)' },
  pdrn:   { stroke: '#fb7185', glow: 'rgba(251,113,133,0.3)' },
  pdlla:  { stroke: '#4ade80', glow: 'rgba(74,222,128,0.3)' },
  plla:   { stroke: '#fbbf24', glow: 'rgba(251,191,36,0.3)' },
};

const DEFAULT_BEAM = { stroke: '#22d3ee', glow: 'rgba(34,211,238,0.3)' };

// ─── SVG geometry ─────────────────────────────────────────────
const SVG_W = 340;
const SVG_H = 230;
const LEFT_MARGIN = 110;    // space for labels (wider for larger text)
const LAYER_W = 180;        // width of layer blocks
const TOP_Y = 10;
const SKEW_X = 12;          // 3D perspective offset

// ─── Normalize layer IDs for matching ─────────────────────────
//  AI-generated skin_layer values are often abbreviated:
//    "deep" → deep_dermis, "upd"/"upper" → upper_dermis,
//    "subq"/"fat" → subcutaneous_fat, etc.
const LAYER_ALIASES: Record<string, string> = {
  epi: 'epidermis',
  epiderm: 'epidermis',
  upper: 'upper_dermis',
  upd: 'upper_dermis',
  upper_derm: 'upper_dermis',
  deep: 'deep_dermis',
  dd: 'deep_dermis',
  deep_derm: 'deep_dermis',
  dermis: 'deep_dermis',
  subq: 'subcutaneous_fat',
  fat: 'subcutaneous_fat',
  subcutaneous: 'subcutaneous_fat',
  smas: 'smas',
  muscle: 'muscle',
};

function normalizeLayerId(s: string): string {
  const key = s.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
  return LAYER_ALIASES[key] ?? key;
}

// ─── Props ────────────────────────────────────────────────────
interface SkinLayer3DProps {
  targetLayers: string[];
  deviceCategory: string;
  lang: SurveyLang;
}

// ─── Component ────────────────────────────────────────────────
export function SkinLayer3D({ targetLayers, deviceCategory, lang }: SkinLayer3DProps) {
  const labels = LAYER_LABELS[lang] ?? LAYER_LABELS.KO;
  const beam = BEAM_COLORS[deviceCategory.toLowerCase()] ?? DEFAULT_BEAM;

  const normalizedTargets = useMemo(
    () => new Set(targetLayers.map(normalizeLayerId)),
    [targetLayers],
  );

  // Compute layer Y positions
  const layerGeometry = useMemo(() => {
    let y = TOP_Y;
    return LAYERS.map((layer) => {
      const result = { ...layer, y, isTarget: normalizedTargets.has(layer.id) };
      y += layer.height + 2; // 2px gap between layers
      return result;
    });
  }, [normalizedTargets]);

  // Find target layer range for energy beam
  const targetIndices = layerGeometry
    .map((l, i) => (l.isTarget ? i : -1))
    .filter((i) => i >= 0);

  const beamStartY = targetIndices.length > 0
    ? layerGeometry[targetIndices[0]].y
    : TOP_Y;
  const beamEndY = targetIndices.length > 0
    ? layerGeometry[targetIndices[targetIndices.length - 1]].y +
      layerGeometry[targetIndices[targetIndices.length - 1]].height
    : TOP_Y + 40;

  const beamX = LEFT_MARGIN + LAYER_W / 2;

  return (
    <div className="rv7-skin-3d-container">
      <div className="rv7-skin-3d-inner">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ width: '100%', height: '100%' }}
          aria-label="Skin layer diagram"
        >
          <defs>
            {/* Energy beam glow filter */}
            <filter id="rv7-beam-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Beam animation gradient */}
            <linearGradient id="rv7-beam-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={beam.stroke} stopOpacity={0} />
              <stop offset="30%" stopColor={beam.stroke} stopOpacity={0.8}>
                <animate attributeName="offset" values="0;0.7;0" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="60%" stopColor={beam.stroke} stopOpacity={0.4}>
                <animate attributeName="offset" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor={beam.stroke} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* ── Layers (3D parallelogram perspective) ── */}
          {layerGeometry.map((layer) => {
            const x = LEFT_MARGIN;
            const y = layer.y;
            const h = layer.height;
            const fill = layer.isTarget ? layer.colorActive : layer.color;
            const opacity = layer.isTarget ? 1 : 0.6;

            // 3D parallelogram points
            const points = [
              `${x},${y + h}`,                        // bottom-left
              `${x + LAYER_W},${y + h}`,               // bottom-right
              `${x + LAYER_W + SKEW_X},${y}`,          // top-right (skewed)
              `${x + SKEW_X},${y}`,                     // top-left (skewed)
            ].join(' ');

            return (
              <g key={layer.id} opacity={opacity}>
                {/* Layer body */}
                <polygon
                  points={points}
                  fill={fill}
                  stroke={layer.isTarget ? beam.stroke : 'rgba(255,255,255,0.08)'}
                  strokeWidth={layer.isTarget ? 1.5 : 0.5}
                />

                {/* Target glow */}
                {layer.isTarget && (
                  <polygon
                    points={points}
                    fill="none"
                    stroke={beam.glow}
                    strokeWidth={3}
                    filter="url(#rv7-beam-glow)"
                    opacity={0.5}
                  />
                )}

                {/* Layer label */}
                <text
                  x={LEFT_MARGIN - 6}
                  y={y + h / 2 + 3}
                  textAnchor="end"
                  fill={layer.isTarget ? beam.stroke : 'rgba(228,228,231,0.7)'}
                  fontSize={11}
                  fontWeight={layer.isTarget ? 700 : 500}
                >
                  {labels[layer.id] ?? layer.id}
                </text>

                {/* Depth indicator */}
                <text
                  x={LEFT_MARGIN + LAYER_W + SKEW_X + 8}
                  y={y + h / 2 + 3}
                  textAnchor="start"
                  fill="rgba(228,228,231,0.55)"
                  fontSize={9}
                >
                  {layer.depth === 0 ? '0.1mm' :
                   layer.depth === 1 ? '0.3mm' :
                   layer.depth === 2 ? '1.5mm' :
                   layer.depth === 3 ? '3.0mm' :
                   layer.depth === 4 ? '4.5mm' : '6.0mm'}
                </text>
              </g>
            );
          })}

          {/* ── Energy Beam (animated) ── */}
          {targetIndices.length > 0 && (
            <g>
              {/* Beam line */}
              <line
                x1={beamX}
                y1={beamStartY - 8}
                x2={beamX}
                y2={beamEndY + 4}
                stroke="url(#rv7-beam-grad)"
                strokeWidth={6}
                strokeLinecap="round"
                filter="url(#rv7-beam-glow)"
              />

              {/* Beam core (bright center) */}
              <line
                x1={beamX}
                y1={beamStartY - 4}
                x2={beamX}
                y2={beamEndY}
                stroke={beam.stroke}
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={0.8}
              >
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
              </line>

              {/* Entry point indicator */}
              <circle
                cx={beamX}
                cy={beamStartY - 8}
                r={3}
                fill={beam.stroke}
                opacity={0.9}
              >
                <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* Scatter particles at target depth */}
              {targetIndices.map((idx) => {
                const ly = layerGeometry[idx];
                const midY = ly.y + ly.height / 2;
                return (
                  <g key={`scatter-${idx}`}>
                    <circle cx={beamX - 12} cy={midY - 3} r={1.5} fill={beam.stroke} opacity={0.4}>
                      <animate attributeName="cx" values={`${beamX - 8};${beamX - 20};${beamX - 8}`} dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={beamX + 10} cy={midY + 2} r={1} fill={beam.stroke} opacity={0.3}>
                      <animate attributeName="cx" values={`${beamX + 8};${beamX + 18};${beamX + 8}`} dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  </g>
                );
              })}
            </g>
          )}

          {/* Surface line */}
          <line
            x1={LEFT_MARGIN + SKEW_X - 5}
            y1={TOP_Y}
            x2={LEFT_MARGIN + LAYER_W + SKEW_X + 5}
            y2={TOP_Y}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
          <text
            x={LEFT_MARGIN + LAYER_W + SKEW_X + 8}
            y={TOP_Y + 3}
            fill="rgba(228,228,231,0.5)"
            fontSize={9}
          >
            Surface
          </text>
        </svg>
      </div>
    </div>
  );
}
