// ═══════════════════════════════════════════════════════════════
//  SignatureSolutions — Depth 1
//  Best EBD + Injectable combination cards with expand/collapse.
//  Props ≤ 7 | CSS rv7- prefix | NO any/unknown
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import type { SurveyLang, SignatureSolution } from '@/types/report-v7';
import { useReportI18n } from './ReportI18nContext';

// ─── i18n labels ──────────────────────────────────────────────
const LABELS: Record<string, Record<SurveyLang, string>> = {
  devices: {
    KO: '장비',
    EN: 'Devices',
    JP: 'デバイス',
    'ZH-CN': '设备',
  },
  injectables: {
    KO: '주사',
    EN: 'Injectables',
    JP: '注入剤',
    'ZH-CN': '注射',
  },
  sessions: {
    KO: '총 세션',
    EN: 'Total Sessions',
    JP: '合計セッション',
    'ZH-CN': '总疗程',
  },
  synergy: {
    KO: '시너지',
    EN: 'Synergy',
    JP: 'シナジー',
    'ZH-CN': '协同',
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

  if (solutions.length === 0) return null;

  return (
    <div className="rv7-sig-section rv7-glass">
      {/* ── Header ── */}
      <div className="rv7-sig-header">
        <div className="rv7-sig-header-title">
          <span className="rv7-sig-crown">👑</span>
          <div>
            <div className="rv7-sig-main-title">{t('section.signature')}</div>
            <div className="rv7-sig-sub-title">EBD + Injectable Synergy</div>
          </div>
        </div>
        <span className="rv7-sig-header-badge">TOP {solutions.length}</span>
      </div>

      {/* ── Solution Bars ── */}
      <div className="rv7-sig-bar-list">
        {solutions.map((sol, idx) => {
          const isOpen = openIndex === idx;
          const rankNum = idx + 1;

          return (
            <div
              key={sol.name}
              className={`rv7-sig-bar${idx === 0 ? ' sig-best' : ''}${isOpen ? ' sig-open' : ''}`}
            >
              {/* ── Collapsed head ── */}
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
                <span className="rv7-sig-bar-arrow">▼</span>
              </div>

              {/* ── Expanded detail ── */}
              <div className="rv7-sig-bar-detail">
                <div className="rv7-sig-detail-inner">
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7, margin: '10px 0' }}>
                    {sol.description}
                  </p>
                  <div className="rv7-sig-detail-grid">
                    {/* Devices */}
                    <div className="rv7-sig-detail-block">
                      <div className="rv7-sig-detail-block-title">
                        ⚡ {l('devices', lang)}
                      </div>
                      <ul>
                        {sol.devices.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </div>
                    {/* Injectables */}
                    <div className="rv7-sig-detail-block">
                      <div className="rv7-sig-detail-block-title">
                        💉 {l('injectables', lang)}
                      </div>
                      <ul>
                        {sol.injectables.map((inj) => (
                          <li key={inj}>{inj}</li>
                        ))}
                      </ul>
                    </div>
                    {/* Sessions */}
                    <div className="rv7-sig-detail-block">
                      <div className="rv7-sig-detail-block-title">
                        📅 {l('sessions', lang)}
                      </div>
                      <p>{sol.totalSessions}</p>
                    </div>
                    {/* Synergy Score */}
                    <div className="rv7-sig-detail-block">
                      <div className="rv7-sig-detail-block-title">
                        🔗 {l('synergy', lang)}
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
    </div>
  );
}
