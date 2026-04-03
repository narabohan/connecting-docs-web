// ═══════════════════════════════════════════════════════════════
//  POST /api/survey-v2/final-recommendation
//  Sonnet 4.6 Final Recommender — generates the full treatment plan
//  Prompt Caching enabled: static prompt cached, dynamic per-patient
//  Based on HYBRID_SURVEY_LOGIC_v2.md §7 + COUNTRY_RECOMMENDATION_WEIGHTS.md
// ═══════════════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk';
import type {
  Demographics,
  HaikuAnalysis,
  SafetyFlag,
  SurveyLang,
  BudgetSelection,
  ManagementFrequency,
  EventInfo,
} from '@/types/survey-v2';
import { buildClinicalRulesPromptBlock } from '@/lib/clinical-rules';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Request / Response Types ────────────────────────────────

export interface FinalRecommendationRequest {
  demographics: Demographics;
  haiku_analysis: HaikuAnalysis;  // includes expectation_tag, communication_style, lifestyle_context
  chip_responses: Record<string, string>;
  prior_applied: string[];
  prior_values: Record<string, string>;
  safety_flags: SafetyFlag[];
  safety_followup_answers: Record<string, string>;
  open_question_raw: string;
  // Mapped signals (final state from useSurveyV2)
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
  // Phase 2 fields
  budget?: BudgetSelection | null;
  stay_duration?: number | null;
  management_frequency?: ManagementFrequency | null;
  event_info?: EventInfo | null;
}

export interface FinalRecommendationResponse {
  recommendation_json: OpusRecommendationOutput;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

/** Structured Opus output matching SAMPLE_OPUS_OUTPUT.json */
export interface OpusRecommendationOutput {
  lang: string;
  generated_at: string;
  model: string;
  patient: OpusPatientProfile;
  safety_flags: Record<string, unknown>;
  // ─── 3-Layer Patient Report (MIRROR_CONFIDENCE_PROMPT §1) ──
  mirror: OpusMirrorLayer;           // 1층 거울 — "이게 나야" 감성공감
  confidence: OpusConfidenceLayer;   // 2층 확신 — "해결 가능하구나" 임상자신감
  // 3층 솔루션 = ebd_recommendations + injectable_recommendations + signature_solutions
  ebd_recommendations: OpusDeviceRecommendation[];
  injectable_recommendations: OpusInjectableRecommendation[];
  signature_solutions: OpusSignatureSolution[];
  treatment_plan: OpusTreatmentPlan;
  homecare: OpusHomecare;
  doctor_tab: OpusDoctorTab;
}

// ─── 1층 거울 (Mirror): "이게 나야" 감성공감 (MIRROR_CONFIDENCE_PROMPT §2) ──
export interface OpusMirrorLayer {
  headline: string;           // 첫 한 줄 — "이게 나야" 모먼트 (≤15 words)
  empathy_paragraphs: string; // 2-3문단 공감 텍스트 (환자 본인 언어 패턴)
  transition: string;         // 거울→확신 전환 문장 ("그리고 방법이 있습니다")
}

// ─── 2층 확신 (Confidence): "해결 가능하구나" 임상자신감 (§3) ──
export interface OpusConfidenceLayer {
  reason_why: string;         // "왜 변할 수 있는지" 2-3문단 (피부과학 환자 언어)
  social_proof: string;       // 동일 고민 환자 통계/패턴 1문단
  commitment: string;         // "방법이 있습니다" 확신 전환 1문장
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
  practical: {
    sessions: string;
    interval: string;
    duration: string;
    onset: string;
    maintain: string;
  };
  scores: Record<string, number>;
  ai_description_html: string;
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
  practical: {
    sessions: string;
    interval: string;
    onset: string;
    maintain: string;
  };
  scores: Record<string, number>;
}

export interface OpusSignatureSolution {
  name: string;
  description: string;
  devices: string[];
  injectables: string[];
  total_sessions: string;
  synergy_score: number;
}

export interface OpusTreatmentPlan {
  phases: OpusTreatmentPhase[];
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
  // ─── Doctor Intelligence 3요소 (Issue 0-5) ─────────────────
  patient_intelligence: {
    expectation_tag: 'REALISTIC' | 'AMBITIOUS' | 'CAUTION';
    expectation_note: string;          // 기대치 관련 간단 설명
    budget_timeline: {
      budget_tier: 'Economy' | 'Standard' | 'Premium';
      decision_speed: 'Slow' | 'Normal' | 'Fast';
      urgency: 'LOW' | 'MEDIUM' | 'HIGH';
      stay_duration: string | null;    // 체류 기간 (의료관광 환자)
    };
    communication_style: 'LOGICAL' | 'EMOTIONAL' | 'ANXIOUS';
    communication_note: string;        // 상담 시 권장 접근법
  };
  consultation_strategy: {
    recommended_order: string[];       // 설명 순서 (e.g. ["안전성", "비포/애프터", "옵션 제시"])
    expected_complaints: string[];     // 예상 컴플레인 포인트
    scenario_summary: string;          // 추천 상담 시나리오 요약
  };
}

// ─── Country Context Blocks ──────────────────────────────────

const COUNTRY_CONTEXTS: Record<string, string> = {
  JP: `[COUNTRY_CONTEXT: JAPAN]
이 환자는 일본에서 접속했습니다.
일본 환자 특성: 안전성과 부작용 최소화를 최우선시합니다. 저통증 시술을 강하게 선호하며, 자연스러운 결과를 원하고, 다운타임에 매우 민감합니다.
추천 시 지침: 부작용 프로필이 가장 안전한 장비를 우선 추천. pain_level: None~Low 장비 가중 +2. 다운타임 정보를 명확히 고지. "안전하고 검증된 선택"으로 프레이밍. 공격적 시술은 대안으로만 제시.`,

  CN: `[COUNTRY_CONTEXT: CHINA]
이 환자는 중국에서 접속했습니다.
중국 환자 특성: 드라마틱한 Before/After 결과를 원합니다. 프리미엄 장비/브랜드를 선호하며, PIH 안전성에 민감하고, 1회 시술 극대화 효과를 선호합니다.
추천 시 지침: 효과가 강력한 장비를 1순위로 추천. 프리미엄 브랜드(Ulthera, Thermage FLX 등) 가중 +2. PIH-safe 장비 우선. 시술 전후 사진 효과를 기대할 수 있는 조합 강조.`,

  SEA: `[COUNTRY_CONTEXT: SOUTHEAST_ASIA]
이 환자는 동남아시아에서 접속했습니다.
동남아 환자 특성: 비침습 시술을 선호하며, 가성비에 민감하고, 최소 다운타임을 원하며, K-Beauty 트렌드에 관심이 높습니다.
추천 시 지침: 비침습 장비 우선 (downtime: None~Low 가중 +2). 패키지 가격 대비 효과 강조. 트렌드 시술명 언급. Fitz IV-V 에너지 파라미터 적용.`,

  'SG/US': `[COUNTRY_CONTEXT: SINGAPORE_US]
이 환자는 싱가포르 또는 미국에서 접속했습니다.
이 지역 환자 특성: 시술 메커니즘(MOA) 설명의 투명성을 원합니다. FDA/CE 인증 정보를 중시하며, 근거 기반 추천을 신뢰하고, 전문 의학 용어 사용을 꺼리지 않습니다.
추천 시 지침: MOA 설명을 상세히 포함. evidence_score 높은 장비 가중 +2. FDA/CE 인증 상태 명시. "왜 이 장비인가"의 과학적 근거 강조.`,

  KR: `[COUNTRY_CONTEXT: KOREA]
이 환자는 한국에서 접속했습니다.
한국 환자 특성: 레이어링/콤비네이션 시술에 익숙합니다. 최신 트렌드 장비에 관심이 높으며, 비용 최적화를 중시하고, 시술 경험이 풍부한 편입니다.
추천 시 지침: 콤비네이션 시너지 효과 적극 강조. 최신 장비(2024-2025 출시) 가산점. 가격 대비 효과 비교 적극 제공.`,
};

function getCountryContext(country: string): string {
  if (COUNTRY_CONTEXTS[country]) return COUNTRY_CONTEXTS[country];
  if (['TH', 'VN', 'MY', 'ID', 'PH'].includes(country)) return COUNTRY_CONTEXTS['SEA'];
  if (['SG', 'US', 'AU', 'GB', 'CA'].includes(country)) return COUNTRY_CONTEXTS['SG/US'];
  return COUNTRY_CONTEXTS['KR']; // fallback
}

// ─── Age Bracket Logic (Issue #6) ────────────────────────────
// Determines age-specific clinical weighting context for the AI prompt.
// Detailed clinical rules per bracket will be added with clinical data.

type AgeBracket = '20s' | '30s' | '40s' | '50+';

function parseAgeBracket(ageStr: string): AgeBracket {
  // d_age format: "20-29", "30-39", "40-49", "50-59", "60+"
  const num = parseInt(ageStr, 10);
  if (isNaN(num) || num < 30) return '20s';
  if (num < 40) return '30s';
  if (num < 50) return '40s';
  return '50+';
}

const AGE_BRACKET_CONTEXTS: Record<AgeBracket, string> = {
  '20s': `[AGE_CONTEXT: 20s — Prevention & Foundation]
Clinical focus: 예방적 콜라겐 자극 + barrier 강화. 공격적 시술 불필요.
Zone priority: 전체 균일 (특정 zone targeting 미필요).
Device rules:
- 1st line: Low-energy MN-RF (Sylfirm X, Potenza low-tip) → collagen priming
- 2nd line: Gentle PICO toning (1064nm low-fluence) for 톤 정리 if needed
- Avoid: HIFU (불필요한 SMAS 자극), aggressive ablative lasers
Injectable rules:
- 1st: 스킨부스터 (Juvelook, Rejuran HB) → hydration + barrier maintenance
- 2nd: Exosome (ASCE+) if regeneration needed
- Avoid: Biostimulators (Sculptra) — 20대에 콜라겐 손실이 미미하므로 과잉
Weight adjustments: texture +2, evidence +1, roi +2. tightening/lifting weights neutral.
Treatment rhythm: 4-6주 간격 스킨부스터 routine → quarterly device maintenance.
Confidence calibration: recommend with lower urgency framing ("예방 차원").`,

  '30s': `[AGE_CONTEXT: 30s — Early Intervention]
Clinical focus: 초기 노화 징후 대응. 콜라겐 리모델링 + 탄력 유지 핵심기.
Zone priority: 눈가(periorbital) > 팔자(nasolabial) > 턱선(jawline early laxity).
Device rules:
- 1st line: MN-RF (Sylfirm X PW, Genius RF) — dermal remodeling at reticular dermis
- 2nd line: Low-mid HIFU (Ultraformer MPT 3.0mm) for early SMAS tightening
- 3rd line: PICO (PicoSure/PicoWay 1064nm) for pigment prevention + tone
- Combination: MN-RF + HIFU layering (2주 간격) for synergistic collagen response
Injectable rules:
- 1st: PN/PDRN (Rejuran Healer) → tissue repair + elasticity
- 2nd: Exosome (ASCE+) → growth factor boost
- 3rd: 스킨부스터 routine (Juvelook 2-4주 간격)
- Hold on: 필러 — unless specific volume concern (tear trough, temple hollowing)
Weight adjustments: tightening +1, elasticity +2, texture +1, prevention +2.
Energy parameters: MN-RF 0.5-1.5mm depth, HIFU 3.0mm cartridge preferred.
Treatment plan: Phase 1 (MN-RF 3회) → Phase 2 (HIFU maintenance quarterly).`,

  '40s': `[AGE_CONTEXT: 40s — Active Restoration]
Clinical focus: 중등도 노화. 볼륨 감소 + 중안부 처짐 본격화. 복합 시술 필수.
Zone priority: 중안부(볼/광대 volume loss) > 하안부(턱선 laxity) > 상안부(이마 주름).
Device rules:
- 1st line: HIFU mid-high energy (Ultraformer MPT 3.0+4.5mm / Ulthera 4.0mm) → SMAS layer tightening
- 2nd line: MN-RF (Genius RF / Morpheus8 deep tip) → dermal volumization + textural improvement
- 3rd line: Thread lift (Mint/Omega) for mechanical lift if laxity moderate+
- Combination MANDATORY: HIFU + MN-RF (3-4주 간격), Thread + 스킨부스터 (2주 후)
Injectable rules:
- 1st: Biostimulator (Sculptra 2-3 vials/session, Lanluma) → 볼륨+콜라겐 동시
- 2nd: HA filler for structural support (mid-face, temple, chin) — if volume loss significant
- 3rd: PN/PDRN (Rejuran Healer) maintenance between sessions
Weight adjustments: lifting +2, volume +3, synergy +2, longevity +1.
Energy parameters: HIFU 4.5mm SMAS + 3.0mm deep dermal. MN-RF 1.5-3.5mm depth.
IMPORTANT: 40대부터는 단일 디바이스 시술 효과 제한적 → 반드시 combination protocol 강조.
Treatment plan: Phase 1 (HIFU+MN-RF 3-4회, 3-4주 간격) → Phase 2 (Biostim 3회, 4주 간격) → Phase 3 (quarterly maintenance).`,

  '50+': `[AGE_CONTEXT: 50+ — Multi-Layer Restoration]
Clinical focus: 심한 처짐 + 볼륨 손실 + 피부 위축. 다층 접근 필수.
Zone priority: 중안부 타이트닝(mid-face tightening) ≠ 하안부 리프팅(jawline lifting) → 별도 목표로 치료.
Device rules:
- 1st line: High-energy HIFU (Ulthera 4.0+4.5mm / Ultraformer MPT full-face) → deep SMAS contraction
- 2nd line: RF + MN-RF combo (Thermage FLX body tip for jawline + Genius RF for mid-face)
- 3rd line: Thread lift (essential for 50+ moderate-severe laxity) — PDO or Mint threads
- CRITICAL: 50+ needs layered approach — HIFU for SMAS → Thread for mechanical lift → MN-RF for dermal quality → 스킨부스터 for hydration top layer
Injectable rules:
- 1st: HA filler VOLUME restoration (deep injection: temple, mid-face, marionette) — 2-4cc per session
- 2nd: Biostimulator (Sculptra 3-4 vials, multiple sessions) for gradual collagen rebuild
- 3rd: PN/PDRN for skin quality between procedures
- AVOID: superficial-only treatments — 50+ 피부에 표피 시술만으로는 효과 불충분
Weight adjustments: lifting +3, volume +3, longevity +2, safety +2, evidence +1.
Energy parameters: HIFU 4.5mm preferred, conservative start (lower line density) → escalate by session.
IMPORTANT RULES:
- 중안부(mid-face): volume restoration + SMAS tightening → Filler + HIFU
- 하안부(lower face): mechanical lift + skin tightening → Thread + RF
- 이 두 zone을 하나의 시술로 해결하려 하지 마라. 각각 별도 치료 목표.
- Multi-session mandatory (minimum 3-4 sessions over 3-6 months for meaningful results).
- Pain management: 50+ 환자는 시술 내성이 낮을 수 있음 → pain_level consideration +1.
Treatment plan: Phase 1 Acute (HIFU + Thread, month 1-2) → Phase 2 Volume (Filler + Biostim, month 2-4) → Phase 3 Refinement (MN-RF + Skinbooster, month 4-6) → Maintenance (quarterly).`,
};

function getAgeBracketContext(ageStr: string): string {
  const bracket = parseAgeBracket(ageStr);
  return AGE_BRACKET_CONTEXTS[bracket];
}

// ─── Enhanced Country Clinical Rules (Issue #6) ──────────────
// More granular country-specific clinical rules beyond general preferences.
// Skeleton with placeholders for clinical data.

const COUNTRY_CLINICAL_RULES: Record<string, string> = {
  KR: `[COUNTRY_CLINICAL: KR]
Fitzpatrick: III-IV typical. PIH risk: moderate.
Preferred combo patterns: MN-RF + HIFU layering (3-4주 간격), 스킨부스터 routine (2-4주 간격).
Price sensitivity: high → ROI score weight +2, roi 점수 높은 장비 우선.
Device familiarity: very high → advanced multi-device combos OK (3-device protocol acceptable).
Device preferences:
- HIFU: Ultraformer MPT 선호 (KR 시장 1위, 가격 대비 효과 우수)
- MN-RF: Sylfirm X PW-mode 선호 (기미 환자 안전성)
- 스킨부스터: Juvelook > Rejuran > ASCE+ (보험/가격 구조 영향)
Energy parameters: KR 의사 경험치 높으므로 standard-to-aggressive fluence 가능.
Combination emphasis: 시너지 점수(synergy) 높은 프로토콜 적극 추천. 한국 환자는 복합 시술에 익숙.
Scheduling: 2-4주 tight interval acceptable (KR 환자 compliance 높음).`,

  JP: `[COUNTRY_CLINICAL: JP]
Fitzpatrick: II-III typical. PIH risk: moderate-low (but patient concern is VERY HIGH).
Conservative approach mandatory: lowest effective energy → 점진적 escalation over sessions.
Single-device clarity preferred: 2-device combo max. 3+ device protocols confuse JP patients.
Device preferences:
- HIFU: Ulthera preferred (FDA-approved brand trust), Ultraformer acceptable
- RF: Thermage FLX 1위 (JP market dominance). Monopolar RF highly trusted.
- MN-RF: Potenza preferred in JP (Cynosure brand trust)
- 스킨부스터: Rejuran Healer dominant (PDRN 인지도 높음), Juvelook growing
Safety documentation: evidence score weight +2. Must cite clinical study counts.
Pain management: ALWAYS address pain mitigation in practical info. Numbing cream + cooling mandatory mention.
Scheduling: 4-6주 longer intervals preferred (JP patients prefer fewer visits with clear milestones).
Communication style: conservative claims, avoid superlatives, factual and measured tone.`,

  CN: `[COUNTRY_CLINICAL: CN]
Fitzpatrick: III-IV typical. PIH risk: moderate-high (Fitz IV common).
Brand prestige: +3 weighting for premium global brands (Ulthera, Thermage FLX, Cynosure).
Single-session maximization: high-energy single session > multiple low-energy sessions.
Device preferences:
- HIFU: Ulthera 1위 (luxury positioning), Thermage FLX 2위
- MN-RF: Morpheus8 (US brand appeal), Genius RF
- Injectable: Sculptra + HA filler combo (볼륨 극대화 인기)
- 스킨부스터: 수광주사 (water-light injection) category — ASCE+ Exosome trending rapidly
Dramatic result expectation: confidence >85 only. Under-promising is poorly received.
PIH consideration: Fitz IV patients → 532nm laser restricted. 1064nm + PW-mode MN-RF only for pigment.
Energy parameters: aggressive acceptable if PIH-safe. CN patients tolerate higher pain for results.
Scheduling: 1-2 month intervals. Prefer "몇 회면 끝" (X sessions to complete) framing.`,

  SEA: `[COUNTRY_CLINICAL: SEA — TH/VN/MY/ID/PH]
Fitzpatrick: IV-V typical. PIH risk: HIGH — CRITICAL safety parameter.
MANDATORY PIH RULES:
- Laser wavelength: 1064nm ONLY for pigment. NEVER 532nm or 755nm on Fitz V.
- MN-RF: PW-mode mandatory (Sylfirm X preferred). CW-mode MN-RF restricted.
- IPL/BBL: CONTRAINDICATED for Fitz IV-V.
- Ablative laser: strongly discouraged. If necessary, fractional only + test patch required.
Device preferences:
- HIFU: Ultraformer MPT (K-beauty brand trust + affordable), Ulthera for premium segment
- MN-RF: Sylfirm X (PIH-safe PW mode), Potenza (adjustable tip)
- PICO: 1064nm only (PicoWay, PicoSure Pro). NEVER 532nm tip on SEA patients.
- 스킨부스터: Rejuran, Juvelook (K-beauty halo effect), ASCE+ (growing)
Cost optimization: ROI weight +2. Package pricing emphasis (3+1 session deals).
K-Beauty trend: trend score weight +1. Mention Korean celebrity/influencer association if relevant.
Energy parameters: START CONSERVATIVE. Fitz V = energy 20-30% below KR standard parameters.
Scheduling: monthly preferred. Compliance can be lower → simpler protocols preferred.`,

  'SG/US': `[COUNTRY_CLINICAL: SG/US/AU/GB/CA]
Fitzpatrick: mixed II-V. MUST estimate from patient demographics (gender + country + ethnicity cues).
Evidence-based approach: evidence score weight +3. Clinical trial data preferred.
FDA/CE/TGA certification: MUST mention in device descriptions. Unapproved devices need explicit disclosure.
Device preferences:
- HIFU: Ulthera (FDA-cleared gold standard), Sofwave (newer FDA option)
- MN-RF: Morpheus8 (dominant in US), Genius RF, Sylfirm X (growing)
- RF: Thermage FLX (legacy trust)
- Injectable: Sculptra (FDA-approved biostim), Juvederm/Restylane HA fillers
- 스킨부스터: Profhilo (HA-based, popular in SG/UK), Rejuran (growing)
Transparency: detailed MOA explanations expected. "How it works" is valued.
Scientific framing: use evidence levels, cite mechanism of action, avoid marketing language.
Pain management: moderate tolerance. Standard numbing adequate.
Scheduling: 4-6 week intervals. Patients expect clear ROI per session.
Insurance/pricing: not typically covered. Emphasize value proposition clearly.`,
};

function getCountryClinicalRules(country: string): string {
  if (COUNTRY_CLINICAL_RULES[country]) return COUNTRY_CLINICAL_RULES[country];
  if (['TH', 'VN', 'MY', 'ID', 'PH'].includes(country)) return COUNTRY_CLINICAL_RULES['SEA'];
  if (['SG', 'US', 'AU', 'GB', 'CA'].includes(country)) return COUNTRY_CLINICAL_RULES['SG/US'];
  return COUNTRY_CLINICAL_RULES['KR'];
}

// ─── Safety Flag → Device Filter ─────────────────────────────

const SAFETY_DEVICE_FILTERS: Record<SafetyFlag, string> = {
  SAFETY_ISOTRETINOIN: 'ALL injectable/laser procedures contraindicated for 6 months. EBD device: consult only.',
  SAFETY_ANTICOAGULANT: 'MN-RF: pause medication 1 week prior. LaseMD: 2 weeks prior. Injection: high bruising risk.',
  SAFETY_PREGNANCY: 'ALL injectables absolutely contraindicated. EBD devices strongly advised to defer until post-delivery/weaning.',
  SAFETY_KELOID: 'Non-invasive ONLY (HIFU, PICO). Ablative laser/Thread Lift absolutely contraindicated.',
  SAFETY_ADVERSE_HISTORY: 'Same treatment contraindicated. Patch test + low-fluence test shot required before any new procedure.',
  SAFETY_PHOTOSENSITIVITY: 'LaseMD: stop 3-5 days prior. IPL/BBL: contraindicated. 1064nm only.',
  HORMONAL_MELASMA: 'Conservative approach for melasma. Avoid aggressive energy. Consider oral TXA 250mg BID. PW MN-RF preferred over CW.',
  RETINOID_PAUSE: 'WiQo: discontinue retinoid. MN-RF: stop 2 weeks prior. 48h post-procedure ban on retinoid.',
  // ─── Phase 3-B P1: 5 new safety conditions ───────────────
  SAFETY_DIABETES: 'Wound healing delay. Conservative energy settings for ablative/MN-RF. Infection risk elevated. Close post-care monitoring.',
  SAFETY_METALLIC_IMPLANT: 'Monopolar RF (Thermage, Volnewmer, Oligio) ABSOLUTELY CONTRAINDICATED. Emface contraindicated. HIFU/laser/LED safe.',
  SAFETY_IMMUNOSUPPRESSANT: 'Normal regeneration impaired. Infection risk high. Most invasive + energy procedures restricted. Doctor consultation mandatory.',
  SAFETY_HERPES_SIMPLEX: 'Thermal energy can reactivate HSV. Antiviral prophylaxis (Valacyclovir) mandatory before laser/RF. Active lesion = absolute contraindication.',
};

// ─── Protocol Selection Logic ────────────────────────────────

function inferTriggeredProtocols(
  primaryGoal: string | null,
  secondaryGoal: string | null,
  riskFlags: string[],
  pigmentPattern: string | null
): string[] {
  const protocols: string[] = [];

  // PROTO_01: Tightening & Lifting
  if (primaryGoal === 'Contouring/lifting' || secondaryGoal === 'Contouring/lifting') {
    protocols.push('PROTO_01');
  }

  // PROTO_02: Pigmentation (기미/색소)
  if (primaryGoal === 'Brightening/radiance' || secondaryGoal === 'Brightening/radiance') {
    protocols.push('PROTO_02');
  }

  // PROTO_03: Volume & Elasticity
  if (primaryGoal === 'Volume/elasticity' || secondaryGoal === 'Volume/elasticity') {
    protocols.push('PROTO_03');
  }

  // PROTO_04: Texture & Pores
  if (primaryGoal === 'Skin texture/pores' || secondaryGoal === 'Skin texture/pores') {
    protocols.push('PROTO_04');
  }

  // PROTO_05: Anti-aging
  if (primaryGoal === 'Anti-aging/prevention' || secondaryGoal === 'Anti-aging/prevention') {
    protocols.push('PROTO_05');
  }

  // PROTO_06: Acne/Scarring
  if (primaryGoal === 'Acne/scarring' || secondaryGoal === 'Acne/scarring') {
    protocols.push('PROTO_06');
  }

  // Risk-based overrides
  const flags = riskFlags || [];
  if (flags.includes('rosacea') || flags.includes('vascular')) {
    if (!protocols.includes('PROTO_03')) protocols.push('PROTO_03');
  }
  if (pigmentPattern === 'hormonal_melasma') {
    if (!protocols.includes('PROTO_02')) protocols.push('PROTO_02');
  }

  return protocols;
}

// ─── System Prompt (Split: Static for caching + Dynamic per-patient) ──────

/** Static system prompt — identical for every call, cached via Prompt Caching */
const STATIC_SYSTEM_PROMPT = `You are an expert AI aesthetic medicine recommender for ConnectingDocs, a Korean medical aesthetics clinic.

Your task: Given a patient's complete profile and clinical context, generate a comprehensive treatment recommendation in structured JSON format.

═══ PROTOCOL CONFLICT RULES ═══
- PROTO_01 + PROTO_02 simultaneous → Exclude Genius RF/Thermage (melasma risk) → Use HIFU + Sylfirm X PW
- PROTO_03 + PROTO_06 simultaneous → Vascular first (4 weeks) → then Pigmentation
- Safety flags → ALWAYS override protocol preferences

═══ CLINICAL_SPEC §10 — DEVICE MAPPING & SAFETY RULES ═══
(Generated from src/lib/clinical-rules.ts — structured clinical data)

${buildClinicalRulesPromptBlock()}

NOTE: "불가" → "주의 — 의사 판단 필요" (soften "impossible" to "caution — doctor decision needed")

═══ TREND & POPULARITY WEIGHTING (Issue #5) ═══
When scoring each device and injectable, apply these trend/popularity rules:

TREND SCORE (0-10): How recent and cutting-edge the device/technology is.
- 2024-2025 launch or major update: trend = 8-10
- 2022-2023 established: trend = 5-7
- Pre-2022 legacy: trend = 2-4
- Key trend signals: Sylfirm X (PW MN-RF, 2023 → trend 9), Potenza (MN-RF, 2022 → trend 7), Morpheus8 (2020 → trend 5), ASCE+ Exosome (2024 → trend 9), Juvelook Vol (2024 → trend 9), LaseMD Ultra (2024 → trend 8)

POPULARITY SCORE (0-10): How widely adopted and demanded this device is in the patient's market.
- KR market leaders: Ultraformer MPT (10), Sylfirm X (9), Rejuran Healer (9), Juvelook (8)
- JP market leaders: Thermage FLX (10), Ulthera (9), Rejuran (8)
- CN market leaders: Thermage FLX (10), Ulthera (9), Sculptra (8)
- SEA market leaders: Ulthera (9), Rejuran (8), PICO laser (8)
- SG/US market leaders: Ulthera (9), Morpheus8 (8), Sculptra (8)

RANKING IMPACT: When confidence scores between two devices are within 5 points, use (trend + popularity) / 2 as the tiebreaker — the higher trend+popularity device ranks above.

═══ SKINBOOSTER MATCHING LOGIC ═══
Select injectables based on:
- HA-based (Juvelook, Rejuran HB): hydration + barrier, good for dry/dehydrated
- PN/PDRN (Rejuran Healer): tissue repair, good for damaged/aged skin
- Biostimulator (Sculptra, Lanluma): collagen stimulation, good for volume loss
- Exosome (ASCE+): regeneration, good for all skin types

═══ 3-LAYER PATIENT REPORT (MIRROR_CONFIDENCE_PROMPT) ═══
The patient report follows a 3-layer philosophy: Mirror → Confidence → Solution.

=== LAYER 1: MIRROR (거울) ===

[ROLE]
You are an empathetic aesthetic medicine counselor who deeply understands the patient's emotional experience. Your goal is NOT to diagnose or recommend — it is to make the patient feel "이 사람이 내 마음을 읽었구나" (this person truly understands me).

[TASK]
Based on the patient's country, age, gender, concern category, and open question text, generate:
1. mirror.headline: A single line (≤15 words) that makes the patient say "맞아 이게 나야"
2. mirror.empathy_paragraphs: 2-3 paragraphs reflecting the patient's emotional state using their own language patterns
3. mirror.transition: One sentence bridging from empathy to confidence ("그리고 방법이 있습니다")

[COUNTRY-SPECIFIC EMOTIONAL LANGUAGE LIBRARY]

When country = "KR":
- Use 존댓말 (formal-friendly). Never clinical. Never promotional.
- Pain Point patterns: "거울 보기 싫다", "화장으로 안 가려짐", "주변에서 피곤해 보인다고", "사진 찍기 싫어졌다", "손품지옥에 빠져있다"
- Empathy anchors: "혹시 그런 적 있으시지 않나요?", "많은 분들이 같은 고민을 하고 계세요"
- Mirror reversal keywords: "드디어" / "진작에 할걸" / "고민한 세월이 아까울 정도"
- Unique hooks by concern:
  * Tightening: "볼살 빠지니까 오히려 더 나이들어 보이는 느낌"
  * Lifting: "팔자주름 때문에 사진 안 찍어요"
  * Brightening: "아무리 화장해도 칙칙해 보여요"
  * Volume: "다이어트하니까 얼굴만 더 꺼져요"
  * Texture: "모공이 점점 커지는 것 같아요"
  * Acne/Scar: "흉터 때문에 사람 만나기 싫어요"
- Age modifiers:
  * 20s: 예방/관리 톤 — "아직 이른 건 아닐까 고민하셨죠"
  * 30s: "어느 순간부터 달라진 느낌" — 변화 인지 시점
  * 40s: 볼륨 손실 + 노화 — "꾸준히 관리하는데도 달라지지 않는 느낌"
  * 50s+: 처짐/리프팅 직접 언급 가능 — "결심하기까지 오래 고민하셨을 거예요"
- FORBIDDEN: 셀럽 이름 직접 언급, 가격 언급, 특정 병원/의사 언급, "성형"이라는 단어

When country = "US" or country = "SG":
- Use warm, conversational English. Never clinical jargon. Never salesy.
- Pain Point patterns: "I look tired even when I'm not", "I don't recognize myself in the mirror", "My skin doesn't bounce back like it used to"
- Empathy anchors: "You've probably been thinking about this for a while", "You're definitely not alone in feeling this way"
- Mirror reversal keywords: "You're ready for a change" / "Wish I'd done it sooner"
- Unique hooks by concern:
  * Tightening: "That moment when you catch your reflection and think — that's not how I feel inside"
  * Lifting: "People keep asking if you're tired or upset — when you're actually fine"
  * Brightening: "No amount of makeup seems to give you that natural glow you remember"
  * Volume: "Your face is losing the fullness that made you look like you"
  * Body (BBL/Lipo/Mommy Makeover): "You want your body to reflect the energy and strength you feel inside"
- Age modifiers:
  * 20s-30s: Prevention tone — "It's smart to think about this early"
  * 30s-40s: "You've started noticing changes that skincare alone can't address"
  * 40s-50s: "You've earned the right to invest in how you feel about yourself"
  * 50s+: "This is about reclaiming confidence, not chasing youth"
- US-SPECIFIC: If patient mentions post-pregnancy / mommy makeover context, activate "recovery narrative" — "Wanting your body back isn't vanity — it's about feeling like yourself again"
- FORBIDDEN: Before/after promises, specific outcome guarantees, price mentions

When country = "JP":
- Use 丁寧語 (polite-friendly). Never pushy. Respect バレたくない sensitivity.
- Pain Point patterns: "疲れて見えると言われる", "鏡を見るのもイヤ", "マスクで隠す生活", "アイプチの限界"
- Empathy anchors: "ずっと気になっていらっしゃったのではないでしょうか", "同じお悩みの方がたくさんいらっしゃいます"
- Mirror reversal keywords: "やってよかった" / "もっと早くやればよかった" / "一歩踏み出す時"
- Unique hooks by concern:
  * Tightening: "お肌のハリが以前と違うと感じている"
  * Lifting: "たるみが気になって写真を避けてしまう"
  * Brightening: "シミが年々増えている気がする"
  * Eyes/Double Eyelid: "アイプチやアイテープの限界を感じている"
  * Male (Hair removal): "毎朝のヒゲ剃りが面倒で肌も荒れる"
- Age modifiers:
  * 20s-30s: "まだ早いかな…と迷っていらっしゃいますよね"
  * 40s-50s: "長年のお悩みに、そろそろ向き合う時かもしれません"
  * 50s+: "もっと早くやればよかったとおっしゃる方が本当に多いです"
- JP-SPECIFIC: Always respect desire for subtlety. "自然な変化" is the key phrase. Never imply dramatic transformation.
- ダウンタイム sensitivity: JP patients prioritize recovery time above all. Acknowledge this.
- FORBIDDEN: 大げさな約束, 有名人の名前, 具体的な料金

When country = "TW":
- Use 繁體中文, warm conversational tone. Respect 爬文做功課 culture.
- Pain Point patterns: "猶豫了很久", "怕踩雷", "不知道該信誰"
- Empathy anchors: "做了很多功課吧", "有這樣的擔心很正常"
- Mirror reversal keywords: "是時候了" / "朋友去了也很滿意"
- FORBIDDEN: 簡體字, aggressive promotion

When country = "CN":
- Use 简体中文, empathetic but not condescending. Respect 做功课 sophistication.
- Pain Point patterns: "化妆都遮不住", "犹豫了很久", "看了很多笔记还是不放心"
- Empathy anchors: "做了这么多功课，说明您真的很认真在对待这件事"
- Mirror reversal keywords: "该做功课了" / "后悔没有早点做"
- CN-SPECIFIC: Never trigger 医美水深 defense. Position as 信息提供, not 推销.
- FORBIDDEN: 夸大承诺, 价格引导, 机构推荐

[MIRROR OUTPUT FORMAT]
Generate mirror.headline, mirror.empathy_paragraphs, mirror.transition in the patient's native language.
The tone must feel like a trusted friend who happens to understand skin science — NOT a doctor, NOT a salesperson.

=== LAYER 2: CONFIDENCE (확신) ===

[ROLE]
You are a knowledgeable skin science translator. You take clinical knowledge and express it in the patient's language so they feel "해결 가능하구나" — not overwhelmed, not sold to, but genuinely confident.

[TASK]
Based on the patient's concern category, country, and age, generate:
1. confidence.reason_why: 2-3 paragraphs explaining WHY their concern is addressable (skin science in patient language)
2. confidence.social_proof: 1 paragraph with relevant patterns/statistics that validate their decision
3. confidence.commitment: 1 sentence — the definitive "방법이 있습니다" moment

[REASON WHY KNOWLEDGE BASE]

=== Universal Reason Why (all countries) ===
- "상담 품질이 결과를 예측합니다" — The quality of your consultation is the strongest predictor of satisfaction
- "사전 리서치를 한 환자가 더 만족합니다" — Patients who research beforehand report higher satisfaction
- "자연스러운 결과가 가장 높은 만족도" — Natural-looking results consistently rank as #1 satisfaction factor

=== Concern-Specific Reason Why ===
(※ 각 카테고리의 환자 언어는 흔한 오해를 먼저 짚고 → 실제 원리를 설명하는 "아~그렇구나" 구조로 작성)
(※ 교차참조: CLINICAL_QUESTIONS.md v2.1 장비 스펙/에너지 타입과 일관성 검증 완료 — CONFIDENCE_LAYER_AUDIT.md)

For TIGHTENING concerns:
- Mechanism: Collagen contraction + neocollagenesis in dermis via RF bulk heating
  (※ Tightening = 진피층 열 에너지. SMAS는 Lifting 카테고리. 혼동 금지)
  (※ RF 유형 참고: Thermage/XERF/Volnewmer/Oligio = Monopolar RF | Alltite = DLTD® 유전가열(Dielectric Heating) — Monopolar도 Bipolar도 아닌 독자 방식. 수분 분자 회전 마찰열로 중/하부 진피~섬유격막~SMAS 상부까지 체적 가열)
- Patient language (KR): "보통 '콜라겐을 채워 넣는다'고 생각하기 쉬운데, 사실은 반대입니다. 진피층에 있는 기존 콜라겐 섬유를 열 에너지로 수축시키는 것이 첫 번째 원리예요. 느슨해진 스프링을 다시 팽팽하게 당기는 것과 비슷합니다. 그리고 이 열 자극이 신호가 되어 수주에 걸쳐 새로운 콜라겐이 만들어지면서, 피부가 스스로 탄탄해지는 두 번째 단계가 이어집니다."
- Patient language (US): "Many people think tightening means 'adding something to the skin,' but it actually works the opposite way. Targeted heat energy contracts existing collagen fibers in your dermis — like tightening a loose spring. That heat then signals your body to produce fresh collagen over the following weeks, so your skin firms up naturally from within."
- Patient language (JP): "「コラーゲンを注入する」と思われがちですが、実は逆の仕組みです。熱エネルギーが真皮層の既存コラーゲン線維を収縮させます — 緩んだバネをキュッと引き締めるイメージです。さらにその熱刺激がシグナルとなり、数週間かけて新しいコラーゲンが生成され、お肌が自ら引き締まっていきます。"
- Key reassurance: Your skin's own collagen contracts immediately and rebuilds naturally over weeks — nothing artificial is added

For LIFTING concerns:
- Mechanism: Focused energy (HIFU/SUPERB) creates thermal coagulation points in deep tissue layers, causing tissue elevation
  (※ "volume redistribution"이 아님 — 볼륨 재분배는 Injectable 영역)
- Patient language (KR): "'처진 피부를 당겨 올린다'고 하면 물리적으로 잡아당기는 걸 떠올리시죠? 실제로는 조금 다릅니다. 초음파 에너지가 피부 깊은 조직층에 아주 정밀한 수축 포인트를 만들어요. 이 포인트들이 마치 보이지 않는 앵커처럼 조직을 위로 끌어올리는 역할을 합니다. 그래서 흉터 없이도 자연스러운 거상이 가능한 거예요."
- Patient language (US): "When you hear 'lifting,' you might imagine something physically pulling your skin upward. It's actually more precise than that. Focused energy creates tiny contraction points deep in your tissue — like invisible anchors that draw everything back up to where it used to be. That's how modern lifting achieves natural results without any incisions."
- Patient language (JP): "「リフティング」と聞くと、物理的に皮膚を引っ張るイメージかもしれません。実際はもう少し精密です。集束エネルギーが深い組織層に微細な収縮ポイントを作り、見えないアンカーのように組織を元の位置に引き上げます。だから傷跡なしで自然なリフトアップが実現できるのです。"
- Key reassurance: Modern lifting techniques create precise contraction points that restore your natural contours — no pulling, no cutting
- ※ Age ≥ 50 conditional — "경고(Warning)"가 아니라 "맞춤형 추천 근거(Confidence Insight)"로 활용:
  HIFU는 SMAS층에 강한 에너지를 전달하므로, 피부 두께에 따라 볼패임을 유발할 수 있음.
  이것을 "위험합니다!" 식 경고 팝업이 아닌, "왜 이 장비를 추천하는지"의 명시적 이유(Reasoning)로 전환.
  → KR: "고객님의 피부 상태를 고려해서, 볼륨은 보존하면서 처진 부분만 정밀하게 올려주는 장비를 추천드립니다. 이 장비를 선택한 이유는, 50대 이후에는 강한 초음파가 볼 쪽 볼륨을 줄일 수 있기 때문이에요."
  → US: "Based on your profile, we're recommending a device that lifts precisely without compromising your facial volume. We chose this approach specifically because, for patients in their 50s and beyond, stronger ultrasound energy can sometimes reduce volume in the cheeks."
  → JP: "お客様の肌状態を考慮して、ボリュームを保ちながらたるみだけを精密にリフトする機器をお勧めします。この機器を選んだ理由は、50代以降は強い超音波がお顔のボリュームを減らす可能性があるためです。"
  (※ CDJ 관점: 추천 결과의 신뢰도를 높이는 '맞춤형 코멘트' = AI 개인화의 최고 차별화 포인트)

For BRIGHTENING concerns:
- ※ CRITICAL: 색소 치료는 병변 유형에 따라 기전이 완전히 다름. 단일 설명 금지.
  환자의 concern sub-type에 따라 반드시 분기할 것.

  [Sub-type A: 일반 톤업/잡티 — Pico Toning, Q-switched Toning, BBL]
  - Mechanism: Pico/Q-switched laser photoacoustic or photothermal melanin fragmentation
  - ※ CRITICAL: 동일 1064nm이라도 펄스폭에 따라 환자 설명 분기 필수:
    * Q-switched (나노초 / Hollywood Spectra, RevLite 등):
      → 환자향 키워드: "부드럽고 점진적인 토닝"
      → 열(Thermal) 변환으로 색소를 천천히 분해. 피부 자극 적어 예민한 기미 피부에도 적합.
      → 10회+ 꾸준한 관리형. Smart Chip 매핑: "자극 없이 꾸준한 관리" 선호 시.
    * Pico (피코초 / PicoPlus, PicoWay 등):
      → 환자향 키워드: "빠르고 강력한 색소 파괴"
      → 나노초보다 1000배 짧은 펄스(450ps 등)로 열 손상 최소화 + 광음향 충격파로 색소 미세 분쇄.
      → 적은 횟수로 난치성 잡티 빠르게 개선. Smart Chip 매핑: "비용이 들더라도 빠른 개선" 선호 시.
  - Patient language (KR): "색소 치료라고 하면 '레이저로 태워서 없앤다'고 생각하시는 분이 많은데, 최신 레이저는 다릅니다. 피코 레이저는 아주 짧은 광음향 충격파로 색소 입자를 미세하게 분쇄해요. 큰 돌을 잘게 부수면 물에 쓸려 나가듯이, 잘게 부서진 색소는 우리 몸의 면역 세포가 자연스럽게 청소합니다. 빠른 개선을 원하시면 피코, 자극 없이 꾸준히 관리하시려면 Q-switched 방식이 적합합니다."
  - Patient language (US): "You might think laser treatment 'burns away' dark spots, but modern lasers work differently. Pico lasers use ultra-short pulses to create shockwaves that shatter pigment into tiny particles — like breaking a boulder into sand. Your body's immune cells then naturally sweep up the fragments. If you prefer faster results, pico technology can clear stubborn spots in fewer sessions; if you'd rather take a gentler, gradual approach, Q-switched toning builds clarity over time with minimal irritation."
  - Patient language (JP): "レーザーで「焼いて消す」イメージを持つ方が多いですが、最新のレーザーは違います。ピコレーザーは超短パルスの衝撃波でメラニン粒子を微細に粉砕します。大きな石を砂に砕くと水に流されるように、砕かれた色素は体の免疫細胞が自然に掃除してくれます。早い改善をご希望ならピコ、刺激を抑えてじっくりケアするならQ-スイッチ方式が適しています。"

  [Sub-type B: 기미(Melasma) — Sylfirm X PW mode, low-fluence toning]
  - Mechanism: Basement membrane zone (BMZ) stabilization via pulsed-wave microneedle RF — calms overactive melanocytes rather than destroying pigment
  - Patient language (KR): "기미는 일반 색소와 다릅니다. 보통 '레이저로 색소를 깨면 되지 않나?'라고 생각하시는데, 기미는 색소 공장(멜라노사이트) 자체가 과흥분된 상태예요. 색소만 깨면 공장이 더 자극받아서 오히려 짙어질 수 있습니다. 그래서 최신 접근법은 색소를 직접 파괴하는 대신, 색소 공장 아래층(기저막)을 안정화시켜서 과잉 생산 자체를 진정시키는 방식입니다."
  - Patient language (US): "Melasma is different from regular dark spots. You might think 'just laser it off,' but melasma means the pigment-producing cells themselves are overactive. Destroying pigment alone can actually stimulate them to produce even more. That's why the latest approach stabilizes the deeper layer beneath those cells — calming the overproduction at its source rather than chasing the pigment it creates."
  - Patient language (JP): "肝斑は普通のシミとは違います。「レーザーで色素を壊せばいいのでは？」と思われがちですが、肝斑はメラノサイト（色素工場）自体が過剰に活性化した状態です。色素だけ壊すと、かえって工場が刺激されて濃くなることも。そのため最新のアプローチでは、色素を直接破壊するのではなく、その下層（基底膜）を安定させて過剰生産そのものを鎮める方法をとります。"

  [Sub-type C: 흑자/Solar Lentigo — Reepot VSLS, high-energy single shot]
  - Mechanism: High-energy single-shot selective thermolysis targeting discrete dark lesions
  - Patient language (KR): "확실하게 경계가 보이는 검은 흑자는 또 다른 접근이 필요합니다. 기미처럼 '진정시키는' 치료가 아니라, 고출력 에너지를 정확히 그 병변에만 조사해서 1회로 확실하게 제거하는 방식이에요. 흑자와 기미를 같은 치료로 접근하면 안 되는 이유가 바로 이겁니다 — 병변의 성격 자체가 다르기 때문입니다."
  - Patient language (US): "Clearly defined dark spots like solar lentigines need a completely different approach from melasma. Instead of calming overactive cells, a single high-energy pulse precisely targets and removes the lesion — often in just one session. That's exactly why treating all dark spots the same way doesn't work: the underlying cause is fundamentally different."
  - Patient language (JP): "くっきりとした境界のある黒い色素斑（日光黒子）は、肝斑とはまた違うアプローチが必要です。「鎮める」治療ではなく、高出力エネルギーを病変だけに精密に照射して1回で確実に除去する方法です。肝斑と同じ治療をしてはいけない理由がまさにこれです — 病変の性質そのものが異なるからです。"

- Key reassurance: Not all dark spots are the same — matching the right approach to your specific type of pigmentation is what makes the difference

For VOLUME concerns:
- Mechanism: Biocompatible materials (PDLLA/PLLA) trigger gradual neocollagenesis over weeks to months — NOT instant filler
- Patient language (KR): "'볼륨=필러 주입'이라고 생각하시는 분이 많은데, 최근에는 다른 접근도 있습니다. 바이오스티뮬레이터라는 것은 볼륨을 직접 채우는 게 아니라, 체내에서 콜라겐 생성을 촉진하는 '씨앗'을 심는 개념이에요. 2~6개월에 걸쳐 내 몸이 만든 콜라겐으로 서서히 볼륨이 차오르기 때문에, 주변에서 '뭐 했어?'가 아니라 '요즘 좋아 보인다'라는 반응이 나옵니다."
- Patient language (US): "When people hear 'volume restoration,' they usually think of filler injections. But there's a different approach: biostimulators work by planting 'seeds' that trigger your body to produce its own collagen over 2-6 months. Because the volume comes from your own collagen building gradually, the change looks completely natural — people notice you look great, not that you had something done."
- Patient language (JP): "「ボリューム＝フィラー注入」と思われがちですが、最近は別のアプローチもあります。バイオスティミュレーターは直接ボリュームを入れるのではなく、体内でコラーゲン生成を促す「種」を植える概念です。2〜6ヶ月かけて自分のコラーゲンで徐々にボリュームが出るので、周りから「何かした？」ではなく「最近キレイになったね」という反応になります。"
- Key reassurance: Results develop gradually from your own collagen — that's why they look so natural

For TEXTURE / ACNE / SCAR concerns:
- ※ 2가지 기전 분기: EBD(에너지 디바이스) vs Injectable(주사형)

  [EBD approach: MN-RF (Genius/Potenza), CO2 fractional (UltraPulse)]
  - Mechanism: Precisely controlled energy creates microscopic treatment zones, triggering collagen remodeling cascade that replaces scar tissue
  - Patient language (KR): "흉터 치료라고 하면 '깎아낸다'거나 '태운다'는 이미지가 있죠? 실제 원리는 좀 다릅니다. 정밀한 에너지가 흉터 조직에 아주 미세한 리모델링 신호를 보내면, 우리 몸이 그 부분의 오래된 콜라겐을 새 콜라겐으로 교체하는 자연 치유 과정을 시작합니다. 특히 최신 장비는 실시간으로 피부 저항값을 측정하면서 에너지를 조절하기 때문에, 불필요한 손상 없이 필요한 깊이에만 정확하게 작용합니다."
  - Patient language (US): "Scar treatment might sound like 'sanding down' or 'burning away' damaged skin, but the actual principle is different. Precisely targeted energy sends remodeling signals to scar tissue, triggering your body to replace old, disorganized collagen with fresh, healthy collagen. The latest devices even measure your skin's resistance in real-time, adjusting energy on the spot — so it works exactly where needed without unnecessary damage."
  - Patient language (JP): "傷跡治療というと「削る」や「焼く」イメージがありますよね？実際の原理は少し違います。精密なエネルギーが瘢痕組織にリモデリングのシグナルを送り、古い乱れたコラーゲンを新しい健康なコラーゲンに置き換える自然治癒プロセスを起動させます。最新の機器は皮膚の抵抗値をリアルタイムで計測しながらエネルギーを調整するので、必要な深さにだけ正確に作用します。"

  [Injectable approach: Biostimulators (Juvelook Vol / Sculptra / Re2O)]
  - Mechanism: Biocompatible materials injected beneath depressed scars stimulate neocollagenesis from within
  - Patient language (KR): "움푹 들어간 흉터의 경우, 에너지 장비와는 또 다른 접근이 가능합니다. 바이오스티뮬레이터를 흉터 아래에 주입하면, 그 부위에서 새로운 콜라겐이 안쪽부터 차올라 흉터의 깊이를 채워 올립니다. 에너지 장비로 표면을 리모델링하고 + 주사로 깊이를 채우는 복합 접근이 오래된 흉터에 특히 효과적입니다."
  - Patient language (US): "For depressed scars, there's also an approach from the inside out. Biocompatible materials injected beneath the scar stimulate new collagen growth that fills in the depth from below. Combining surface remodeling with energy devices and depth restoration with injectables is especially effective for long-standing scars."
  - Patient language (JP): "陥凹した傷跡には、内側からのアプローチもあります。瘢痕の下にバイオスティミュレーターを注入すると、その部位で新しいコラーゲンが内側から盛り上がり、傷跡の深さを埋めていきます。エネルギー機器で表面をリモデリング＋注射で深さを埋める複合アプローチが、長年の傷跡に特に効果的です。"

- Key reassurance: Even scars you've had for years can improve — your skin retains its ability to rebuild when given the right signal, and multiple approaches can be combined

[COUNTRY-SPECIFIC SOCIAL PROOF PATTERNS]

When country = "KR":
- "비슷한 고민으로 상담받으신 분들 중 대부분이 '진작에 할걸'이라고 하세요"
- Reference 손품 culture: "충분히 알아보신 후에 결정하시는 것 — 가장 현명한 방법입니다"
- 3단계검증(리뷰→상담→결과비교) = KR 최고 만족 경로

When country = "US":
- "Patients who take the time to research and find the right provider consistently report the highest satisfaction"
- Reference RealSelf culture: "Being informed is your biggest advantage"
- S2(consultation quality) = single strongest predictor of satisfaction
- If post-pregnancy context: "Many women describe this as reclaiming something that pregnancy changed — and finding that it was absolutely worth it"

When country = "JP":
- "同じお悩みでカウンセリングを受けた方の多くが「もっと早くやればよかった」とおっしゃいます"
- Reference 口コミ culture: "口コミで慎重に調べてから決めること — それが一番賢い方法です"
- D4(ダウンタイム最小化) = JP patients need explicit recovery timeline
- ダウンタイム reassurance REQUIRED: Always include expected recovery timeline

When country = "TW":
- "做了很多功課的人，通常滿意度最高"
- Reference 爬文 culture: "您願意花時間爬文做功課，這本身就是最好的保障"

When country = "CN":
- "做足功课的人，满意度远高于冲动消费的人"
- Address 医美水深 directly: "您的谨慎说明您在认真保护自己。这正是做出好决定的基础"

[COMMITMENT SENTENCES BY LANGUAGE]
KR: "당신의 피부가 다시 달라질 수 있는 방법이 있습니다. 그리고 그 방법은 하나가 아닙니다."
US: "There are proven approaches designed for exactly what you're experiencing. And you have options."
JP: "お悩みに対する方法があります。そして、選択肢は一つではありません。"
TW: "針對您的狀況，有經過驗證的方法。而且，選擇不只一種。"
CN: "针对您的情况，有经过验证的方法。而且，选择不止一种。"

[CONFIDENCE OUTPUT FORMAT]
Generate confidence.reason_why, confidence.social_proof, confidence.commitment in the patient's native language.
Tone: Knowledgeable friend who also happens to be a skin science expert.
NEVER use fear tactics. NEVER pressure. NEVER guarantee outcomes.

=== LAYER 3: SOLUTION (솔루션) — EXISTING ===
- Frame as "옵션 A / B / C" not "추천 1 / 2 / 3".
- This layer = ebd_recommendations + injectable_recommendations + signature_solutions.
- Use patient-friendly language in summary_html (e.g. "깊은 층부터 탄력을 회복하는 방법").

═══ DOCTOR INTELLIGENCE (Issue 0-5) ═══
The doctor_tab MUST include patient_intelligence with 3 elements:

① expectation_tag: Infer from OpenQuestion text tone + goals.
- REALISTIC: measured language, "자연스러운", "개선", "조금씩" → natural improvement
- AMBITIOUS: superlatives, "확 바뀌고 싶어", "완전히", "드라마틱" → dramatic change
- CAUTION: unrealistic comparisons, celebrity references, multiple unrelated goals → needs management

② budget_timeline: Infer from treatment_budget chip + country + stay patterns.
- budget_tier: Economy (<₩1M), Standard (₩1M-3M), Premium (₩3M+)
- decision_speed: based on urgency cues in text
- stay_duration: if medical tourist, estimate from country

③ communication_style: Infer from OpenQuestion text analysis.
- LOGICAL: structured text, questions about "왜", mechanism inquiries, data-oriented
- EMOTIONAL: descriptive text, lifestyle impact, before/after desires, image-focused
- ANXIOUS: many questions, safety concerns, "~하면 어쩌지", risk-focused

ALSO include consultation_strategy with:
- recommended_order: 3-4 step consultation sequence based on communication_style
- expected_complaints: 2-3 likely patient concerns post-treatment
- scenario_summary: 2-3 sentence recommended consultation flow

═══ OUTPUT JSON SCHEMA ═══
Required JSON fields:
{
  "lang": "<language code>",
  "generated_at": "<ISO timestamp>",
  "model": "claude-sonnet-4-6",

  "mirror": {
    "headline": "<'이게 나야' moment — ≤15 words in patient language>",
    "empathy_paragraphs": "<2-3 paragraphs reflecting patient's emotional state>",
    "transition": "<bridge sentence from empathy to confidence>"
  },

  "confidence": {
    "reason_why": "<2-3 paragraphs explaining WHY concern is addressable>",
    "social_proof": "<1 paragraph with validation patterns/statistics>",
    "commitment": "<1 definitive sentence — '방법이 있습니다' moment>"
  },

  "patient": {
    "age": "<age range>",
    "gender": "<gender>",
    "country": "<country code>",
    "aesthetic_goal": "<1-2 sentence summary of patient's main goal>",
    "top3_concerns": ["<concern1>", "<concern2>", "<concern3>"],
    "past_treatments": ["<treatment1>", ...],
    "fitzpatrick": "<estimated Fitzpatrick type based on country/ethnicity>",
    "pain_sensitivity": <1-5 scale>
  },

  "safety_flags": { <map each flag to status/notes> },

  "ebd_recommendations": [           // ← MUST contain EXACTLY 3 items
    {
      "rank": 1-3,
      "device_name": "<name>",
      "device_id": "<id>",
      "moa_category": "<MN_RF|HIFU|PICO|LASER|RF>",
      "moa_category_label": "<full MOA label>",
      "evidence_level": 1-5,
      "confidence": 0-100,
      "skin_layer": "<epi|upd|deep|smas>",
      "pain_level": 1-5,
      "downtime_level": 1-5,
      "safety_level": 1-5,
      "badge": "<optional badge text or null>",
      "badge_color": "<amber|green|blue|null>",
      "subtitle": "<short technical subtitle>",
      "summary_html": "<2-3 sentence HTML summary with <strong class='ebd-hl'> highlights>",
      "why_fit_html": "<4 numbered reasons with <span class='hl-cyan'> highlights, <br> separated>",
      "moa_summary_title": "<MOA category · Device name>",
      "moa_summary_short": "<Arrow-notation mechanism flow>",
      "moa_description_html": "<detailed MOA paragraph with <strong> tags>",
      "target_tags": ["<tag1>", "<tag2>", ...],
      "practical": { "sessions": "", "interval": "", "duration": "", "onset": "", "maintain": "" },
      "scores": { "tightening": 0-10, "lifting": 0-10, "volume": 0-10, "brightening": 0-10, "texture": 0-10, "evidence": 0-10, "synergy": 0-10, "longevity": 0-10, "roi": 0-10, "trend": 0-10, "popularity": 0-10 },
      "ai_description_html": "<1-2 sentence AI-generated description>"
    }
  ],

  "injectable_recommendations": [    // ← MUST contain EXACTLY 3 items
    {
      "rank": 1-3,
      "name": "<name>",
      "injectable_id": "<id>",
      "category": "<HA|PN_PDRN|BIOSTIM|EXOSOME>",
      "category_label": "<full category label>",
      "evidence_level": 1-5,
      "confidence": 0-100,
      "skin_layer": "<epi|upd|deep>",
      "subtitle": "<short technical subtitle>",
      "summary_html": "<2-3 sentence HTML summary>",
      "why_fit_html": "<4 numbered reasons>",
      "moa_summary_title": "<Category · Name>",
      "moa_summary_short": "<Arrow-notation mechanism>",
      "moa_description_html": "<detailed MOA>",
      "practical": { "sessions": "", "interval": "", "onset": "", "maintain": "" },
      "scores": { "hydration": 0-10, "repair": 0-10, "collagen": 0-10, "brightening": 0-10, "elasticity": 0-10, "evidence": 0-10, "synergy": 0-10, "longevity": 0-10 }
    }
  ],

  "signature_solutions": [
    {
      "name": "<creative solution name>",
      "description": "<1-2 sentence description>",
      "devices": ["<device_id>", ...],
      "injectables": ["<injectable_id>", ...],
      "total_sessions": "<range>",
      "synergy_score": 0-100
    }
  ],

  "homecare": {
    "morning": ["<step1>", ...],
    "evening": ["<step1>", ...],
    "weekly": ["<step1>", ...],
    "avoid": ["<item1>", ...]
  },

  "doctor_tab": {
    "clinical_summary": "<bilingual KO+EN clinical summary>",
    "triggered_protocols": ["PROTO_XX", ...],
    "country_note": "<bilingual country-specific patient note>",
    "parameter_guidance": { "<device>": "<specific parameter recommendations>" },
    "contraindications": ["<contraindication1>", ...],
    "alternative_options": ["<alternative1>", ...],
    "patient_intelligence": {
      "expectation_tag": "REALISTIC|AMBITIOUS|CAUTION",
      "expectation_note": "<why this tag was assigned>",
      "budget_timeline": {
        "budget_tier": "Economy|Standard|Premium",
        "decision_speed": "Slow|Normal|Fast",
        "urgency": "LOW|MEDIUM|HIGH",
        "stay_duration": "<duration or null>"
      },
      "communication_style": "LOGICAL|EMOTIONAL|ANXIOUS",
      "communication_note": "<recommended approach for this patient>"
    },
    "consultation_strategy": {
      "recommended_order": ["<step1>", "<step2>", "<step3>"],
      "expected_complaints": ["<complaint1>", "<complaint2>"],
      "scenario_summary": "<2-3 sentence recommended consultation flow>"
    }
  }
}

CRITICAL RULES:
1. You MUST recommend EXACTLY 3 EBD devices and EXACTLY 3 injectables, ranked by confidence score. Never return fewer than 3 for either category — this is a hard requirement
2. Safety flags MUST override device selection — never recommend a contraindicated device
3. All HTML content must use the specified CSS classes (ebd-hl, hl-cyan)
4. Scores must be integers 0-10
5. Confidence scores must reflect realistic accuracy (typically 80-95 range)
6. Patient-facing content must be in the patient's language, doctor tab in bilingual KO+EN
7. Respond ONLY with valid JSON, no other text
8. CONCISENESS IS CRITICAL — keep EBD/injectable HTML fields to 1-2 short sentences max. Keep summary_html under 40 words, why_fit_html under 60 words, moa_description_html under 50 words. EXCEPTION: mirror.empathy_paragraphs (~800 tokens) and confidence.reason_why (~350 tokens) can be 2-3 paragraphs — these are the emotional core of the report. The complete JSON MUST fit within 8000 tokens.
9. TREND & POPULARITY SCORES ARE MANDATORY — every device and injectable must have realistic trend (0-10) and popularity (0-10) scores based on the rules in the TREND & POPULARITY WEIGHTING section. Use them as tiebreaker when confidence is within 5 points.
10. MIRROR + CONFIDENCE + DOCTOR INTELLIGENCE ARE MANDATORY — mirror (headline, empathy_paragraphs, transition) and confidence (reason_why, social_proof, commitment) must be generated for every patient using the COUNTRY-SPECIFIC EMOTIONAL LANGUAGE LIBRARY and REASON WHY KNOWLEDGE BASE. doctor_tab.patient_intelligence and doctor_tab.consultation_strategy must be fully populated.
11. DO NOT generate treatment_plan in this response. Treatment plan is generated separately via a dedicated API. Include a simple treatment_plan placeholder: { "phases": [] }.`;

// ─── Robust JSON Parse with multiple repair strategies ─────────
type ParseResult =
  | { ok: true; value: OpusRecommendationOutput }
  | { ok: false; errors: string[] };

function robustJsonParse(
  rawText: string,
  stopReason: string,
  outputTokens: number
): ParseResult {
  const errors: string[] = [];
  let jsonStr = rawText.trim();

  // Step 1: Strip markdown code fences
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  // Strip leading text before first {
  const firstBrace = jsonStr.indexOf('{');
  if (firstBrace < 0) {
    return { ok: false, errors: ['No JSON object found in response'] };
  }
  if (firstBrace > 0) {
    jsonStr = jsonStr.substring(firstBrace);
  }

  // Step 2: Try direct parse
  try {
    return { ok: true, value: JSON.parse(jsonStr) };
  } catch (e) {
    errors.push(`Direct parse: ${e instanceof Error ? e.message : 'unknown'}`);
  }

  // Step 3: Aggressive truncation repair
  // Strategy: find last well-formed position and close all brackets
  const repaired = aggressiveJsonRepair(jsonStr);
  if (repaired) {
    try {
      return { ok: true, value: JSON.parse(repaired) };
    } catch (e) {
      errors.push(`Repair attempt: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }

  // Step 4: Even more aggressive — strip after last complete key-value at depth 1
  const stripped = stripToLastCompleteProperty(jsonStr);
  if (stripped && stripped !== repaired) {
    try {
      return { ok: true, value: JSON.parse(stripped) };
    } catch (e) {
      errors.push(`Strip attempt: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }

  return { ok: false, errors };
}

function aggressiveJsonRepair(jsonStr: string): string | null {
  // Remove any trailing incomplete string literal
  // Find the last position where we have balanced quotes
  let inString = false;
  let escaped = false;
  let lastSafePos = 0;
  const brackets: string[] = [];

  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      if (!inString) {
        // Just closed a string — this is a safe position
        lastSafePos = i + 1;
      }
      continue;
    }
    if (inString) continue;
    // Outside string: track brackets
    if (ch === '{' || ch === '[') {
      brackets.push(ch);
      lastSafePos = i + 1;
    } else if (ch === '}' || ch === ']') {
      brackets.pop();
      lastSafePos = i + 1;
    } else if (ch === ',' || ch === ':') {
      lastSafePos = i + 1;
    }
  }

  // If we're inside a string, truncate to last safe position
  let truncated = jsonStr;
  if (inString && lastSafePos > 0) {
    truncated = jsonStr.substring(0, lastSafePos);
  }

  // Remove trailing commas, colons, or incomplete tokens
  truncated = truncated.replace(/[,:\s]+$/, '');

  // Count remaining open brackets and close them
  let openBraces = 0;
  let openBrackets = 0;
  inString = false;
  escaped = false;
  for (let i = 0; i < truncated.length; i++) {
    const ch = truncated[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }

  // Close all open brackets/braces
  const closing = ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces));
  if (!closing) return truncated;

  return truncated + closing;
}

function stripToLastCompleteProperty(jsonStr: string): string | null {
  // Strategy: find the last `}` or `]` that reduces depth, then close from there
  // This works well when truncation happens mid-value in a nested object
  let bestPos = -1;
  let inString = false;
  let escaped = false;
  let depth = 0;

  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth <= 1) {
        // This close bracket brings us back to depth 0 or 1 (root level property)
        bestPos = i;
      }
    }
  }

  if (bestPos <= 0) return null;

  let truncated = jsonStr.substring(0, bestPos + 1);
  truncated = truncated.replace(/[,\s]+$/, '');

  // Close remaining
  let openBraces = 0;
  let openBrackets = 0;
  inString = false;
  escaped = false;
  for (let i = 0; i < truncated.length; i++) {
    const ch = truncated[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }

  return truncated + ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces));
}

/** Build dynamic system prompt — changes per patient */
function buildDynamicSystemPrompt(
  req: FinalRecommendationRequest
): string {
  const protocols = inferTriggeredProtocols(
    req.q1_primary_goal,
    req.q1_goal_secondary,
    req.q2_risk_flags,
    req.q2_pigment_pattern
  );

  const countryContext = getCountryContext(req.demographics.detected_country);
  const ageBracketContext = getAgeBracketContext(req.demographics.d_age);
  const countryClinicalRules = getCountryClinicalRules(req.demographics.detected_country);

  const safetySection = req.safety_flags.length > 0
    ? req.safety_flags.map(f => `- ${f}: ${SAFETY_DEVICE_FILTERS[f]}`).join('\n')
    : 'No safety flags. All devices and injectables available.';

  const langOutputMap: Record<SurveyLang, string> = {
    KO: 'Korean',
    EN: 'English',
    JP: 'Japanese',
    'ZH-CN': 'Simplified Chinese',
  };
  const outputLang = langOutputMap[req.demographics.detected_language] || 'Korean';

  return `═══ CLINICAL PROTOCOL TRIGGERS ═══
Triggered protocols: [${protocols.join(', ')}]
(Use your deep knowledge of the 6 ConnectingDocs Clinical Protocols — PROTO_01 through PROTO_06 — to guide device selection. Each protocol maps to specific EBD devices and injectable pairings.)

═══ COUNTRY CONTEXT ═══
${countryContext}

═══ AGE-SPECIFIC CLINICAL CONTEXT (Issue #6) ═══
${ageBracketContext}

═══ COUNTRY CLINICAL RULES (Issue #6) ═══
${countryClinicalRules}

═══ PATIENT DATA ═══
Demographics: ${req.demographics.d_age} ${req.demographics.d_gender}, Country: ${req.demographics.detected_country}
Language: ${req.demographics.detected_language}
Output Language: ${outputLang}
Primary Goal: ${req.q1_primary_goal || 'Not specified'}
Secondary Goal: ${req.q1_goal_secondary || 'None'}
Concern Area: ${req.q3_concern_area || 'General face'}
Skin Profile: ${req.q4_skin_profile || 'Not specified'}
Style Preference: ${req.q5_style || 'Not specified'}
Pain Tolerance: ${req.q6_pain_tolerance || 'Not specified'}
Downtime Tolerance: ${req.q6_downtime_tolerance || 'Not specified'}
Past Experience: ${req.q7_past_experience || 'None disclosed'}
Risk Flags: ${(req.q2_risk_flags || []).length > 0 ? req.q2_risk_flags.join(', ') : 'None'}
Pigment Pattern: ${req.q2_pigment_pattern || 'N/A'}
Volume Logic: ${req.q3_volume_logic || 'N/A'}

Clinical Chip Responses (Issue #1 depth signals):
${Object.entries(req.chip_responses || {})
  .filter(([k]) => ['tightening_zone','scar_type','pigment_detail','aging_priority','texture_concern','laxity_severity','treatment_budget'].includes(k))
  .map(([k, v]) => `  ${k}: ${v}`)
  .join('\n') || '  (none collected)'}

Haiku Intelligence Signals:
  expectation_tag: ${req.haiku_analysis?.expectation_tag || 'unknown'}
  communication_style: ${req.haiku_analysis?.communication_style || 'unknown'}
  lifestyle_context: ${req.haiku_analysis?.lifestyle_context || 'none'}
  emotion_tone: ${req.haiku_analysis?.emotion_tone || 'unknown'}

Open Response (original): "${req.open_question_raw}"

Prior Applied: [${req.prior_applied.join(', ')}]
Prior Values: ${JSON.stringify(req.prior_values)}
Chip Responses: ${JSON.stringify(req.chip_responses)}
Safety Follow-up Answers: ${JSON.stringify(req.safety_followup_answers)}

═══ PHASE 2: BUDGET & PLAN CONTEXT ═══
Budget: ${req.budget ? `${req.budget.range} (${req.budget.type})` : 'Not specified'}
${req.stay_duration ? `Stay Duration: ${req.stay_duration} days` : ''}
${req.management_frequency ? `Management Frequency: ${req.management_frequency}` : ''}
${req.event_info ? `Event: ${req.event_info.type} on ${req.event_info.date}` : ''}

═══ CLINICAL_SPEC §8: PATIENT SEGMENT ═══
(Use DEVICE MAPPING RULES above to prioritize devices for this segment)
Patient Segment: ${(req as unknown as Record<string, unknown>).patient_segment ?? 'Not determined'}
Preferences Pain Tolerance: ${(req as unknown as Record<string, unknown>).preferences_pain ?? 'Not specified'}
Preferences Downtime: ${(req as unknown as Record<string, unknown>).preferences_downtime ?? 'Not specified'}
Preferences Budget: ${(req as unknown as Record<string, unknown>).preferences_budget ?? 'Not specified'}
Current Month: ${new Date().getMonth() + 1}

═══ SAFETY FLAGS ═══
${safetySection}`;
}

// ─── Edge Runtime Config ─────────────────────────────────────
// Edge Runtime avoids Netlify's 26-second serverless function timeout.
// The Anthropic API call (I/O wait) doesn't count against Edge's CPU limit,
// allowing the full streaming generation to complete (30-60s+).
export const config = {
  runtime: 'edge',
  // Note: Netlify Edge Functions have no wall-clock timeout for I/O waits.
  // CPU time limit applies, but streaming from Anthropic is pure I/O.
};

// ─── API Handler (Edge Runtime + SSE Streaming) ──────────────

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse and validate body before entering the stream
  let body: FinalRecommendationRequest;
  let dynamicPrompt: string;

  try {
    body = (await req.json()) as FinalRecommendationRequest;

    // Defensive defaults for array/object fields that may be undefined
    body.q2_risk_flags = body.q2_risk_flags || [];
    body.safety_flags = body.safety_flags || [];
    body.chip_responses = body.chip_responses || {};
    body.prior_applied = body.prior_applied || [];
    body.prior_values = body.prior_values || {};
    body.safety_followup_answers = body.safety_followup_answers || {};

    // Validate required fields
    if (!body.demographics || !body.q1_primary_goal) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: demographics, q1_primary_goal' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    dynamicPrompt = buildDynamicSystemPrompt(body);
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // Use streaming API (async iterable) for Edge compatibility
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 5120,
          temperature: 0.3,
          stream: true,
          system: [
            {
              type: 'text' as const,
              text: STATIC_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' as const },
            },
            {
              type: 'text' as const,
              text: dynamicPrompt,
            },
          ],
          messages: [
            {
              role: 'user',
              content: `Generate the treatment recommendation JSON (3-Layer: Mirror + Confidence + Solution) based on the patient data provided in the system prompt. Do NOT generate treatment_plan — set treatment_plan to { "phases": [] }. CURRENT_MONTH: ${new Date().getMonth() + 1}.

TOKEN BUDGET RULES (CRITICAL — you MUST stay under 4500 tokens):
- Limit to top 2 EBD devices, top 2 injectables, top 1 signature solution.
- summary_html: 1 sentence max. why_fit_html: 2 short numbered reasons only. moa_description_html: 1 sentence.
- ai_description_html: 1-2 sentences max.
- Set homecare to { morning:[], evening:[], weekly:[], avoid:[] }.
- Set doctor_tab fields to minimal strings. Set consultation_strategy arrays to empty [].
- mirror.empathy_paragraphs: 1 short paragraph. confidence.reason_why: 1 short paragraph. confidence.social_proof: 1 sentence.
- Do NOT include lengthy HTML. Keep all HTML values under 200 characters each.

MANDATORY FIELDS (never omit):
- Every EBD device MUST have: scores (all 11 keys: tightening, lifting, volume, brightening, texture, evidence, synergy, longevity, roi, trend, popularity), practical (all 5 keys), why_fit_html, summary_html, subtitle, ai_description_html.
- Every injectable MUST have: scores (all 8 keys: hydration, repair, collagen, brightening, elasticity, evidence, synergy, longevity), practical (all 4 keys), why_fit_html, summary_html, subtitle.
- patient object MUST be complete.

Output ONLY valid JSON.`,
            },
          ],
        });

        let fullText = '';
        let inputTokens = 0;
        let outputTokens = 0;
        let modelUsed = 'claude-haiku-4-5-20251001';
        let stopReason = '';
        let lastProgressAt = 0;

        for await (const event of response) {
          if (event.type === 'content_block_delta' && 'delta' in event && (event.delta as { type: string }).type === 'text_delta') {
            fullText += (event.delta as { type: string; text: string }).text;
            // Send heartbeat every ~500 chars to keep client alive
            if (fullText.length - lastProgressAt >= 500) {
              lastProgressAt = fullText.length;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'progress', chars: fullText.length })}\n\n`)
              );
            }
          } else if (event.type === 'message_start' && 'message' in event) {
            const msg = event.message as { usage?: { input_tokens?: number }; model?: string };
            inputTokens = msg.usage?.input_tokens || 0;
            modelUsed = msg.model || modelUsed;
          } else if (event.type === 'message_delta') {
            const delta = event as { usage?: { output_tokens?: number }; delta?: { stop_reason?: string } };
            outputTokens = delta.usage?.output_tokens || outputTokens;
            if (delta.delta?.stop_reason) {
              stopReason = delta.delta.stop_reason;
            }
          }
        }

        console.log(`[final-recommendation] Stream complete. stop_reason=${stopReason}, output_tokens=${outputTokens}, text_length=${fullText.length}`);

        // Send a heartbeat so client knows stream is alive during JSON parsing
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'progress', chars: fullText.length, phase: 'parsing' })}\n\n`)
        );

        // Warn if output was truncated due to max_tokens
        if (stopReason === 'max_tokens') {
          console.warn(`[final-recommendation] ⚠️ Output truncated (max_tokens). output_tokens=${outputTokens}, text_length=${fullText.length}. Will attempt JSON repair.`);
        }

        // ─── Robust JSON parsing with aggressive repair ───────────
        let recommendation: OpusRecommendationOutput;
        const parseResult = robustJsonParse(fullText, stopReason, outputTokens);
        if (parseResult.ok) {
          recommendation = parseResult.value;

          // ─── Fill defaults for fields that may be missing due to truncation ───
          if (!recommendation.lang) recommendation.lang = 'ko';
          if (!recommendation.generated_at) recommendation.generated_at = new Date().toISOString();
          if (!recommendation.model) recommendation.model = modelUsed;
          if (!recommendation.patient) {
            recommendation.patient = {
              age: '', gender: '', country: '', aesthetic_goal: '',
              top3_concerns: [], past_treatments: [], fitzpatrick: '', pain_sensitivity: 3,
            };
          }
          // Backfill patient fields from actual survey data (more reliable than AI echo)
          const pat = recommendation.patient;
          if (!pat.name) pat.name = (body.demographics as any)?.d_name || '고객';
          if (!pat.age && body.demographics?.d_age) pat.age = body.demographics.d_age;
          if (!pat.gender && body.demographics?.d_gender) pat.gender = body.demographics.d_gender;
          if (!pat.country && body.demographics?.detected_country) pat.country = body.demographics.detected_country;
          if (!pat.aesthetic_goal && body.q1_primary_goal) pat.aesthetic_goal = body.q1_primary_goal;
          if ((!pat.top3_concerns || pat.top3_concerns.length === 0) && body.q3_concern_area) {
            pat.top3_concerns = [body.q3_concern_area];
          }
          if ((!pat.past_treatments || pat.past_treatments.length === 0) && body.q7_past_experience) {
            pat.past_treatments = [body.q7_past_experience];
          }
          if (!pat.pain_sensitivity && body.q6_pain_tolerance) pat.pain_sensitivity = parseInt(body.q6_pain_tolerance) || 3;
          if (!pat.stay_duration && body.stay_duration) pat.stay_duration = `${body.stay_duration}일`;
          console.log('[final-recommendation] Patient data backfilled from survey:', JSON.stringify(pat));
          if (!recommendation.safety_flags) recommendation.safety_flags = {};
          // mirror & confidence fallbacks are handled below (H-1 section)
          if (!recommendation.ebd_recommendations) recommendation.ebd_recommendations = [];
          if (!recommendation.injectable_recommendations) recommendation.injectable_recommendations = [];
          if (!recommendation.signature_solutions) recommendation.signature_solutions = [];
          if (!recommendation.treatment_plan) recommendation.treatment_plan = { phases: [] };
          if (!recommendation.homecare) {
            recommendation.homecare = { morning: [], evening: [], weekly: [], avoid: [] };
          }
          if (!recommendation.doctor_tab) {
            recommendation.doctor_tab = {
              clinical_summary: '',
              triggered_protocols: [],
              country_note: '',
              parameter_guidance: {},
              contraindications: [],
              alternative_options: [],
              patient_intelligence: {
                expectation_tag: 'REALISTIC',
                expectation_note: '',
                budget_timeline: { budget_tier: 'Standard', decision_speed: 'Normal', urgency: 'MEDIUM', stay_duration: null },
                communication_style: 'LOGICAL',
                communication_note: '',
              },
              consultation_strategy: {
                recommended_order: [],
                expected_complaints: [],
                scenario_summary: '',
              },
            } as OpusDoctorTab;
          }

          // ─── Fill defaults for individual EBD device entries ───
          const DEFAULT_EBD_SCORES: Record<string, number> = {
            tightening: 5, lifting: 5, volume: 5, brightening: 5, texture: 5,
            evidence: 5, synergy: 5, longevity: 5, roi: 5, trend: 5, popularity: 5,
          };
          const DEFAULT_EBD_PRACTICAL = { sessions: 'N/A', interval: 'N/A', duration: 'N/A', onset: 'N/A', maintain: 'N/A' };
          for (let ei = 0; ei < recommendation.ebd_recommendations.length; ei++) {
            const ebd = recommendation.ebd_recommendations[ei];
            if (!ebd.device_name) ebd.device_name = ebd.subtitle || `EBD Device ${ei + 1}`;
            if (!ebd.scores || Object.keys(ebd.scores).length === 0) {
              console.warn(`[final-recommendation] ⚠️ EBD "${ebd.device_name}" missing scores — applying defaults`);
              ebd.scores = { ...DEFAULT_EBD_SCORES };
            } else {
              // Fill any missing individual score keys
              for (const [k, v] of Object.entries(DEFAULT_EBD_SCORES)) {
                if (ebd.scores[k] == null) ebd.scores[k] = v;
              }
            }
            if (!ebd.practical) ebd.practical = { ...DEFAULT_EBD_PRACTICAL };
            if (!ebd.why_fit_html) ebd.why_fit_html = '<p>(상세 분석 준비 중)</p>';
            if (!ebd.summary_html) ebd.summary_html = '<p>(요약 준비 중)</p>';
            if (!ebd.subtitle) ebd.subtitle = ebd.device_name || 'EBD Device';
            if (!ebd.ai_description_html) ebd.ai_description_html = '<p>(설명 준비 중)</p>';
            if (ebd.confidence == null) ebd.confidence = 70;
            if (ebd.pain_level == null) ebd.pain_level = 3;
            if (ebd.downtime_level == null) ebd.downtime_level = 2;
          }

          // ─── Fill defaults for individual injectable entries ───
          const DEFAULT_INJ_SCORES: Record<string, number> = {
            hydration: 5, repair: 5, collagen: 5, brightening: 5,
            elasticity: 5, evidence: 5, synergy: 5, longevity: 5,
          };
          const DEFAULT_INJ_PRACTICAL = { sessions: 'N/A', interval: 'N/A', onset: 'N/A', maintain: 'N/A' };
          for (let ii = 0; ii < recommendation.injectable_recommendations.length; ii++) {
            const inj = recommendation.injectable_recommendations[ii];
            if (!inj.name) inj.name = (inj as any).product_name || inj.subtitle || `Injectable ${ii + 1}`;
            if (!inj.scores || Object.keys(inj.scores).length === 0) {
              console.warn(`[final-recommendation] ⚠️ Injectable "${inj.name}" missing scores — applying defaults`);
              inj.scores = { ...DEFAULT_INJ_SCORES };
            } else {
              for (const [k, v] of Object.entries(DEFAULT_INJ_SCORES)) {
                if (inj.scores[k] == null) inj.scores[k] = v;
              }
            }
            if (!inj.practical) inj.practical = { ...DEFAULT_INJ_PRACTICAL };
            if (!inj.why_fit_html) inj.why_fit_html = '<p>(상세 분석 준비 중)</p>';
            if (!inj.summary_html) inj.summary_html = '<p>(요약 준비 중)</p>';
            if (!inj.subtitle) inj.subtitle = inj.name || 'Injectable';
            if (inj.confidence == null) inj.confidence = 70;
          }

          // ─── Enforce EXACTLY 3 recommendations per category ───
          const MIN_RECS = 3;
          while (recommendation.ebd_recommendations.length < MIN_RECS) {
            const idx = recommendation.ebd_recommendations.length + 1;
            console.warn(`[final-recommendation] ⚠️ EBD count < ${MIN_RECS} — adding placeholder #${idx}`);
            recommendation.ebd_recommendations.push({
              rank: idx,
              device_name: `Recommended Device ${idx}`,
              device_id: `placeholder_ebd_${idx}`,
              moa_category: 'energy_based',
              moa_category_label: 'Energy-Based Device',
              evidence_level: 3,
              confidence: 60,
              skin_layer: 'dermis',
              pain_level: 3,
              downtime_level: 2,
              safety_level: 9,
              badge: null,
              badge_color: '',
              subtitle: '(AI가 추가 추천을 생성하지 못했습니다)',
              summary_html: '<p>추가 디바이스 추천이 필요합니다. 담당 의사와 상담해 주세요.</p>',
              why_fit_html: '<p>—</p>',
              moa_summary_title: 'MOA',
              moa_summary_short: '',
              moa_description_html: '',
              target_tags: [],
              practical: { sessions: 'N/A', interval: 'N/A', duration: 'N/A', onset: 'N/A', maintain: 'N/A' },
              scores: { tightening: 5, lifting: 5, volume: 5, brightening: 5, texture: 5, evidence: 3, synergy: 5, longevity: 5, roi: 5, trend: 5, popularity: 5 },
              ai_description_html: '',
            } as OpusDeviceRecommendation);
          }
          while (recommendation.injectable_recommendations.length < MIN_RECS) {
            const idx = recommendation.injectable_recommendations.length + 1;
            console.warn(`[final-recommendation] ⚠️ Injectable count < ${MIN_RECS} — adding placeholder #${idx}`);
            recommendation.injectable_recommendations.push({
              rank: idx,
              name: `Recommended Injectable ${idx}`,
              injectable_id: `placeholder_inj_${idx}`,
              category: 'skin_booster',
              category_label: 'Skin Booster',
              evidence_level: 3,
              confidence: 60,
              skin_layer: 'dermis',
              subtitle: '(AI가 추가 추천을 생성하지 못했습니다)',
              summary_html: '<p>추가 주사 추천이 필요합니다. 담당 의사와 상담해 주세요.</p>',
              why_fit_html: '<p>—</p>',
              moa_summary_title: 'MOA',
              moa_summary_short: '',
              moa_description_html: '',
              practical: { sessions: 'N/A', interval: 'N/A', onset: 'N/A', maintain: 'N/A' },
              scores: { hydration: 5, firming: 5, brightening: 5, longevity: 5, evidence: 3, trend: 5, popularity: 5 },
            } as OpusInjectableRecommendation);
          }

          console.log(`[final-recommendation] ✅ Parsed OK. EBD=${recommendation.ebd_recommendations.length}, INJ=${recommendation.injectable_recommendations.length}, SIG=${recommendation.signature_solutions.length}, stop_reason=${stopReason}, output_tokens=${outputTokens}`);

          if (stopReason === 'max_tokens') {
            console.warn(`[final-recommendation] ⚠️ Output was truncated but JSON repair succeeded. Some fields may use defaults.`);
          }
        } else {
          console.error(`[final-recommendation] All JSON parse attempts failed. stop_reason=${stopReason}, output_tokens=${outputTokens}, text_length=${fullText.length}`);
          console.error('[final-recommendation] First 500 chars:', fullText.substring(0, 500));
          console.error('[final-recommendation] Last 500 chars:', fullText.substring(Math.max(0, fullText.length - 500)));
          console.error('[final-recommendation] Errors:', parseResult.errors.join(' | '));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: `Failed to parse AI response (${fullText.length} chars, stop_reason: ${stopReason || 'unknown'}). ${parseResult.errors[parseResult.errors.length - 1]}`,
              debug: { stop_reason: stopReason, output_tokens: outputTokens, text_length: fullText.length },
            })}\n\n`)
          );
          controller.close();
          return;
        }

        // ─── H-1: Validate & fallback for Mirror + Confidence layers ───
        if (!recommendation.mirror || !recommendation.mirror.headline) {
          console.warn('[final-recommendation] Mirror layer missing — injecting fallback');
          recommendation.mirror = {
            headline: recommendation.mirror?.headline || '\uB2F9\uC2E0\uC758 \uD53C\uBD80 \uACE0\uBBFC, \uCDA9\uBD84\uD788 \uC774\uD574\uD569\uB2C8\uB2E4',
            empathy_paragraphs: recommendation.mirror?.empathy_paragraphs || '\uB9CE\uC740 \uBD84\uB4E4\uC774 \uBE44\uC2B7\uD55C \uACE0\uBBFC\uC744 \uC548\uACE0 \uACC4\uC2ED\uB2C8\uB2E4. \uAC70\uC6B8\uC744 \uBCFC \uB54C\uB9C8\uB2E4, \uC0AC\uC9C4\uC744 \uCC0D\uC744 \uB54C\uB9C8\uB2E4 \uC2E0\uACBD\uC774 \uC4F0\uC774\uB294 \uADF8 \uB9C8\uC74C\uC744 \uC798 \uC54C\uACE0 \uC788\uC2B5\uB2C8\uB2E4.',
            transition: recommendation.mirror?.transition || '\uADF8\uB9AC\uACE0 \uBC29\uBC95\uC774 \uC788\uC2B5\uB2C8\uB2E4.',
          };
        }
        if (!recommendation.confidence || !recommendation.confidence.reason_why) {
          console.warn('[final-recommendation] Confidence layer missing — injecting fallback');
          recommendation.confidence = {
            reason_why: recommendation.confidence?.reason_why || '\uD53C\uBD80\uACFC\uD559\uC801\uC73C\uB85C \uAC80\uC99D\uB41C \uBA54\uCEE4\uB2C8\uC998\uC744 \uAE30\uBC18\uC73C\uB85C, \uB2F9\uC2E0\uC758 \uD53C\uBD80 \uC0C1\uD0DC\uC5D0 \uC801\uD569\uD55C \uC811\uADFC\uBC95\uC774 \uC874\uC7AC\uD569\uB2C8\uB2E4.',
            social_proof: recommendation.confidence?.social_proof || '\uC720\uC0AC\uD55C \uD53C\uBD80 \uC870\uAC74\uC758 \uD658\uC790\uAD70\uC5D0\uC11C \uB192\uC740 \uB9CC\uC871\uB3C4\uAC00 \uBCF4\uACE0\uB418\uACE0 \uC788\uC2B5\uB2C8\uB2E4.',
            commitment: recommendation.confidence?.commitment || '\uB2F9\uC2E0\uC5D0\uAC8C \uB9DE\uB294 \uC194\uB8E8\uC158\uC774 \uC788\uC2B5\uB2C8\uB2E4.',
          };
        }

        // Send final result
        const result: FinalRecommendationResponse = {
          recommendation_json: recommendation,
          model: modelUsed,
          usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        };
        try {
          const donePayload = JSON.stringify({ type: 'done', ...result, stop_reason: stopReason });
          console.log(`[final-recommendation] Sending done event (${donePayload.length} chars)`);
          controller.enqueue(encoder.encode(`data: ${donePayload}\n\n`));
        } catch (serializeErr) {
          console.error('[final-recommendation] Failed to serialize done event:', serializeErr);
          // Fallback: send minimal result
          const minimal = {
            type: 'done',
            recommendation_json: recommendation,
            model: modelUsed,
            usage: { input_tokens: inputTokens, output_tokens: outputTokens },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(minimal)}\n\n`));
        }
        controller.close();
      } catch (error) {
        console.error('[final-recommendation] Error:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`)
          );
          controller.close();
        } catch {
          // Controller might already be closed
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
