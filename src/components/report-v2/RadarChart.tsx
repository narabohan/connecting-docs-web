// ═══════════════════════════════════════════════════════════════
//  RadarChart — Device Score Radar (recharts)
//  Shows up to 5 dimensions for each EBD device recommendation
//  Used in report-v2 Patient Tab
// ═══════════════════════════════════════════════════════════════

import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SurveyLang } from '@/types/survey-v2';

interface RadarChartProps {
  /** Record<string, number> from OpusDeviceRecommendation.scores */
  scores: Record<string, number>;
  /** Device name for the chart title */
  deviceName: string;
  lang: SurveyLang;
  /** Optional: Compare another device's scores (overlay) */
  compareScores?: Record<string, number>;
  compareName?: string;
}

/** Localized dimension labels */
const DIMENSION_LABELS: Record<string, Record<SurveyLang, string>> = {
  efficacy:       { KO: '효과', EN: 'Efficacy', JP: '効果', 'ZH-CN': '效果' },
  safety:         { KO: '안전성', EN: 'Safety', JP: '安全性', 'ZH-CN': '安全性' },
  downtime:       { KO: '다운타임', EN: 'Downtime', JP: 'ダウンタイム', 'ZH-CN': '恢复期' },
  pain:           { KO: '통증', EN: 'Pain', JP: '痛み', 'ZH-CN': '疼痛' },
  cost_efficiency: { KO: '가성비', EN: 'Value', JP: 'コスパ', 'ZH-CN': '性价比' },
  maintenance:    { KO: '유지력', EN: 'Duration', JP: '持続', 'ZH-CN': '持久性' },
  evidence:       { KO: '근거', EN: 'Evidence', JP: 'エビデンス', 'ZH-CN': '循证' },
  comfort:        { KO: '편안함', EN: 'Comfort', JP: '快適さ', 'ZH-CN': '舒适度' },
};

function getDimensionLabel(key: string, lang: SurveyLang): string {
  return DIMENSION_LABELS[key]?.[lang] || DIMENSION_LABELS[key]?.EN || key;
}

export default function RadarChart({
  scores,
  deviceName,
  lang,
  compareScores,
  compareName,
}: RadarChartProps) {
  // Transform scores into recharts data format
  const data = Object.entries(scores).map(([key, value]) => ({
    dimension: getDimensionLabel(key, lang),
    value: value,
    fullMark: 10,
    ...(compareScores ? { compare: compareScores[key] ?? 0 } : {}),
  }));

  if (data.length === 0) return null;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <RechartsRadar cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            tickCount={6}
          />
          <Radar
            name={deviceName}
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          {compareScores && (
            <Radar
              name={compareName || 'Compare'}
              dataKey="compare"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
