// ═══════════════════════════════════════════════════════════════
//  Report v7 — EBDSection (Depth 0/1 container)
//  Wraps multiple EBDCards with:
//    - Mobile (<768px): Accordion (one open at a time)
//    - Desktop (≥768px): Independent toggle (multiple open)
//  Each card wrapped in ErrorBoundary.
//  Props ≤ 2: recommendations, lang
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import type { SurveyLang, EBDRecommendation } from '@/types/report-v7';
import { useReportI18n } from './ReportI18nContext';
import { ReportErrorBoundary } from './ReportErrorBoundary';
import { EBDCard } from './EBDCard';
import { useIsMobile } from './useMediaQuery';

interface EBDSectionProps {
  recommendations: EBDRecommendation[];
  lang: SurveyLang;
}

export function EBDSection({ recommendations, lang }: EBDSectionProps) {
  const { t } = useReportI18n();
  const isMobile = useIsMobile();

  // Mobile: single expanded ID; Desktop: set of expanded IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleToggle = useCallback(
    (deviceId: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(deviceId)) {
          next.delete(deviceId);
        } else {
          if (isMobile) {
            // Accordion: close all others
            next.clear();
          }
          next.add(deviceId);
        }
        return next;
      });
    },
    [isMobile],
  );

  if (recommendations.length === 0) return null;

  return (
    <section className="rv7-rec-section">
      <div className="rv7-sec-label">{t('section.ebd')}</div>
      <div className="rv7-rec-grid">
        {recommendations.map((rec) => (
          <ReportErrorBoundary
            key={rec.deviceId}
            componentName={`EBDCard-${rec.deviceId}`}
          >
            <EBDCard
              recommendation={rec}
              isExpanded={expandedIds.has(rec.deviceId)}
              onToggle={() => handleToggle(rec.deviceId)}
              lang={lang}
            />
          </ReportErrorBoundary>
        ))}
      </div>
    </section>
  );
}
