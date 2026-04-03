// ═══════════════════════════════════════════════════════════════
//  TreatmentPlanSection — Depth 2 (lazy-loaded)
//  Phase 3-C Task 4: Enhanced with day-by-day schedule view
//  4-status handling: idle/loading → skeleton, done → data, error → retry
//  Props ≤ 7 | CSS rv7- prefix | NO any/unknown
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang, TreatmentPlan, ScheduleDay, ScheduleTreatment } from '@/types/report-v7';
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
  precautions: {
    KO: '주의사항',
    EN: 'Precautions',
    JP: '注意事項',
    'ZH-CN': '注意事项',
  },
};

function msg(key: string, lang: SurveyLang): string {
  return STATUS_MSG[key]?.[lang] ?? STATUS_MSG[key]?.KO ?? key;
}

// ─── Treatment type colors ───────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; color: string; border: string; icon: string }> = {
  ebd: { bg: 'rgba(34,211,238,0.08)', color: 'var(--cyan, #22d3ee)', border: '1px solid rgba(34,211,238,0.15)', icon: '&#9889;' },
  injectable: { bg: 'rgba(251,113,133,0.08)', color: 'var(--rose, #fb7185)', border: '1px solid rgba(251,113,133,0.15)', icon: '&#128137;' },
  consultation: { bg: 'rgba(168,85,247,0.08)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.15)', icon: '&#128196;' },
};

// ─── Schedule Treatment Row ──────────────────────────────────
function TreatmentRow({ treatment }: { treatment: ScheduleTreatment }) {
  const colors = TYPE_COLORS[treatment.type] || TYPE_COLORS.ebd;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '6px 0',
    }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '4px',
          background: colors.bg,
          border: colors.border,
          fontSize: '10px',
          flexShrink: 0,
        }}
        dangerouslySetInnerHTML={{ __html: colors.icon }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-hi, #e2e8f0)' }}>
            {treatment.deviceOrProduct}
          </span>
          {treatment.category && (
            <span style={{
              fontSize: '9px',
              padding: '1px 5px',
              borderRadius: '3px',
              background: colors.bg,
              color: colors.color,
              border: colors.border,
            }}>
              {treatment.category}
            </span>
          )}
          {treatment.durationMinutes > 0 && (
            <span style={{ fontSize: '10px', color: 'var(--text-3, #64748b)' }}>
              {treatment.durationMinutes}min
            </span>
          )}
        </div>
        {treatment.note && (
          <div style={{ fontSize: '10px', color: 'var(--text-2, #94a3b8)', marginTop: '2px', lineHeight: 1.5 }}>
            {treatment.note}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Schedule Day Card ───────────────────────────────────────
function DayCard({ scheduleDay }: { scheduleDay: ScheduleDay }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.06)',
      padding: '12px 14px',
      minWidth: '220px',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--cyan, #22d3ee)',
        marginBottom: '8px',
        letterSpacing: '0.05em',
      }}>
        {scheduleDay.day}
      </div>
      <div>
        {scheduleDay.treatments.map((tr, i) => (
          <TreatmentRow key={`${tr.deviceOrProduct}-${i}`} treatment={tr} />
        ))}
      </div>
      {scheduleDay.postCare && (
        <div style={{
          fontSize: '10px',
          color: 'var(--text-3, #64748b)',
          fontStyle: 'italic',
          marginTop: '8px',
          paddingTop: '6px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          &#128161; {scheduleDay.postCare}
        </div>
      )}
    </div>
  );
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

  // idle / loading
  if (status === 'idle' || status === 'loading') {
    return <PlanSkeleton lang={lang} />;
  }

  // error
  if (status === 'error') {
    return (
      <div className="rv7-plan-section rv7-glass" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.6 }}>&#9888;&#65039;</div>
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

  // done but no data at all
  const hasSchedule = plan && plan.schedule.length > 0;
  const hasPhases = plan && plan.phases.length > 0;

  if (!plan || (!hasSchedule && !hasPhases)) {
    return (
      <div className="rv7-plan-section rv7-glass" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.5 }}>&#128203;</div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
          {msg('empty', lang)}
        </div>
      </div>
    );
  }

  // done → render
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

      {/* Title + Summary */}
      {(plan.title || plan.totalDuration) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          padding: '8px 12px',
          background: 'rgba(0,229,255,0.04)',
          borderRadius: '8px',
          border: '1px solid rgba(0,229,255,0.1)',
        }}>
          {plan.title && (
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-hi, #e2e8f0)' }}>
              &#128203; {plan.title}
            </span>
          )}
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-2, #94a3b8)' }}>
            {plan.totalVisits > 0 && (
              <span>{plan.totalVisits} visits</span>
            )}
            {plan.totalDuration && (
              <span>{plan.totalDuration}</span>
            )}
          </div>
        </div>
      )}

      {/* Schedule (day-by-day) — preferred view */}
      {hasSchedule && (
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}>
          {plan.schedule.map((day) => (
            <DayCard key={day.day} scheduleDay={day} />
          ))}
        </div>
      )}

      {/* Phase timeline (fallback or supplementary) */}
      {hasPhases && (
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
                    &#8226; {tr}
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
      )}

      {/* Precautions */}
      {plan.precautions.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          background: 'rgba(255,215,0,0.04)',
          borderRadius: '8px',
          border: '1px solid rgba(255,215,0,0.1)',
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#FFD740',
            marginBottom: '6px',
          }}>
            &#9888;&#65039; {msg('precautions', lang)}
          </div>
          {plan.precautions.map((p, i) => (
            <div key={i} style={{
              fontSize: '11px',
              color: 'var(--text-2, #94a3b8)',
              lineHeight: 1.6,
            }}>
              &#8226; {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
