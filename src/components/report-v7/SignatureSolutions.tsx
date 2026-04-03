// ═══════════════════════════════════════════════════════════════
//  SignatureSolutions — Top 3 with Combination Step Display
//  Phase 3-C Task 3: Expanded to show ordered treatment steps
//  Props ≤ 7 | CSS rv7- prefix | NO any/unknown
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import type { SurveyLang, SignatureSolution, SolutionStep } from '@/types/report-v7';
import { useReportI18n } from './ReportI18nContext';

// ─── i18n labels ──────────────────────────────────────────────
const LABELS: Record<string, Record<SurveyLang, string>> = {
  devices: { KO: '장비', EN: 'Devices', JP: 'デバイス', 'ZH-CN': '设备' },
  injectables: { KO: '주사', EN: 'Injectables', JP: '注入剤', 'ZH-CN': '注射' },
  sessions: { KO: '총 세션', EN: 'Total Sessions', JP: '合計セッション', 'ZH-CN': '总疗程' },
  duration: { KO: '기간', EN: 'Duration', JP: '期間', 'ZH-CN': '周期' },
  synergy: { KO: '시너지', EN: 'Synergy', JP: 'シナジー', 'ZH-CN': '协同' },
  steps: { KO: '시술 순서', EN: 'Treatment Steps', JP: '施術手順', 'ZH-CN': '治疗步骤' },
  synergyReason: { KO: '시너지 원리', EN: 'Why it works', JP: '相乗効果', 'ZH-CN': '协同原理' },
  emptyMsg: {
    KO: '시그니처 솔루션을 준비 중입니다.',
    EN: 'Signature solutions are being prepared.',
    JP: 'シグネチャーソリューションを準備中です。',
    'ZH-CN': '正在准备签名方案。',
  },
  partialMsg: {
    KO: '상담 시 추가 프로토콜을 추천해 드립니다.',
    EN: 'Additional protocols will be recommended during consultation.',
    JP: '診察時に追加プロトコルをご提案します。',
    'ZH-CN': '咨询时将推荐更多方案。',
  },
};

function l(key: string, lang: SurveyLang): string {
  return LABELS[key]?.[lang] ?? LABELS[key]?.KO ?? key;
}

// ─── Fit score color ─────────────────────────────────────────
function fitClass(score: number): string {
  if (score >= 85) return 'fit-high';
  if (score >= 65) return 'fit-mid';
  return 'fit-low';
}

// ─── Step Connector ──────────────────────────────────────────
function StepConnector({ interval }: { interval: string | null }) {
  if (!interval) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 0 4px 20px',
    }}>
      <div style={{
        width: '2px',
        height: '16px',
        background: 'rgba(0,229,255,0.2)',
        marginLeft: '6px',
      }} />
      <span style={{
        fontSize: '10px',
        color: 'var(--text-3, #64748b)',
        fontStyle: 'italic',
      }}>
        {interval}
      </span>
    </div>
  );
}

// ─── Step Row ────────────────────────────────────────────────
function StepRow({ step }: { step: SolutionStep }) {
  const isEBD = step.type === 'ebd';
  const chipColor = isEBD
    ? { bg: 'rgba(34,211,238,0.08)', color: 'var(--cyan, #22d3ee)', border: '1px solid rgba(34,211,238,0.15)' }
    : { bg: 'rgba(251,113,133,0.08)', color: 'var(--rose, #fb7185)', border: '1px solid rgba(251,113,133,0.15)' };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '6px 0',
    }}>
      <span style={{
        minWidth: '22px',
        height: '22px',
        borderRadius: '50%',
        background: 'rgba(0,229,255,0.12)',
        color: 'var(--cyan, #22d3ee)',
        fontSize: '11px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {step.order}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-hi, #e2e8f0)',
          }}>
            {step.deviceOrProduct}
          </span>
          <span
            className="rv7-combo-chip"
            style={{
              background: chipColor.bg,
              color: chipColor.color,
              border: chipColor.border,
              fontSize: '9px',
              padding: '1px 6px',
            }}
          >
            {step.category}
          </span>
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--text-2, #94a3b8)',
          lineHeight: 1.5,
          marginTop: '2px',
        }}>
          {step.action}
        </div>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────
interface SignatureSolutionsProps {
  solutions: SignatureSolution[];
  lang: SurveyLang;
}

// ─── Component ────────────────────────────────────────────────
export function SignatureSolutions({ solutions, lang }: SignatureSolutionsProps) {
  const { t } = useReportI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = useCallback((idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  }, []);

  // ─── Empty state: show preparing message ─────────────────
  if (solutions.length === 0) {
    return (
      <div className="rv7-sig-section rv7-glass">
        <div className="rv7-sig-header">
          <div className="rv7-sig-header-title">
            <span className="rv7-sig-crown">&#128081;</span>
            <div>
              <div className="rv7-sig-main-title">{t('section.signature')}</div>
              <div className="rv7-sig-sub-title">EBD + Injectable Synergy</div>
            </div>
          </div>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '24px 16px',
          color: 'var(--text-2, #94a3b8)',
          fontSize: '13px',
          lineHeight: 1.6,
        }}>
          {l('emptyMsg', lang)}
        </div>
      </div>
    );
  }

  return (
    <div className="rv7-sig-section rv7-glass">
      {/* Header */}
      <div className="rv7-sig-header">
        <div className="rv7-sig-header-title">
          <span className="rv7-sig-crown">&#128081;</span>
          <div>
            <div className="rv7-sig-main-title">{t('section.signature')}</div>
            <div className="rv7-sig-sub-title">EBD + Injectable Synergy</div>
          </div>
        </div>
        <span className="rv7-sig-header-badge">TOP {solutions.length}</span>
      </div>

      {/* Solution Bars */}
      <div className="rv7-sig-bar-list">
        {solutions.map((sol, idx) => {
          const isOpen = openIndex === idx;
          const rankNum = idx + 1;

          return (
            <div
              key={sol.name}
              className={`rv7-sig-bar${idx === 0 ? ' sig-best' : ''}${isOpen ? ' sig-open' : ''}`}
            >
              {/* Collapsed head */}
              <div
                className="rv7-sig-bar-head"
                onClick={() => toggle(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(idx);
                  }
                }}
              >
                <span className={`rv7-sig-bar-rank rank-${Math.min(rankNum, 4)}`}>
                  #{rankNum}
                </span>
                <div className="rv7-sig-bar-info">
                  <span className="rv7-sig-bar-name">{sol.name}</span>
                </div>
                <div className="rv7-sig-bar-chips">
                  {sol.devices.slice(0, 2).map((d) => (
                    <span key={d} className="rv7-combo-chip" style={{
                      background: 'rgba(34,211,238,0.08)',
                      color: 'var(--cyan)',
                      border: '1px solid rgba(34,211,238,0.15)',
                    }}>
                      {d}
                    </span>
                  ))}
                  {sol.injectables.slice(0, 1).map((inj) => (
                    <span key={inj} className="rv7-combo-chip" style={{
                      background: 'rgba(251,113,133,0.08)',
                      color: 'var(--rose)',
                      border: '1px solid rgba(251,113,133,0.15)',
                    }}>
                      {inj}
                    </span>
                  ))}
                </div>
                <span className={`rv7-sig-bar-fit ${fitClass(sol.synergyScore)}`}>
                  {sol.synergyScore}
                </span>
                <span className="rv7-sig-bar-arrow">&#9660;</span>
              </div>

              {/* Expanded detail */}
              <div className="rv7-sig-bar-detail">
                <div className="rv7-sig-detail-inner">
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7, margin: '10px 0' }}>
                    {sol.description}
                  </p>

                  {/* Treatment Steps */}
                  {sol.steps.length > 0 && (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '10px 12px',
                      marginBottom: '12px',
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-hi, #e2e8f0)',
                        marginBottom: '8px',
                      }}>
                        &#9654; {l('steps', lang)}
                      </div>
                      {sol.steps.map((step, sIdx) => (
                        <div key={step.order}>
                          <StepRow step={step} />
                          {sIdx < sol.steps.length - 1 && (
                            <StepConnector interval={step.intervalAfter} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Synergy Explanation */}
                  {sol.synergyExplanation && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-2, #94a3b8)',
                      lineHeight: 1.6,
                      padding: '8px 0',
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      marginBottom: '10px',
                    }}>
                      <span style={{ fontWeight: 600, color: 'var(--cyan, #22d3ee)', marginRight: '6px' }}>
                        &#128279; {l('synergyReason', lang)}:
                      </span>
                      {sol.synergyExplanation}
                    </div>
                  )}

                  <div className="rv7-sig-detail-grid">
                    {/* Sessions */}
                    <div className="rv7-sig-detail-block">
                      <div className="rv7-sig-detail-block-title">
                        &#128197; {l('sessions', lang)}
                      </div>
                      <p>{sol.totalSessions}</p>
                    </div>
                    {/* Duration */}
                    {sol.totalDuration && (
                      <div className="rv7-sig-detail-block">
                        <div className="rv7-sig-detail-block-title">
                          &#9200; {l('duration', lang)}
                        </div>
                        <p>{sol.totalDuration}</p>
                      </div>
                    )}
                    {/* Synergy Score */}
                    <div className="rv7-sig-detail-block">
                      <div className="rv7-sig-detail-block-title">
                        &#128279; {l('synergy', lang)}
                      </div>
                      <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--cyan)' }}>
                        {sol.synergyScore}
                        <span style={{ fontSize: '12px', color: 'var(--text-3)', marginLeft: '2px' }}>/100</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Partial fallback: 1-2 solutions → suggest consultation */}
      {solutions.length < 3 && (
        <div style={{
          textAlign: 'center',
          padding: '12px 16px',
          color: 'var(--text-3, #64748b)',
          fontSize: '12px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {l('partialMsg', lang)}
        </div>
      )}
    </div>
  );
}
