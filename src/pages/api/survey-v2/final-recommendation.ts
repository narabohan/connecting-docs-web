// ═══════════════════════════════════════════════════════════════
//  POST /api/survey-v2/final-recommendation
//  Sonnet 4.6 Final Recommender — generates the full treatment plan
//  Prompt Caching enabled: static prompt cached, dynamic per-patient
//  Based on HYBRID_SURVEY_LOGIC_v2.md §7 + COUNTRY_RECOMMENDATION_WEIGHTS.md
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import type {
  Demographics,
  HaikuAnalysis,
  SafetyFlag,
  SurveyLang,
} from '@/types/survey-v2';

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
  // ─── 3-Layer Patient Report (Issue 0-4) ───────────────────
  mirror_section: OpusMirrorSection;       // 1층 거울
  confidence_section: OpusConfidenceSection; // 2층 확신
  // 3층 솔루션 = ebd_recommendations + injectable_recommendations + signature_solutions
  ebd_recommendations: OpusDeviceRecommendation[];
  injectable_recommendations: OpusInjectableRecommendation[];
  signature_solutions: OpusSignatureSolution[];
  treatment_plan: OpusTreatmentPlan;
  homecare: OpusHomecare;
  doctor_tab: OpusDoctorTab;
}

// ─── 1층 거울: 환자가 "이게 나야" 느끼는 감성 텍스트 ────────
export interface OpusMirrorSection {
  headline: string;        // 짧은 공감 한줄 (e.g. "요즘 거울 보기가 싫어지셨나요?")
  body_html: string;       // 2-3문단 감성 텍스트 (환자 일상 언어)
  concern_tags: string[];  // 환자 핵심 키워드 뱃지 (e.g. ["탄력", "볼륨", "팔자주름"])
}

// ─── 2층 확신: "해결 가능하다"는 자신감 ─────────────────────
export interface OpusConfidenceSection {
  headline: string;        // (e.g. "방법이 있습니다")
  body_html: string;       // 임상 지식을 환자 언어로 2-3문단
  key_insight: string;     // 핵심 한줄 (e.g. "진피 깊은 층의 콜라겐을 자극하면 자연스러운 회복이 가능합니다")
}

export interface OpusPatientProfile {
  age: string;
  gender: string;
  country: string;
  aesthetic_goal: string;
  top3_concerns: string[];
  past_treatments: string[];
  fitzpatrick: string;
  pain_sensitivity: number;
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

═══ 3-LAYER PATIENT REPORT STRUCTURE (Issue 0-4) ═══
The patient report follows a 3-layer philosophy: Mirror → Confidence → Solution.

LAYER 1 — MIRROR (거울): Make the patient feel "이게 나야" (this is me).
- Use the patient's OWN words from OpenQuestion. Reference their lifestyle context.
- Tone: warm, empathetic, everyday language. NOT clinical. NOT salesy.
- Structure: headline (1 short empathetic question) + body_html (2-3 paragraphs) + concern_tags (3-5 keywords).
- End with a bridge sentence: "많은 분들이 같은 고민을 하고 계세요. 그리고 방법이 있습니다."
- MUST be in the patient's language.

LAYER 2 — CONFIDENCE (확신): Give confidence that solutions exist.
- Explain the clinical WHY in patient-friendly language. No jargon.
- Reference collagen/elastin science at the right depth for the patient's age.
- Structure: headline + body_html (2-3 paragraphs) + key_insight (1 powerful sentence).
- End with: "당신의 상황에 맞는 여러 옵션이 있어요."
- MUST be in the patient's language.

LAYER 3 — SOLUTION (솔루션): Present options, NOT recommendations.
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

  "mirror_section": {
    "headline": "<empathetic 1-line question in patient language>",
    "body_html": "<2-3 paragraphs using patient's own words, warm tone>",
    "concern_tags": ["<keyword1>", "<keyword2>", "<keyword3>"]
  },

  "confidence_section": {
    "headline": "<e.g. '방법이 있습니다'>",
    "body_html": "<2-3 paragraphs explaining WHY in patient language>",
    "key_insight": "<1 powerful sentence summarizing the clinical key>"
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

  "ebd_recommendations": [
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

  "injectable_recommendations": [
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

  "treatment_plan": {
    "phases": [
      { "phase": 1-4, "name": "<phase name>", "period": "<time range>", "treatments": ["<treatment>"], "goal": "<phase goal>" }
    ]
  },

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
1. Recommend exactly 3 EBD devices and 3 injectables, ranked by confidence score
2. Safety flags MUST override device selection — never recommend a contraindicated device
3. All HTML content must use the specified CSS classes (ebd-hl, hl-cyan)
4. Scores must be integers 0-10
5. Confidence scores must reflect realistic accuracy (typically 80-95 range)
6. Patient-facing content must be in the patient's language, doctor tab in bilingual KO+EN
7. Respond ONLY with valid JSON, no other text
8. CONCISENESS IS CRITICAL — keep EBD/injectable HTML fields to 1-2 short sentences max. Keep summary_html under 40 words, why_fit_html under 60 words, moa_description_html under 50 words. EXCEPTION: mirror_section.body_html and confidence_section.body_html can be 2-3 paragraphs (80-120 words each) — these are the emotional core of the report. The complete JSON MUST fit within 9000 tokens.
9. TREND & POPULARITY SCORES ARE MANDATORY — every device and injectable must have realistic trend (0-10) and popularity (0-10) scores based on the rules in the TREND & POPULARITY WEIGHTING section. Use them as tiebreaker when confidence is within 5 points.
10. MIRROR + CONFIDENCE + DOCTOR INTELLIGENCE ARE MANDATORY — mirror_section and confidence_section must be generated for every patient. doctor_tab.patient_intelligence and doctor_tab.consultation_strategy must be fully populated. These are the emotional and strategic core of the report.`;

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

═══ SAFETY FLAGS ═══
${safetySection}`;
}

// ─── API Route Config ────────────────────────────────────────
// Extend Netlify function timeout (default 10s)
// Using Haiku 4.5 for speed (~3-5s); Sonnet requires Background Functions
export const config = {
  maxDuration: 60, // seconds — Netlify will cap to plan max
};

// ─── API Handler (Streaming to avoid Netlify timeout) ────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as FinalRecommendationRequest;

    // Defensive defaults for array/object fields that may be undefined
    body.q2_risk_flags = body.q2_risk_flags || [];
    body.safety_flags = body.safety_flags || [];
    body.chip_responses = body.chip_responses || {};
    body.prior_applied = body.prior_applied || [];
    body.prior_values = body.prior_values || {};
    body.safety_followup_answers = body.safety_followup_answers || {};

    // Validate required fields
    if (!body.demographics || !body.q1_primary_goal) {
      return res.status(400).json({ error: 'Missing required fields: demographics, q1_primary_goal' });
    }

    const dynamicPrompt = buildDynamicSystemPrompt(body);

    // Use streaming to keep connection alive and avoid Netlify timeout
    // We collect the full text, then parse JSON at the end
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10000,
      temperature: 0.3,
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
          content: 'Generate the complete treatment recommendation JSON based on the patient data provided in the system prompt. Output ONLY valid JSON.',
        },
      ],
    });

    // Set headers for streaming (keeps Netlify connection alive)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullText = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let modelUsed = 'claude-haiku-4-5-20251001';
    let lastProgressAt = 0;

    // Stream progress events to keep connection alive (throttled to every 500 chars)
    stream.on('text', (text) => {
      fullText += text;
      // Send heartbeat every ~500 chars to avoid excessive SSE events
      if (fullText.length - lastProgressAt >= 500) {
        lastProgressAt = fullText.length;
        res.write(`data: ${JSON.stringify({ type: 'progress', chars: fullText.length })}\n\n`);
      }
    });

    // Wait for stream to complete
    const finalMessage = await stream.finalMessage();
    inputTokens = finalMessage.usage.input_tokens;
    outputTokens = finalMessage.usage.output_tokens;
    modelUsed = finalMessage.model;

    // Parse JSON from collected text
    let recommendation: OpusRecommendationOutput;
    try {
      let jsonStr = fullText.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      recommendation = JSON.parse(jsonStr);
    } catch {
      console.error('[final-recommendation] JSON parse error:', fullText.substring(0, 200));
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to parse model response as JSON — output may be truncated (max_tokens)' })}\n\n`);
      res.end();
      return;
    }

    // Send final result
    const result: FinalRecommendationResponse = {
      recommendation_json: recommendation,
      model: modelUsed,
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    };
    res.write(`data: ${JSON.stringify({ type: 'done', ...result })}\n\n`);
    res.end();
  } catch (error) {
    console.error('[final-recommendation] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    // Try to send error via stream if headers already sent
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: msg });
    }
  }
}
