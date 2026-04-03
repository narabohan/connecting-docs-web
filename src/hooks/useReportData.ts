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
import { PRICE_MAP } from '@/lib/clinical-rules';

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
  SAFETY_DIABETES: { severity: 'warning', message: 'Diabetes — delayed wound healing risk' },
  SAFETY_METALLIC_IMPLANT: { severity: 'critical', message: 'Metallic implant/pacemaker — RF contraindicated' },
  SAFETY_IMMUNOSUPPRESSANT: { severity: 'critical', message: 'Immunosuppressive therapy — infection risk elevated' },
  SAFETY_HERPES_SIMPLEX: { severity: 'warning', message: 'HSV history — antiviral prophylaxis recommended' },
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

// ─── Injectable keywords for client-side EBD/injectable separation ──
const INJECTABLE_KEYWORDS = [
  'sculptra', 'rejuran', 'juvelook', 'botox', 'dysport', 'xeomin',
  'restylane', 'juvederm', 'belotero', 'filler', 'toxin', 'booster',
  'profhilo', 'nctf', 'ellanse', 'exosome', 'asce', 'pdrn',
  'skinvive', 'volite', 'chanel', 'filorga',
];

function isInjectable(name: string): boolean {
  const lower = (name || '').toLowerCase();
  return INJECTABLE_KEYWORDS.some((kw) => lower.includes(kw));
}

function convertEBD(items: OpusDeviceRecommendation[]): EBDRecommendation[] {
  // Filter out any injectables that AI mistakenly placed in ebd_recommendations
  const filtered = items.filter((d) => !isInjectable(d.device_name));
  return filtered.map((d) => ({
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
    // ─── Category-first fields ──────────────────────────────
    slot: d.slot ?? null,
    categoryId: d.category_id ?? d.moa_category,
    categoryNameKo: d.category_name_ko ?? d.moa_category_label,
    categoryNameEn: d.category_name_en ?? d.moa_category,
    categoryReason: d.category_reason ?? '',
    matchScore: d.match_score ?? d.confidence,
    downtimeDisplay: d.downtime_display ?? '',
    priceTier: d.price_tier ?? 3,
    alternativeDevices: (d.alternative_devices ?? []).map((alt) => ({
      name: alt.name,
      oneLiner: alt.one_liner,
      matchScore: alt.match_score,
      downtimeDisplay: alt.downtime_display,
      painLevel: alt.pain_level,
      priceTier: alt.price_tier,
    })),
    doctorNote: d.doctor_note ? {
      suggestedParameters: d.doctor_note.suggested_parameters,
      fitzpatrickAdjustment: d.doctor_note.fitzpatrick_adjustment,
      safetyFlags: d.doctor_note.safety_flags,
      minIntervalDays: d.doctor_note.min_interval_days,
    } : null,
  }));
}

function convertInjectable(items: OpusInjectableRecommendation[]): InjectableRecommendation[] {
  // Filter out any EBD devices that AI mistakenly placed in injectable_recommendations
  const filtered = items.filter((inj) => {
    const name = (inj.name || '').toLowerCase();
    // If it looks like a known EBD device, exclude it
    const EBD_KEYWORDS = ['ulthera', 'thermage', 'genius', 'potenza', 'sylfirm', 'morpheus', 'picosure', 'picoplus', 'bbl', 'lasemd', 'emface', 'co2', 'fractional'];
    return !EBD_KEYWORDS.some((kw) => name.includes(kw));
  });
  return filtered.map((inj) => ({
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
    // ─── Category-first fields (Phase 3-C Task 7) ────────────
    categoryNameKo: inj.category_name_ko ?? inj.category_label ?? '',
    categoryNameEn: inj.category_name_en ?? inj.category ?? '',
    categoryReason: inj.category_reason ?? '',
    matchScore: inj.match_score ?? Math.round(inj.confidence * 100),
    downtimeDisplay: inj.downtime_display ?? '',
    painLevel: (inj.pain_level ?? 2) as 1 | 2 | 3 | 4 | 5,
    priceTier: (inj.price_tier ?? 2) as 1 | 2 | 3 | 4 | 5,
    alternativeProducts: (inj.alternative_products ?? []).map((alt) => ({
      name: alt.name,
      oneLiner: alt.one_liner,
      matchScore: alt.match_score,
      downtimeDisplay: alt.downtime_display,
      painLevel: alt.pain_level,
      priceTier: alt.price_tier,
    })),
  }));
}

function convertSignatureSolutions(items: OpusSignatureSolution[]): SignatureSolution[] {
  return items.map((s) => ({
    name: s.name,
    description: s.description,
    devices: s.devices,
    injectables: s.injectables,
    totalSessions: s.total_sessions,
    totalDuration: s.total_duration ?? '',
    synergyScore: s.synergy_score,
    synergyExplanation: s.synergy_explanation ?? '',
    steps: (s.steps ?? []).map((step) => ({
      order: step.order,
      type: step.type,
      deviceOrProduct: step.device_or_product,
      category: step.category,
      action: step.action,
      intervalAfter: step.interval_after ?? null,
    })),
  }));
}

function convertTreatmentPlan(plan: OpusTreatmentPlan): TreatmentPlan {
  return {
    title: plan.title ?? '',
    totalVisits: plan.total_visits ?? 0,
    totalDuration: plan.total_duration ?? '',
    phases: plan.phases.map((ph) => ({
      phase: ph.phase,
      name: ph.name,
      period: ph.period,
      treatments: ph.treatments,
      goal: ph.goal,
    })),
    schedule: (plan.schedule ?? []).map((day) => ({
      day: day.day,
      treatments: day.treatments.map((tr) => ({
        type: tr.type,
        deviceOrProduct: tr.device_or_product,
        category: tr.category,
        durationMinutes: tr.duration_minutes,
        note: tr.note,
      })),
      postCare: day.post_care,
    })),
    precautions: plan.precautions ?? [],
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

// ─── Currency formatting by country ─────────────────────────
const CURRENCY_CONFIG: Record<string, { symbol: string; rate: number; unit: string; unitDiv: number }> = {
  KR: { symbol: '₩', rate: 1, unit: '만', unitDiv: 10000 },
  JP: { symbol: '¥', rate: 0.11, unit: '', unitDiv: 1 },
  TW: { symbol: 'NT$', rate: 0.024, unit: '', unitDiv: 1 },
};
const DEFAULT_CURRENCY = { symbol: '$', rate: 0.00075, unit: '', unitDiv: 1 };

function getCurrency(country: string) {
  return CURRENCY_CONFIG[country] || DEFAULT_CURRENCY;
}

function formatPrice(krw: number, country: string): string {
  const c = getCurrency(country);
  const converted = Math.round(krw * c.rate / (c.unitDiv || 1));
  if (c.unit) return `${c.symbol}${converted.toLocaleString()}${c.unit}`;
  return `${c.symbol}${converted.toLocaleString()}`;
}

function formatRange(krwMin: number, krwMax: number, country: string): string {
  return `${formatPrice(krwMin, country)}~${formatPrice(krwMax, country)}`;
}

// ─── Tier guide descriptions (i18n) ─────────────────────────
const TIER_DESC: Record<string, Record<SurveyLang, string>> = {
  premium: {
    KO: '최신 프리미엄 장비 + 정품 주사제',
    EN: 'Latest premium devices + authentic injectables',
    JP: '最新プレミアム機器 + 正規注入剤',
    'ZH-CN': '最新高端设备 + 正品注射剂',
  },
  standard: {
    KO: '검증된 장비 + 표준 프로토콜',
    EN: 'Proven devices + standard protocols',
    JP: '実績のある機器 + 標準プロトコル',
    'ZH-CN': '经过验证的设备 + 标准方案',
  },
  value: {
    KO: '핵심 시술만 선별',
    EN: 'Essential treatments only',
    JP: '必須施術のみ厳選',
    'ZH-CN': '仅精选核心项目',
  },
};

// ─── Auto-generate budget from PRICE_MAP + recommendations ──
function generateBudget(
  ebdRecs: EBDRecommendation[],
  injRecs: InjectableRecommendation[],
  lang: SurveyLang,
  country: string,
): BudgetEstimate {
  const lineItems: BudgetEstimate['lineItems'] = [];

  // EBD devices
  for (const rec of ebdRecs) {
    const key = rec.deviceName.toLowerCase().replace(/[\s-]+/g, '_');
    const price = PRICE_MAP[key] || PRICE_MAP[Object.keys(PRICE_MAP).find((k) => key.includes(k)) ?? ''];
    const sessions = parseInt(rec.practical.sessions) || 1;
    if (price) {
      const avg = Math.round((price.krMin + price.krMax) / 2);
      lineItems.push({
        treatment: rec.deviceName,
        category: rec.categoryNameEn || 'EBD',
        sessions,
        unitPrice: formatRange(price.krMin, price.krMax, country),
        subtotal: formatPrice(avg * sessions, country),
      });
    }
  }

  // Injectables
  for (const rec of injRecs) {
    const key = rec.name.toLowerCase().replace(/[\s()-]+/g, '_');
    const price = PRICE_MAP[key] || PRICE_MAP[Object.keys(PRICE_MAP).find((k) => key.includes(k)) ?? ''];
    const sessions = parseInt(rec.practical.sessions) || 1;
    if (price) {
      const avg = Math.round((price.krMin + price.krMax) / 2);
      lineItems.push({
        treatment: rec.name,
        category: rec.categoryNameEn || 'Injectable',
        sessions,
        unitPrice: formatRange(price.krMin, price.krMax, country),
        subtotal: formatPrice(avg * sessions, country),
      });
    }
  }

  // Total range (sum subtotals in KRW, then convert)
  const totalKRW = lineItems.reduce((sum, _li, idx) => {
    // Re-compute from raw data
    const allRecs = [...ebdRecs, ...injRecs];
    const r = allRecs[idx];
    if (!r) return sum;
    const name = 'deviceName' in r ? (r as EBDRecommendation).deviceName : (r as InjectableRecommendation).name;
    const key2 = name.toLowerCase().replace(/[\s()-]+/g, '_');
    const p = PRICE_MAP[key2] || PRICE_MAP[Object.keys(PRICE_MAP).find((k) => key2.includes(k)) ?? ''];
    const sess = parseInt(r.practical.sessions) || 1;
    if (p) return sum + Math.round((p.krMin + p.krMax) / 2) * sess;
    return sum;
  }, 0);

  const tierGuides: BudgetEstimate['tierGuides'] = [
    { tier: 'premium', description: TIER_DESC.premium[lang] ?? TIER_DESC.premium.EN, range: `${formatPrice(Math.round(totalKRW * 1.3), country)}~` },
    { tier: 'standard', description: TIER_DESC.standard[lang] ?? TIER_DESC.standard.EN, range: `${formatPrice(Math.round(totalKRW * 0.8), country)}~${formatPrice(totalKRW, country)}` },
    { tier: 'value', description: TIER_DESC.value[lang] ?? TIER_DESC.value.EN, range: `~${formatPrice(Math.round(totalKRW * 0.6), country)}` },
  ];

  return {
    totalRange: lineItems.length > 0 ? `${formatPrice(Math.round(totalKRW * 0.7), country)} ~ ${formatPrice(Math.round(totalKRW * 1.3), country)}` : '',
    segments: [],
    lineItems,
    tierGuides,
    roiNote: '',
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
    lang: rec.lang?.toUpperCase() || demo.detected_language,
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
    budgetEstimate: generateBudget(
      convertEBD(rec.ebd_recommendations),
      convertInjectable(rec.injectable_recommendations),
      (rec.lang?.toUpperCase() || demo.detected_language) as SurveyLang,
      demo.detected_country || 'KR',
    ),
    doctorTab: convertDoctorTab(rec.doctor_tab),
  };
}

// ─── Mock mode check ──────────────────────────────────────────
const IS_MOCK_MODE = process.env.NEXT_PUBLIC_AI_MOCK === 'true';

// ═══════════════════════════════════════════════════════════════
//  Airtable Fallback — fetch from /api/report-v2/[id]
//  Returns StoredReportPayload or null
// ═══════════════════════════════════════════════════════════════

async function fetchFromAirtable(reportId: string): Promise<StoredReportPayload | null> {
  try {
    const res = await fetch(`/api/report-v2/${encodeURIComponent(reportId)}`);
    if (!res.ok) {
      console.error(`[useReportData] API ${res.status}: ${res.statusText}`);
      return null;
    }

    const json = await res.json();

    // The API returns StoredReportPayload-compatible shape
    const payload: StoredReportPayload = {
      recommendation: json.recommendation,
      model: json.model,
      usage: json.usage,
      survey_state: {
        demographics: {
          detected_language: json.survey_state.demographics.detected_language as SurveyLang,
          detected_country: json.survey_state.demographics.detected_country,
          d_gender: json.survey_state.demographics.d_gender,
          d_age: json.survey_state.demographics.d_age,
        },
        safety_flags: json.survey_state.safety_flags as SafetyFlag[],
        open_question_raw: json.survey_state.open_question_raw,
      },
      created_at: json.created_at,
    };

    // Cache in sessionStorage for subsequent navigations within this tab
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      console.info('[useReportData] Airtable data cached to sessionStorage');
    } catch {
      // sessionStorage may be full or unavailable — non-blocking
    }

    return payload;
  } catch (err) {
    console.error('[useReportData] Airtable fallback fetch failed:', err);
    return null;
  }
}

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

    // ─── Helper: process payload → validate → set state ───────
    function applyPayload(payload: StoredReportPayload) {
      const detectedLang = payload.survey_state.demographics.detected_language;
      setLang(detectedLang);

      const reportData = convertPayloadToReportV7Data(payload);

      const { data: validated, warnings } = validateRecommendation(reportData);
      if (warnings.length > 0) {
        console.warn('[useReportData] Validation warnings:', warnings);
      }

      setData(validated);
      setStatus('success');
    }

    // ─── Step 1: Try sessionStorage (fully synchronous) ───────
    try {
      const raw = typeof window !== 'undefined'
        ? sessionStorage.getItem(STORAGE_KEY)
        : null;

      if (raw) {
        console.info('[useReportData] Loading from sessionStorage');
        const payload: StoredReportPayload = JSON.parse(raw);
        applyPayload(payload);
        return; // Done — no cleanup needed
      }
    } catch (err) {
      console.error('[useReportData] sessionStorage parse failed:', err);
      // Fall through to Airtable fetch
    }

    // ─── Step 2: Airtable fallback (async, with cancel guard) ─
    let cancelled = false;
    console.info('[useReportData] sessionStorage empty — fetching from Airtable');

    fetchFromAirtable(reportId)
      .then((payload) => {
        if (cancelled) return;

        if (!payload) {
          setError('Report not found. The link may be invalid or expired.');
          setStatus('error');
          return;
        }

        try {
          applyPayload(payload);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to process report data.';
          setError(message);
          setStatus('error');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load report data.';
        setError(message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  return { data, status, error, lang };
}

// ─── Re-export for [id].tsx consultation request ──────────────
export type { StoredReportPayload };
