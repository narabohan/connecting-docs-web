// ═══════════════════════════════════════════════════════════════
//  HomecareSection — Depth 1
//  Morning / Evening / Weekly / Avoid homecare guide cards.
//  Props ≤ 7 | CSS rv7- prefix | NO any/unknown
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang, HomecareGuide } from '@/types/report-v7';
import { useReportI18n } from './ReportI18nContext';

// ─── Card config ──────────────────────────────────────────────
interface CardConfig {
  key: keyof HomecareGuide;
  icon: string;
  label: Record<SurveyLang, string>;
}

const CARDS: CardConfig[] = [
  {
    key: 'morning',
    icon: '🌅',
    label: { KO: '아침 루틴', EN: 'Morning', JP: '朝のルーティン', 'ZH-CN': '早间护理' },
  },
  {
    key: 'evening',
    icon: '🌙',
    label: { KO: '저녁 루틴', EN: 'Evening', JP: '夜のルーティン', 'ZH-CN': '晚间护理' },
  },
  {
    key: 'weekly',
    icon: '📆',
    label: { KO: '주간 루틴', EN: 'Weekly', JP: '週間ルーティン', 'ZH-CN': '每周护理' },
  },
  {
    key: 'avoid',
    icon: '🚫',
    label: { KO: '금지 사항', EN: 'Avoid', JP: '禁止事項', 'ZH-CN': '注意事项' },
  },
];

// ─── Props ────────────────────────────────────────────────────
interface HomecareSectionProps {
  homecare: HomecareGuide;
  lang: SurveyLang;
}

// ─── Component ────────────────────────────────────────────────
export function HomecareSection({ homecare, lang }: HomecareSectionProps) {
  const { t } = useReportI18n();

  const hasContent = CARDS.some((c) => homecare[c.key].length > 0);
  if (!hasContent) return null;

  return (
    <div className="rv7-glass" style={{ padding: '16px 20px', marginBottom: '20px' }}>
      <div style={{
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        color: 'var(--text-3)',
        marginBottom: '14px',
      }}>
        {t('section.homecare')}
      </div>

      <div className="rv7-homecare-grid">
        {CARDS.map((card) => {
          const items = homecare[card.key];
          if (items.length === 0) return null;

          return (
            <div key={card.key} className="rv7-hc-card">
              <div className="rv7-hc-icon">{card.icon}</div>
              <div className="rv7-hc-title">{card.label[lang]}</div>
              <div className="rv7-hc-desc">
                {items.map((item, idx) => (
                  <span key={idx}>
                    {item}
                    {idx < items.length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
