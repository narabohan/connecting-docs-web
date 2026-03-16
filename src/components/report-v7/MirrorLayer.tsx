// ═══════════════════════════════════════════════════════════════
//  Report v7 — MirrorLayer (Depth 0)
//  서사 1단계: "당신을 이해합니다" — 감정 공감
//  Props ≤ 2: mirror, lang
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang, MirrorLayer as MirrorLayerType } from '@/types/report-v7';

interface MirrorLayerProps {
  mirror: MirrorLayerType;
  lang: SurveyLang;
}

export function MirrorLayerView({ mirror }: MirrorLayerProps) {
  // Don't render if no content
  if (!mirror.headline && !mirror.empathyParagraphs) {
    return null;
  }

  return (
    <div className="rv7-mirror-layer">
      {mirror.headline && (
        <div className="rv7-mirror-headline">{mirror.headline}</div>
      )}
      {mirror.empathyParagraphs && (
        <div className="rv7-mirror-empathy">{mirror.empathyParagraphs}</div>
      )}
      {mirror.transition && (
        <div className="rv7-mirror-transition">{mirror.transition}</div>
      )}
    </div>
  );
}
