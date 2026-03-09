// ═══════════════════════════════════════════════════════════════
//  SkinLayerDiagram — Visual skin cross-section showing device target depth
//  Renders a layered skin diagram with highlighted treatment zones
//  Used in report-v2 Patient Tab (EBD device detail expansion)
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang } from '@/types/survey-v2';

interface SkinLayerDiagramProps {
  /** Which skin layer(s) this device targets — matches OpusDeviceRecommendation.skin_layer */
  targetLayers: string[];
  lang: SurveyLang;
  /** Device names to display alongside markers */
  deviceNames?: string[];
}

interface LayerDef {
  id: string;
  label: Record<SurveyLang, string>;
  color: string;
  activeColor: string;
  depth: string;
  height: number; // px
}

const LAYERS: LayerDef[] = [
  {
    id: 'epidermis',
    label: { KO: '표피', EN: 'Epidermis', JP: '表皮', 'ZH-CN': '表皮' },
    color: '#fef3c7',
    activeColor: '#fbbf24',
    depth: '0.05–0.1mm',
    height: 28,
  },
  {
    id: 'upper_dermis',
    label: { KO: '진피 상층', EN: 'Upper Dermis', JP: '真皮上層', 'ZH-CN': '真皮上层' },
    color: '#fed7aa',
    activeColor: '#f97316',
    depth: '0.1–0.5mm',
    height: 36,
  },
  {
    id: 'deep_dermis',
    label: { KO: '진피 심층', EN: 'Deep Dermis', JP: '真皮深層', 'ZH-CN': '真皮深层' },
    color: '#fecaca',
    activeColor: '#ef4444',
    depth: '0.5–2.0mm',
    height: 44,
  },
  {
    id: 'smas',
    label: { KO: 'SMAS/지방', EN: 'SMAS / Fat', JP: 'SMAS/脂肪', 'ZH-CN': 'SMAS/脂肪' },
    color: '#e9d5ff',
    activeColor: '#a855f7',
    depth: '2.0–4.5mm',
    height: 36,
  },
];

/** Map common skin_layer values to our layer IDs */
function matchLayer(skinLayer: string): string[] {
  const lower = skinLayer.toLowerCase();
  const matched: string[] = [];

  if (lower.includes('epiderm') || lower.includes('표피') || lower.includes('表皮'))
    matched.push('epidermis');
  if (lower.includes('upper') || lower.includes('상층') || lower.includes('上層') || lower.includes('papillary'))
    matched.push('upper_dermis');
  if (lower.includes('deep') || lower.includes('심층') || lower.includes('深層') || lower.includes('reticular'))
    matched.push('deep_dermis');
  if (lower.includes('smas') || lower.includes('fat') || lower.includes('지방') || lower.includes('脂肪') || lower.includes('subcutan'))
    matched.push('smas');
  // Fallback: if contains "dermis" but didn't match upper/deep specifically
  if (lower.includes('dermis') && matched.length === 0) {
    matched.push('upper_dermis', 'deep_dermis');
  }

  return matched.length > 0 ? matched : ['upper_dermis']; // default
}

export default function SkinLayerDiagram({ targetLayers, lang, deviceNames }: SkinLayerDiagramProps) {
  const activeLayers = new Set<string>();
  targetLayers.forEach((tl) => matchLayer(tl).forEach((id) => activeLayers.add(id)));

  return (
    <div className="flex items-stretch gap-3">
      {/* Diagram */}
      <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 w-48">
        {LAYERS.map((layer) => {
          const isActive = activeLayers.has(layer.id);
          return (
            <div
              key={layer.id}
              className="relative flex items-center justify-between px-3 transition-all duration-300"
              style={{
                height: layer.height,
                backgroundColor: isActive ? layer.activeColor : layer.color,
                opacity: isActive ? 1 : 0.5,
              }}
            >
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? '#fff' : '#78716c' }}
              >
                {layer.label[lang] || layer.label.EN}
              </span>
              <span
                className="text-[9px]"
                style={{ color: isActive ? '#fff' : '#a8a29e' }}
              >
                {layer.depth}
              </span>
              {isActive && (
                <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full"
                  style={{ borderColor: layer.activeColor }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {deviceNames && deviceNames.length > 0 && (
        <div className="flex flex-col justify-center gap-1">
          {deviceNames.map((name, i) => (
            <span key={i} className="text-[10px] text-slate-500">
              {name}
            </span>
          ))}
          <span className="text-[9px] text-slate-400 mt-1">
            {lang === 'KO' ? '색상 = 시술 타겟 레이어' : 'Colored = target layers'}
          </span>
        </div>
      )}
    </div>
  );
}
