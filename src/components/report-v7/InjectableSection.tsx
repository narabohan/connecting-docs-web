// ═══════════════════════════════════════════════════════════════
//  Report v7 — InjectableSection (Depth 0/1 container)
//  Same pattern as EBDSection but with rose theme.
//  Props ≤ 2: recommendations, lang
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import type { SurveyLang, InjectableRecommendation } from '@/types/report-v7';
import { useReportI18n } from './ReportI18nContext';
import { ReportErrorBoundary } from './ReportErrorBoundary';
import { InjectableCard } from './InjectableCard';
import { useIsMobile } from './useMediaQuery';

interface InjectableSectionProps {
  recommendations: InjectableRecommendation[];
  lang: SurveyLang;
}

export function InjectableSection({ recommendations, lang }: InjectableSectionProps) {
  const { t } = useReportI18n();
  const isMobile = useIsMobile();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleToggle = useCallback(
    (injectableId: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(injectableId)) {
          next.delete(injectableId);
        } else {
          if (isMobile) {
            next.clear();
          }
          next.add(injectableId);
        }
        return next;
      });
    },
    [isMobile],
  );

  if (recommendations.length === 0) return null;

  return (
    <section className="rv7-rec-section">
      <div className="rv7-sec-label rv7-rose">{t('section.injectable')}</div>
      <div className="rv7-rec-grid">
        {recommendations.map((rec) => (
          <ReportErrorBoundary
            key={rec.injectableId}
            componentName={`InjectableCard-${rec.injectableId}`}
          >
            <InjectableCard
              recommendation={rec}
              isExpanded={expandedIds.has(rec.injectableId)}
              onToggle={() => handleToggle(rec.injectableId)}
              lang={lang}
            />
          </ReportErrorBoundary>
        ))}
      </div>
    </section>
  );
}
