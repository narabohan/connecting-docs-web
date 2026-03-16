// ═══════════════════════════════════════════════════════════════
//  LegalDisclaimer — Fixed bottom component
//  AI-generated report disclaimer in 4 languages.
//  §13 Compliance per MASTER_PLAN_V4.md
//  Props ≤ 7 | CSS rv7- prefix | NO any/unknown
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang } from '@/types/report-v7';

// ─── 4-language disclaimer messages ──────────────────────────
const DISCLAIMER_TEXT: Record<SurveyLang, string> = {
  KO: '본 리포트는 AI에 의해 생성되었으며, 의사의 진료를 대체할 수 없습니다.',
  EN: 'This report is AI-generated and does not replace professional medical advice.',
  JP: '本レポートはAIにより生成されたものであり、医師の診療に代わるものではありません。',
  'ZH-CN': '本报告由AI生成，不能替代医生的诊疗。',
};

// ─── Props ────────────────────────────────────────────────────
interface LegalDisclaimerProps {
  lang: SurveyLang;
}

// ─── Component ────────────────────────────────────────────────
export function LegalDisclaimer({ lang }: LegalDisclaimerProps) {
  return (
    <div
      className="rv7-disclaimer"
      style={{
        padding: '16px 20px',
        marginTop: '24px',
        borderRadius: 'var(--radius)',
        background: 'rgba(248,113,113,0.04)',
        border: '1px solid rgba(248,113,113,0.12)',
        textAlign: 'center',
        fontSize: '10px',
        color: 'var(--text-3)',
        lineHeight: 1.6,
        letterSpacing: '0.01em',
      }}
    >
      <span style={{ fontSize: '14px', display: 'block', marginBottom: '6px', opacity: 0.7 }}>⚖️</span>
      {DISCLAIMER_TEXT[lang]}
    </div>
  );
}
