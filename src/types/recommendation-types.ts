// ═══════════════════════════════════════════════════════════════
//  Final Recommendation Types — extracted for bundle size reduction
// ═══════════════════════════════════════════════════════════════

import type {
  Demographics, HaikuAnalysis, SafetyFlag, BudgetSelection,
  ManagementFrequency, EventInfo,
} from '@/types/survey-v2';

export interface FinalRecommendationRequest {
  demographics: Demographics;
  haiku_analysis: HaikuAnalysis;
  chip_responses: Record<string, string>;
  prior_applied: string[];
  prior_values: Record<string, string>;
  safety_flags: SafetyFlag[];
  safety_followup_answers: Record<string, string>;
  open_question_raw: string;
  q1_primary_goal: string | null;
  q1_goal_secondary: string | null;
  q3_concern_area: string | null;
  q4_skin_profile: string | null;
  q5_style: string | null;
  q6_pain_tolerance: string | null;
  q6_downtime_tolerance: string | null;
  q7_past_experience: string | null;
  q2_risk_flags: string[];
  q2_pigment_pattern: string | null;
  q3_volume_logic: string | null;
  budget?: BudgetSelection | null;
  stay_duration?: number | null;
  management_frequency?: ManagementFrequency | null;
  event_info?: EventInfo | null;
  branch_responses?: Record<string, unknown> | null;
}

export interface FinalRecommendationResponse {
  recommendation_json: OpusRecommendationOutput;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

export interface OpusRecommendationOutput {
  lang: string;
  generated_at: string;
  model: string;
  patient: OpusPatientProfile;
  safety_flags: Record<string, unknown>;
  mirror: OpusMirrorLayer;
  confidence: OpusConfidenceLayer;
  ebd_recommendations: OpusDeviceRecommendation[];
  injectable_recommendations: OpusInjectableRecommendation[];
  signature_solutions: OpusSignatureSolution[];
  treatment_plan: OpusTreatmentPlan;
  homecare: OpusHomecare;
  doctor_tab: OpusDoctorTab;
}

export interface OpusMirrorLayer {
  headline: string;
  empathy_paragraphs: string;
  transition: string;
}

export interface OpusConfidenceLayer {
  reason_why: string;
  social_proof: string;
  commitment: string;
}

export interface OpusPatientProfile {
  name?: string;
  age: string;
  gender: string;
  country: string;
  aesthetic_goal: string;
  top3_concerns: string[];
  past_treatments: string[];
  fitzpatrick: string;
  pain_sensitivity: number;
  stay_duration?: string;
  contraindications?: string[];
}

export interface OpusDeviceRecommendation {
  rank: number;
  device_name: string;
  device_id: string;
  moa_category: string;
  moa_category_label: string;
  evidence_level: number;
  confidence: number;
  skin_layer: string;
  pain_level: number;
  downtime_level: number;
  safety_level: number;
  badge: string | null;
  badge_color?: string;
  subtitle: string;
  summary_html: string;
  why_fit_html: string;
  moa_summary_title: string;
  moa_summary_short: string;
  moa_description_html: string;
  target_tags: string[];
  practical: { sessions: string; interval: string; duration: string; onset: string; maintain: string };
  scores: Record<string, number>;
  ai_description_html: string;
  slot?: 'premium' | 'trending' | 'value';
  category_id?: string;
  category_name_ko?: string;
  category_name_en?: string;
  category_reason?: string;
  match_score?: number;
  downtime_display?: string;
  price_tier?: 1 | 2 | 3 | 4 | 5;
  alternative_devices?: {
    name: string; one_liner: string; match_score: number;
    downtime_display: string; pain_level: 1|2|3|4|5; price_tier: 1|2|3|4|5;
  }[];
  doctor_note?: {
    suggested_parameters: string; fitzpatrick_adjustment: string;
    safety_flags: string[]; min_interval_days: number;
  };
}

export interface OpusInjectableAlternative {
  name: string; one_liner: string; match_score: number;
  downtime_display: string; pain_level: 1|2|3|4|5; price_tier: 1|2|3|4|5;
}

export interface OpusInjectableRecommendation {
  rank: number;
  name: string;
  injectable_id: string;
  category: string;
  category_label: string;
  evidence_level: number;
  confidence: number;
  skin_layer: string;
  subtitle: string;
  summary_html: string;
  why_fit_html: string;
  moa_summary_title: string;
  moa_summary_short: string;
  moa_description_html: string;
  practical: { sessions: string; interval: string; onset: string; maintain: string };
  scores: Record<string, number>;
  category_name_ko?: string;
  category_name_en?: string;
  category_reason?: string;
  match_score?: number;
  downtime_display?: string;
  pain_level?: 1|2|3|4|5;
  price_tier?: 1|2|3|4|5;
  alternative_products?: OpusInjectableAlternative[];
}

export interface OpusSolutionStep {
  order: number;
  type: 'ebd' | 'injectable';
  device_or_product: string;
  category: string;
  action: string;
  interval_after?: string;
}

export interface OpusSignatureSolution {
  name: string;
  description: string;
  devices: string[];
  injectables: string[];
  total_sessions: string;
  total_duration?: string;
  synergy_score: number;
  synergy_explanation?: string;
  steps?: OpusSolutionStep[];
}

export interface OpusScheduleTreatment {
  type: 'ebd' | 'injectable' | 'consultation';
  device_or_product: string;
  category: string;
  duration_minutes: number;
  note: string;
}

export interface OpusScheduleDay {
  day: string;
  treatments: OpusScheduleTreatment[];
  post_care: string;
}

export interface OpusTreatmentPlan {
  title?: string;
  total_visits?: number;
  total_duration?: string;
  phases: OpusTreatmentPhase[];
  schedule?: OpusScheduleDay[];
  precautions?: string[];
}

export interface OpusTreatmentPhase {
  phase: number;
  name: string;
  period: string;
  treatments: string[];
  goal: string;
}

export interface OpusHomecare {
  morning: string[];
  evening: string[];
  weekly: string[];
  avoid: string[];
}

export interface OpusDoctorTab {
  clinical_summary: string;
  triggered_protocols: string[];
  country_note: string;
  parameter_guidance: Record<string, string>;
  contraindications: string[];
  alternative_options: string[];
  patient_intelligence: {
    expectation_tag: 'REALISTIC' | 'AMBITIOUS' | 'CAUTION';
    expectation_note: string;
    budget_timeline: {
      budget_tier: 'Economy' | 'Standard' | 'Premium';
      decision_speed: 'Slow' | 'Normal' | 'Fast';
      urgency: 'LOW' | 'MEDIUM' | 'HIGH';
      stay_duration: string | null;
    };
    communication_style: 'LOGICAL' | 'EMOTIONAL' | 'ANXIOUS';
    communication_note: string;
  };
  consultation_strategy: {
    recommended_order: string[];
    expected_complaints: string[];
    scenario_summary: string;
  };
}
