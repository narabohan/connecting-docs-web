// ═══════════════════════════════════════════════════════════════
//  Report v7 — ConfidenceLayer (Depth 0)
//  서사 2단계: "의학적으로 이런 상태입니다" — 임상 확신
//  Props ≤ 2: confidence, lang
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang, ConfidenceLayer as ConfidenceLayerType } from '@/types/report-v7';

interface ConfidenceLayerProps {
  confidence: ConfidenceLayerType;
  lang: SurveyLang;
}

export function ConfidenceLayerView({ confidence }: ConfidenceLayerProps) {
  if (!confidence.reasonWhy && !confidence.socialProof) {
    return null;
  }

  return (
    <div className="rv7-confidence-layer">
      {confidence.reasonWhy && (
        <div className="rv7-confidence-reason">{confidence.reasonWhy}</div>
      )}
      {confidence.socialProof && (
        <div className="rv7-confidence-proof">{confidence.socialProof}</div>
      )}
      {confidence.commitment && (
        <div className="rv7-confidence-commit">{confidence.commitment}</div>
      )}
    </div>
  );
}
