// ═══════════════════════════════════════════════════════════════
//  Report v7 — Main Wrapper Component
//
//  3-Depth layout:
//    Depth 0 — Immediately visible (profile, mirror, cards, radar)
//    Depth 1 — Click/expand (card details, why-fit, gauges, signature, homecare)
//    Depth 2 — Lazy-loaded (treatment plan, budget, doctor tab)
//
//  Props ≤ 2: data (ReportV7Data), lang (SurveyLang)
// ═══════════════════════════════════════════════════════════════

import { Suspense, lazy, useState, useCallback, type ReactNode } from 'react';
import type { SurveyLang, ReportV7Data } from '@/types/report-v7';
import { ReportI18nProvider, useReportI18n } from './ReportI18nContext';
import { ReportErrorBoundary } from './ReportErrorBoundary';
import { SkeletonReport } from './SkeletonReport';
import { ReportHeader } from './ReportHeader';
import { MirrorLayerView } from './MirrorLayer';
import { ConfidenceLayerView } from './ConfidenceLayer';
import { SafetyFlags } from './SafetyFlags';
import { EBDSection } from './EBDSection';
import { InjectableSection } from './InjectableSection';
import { SignatureSolutions } from './SignatureSolutions';
import { HomecareSection } from './HomecareSection';
import { BudgetSection } from './BudgetSection';
import { LegalDisclaimer } from './LegalDisclaimer';
// report-v7.css is imported globally in _app.tsx (Next.js requirement)

// ─── Depth 2: Lazy-loaded sections ───────────────────────────
const LazyTreatmentPlan = lazy(() =>
  import('./sections/TreatmentPlanSection').catch(() => ({
    default: () => <PlaceholderSection name="Treatment Plan" />,
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
      {name} — Phase 1에서 구현 예정
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
  const { t, lang } = useReportI18n();
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

      {/* ══ Patient Tab ══ */}
      <div
        className={`rv7-tab-page${activeTab === 'patient' ? ' active' : ''}`}
        role="tabpanel"
        aria-hidden={activeTab !== 'patient'}
      >
        <div className="rv7-p-container">
          {/* ─ Depth 0: Patient Profile ─ */}
          <ReportErrorBoundary componentName="ReportHeader">
            <ReportHeader patient={data.patient} lang={lang} />
          </ReportErrorBoundary>

          {/* ─ Depth 0: Safety Flags ─ */}
          <ReportErrorBoundary componentName="SafetyFlags">
            <SafetyFlags flags={data.safetyFlags} lang={lang} />
          </ReportErrorBoundary>

          {/* ─ Depth 0: Mirror Layer (서사 1단계: 감정 공감) ─ */}
          <ReportErrorBoundary componentName="MirrorLayer">
            <MirrorLayerView mirror={data.mirror} lang={lang} />
          </ReportErrorBoundary>

          {/* ─ Depth 0: Confidence Layer (서사 2단계: 임상 확신) ─ */}
          <ReportErrorBoundary componentName="ConfidenceLayer">
            <ConfidenceLayerView confidence={data.confidence} lang={lang} />
          </ReportErrorBoundary>

          {/* ─ Depth 0+1: EBD Recommendation Cards ─ */}
          <ReportErrorBoundary componentName="EBDSection">
            <EBDSection recommendations={data.ebdRecommendations} lang={lang} />
          </ReportErrorBoundary>

          {/* ─ Depth 0+1: Injectable Recommendation Cards ─ */}
          <ReportErrorBoundary componentName="InjectableSection">
            <InjectableSection recommendations={data.injectableRecommendations} lang={lang} />
          </ReportErrorBoundary>

          {/* ─ Depth 1: Signature Solutions (EBD + Injectable 조합) ─ */}
          <ReportErrorBoundary componentName="SignatureSolutions">
            <SignatureSolutions solutions={data.signatureSolutions} lang={lang} />
          </ReportErrorBoundary>

          {/* ─ Depth 1: Homecare Guide ─ */}
          <ReportErrorBoundary componentName="HomecareSection">
            <HomecareSection homecare={data.homecare} lang={lang} />
          </ReportErrorBoundary>

          {/* ─ Depth 2: Treatment Plan (lazy) ─ */}
          <LazySection name="TreatmentPlan">
            <LazyTreatmentPlan
              plan={data.treatmentPlan}
              status="done"
              lang={lang}
            />
          </LazySection>

          {/* ─ Depth 2: Budget Estimate ─ */}
          <ReportErrorBoundary componentName="BudgetSection">
            <BudgetSection
              budget={data.budgetEstimate}
              status="done"
              lang={lang}
            />
          </ReportErrorBoundary>

          {/* ─ Legal Disclaimer (§13 Compliance) ─ */}
          <ReportErrorBoundary componentName="LegalDisclaimer">
            <LegalDisclaimer lang={lang} />
          </ReportErrorBoundary>

          {/* ─ CTA ─ */}
          <div className="rv7-p-cta">
            <button className="rv7-p-cta-btn">{t('action.bookConsult')}</button>
          </div>
        </div>
      </div>

      {/* ══ Doctor Tab (Depth 2: fully lazy) ══ */}
      <div
        className={`rv7-tab-page${activeTab === 'doctor' ? ' active' : ''}`}
        role="tabpanel"
        aria-hidden={activeTab !== 'doctor'}
      >
        <LazySection name="DoctorTab">
          <LazyDoctorTab
            doctorData={data.doctorTab}
            patient={data.patient}
            safetyFlags={data.safetyFlags}
            ebdList={data.ebdRecommendations}
            injectableList={data.injectableRecommendations}
            status="done"
            lang={lang}
          />
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
