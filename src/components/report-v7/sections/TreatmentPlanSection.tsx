// ═══════════════════════════════════════════════════════════════
//  TreatmentPlanSection — Depth 2 (lazy-loaded)
//  Horizontal timeline with phase cards.
//  4-status handling: idle/loading → skeleton, done → data, error → retry
//  Props ≤ 7 | CSS rv7- prefix | NO any/unknown
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang, TreatmentPlan } from '@/types/report-v7';
import { useReportI18n } from '../ReportI18nContext';

// ─── Status type ──────────────────────────────────────────────
type SectionStatus = 'idle' | 'loading' | 'done' | 'error';

// ─── Status messages (4 languages) ───────────────────────────
const STATUS_MSG: Record<string, Record<SurveyLang, string>> = {
  loading: {
    KO: '시술 플랜을 준비하고 있습니다…',
    EN: 'Preparing treatment plan…',
    JP: '施術プランを準備中…',
    'ZH-CN': '正在准备治疗计划…',
  },
  idle: {
    KO: '시술 플랜을 불러오는 중…',
    EN: 'Loading treatment plan…',
    JP: '施術プランを読み込み中…',
    'ZH-CN': '正在加载治疗计划…',
  },
  error: {
    KO: '시술 플랜을 불러오지 못했습니다.',
    EN: 'Failed to load treatment plan.',
    JP: '施術プランの読み込みに失敗しました。',
    'ZH-CN': '加载治疗计划失败。',
  },
  retry: {
    KO: '다시 시도',
    EN: 'Retry',
    JP: '再試行',
    'ZH-CN': '重试',
  },
  empty: {
    KO: '시술 플랜이 아직 생성되지 않았습니다.',
    EN: 'Treatment plan has not been generated yet.',
    JP: '施術プランはまだ作成されていません。',
    'ZH-CN': '治疗计划尚未生成。',
  },
};

function msg(key: string, lang: SurveyLang): string {
  return STATUS_MSG[key]?.[lang] ?? STATUS_MSG[key]?.KO ?? key;
}

// ─── Props ────────────────────────────────────────────────────
interface TreatmentPlanSectionProps {
  plan: TreatmentPlan | null;
  status: SectionStatus;
  lang: SurveyLang;
  onRetry?: () => void;
}

// ─── Skeleton ─────────────────────────────────────────────────
function PlanSkeleton({ lang }: { lang: SurveyLang }) {
  return (
    <div className="rv7-plan-section">
      <div className="rv7-plan-timeline">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rv7-plan-phase rv7-skeleton-loading"
            style={{ height: '120px', opacity: 0.5 }}
          />
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-3)', marginTop: '8px' }}>
        {msg('loading', lang)}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────
export default function TreatmentPlanSection({ plan, status, lang, onRetry }: TreatmentPlanSectionProps) {
  const { t } = useReportI18n();

  // idle / loading → skeleton
  if (status === 'idle' || status === 'loading') {
    return <PlanSkeleton lang={lang} />;
  }

  // error → retry button
  if (status === 'error') {
    return (
      <div className="rv7-plan-section rv7-glass" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.6 }}>⚠️</div>
        <div style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '12px' }}>
          {msg('error', lang)}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              background: 'var(--cyan-dim)',
              border: '1px solid var(--cyan-border)',
              color: 'var(--cyan)',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {msg('retry', lang)}
          </button>
        )}
      </div>
    );
  }

  // done but no data
  if (!plan || plan.phases.length === 0) {
    return (
      <div className="rv7-plan-section rv7-glass" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.5 }}>📋</div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
          {msg('empty', lang)}
        </div>
      </div>
    );
  }

  // done → render phases
  return (
    <div className="rv7-plan-section">
      <div style={{
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        color: 'var(--text-3)',
        marginBottom: '12px',
      }}>
        {t('section.plan')}
      </div>

      <div className="rv7-plan-timeline">
        {plan.phases.map((phase) => (
          <div key={phase.phase} className="rv7-plan-phase">
            <div style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: 'var(--cyan)',
              marginBottom: '6px',
            }}>
              Phase {phase.phase}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-hi)',
              marginBottom: '4px',
            }}>
              {phase.name}
            </div>
            <div style={{
              fontSize: '9px',
              color: 'var(--text-3)',
              marginBottom: '8px',
            }}>
              {phase.period}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-2)',
              lineHeight: 1.6,
              marginBottom: '6px',
            }}>
              {phase.treatments.map((tr, i) => (
                <span key={i}>
                  • {tr}
                  {i < phase.treatments.length - 1 && <br />}
                </span>
              ))}
            </div>
            <div style={{
              fontSize: '9px',
              color: 'var(--text-3)',
              fontStyle: 'italic',
            }}>
              {phase.goal}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
