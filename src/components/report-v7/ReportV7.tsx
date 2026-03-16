// ═══════════════════════════════════════════════════════════════
//  Report v7 — Main Wrapper Component
//
//  3-Depth layout:
//    Depth 0 — Immediately visible (profile, mirror, cards, radar)
//    Depth 1 — Click/expand (card details, why-fit, gauges)
//    Depth 2 — Lazy-loaded (treatment plan, skin layer, doctor tab)
//
//  Props ≤ 2: data (ReportV7Data), lang (SurveyLang)
// ═══════════════════════════════════════════════════════════════

import { Suspense, lazy, useState, useCallback, type ReactNode } from 'react';
import type { SurveyLang, ReportV7Data } from '@/types/report-v7';
import { ReportI18nProvider, useReportI18n } from './ReportI18nContext';
import { ReportErrorBoundary } from './ReportErrorBoundary';
import { SkeletonReport } from './SkeletonReport';
import './report-v7.css';

// ─── Depth 2: Lazy-loaded sections (placeholder stubs for now) ──
// These will be replaced with actual components in later phases.
const LazyTreatmentPlan = lazy(() =>
  import('./sections/TreatmentPlanSection').catch(() => ({
    default: () => <PlaceholderSection name="Treatment Plan" />,
  })),
);

const LazySkinLayer = lazy(() =>
  import('./sections/SkinLayerSection').catch(() => ({
    default: () => <PlaceholderSection name="Skin Layer Diagram" />,
  })),
);

const LazyDoctorTab = lazy(() =>
  import('./sections/DoctorTabSection').catch(() => ({
    default: () => <PlaceholderSection name="Doctor Tab" />,
  })),
);

// ─── Placeholder for unbuilt sections ─────────────────────────
function PlaceholderSection({ name }: { name: string }) {
  return (
    <div
      className="rv7-glass"
      style={{
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-3)',
        fontSize: '11px',
      }}
    >
      <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.5 }}>🔧</div>
      {name} — Phase 0 준비 중
    </div>
  );
}

// ─── Lazy Section Wrapper (Depth 2) ───────────────────────────
function LazySection({ children, name }: { children: ReactNode; name: string }) {
  return (
    <ReportErrorBoundary componentName={name}>
      <Suspense
        fallback={
          <div
            className="rv7-skeleton-loading rv7-glass"
            style={{
              height: '120px',
              borderRadius: 'var(--radius)',
            }}
          />
        }
      >
        {children}
      </Suspense>
    </ReportErrorBoundary>
  );
}

// ─── Active Tab Type ──────────────────────────────────────────
type ReportTab = 'patient' | 'doctor';

// ─── Props ────────────────────────────────────────────────────
interface ReportV7Props {
  data: ReportV7Data;
  lang: SurveyLang;
}

// ─── Inner Report (consumes i18n context) ─────────────────────
function ReportV7Inner({ data }: { data: ReportV7Data }) {
  const { t } = useReportI18n();
  const [activeTab, setActiveTab] = useState<ReportTab>('patient');

  const handleTabSwitch = useCallback((tab: ReportTab) => {
    setActiveTab(tab);
  }, []);

  return (
    <>
      {/* ── Tab Bar ── */}
      <div className="rv7-tab-bar" role="tablist">
        <button
          className={`rv7-tab-btn${activeTab === 'patient' ? ' active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'patient'}
          onClick={() => handleTabSwitch('patient')}
        >
          {t('tab.patient')}
        </button>
        <button
          className={`rv7-tab-btn${activeTab === 'doctor' ? ' active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'doctor'}
          onClick={() => handleTabSwitch('doctor')}
        >
          {t('tab.doctor')}
        </button>
      </div>

      {/* ── Patient Tab (Depth 0 + Depth 1 expandable + Depth 2 lazy) ── */}
      <div
        className={`rv7-tab-page${activeTab === 'patient' ? ' active' : ''}`}
        role="tabpanel"
        aria-hidden={activeTab !== 'patient'}
      >
        <div className="rv7-p-container">
          {/* ─ Depth 0: Patient Profile ─ */}
          <ReportErrorBoundary componentName="PatientProfile">
            <section className="rv7-p-header">
              <div className="rv7-p-avatar">
                {(data.patient.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="rv7-p-name">{data.patient.name || 'Patient'}</div>
                <div className="rv7-p-meta">
                  {data.patient.age} · {data.patient.gender} · {data.patient.country}
                </div>
              </div>
            </section>
          </ReportErrorBoundary>

          {/* ─ Depth 0: Patient Chips ─ */}
          <ReportErrorBoundary componentName="PatientChips">
            <div className="rv7-p-chips">
              {data.patient.top3Concerns.map((concern) => (
                <span key={concern} className="rv7-p-chip">
                  <span className="rv7-pc-val">{concern}</span>
                </span>
              ))}
              {data.patient.fitzpatrick && (
                <span className="rv7-p-chip">
                  <span className="rv7-pc-label">Fitz</span>
                  <span className="rv7-pc-val">{data.patient.fitzpatrick}</span>
                </span>
              )}
            </div>
          </ReportErrorBoundary>

          {/* ─ Depth 0: Mirror Layer ─ */}
          {data.mirror.headline && (
            <ReportErrorBoundary componentName="MirrorLayer">
              <div className="rv7-mirror-layer">
                <div className="rv7-mirror-headline">{data.mirror.headline}</div>
                <div className="rv7-mirror-empathy">{data.mirror.empathyParagraphs}</div>
                <div className="rv7-mirror-transition">{data.mirror.transition}</div>
              </div>
            </ReportErrorBoundary>
          )}

          {/* ─ Depth 0: Confidence Layer ─ */}
          {data.confidence.reasonWhy && (
            <ReportErrorBoundary componentName="ConfidenceLayer">
              <div className="rv7-confidence-layer">
                <div className="rv7-confidence-reason">{data.confidence.reasonWhy}</div>
                <div className="rv7-confidence-proof">{data.confidence.socialProof}</div>
                <div className="rv7-confidence-commit">{data.confidence.commitment}</div>
              </div>
            </ReportErrorBoundary>
          )}

          {/* ─ Depth 0: EBD Recommendation Cards ─ */}
          {data.ebdRecommendations.length > 0 && (
            <ReportErrorBoundary componentName="EBDRecommendations">
              <section className="rv7-rec-section">
                <div className="rv7-sec-label">{t('section.ebd')}</div>
                <div className="rv7-rec-grid">
                  {data.ebdRecommendations.map((rec) => (
                    <div key={rec.deviceId} className="rv7-rec-card rv7-ebd-card">
                      <div className="rv7-rec-badge">
                        <span className="rv7-neon-tag rv7-cyan">#{rec.rank}</span>
                      </div>
                      <div className="rv7-rec-head">
                        <div className="rv7-rec-title-area">
                          <div className="rv7-rec-name">{rec.deviceName}</div>
                          <div className="rv7-rec-sub">{rec.subtitle}</div>
                        </div>
                      </div>
                      <div
                        className="rv7-rec-summary"
                        dangerouslySetInnerHTML={{ __html: rec.summaryHtml }}
                      />
                      {/* Depth 1: Detail expand — will be wired in Phase 1 */}
                    </div>
                  ))}
                </div>
              </section>
            </ReportErrorBoundary>
          )}

          {/* ─ Depth 0: Injectable Recommendation Cards ─ */}
          {data.injectableRecommendations.length > 0 && (
            <ReportErrorBoundary componentName="InjectableRecommendations">
              <section className="rv7-rec-section">
                <div className="rv7-sec-label rv7-rose">{t('section.injectable')}</div>
                <div className="rv7-rec-grid">
                  {data.injectableRecommendations.map((rec) => (
                    <div key={rec.injectableId} className="rv7-rec-card rv7-inj-card">
                      <div className="rv7-rec-badge">
                        <span className="rv7-neon-tag rv7-rose">#{rec.rank}</span>
                      </div>
                      <div className="rv7-rec-head">
                        <div className="rv7-rec-title-area">
                          <div className="rv7-rec-name">{rec.name}</div>
                          <div className="rv7-rec-sub">{rec.subtitle}</div>
                        </div>
                      </div>
                      <div
                        className="rv7-rec-summary"
                        dangerouslySetInnerHTML={{ __html: rec.summaryHtml }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            </ReportErrorBoundary>
          )}

          {/* ─ Depth 0: Radar Chart placeholder ─ */}
          <ReportErrorBoundary componentName="RadarChart">
            <section className="rv7-rec-section">
              <div className="rv7-sec-label">{t('section.radar')}</div>
              <div className="rv7-glass rv7-radar-card">
                <PlaceholderSection name="Radar Chart (5-axis)" />
              </div>
            </section>
          </ReportErrorBoundary>

          {/* ─ Depth 2: Treatment Plan (lazy) ─ */}
          <LazySection name="TreatmentPlan">
            <LazyTreatmentPlan />
          </LazySection>

          {/* ─ Depth 2: Skin Layer Diagram (lazy) ─ */}
          <LazySection name="SkinLayerDiagram">
            <LazySkinLayer />
          </LazySection>

          {/* ─ Disclaimer + CTA ─ */}
          <div className="rv7-p-disclaimer">{t('disclaimer.text')}</div>
          <div className="rv7-p-cta">
            <button className="rv7-p-cta-btn">{t('action.bookConsult')}</button>
          </div>
        </div>
      </div>

      {/* ── Doctor Tab (Depth 2: fully lazy) ── */}
      <div
        className={`rv7-tab-page${activeTab === 'doctor' ? ' active' : ''}`}
        role="tabpanel"
        aria-hidden={activeTab !== 'doctor'}
      >
        <LazySection name="DoctorTab">
          <LazyDoctorTab />
        </LazySection>
      </div>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────
export function ReportV7({ data, lang }: ReportV7Props) {
  if (!data) {
    return <SkeletonReport lang={lang} />;
  }

  return (
    <ReportI18nProvider lang={lang}>
      <div className="rv7-report">
        <ReportErrorBoundary componentName="ReportV7Root">
          <ReportV7Inner data={data} />
        </ReportErrorBoundary>
      </div>
    </ReportI18nProvider>
  );
}
