// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs Report v7 — Type Definitions
//  Phase 0: Scoped types for the React-based report renderer.
//
//  Re-exports SurveyLang from survey-v2 for single import convenience.
//  Defines view-model interfaces aligned with report-v7-premium.html.
//  NO `any` or `unknown` types allowed.
// ═══════════════════════════════════════════════════════════════

export type { SurveyLang } from './survey-v2';

// ─── Safety ────────────────────────────────────────────────────
/** Display-oriented safety flag for report UI (distinct from survey-v2's SafetyFlag union). */
export interface ReportSafetyFlag {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

// ─── Patient Profile ──────────────────────────────────────────
export interface ReportPatientProfile {
  name: string;
  age: string;
  gender: string;
  country: string;
  aestheticGoal: string;
  top3Concerns: string[];
  pastTreatments: string[];
  fitzpatrick: string;
  painSensitivity: number;
  stayDuration: string;
  contraindications: string[];
}

/** Default patient profile for safe destructuring */
export const DEFAULT_PATIENT_PROFILE: ReportPatientProfile = {
  name: '',
  age: '',
  gender: '',
  country: 'KR',
  aestheticGoal: '',
  top3Concerns: [],
  pastTreatments: [],
  fitzpatrick: '',
  painSensitivity: 3,
  stayDuration: '',
  contraindications: [],
};

// ─── Mirror & Confidence Layers ───────────────────────────────
export interface MirrorLayer {
  headline: string;
  empathyParagraphs: string;
  transition: string;
}

export const DEFAULT_MIRROR_LAYER: MirrorLayer = {
  headline: '',
  empathyParagraphs: '',
  transition: '',
};

export interface ConfidenceLayer {
  reasonWhy: string;
  socialProof: string;
  commitment: string;
}

export const DEFAULT_CONFIDENCE_LAYER: ConfidenceLayer = {
  reasonWhy: '',
  socialProof: '',
  commitment: '',
};

// ─── Practical Info ───────────────────────────────────────────
export interface PracticalInfo {
  sessions: string;
  interval: string;
  duration: string;
  onset: string;
  maintain: string;
}

export const DEFAULT_PRACTICAL_INFO: PracticalInfo = {
  sessions: '',
  interval: '',
  duration: '',
  onset: '',
  maintain: '',
};

// ─── EBD (Device) Recommendation ──────────────────────────────
export interface EBDAlternativeDevice {
  name: string;
  oneLiner: string;
  matchScore: number;
  downtimeDisplay: string;
  painLevel: 1 | 2 | 3 | 4 | 5;
  priceTier: 1 | 2 | 3 | 4 | 5;
}

export interface EBDDoctorNote {
  suggestedParameters: string;
  fitzpatrickAdjustment: string;
  safetyFlags: string[];
  minIntervalDays: number;
}

export interface EBDRecommendation {
  rank: number;
  deviceName: string;
  deviceId: string;
  moaCategory: string;
  moaCategoryLabel: string;
  evidenceLevel: number;
  confidence: number;
  skinLayer: string;
  painLevel: number;
  downtimeLevel: number;
  safetyLevel: number;
  badge: string | null;
  badgeColor: string;
  subtitle: string;
  summaryHtml: string;
  whyFitHtml: string;
  moaSummaryTitle: string;
  moaSummaryShort: string;
  moaDescriptionHtml: string;
  targetTags: string[];
  practical: PracticalInfo;
  scores: Record<string, number>;
  aiDescriptionHtml: string;
  // ─── Category-first fields (Phase 3-C Task 2) ────────────
  slot: 'premium' | 'trending' | 'value' | null;
  categoryId: string;
  categoryNameKo: string;
  categoryNameEn: string;
  categoryReason: string;
  matchScore: number;
  downtimeDisplay: string;
  priceTier: 1 | 2 | 3 | 4 | 5;
  alternativeDevices: EBDAlternativeDevice[];
  doctorNote: EBDDoctorNote | null;
}

// ─── Injectable Recommendation ────────────────────────────────
export interface InjectableRecommendation {
  rank: number;
  name: string;
  injectableId: string;
  category: string;
  categoryLabel: string;
  evidenceLevel: number;
  confidence: number;
  skinLayer: string;
  subtitle: string;
  summaryHtml: string;
  whyFitHtml: string;
  moaSummaryTitle: string;
  moaSummaryShort: string;
  moaDescriptionHtml: string;
  practical: PracticalInfo;
  scores: Record<string, number>;
}

// ─── Signature Solution ───────────────────────────────────────
export interface SignatureSolution {
  name: string;
  description: string;
  devices: string[];
  injectables: string[];
  totalSessions: string;
  synergyScore: number;
}

// ─── Treatment Plan ───────────────────────────────────────────
export interface TreatmentPhase {
  phase: number;
  name: string;
  period: string;
  treatments: string[];
  goal: string;
}

export interface TreatmentPlan {
  phases: TreatmentPhase[];
}

export const DEFAULT_TREATMENT_PLAN: TreatmentPlan = {
  phases: [],
};

// ─── Homecare ─────────────────────────────────────────────────
export interface HomecareGuide {
  morning: string[];
  evening: string[];
  weekly: string[];
  avoid: string[];
}

export const DEFAULT_HOMECARE_GUIDE: HomecareGuide = {
  morning: [],
  evening: [],
  weekly: [],
  avoid: [],
};

// ─── Doctor Tab (Phase 0: read-only) ──────────────────────────
export interface PatientIntelligence {
  expectationTag: 'REALISTIC' | 'AMBITIOUS' | 'CAUTION';
  expectationNote: string;
  budgetTimeline: {
    budgetTier: 'Economy' | 'Standard' | 'Premium';
    decisionSpeed: 'Slow' | 'Normal' | 'Fast';
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
    stayDuration: string | null;
  };
  communicationStyle: 'LOGICAL' | 'EMOTIONAL' | 'ANXIOUS';
  communicationNote: string;
}

export interface ConsultationStrategy {
  recommendedOrder: string[];
  expectedComplaints: string[];
  scenarioSummary: string;
}

export interface DoctorTab {
  clinicalSummary: string;
  triggeredProtocols: string[];
  countryNote: string;
  parameterGuidance: Record<string, string>;
  contraindications: string[];
  alternativeOptions: string[];
  patientIntelligence: PatientIntelligence;
  consultationStrategy: ConsultationStrategy;
}

export const DEFAULT_DOCTOR_TAB: DoctorTab = {
  clinicalSummary: '',
  triggeredProtocols: [],
  countryNote: '',
  parameterGuidance: {},
  contraindications: [],
  alternativeOptions: [],
  patientIntelligence: {
    expectationTag: 'REALISTIC',
    expectationNote: '',
    budgetTimeline: {
      budgetTier: 'Standard',
      decisionSpeed: 'Normal',
      urgency: 'MEDIUM',
      stayDuration: null,
    },
    communicationStyle: 'LOGICAL',
    communicationNote: '',
  },
  consultationStrategy: {
    recommendedOrder: [],
    expectedComplaints: [],
    scenarioSummary: '',
  },
};

// ─── Budget Estimate ─────────────────────────────────────────
export interface BudgetSegment {
  label: string;
  category: 'foundation' | 'main' | 'maintenance';
  percentage: number;
  amount: string;
}

export interface BudgetEstimate {
  totalRange: string;
  segments: BudgetSegment[];
  roiNote: string;
}

export const DEFAULT_BUDGET_ESTIMATE: BudgetEstimate = {
  totalRange: '',
  segments: [],
  roiNote: '',
};

// ─── ReportV7Data (전체 리포트 데이터) ─────────────────────────
export interface ReportV7Data {
  lang: string;
  generatedAt: string;
  model: string;
  patient: ReportPatientProfile;
  safetyFlags: ReportSafetyFlag[];
  // 3-Layer Patient Report
  mirror: MirrorLayer;
  confidence: ConfidenceLayer;
  // Recommendations
  ebdRecommendations: EBDRecommendation[];
  injectableRecommendations: InjectableRecommendation[];
  signatureSolutions: SignatureSolution[];
  treatmentPlan: TreatmentPlan;
  homecare: HomecareGuide;
  budgetEstimate: BudgetEstimate;
  // Doctor tab (Phase 0: read-only view)
  doctorTab: DoctorTab;
}

export const DEFAULT_REPORT_V7_DATA: ReportV7Data = {
  lang: 'KO',
  generatedAt: '',
  model: '',
  patient: DEFAULT_PATIENT_PROFILE,
  safetyFlags: [],
  mirror: DEFAULT_MIRROR_LAYER,
  confidence: DEFAULT_CONFIDENCE_LAYER,
  ebdRecommendations: [],
  injectableRecommendations: [],
  signatureSolutions: [],
  treatmentPlan: DEFAULT_TREATMENT_PLAN,
  homecare: DEFAULT_HOMECARE_GUIDE,
  budgetEstimate: DEFAULT_BUDGET_ESTIMATE,
  doctorTab: DEFAULT_DOCTOR_TAB,
};

// ─── 3-Depth Rendering Model ──────────────────────────────────
/** Depth 0: Immediately visible on load */
export type Depth0Section =
  | 'mirror'
  | 'confidence'
  | 'patientProfile'
  | 'ebdCards'
  | 'injectableCards'
  | 'radarChart';

/** Depth 1: Revealed on user click/expand */
export type Depth1Section =
  | 'cardDetail'
  | 'whyFit'
  | 'moaInline'
  | 'gauges'
  | 'synergyPairs';

/** Depth 2: Lazy-loaded on scroll or explicit request */
export type Depth2Section =
  | 'treatmentPlan'
  | 'skinLayerDiagram'
  | 'signatureSolutions'
  | 'homecare'
  | 'doctorTab';
