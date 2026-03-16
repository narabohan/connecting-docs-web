// ═══════════════════════════════════════════════════════════════
//  useReportData — Report data loading hook
//
//  Phase 0: Loads from sessionStorage (same as existing [id].tsx).
//  Phase 1: Airtable fallback will be activated here.
//
//  Converts OpusRecommendationOutput (snake_case) → ReportV7Data (camelCase).
//  Validates through Zod schema before returning.
//  NEXT_PUBLIC_AI_MOCK=true → returns mock data (no sessionStorage needed).
//  Returns: { data, status, error, lang }
//
//  NO any/unknown types allowed.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import type { SurveyLang, SafetyFlag } from '@/types/survey-v2';
import type {
  ReportV7Data,
  ReportSafetyFlag,
  ReportPatientProfile,
  MirrorLayer,
  ConfidenceLayer,
  EBDRecommendation,
  InjectableRecommendation,
  SignatureSolution,
  TreatmentPlan,
  HomecareGuide,
  BudgetEstimate,
  DoctorTab,
  PracticalInfo,
} from '@/types/report-v7';
import { DEFAULT_REPORT_V7_DATA } from '@/types/report-v7';
import type {
  OpusRecommendationOutput,
  OpusPatientProfile,
  OpusMirrorLayer,
  OpusConfidenceLayer,
  OpusDeviceRecommendation,
  OpusInjectableRecommendation,
  OpusSignatureSolution,
  OpusTreatmentPlan,
  OpusHomecare,
  OpusDoctorTab,
} from '@/pages/api/survey-v2/final-recommendation';
import { validateRecommendation } from '@/validators/report-v7-validator';
import { MOCK_REPORT_V7 } from '@/mocks/report-v7-mock';

// ─── Status / Return types ───────────────────────────────────
type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseReportDataReturn {
  data: ReportV7Data | null;
  status: LoadStatus;
  error: string | null;
  lang: SurveyLang;
}

// ─── Session Storage payload (same shape as existing [id].tsx) ─
interface StoredReportPayload {
  recommendation: OpusRecommendationOutput;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
  survey_state: {
    demographics: {
      detected_language: SurveyLang;
      detected_country: string;
      d_gender: string;
      d_age: string;
    };
    safety_flags: SafetyFlag[];
    open_question_raw: string;
  };
  created_at: string;
}

// ─── Storage key ──────────────────────────────────────────────
const STORAGE_KEY = 'connectingdocs_v2_report';

// ═══════════════════════════════════════════════════════════════
//  Safety Flag Conversion
//  SafetyFlag union string → ReportSafetyFlag display object
// ═══════════════════════════════════════════════════════════════

const SAFETY_FLAG_META: Record<SafetyFlag, { severity: 'info' | 'warning' | 'critical'; message: string }> = {
  SAFETY_ISOTRETINOIN: { severity: 'critical', message: 'Active isotretinoin use detected' },
  SAFETY_ANTICOAGULANT: { severity: 'critical', message: 'Active anticoagulant therapy' },
  SAFETY_PREGNANCY: { severity: 'critical', message: 'Pregnancy or suspected pregnancy' },
  SAFETY_KELOID: { severity: 'warning', message: 'History of keloid scarring' },
  SAFETY_PHOTOSENSITIVITY: { severity: 'warning', message: 'Photosensitive medication use' },
  SAFETY_ADVERSE_HISTORY: { severity: 'warning', message: 'Previous adverse treatment reaction' },
  HORMONAL_MELASMA: { severity: 'info', message: 'Hormonal melasma noted' },
  RETINOID_PAUSE: { severity: 'info', message: 'Recent retinoid use — pause required' },
};

function convertSafetyFlags(flags: SafetyFlag[]): ReportSafetyFlag[] {
  return flags.map((flag) => {
    const meta = SAFETY_FLAG_META[flag];
    return {
      code: flag,
      severity: meta?.severity ?? 'info',
      message: meta?.message ?? flag,
    };
  });
}

// ═══════════════════════════════════════════════════════════════
//  Data Conversion: Opus snake_case → ReportV7 camelCase
// ═══════════════════════════════════════════════════════════════

function convertPatient(p: OpusPatientProfile, demographics: StoredReportPayload['survey_state']['demographics']): ReportPatientProfile {
  return {
    name: p.name ?? '',
    age: p.age || demographics.d_age,
    gender: p.gender || demographics.d_gender,
    country: p.country || demographics.detected_country,
    aestheticGoal: p.aesthetic_goal,
    top3Concerns: p.top3_concerns,
    pastTreatments: p.past_treatments,
    fitzpatrick: p.fitzpatrick,
    painSensitivity: p.pain_sensitivity,
    stayDuration: p.stay_duration ?? '',
    contraindications: p.contraindications ?? [],
  };
}

function convertMirror(m: OpusMirrorLayer): MirrorLayer {
  return {
    headline: m.headline,
    empathyParagraphs: m.empathy_paragraphs,
    transition: m.transition,
  };
}

function convertConfidence(c: OpusConfidenceLayer): ConfidenceLayer {
  return {
    reasonWhy: c.reason_why,
    socialProof: c.social_proof,
    commitment: c.commitment,
  };
}

function convertPractical(p: { sessions: string; interval: string; duration?: string; onset: string; maintain: string }): PracticalInfo {
  return {
    sessions: p.sessions,
    interval: p.interval,
    duration: p.duration ?? '',
    onset: p.onset,
    maintain: p.maintain,
  };
}

function convertEBD(items: OpusDeviceRecommendation[]): EBDRecommendation[] {
  return items.map((d) => ({
    rank: d.rank,
    deviceName: d.device_name,
    deviceId: d.device_id,
    moaCategory: d.moa_category,
    moaCategoryLabel: d.moa_category_label,
    evidenceLevel: d.evidence_level,
    confidence: d.confidence,
    skinLayer: d.skin_layer,
    painLevel: d.pain_level,
    downtimeLevel: d.downtime_level,
    safetyLevel: d.safety_level,
    badge: d.badge,
    badgeColor: d.badge_color ?? '',
    subtitle: d.subtitle,
    summaryHtml: d.summary_html,
    whyFitHtml: d.why_fit_html,
    moaSummaryTitle: d.moa_summary_title,
    moaSummaryShort: d.moa_summary_short,
    moaDescriptionHtml: d.moa_description_html,
    targetTags: d.target_tags,
    practical: convertPractical(d.practical),
    scores: d.scores,
    aiDescriptionHtml: d.ai_description_html,
  }));
}

function convertInjectable(items: OpusInjectableRecommendation[]): InjectableRecommendation[] {
  return items.map((inj) => ({
    rank: inj.rank,
    name: inj.name,
    injectableId: inj.injectable_id,
    category: inj.category,
    categoryLabel: inj.category_label,
    evidenceLevel: inj.evidence_level,
    confidence: inj.confidence,
    skinLayer: inj.skin_layer,
    subtitle: inj.subtitle,
    summaryHtml: inj.summary_html,
    whyFitHtml: inj.why_fit_html,
    moaSummaryTitle: inj.moa_summary_title,
    moaSummaryShort: inj.moa_summary_short,
    moaDescriptionHtml: inj.moa_description_html,
    practical: convertPractical(inj.practical),
    scores: inj.scores,
  }));
}

function convertSignatureSolutions(items: OpusSignatureSolution[]): SignatureSolution[] {
  return items.map((s) => ({
    name: s.name,
    description: s.description,
    devices: s.devices,
    injectables: s.injectables,
    totalSessions: s.total_sessions,
    synergyScore: s.synergy_score,
  }));
}

function convertTreatmentPlan(plan: OpusTreatmentPlan): TreatmentPlan {
  return {
    phases: plan.phases.map((ph) => ({
      phase: ph.phase,
      name: ph.name,
      period: ph.period,
      treatments: ph.treatments,
      goal: ph.goal,
    })),
  };
}

function convertHomecare(hc: OpusHomecare): HomecareGuide {
  return {
    morning: hc.morning,
    evening: hc.evening,
    weekly: hc.weekly,
    avoid: hc.avoid,
  };
}

function convertDoctorTab(dt: OpusDoctorTab): DoctorTab {
  return {
    clinicalSummary: dt.clinical_summary,
    triggeredProtocols: dt.triggered_protocols,
    countryNote: dt.country_note,
    parameterGuidance: dt.parameter_guidance,
    contraindications: dt.contraindications,
    alternativeOptions: dt.alternative_options,
    patientIntelligence: {
      expectationTag: dt.patient_intelligence.expectation_tag,
      expectationNote: dt.patient_intelligence.expectation_note,
      budgetTimeline: {
        budgetTier: dt.patient_intelligence.budget_timeline.budget_tier,
        decisionSpeed: dt.patient_intelligence.budget_timeline.decision_speed,
        urgency: dt.patient_intelligence.budget_timeline.urgency,
        stayDuration: dt.patient_intelligence.budget_timeline.stay_duration,
      },
      communicationStyle: dt.patient_intelligence.communication_style,
      communicationNote: dt.patient_intelligence.communication_note,
    },
    consultationStrategy: {
      recommendedOrder: dt.consultation_strategy.recommended_order,
      expectedComplaints: dt.consultation_strategy.expected_complaints,
      scenarioSummary: dt.consultation_strategy.scenario_summary,
    },
  };
}

// ─── Full conversion ─────────────────────────────────────────
function convertPayloadToReportV7Data(
  payload: StoredReportPayload,
): ReportV7Data {
  const rec = payload.recommendation;
  const demo = payload.survey_state.demographics;

  return {
    lang: rec.lang,
    generatedAt: rec.generated_at || payload.created_at,
    model: rec.model || payload.model,
    patient: convertPatient(rec.patient, demo),
    safetyFlags: convertSafetyFlags(payload.survey_state.safety_flags),
    mirror: convertMirror(rec.mirror),
    confidence: convertConfidence(rec.confidence),
    ebdRecommendations: convertEBD(rec.ebd_recommendations),
    injectableRecommendations: convertInjectable(rec.injectable_recommendations),
    signatureSolutions: convertSignatureSolutions(rec.signature_solutions),
    treatmentPlan: convertTreatmentPlan(rec.treatment_plan),
    homecare: convertHomecare(rec.homecare),
    budgetEstimate: { totalRange: '', segments: [], roiNote: '' }, // Phase 1: budget generation
    doctorTab: convertDoctorTab(rec.doctor_tab),
  };
}

// ─── Mock mode check ──────────────────────────────────────────
const IS_MOCK_MODE = process.env.NEXT_PUBLIC_AI_MOCK === 'true';

// ═══════════════════════════════════════════════════════════════
//  Hook
// ═══════════════════════════════════════════════════════════════

export function useReportData(reportId: string | undefined): UseReportDataReturn {
  const [data, setData] = useState<ReportV7Data | null>(null);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<SurveyLang>('EN');

  useEffect(() => {
    if (!reportId) return;

    setStatus('loading');

    // ─── Mock mode: return mock data immediately ──────────────
    if (IS_MOCK_MODE) {
      console.info('[useReportData] Mock mode active — using MOCK_REPORT_V7');
      const { data: validated, warnings } = validateRecommendation(MOCK_REPORT_V7);
      if (warnings.length > 0) {
        console.warn('[useReportData] Mock validation warnings:', warnings);
      }
      setLang((validated.lang as SurveyLang) || 'KO');
      setData(validated);
      setStatus('success');
      return;
    }

    try {
      // ─── Phase 0: sessionStorage ────────────────────────────
      const raw = typeof window !== 'undefined'
        ? sessionStorage.getItem(STORAGE_KEY)
        : null;

      if (!raw) {
        // Phase 1 TODO: Airtable fallback
        // const airtableData = await fetchFromAirtable(reportId);
        setError('Report data not found. Please complete the survey first.');
        setStatus('error');
        return;
      }

      const payload: StoredReportPayload = JSON.parse(raw);
      const detectedLang = payload.survey_state.demographics.detected_language;
      setLang(detectedLang);

      const reportData = convertPayloadToReportV7Data(payload);

      // ─── Validate through Zod ────────────────────────────────
      const { data: validated, warnings } = validateRecommendation(reportData);
      if (warnings.length > 0) {
        console.warn('[useReportData] Validation warnings:', warnings);
      }

      setData(validated);
      setStatus('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load report data.';
      setError(message);
      setStatus('error');
    }
  }, [reportId]);

  return { data, status, error, lang };
}

// ─── Re-export for [id].tsx consultation request ──────────────
export type { StoredReportPayload };
