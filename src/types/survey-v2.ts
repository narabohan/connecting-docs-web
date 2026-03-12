// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs Survey v2 — Type Definitions
//  Based on HYBRID_SURVEY_LOGIC_v2.md + FRONTEND_UI_COMPONENT_DESIGN_v2.md
// ═══════════════════════════════════════════════════════════════

export type SurveyLang = 'KO' | 'EN' | 'JP' | 'ZH-CN';
export type SurveyStep = 'demographics' | 'open' | 'chips' | 'safety' | 'messenger' | 'analyzing' | 'complete';

// ─── Messenger Contact ─────────────────────────────────────
export type MessengerType = 'kakao' | 'whatsapp' | 'line' | 'wechat' | 'zalo' | 'email';

export interface MessengerContact {
  type: MessengerType;
  contact_id: string;  // phone number, kakao ID, Line ID, etc.
  name: string;        // patient display name
}

/** Country → preferred messenger mapping */
export const COUNTRY_MESSENGER_MAP: Record<string, MessengerType> = {
  KR: 'kakao',
  JP: 'line',
  TH: 'line',
  TW: 'line',
  CN: 'wechat',
  VN: 'zalo',
  // Default to WhatsApp for all others (most global reach)
};

export const MESSENGER_LABELS: Record<MessengerType, { name: string; icon: string; placeholder: Record<SurveyLang, string> }> = {
  kakao: { name: 'KakaoTalk', icon: '\uD83D\uDFE1', placeholder: { KO: '\uCE74\uCE74\uC624\uD1A1 \uC544\uC774\uB514 \uB610\uB294 \uD734\uB300\uD3F0 \uBC88\uD638', EN: 'KakaoTalk ID or phone number', JP: 'KakaoTalk ID\u307E\u305F\u306F\u96FB\u8A71\u756A\u53F7', 'ZH-CN': 'KakaoTalk ID\u6216\u624B\u673A\u53F7' } },
  whatsapp: { name: 'WhatsApp', icon: '\uD83D\uDFE2', placeholder: { KO: 'WhatsApp \uC804\uD654\uBC88\uD638 (+82...)', EN: 'WhatsApp phone number (+1...)', JP: 'WhatsApp\u96FB\u8A71\u756A\u53F7 (+81...)', 'ZH-CN': 'WhatsApp\u624B\u673A\u53F7 (+86...)' } },
  line: { name: 'LINE', icon: '\uD83D\uDFE2', placeholder: { KO: 'LINE \uC544\uC774\uB514', EN: 'LINE ID', JP: 'LINE ID', 'ZH-CN': 'LINE ID' } },
  wechat: { name: 'WeChat', icon: '\uD83D\uDFE2', placeholder: { KO: 'WeChat \uC544\uC774\uB514', EN: 'WeChat ID', JP: 'WeChat ID', 'ZH-CN': '\u5FAE\u4FE1\u53F7' } },
  zalo: { name: 'Zalo', icon: '\uD83D\uDD35', placeholder: { KO: 'Zalo \uC804\uD654\uBC88\uD638', EN: 'Zalo phone number', JP: 'Zalo\u96FB\u8A71\u756A\u53F7', 'ZH-CN': 'Zalo\u624B\u673A\u53F7' } },
  email: { name: 'Email', icon: '\u2709\uFE0F', placeholder: { KO: '\uC774\uBA54\uC77C \uC8FC\uC18C', EN: 'Email address', JP: '\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9', 'ZH-CN': '\u7535\u5B50\u90AE\u4EF6\u5730\u5740' } },
};
export type Gender = 'female' | 'male' | 'other';
export type AgeRange = 'teen' | '20s' | '30s' | '40s' | '50s' | '60+';

// ─── Demographics ───────────────────────────────────────────
export interface Demographics {
  d_gender: Gender;
  d_age: AgeRange;
  detected_country: string;       // ISO 3166 (KR, JP, CN, SG, US…)
  detected_language: SurveyLang;  // IP 기반 자동 + 수동 변경
}

// ─── Haiku Open Question Analysis ───────────────────────────
export interface HaikuAnalysis {
  q1_primary_goal: string;
  q1_goal_secondary: string | null;
  concern_area_hint: string;
  emotion_tone: 'urgent' | 'casual' | 'serious' | 'exploratory';
  prior_alignment: 'aligned' | 'diverged' | 'neutral';
  already_known_signals: string[];
  needs_confirmation: string[];
  // ─── Doctor Intelligence signals (Issue 0-5) ──────────────
  expectation_tag: 'REALISTIC' | 'AMBITIOUS' | 'CAUTION';
  communication_style: 'LOGICAL' | 'EMOTIONAL' | 'ANXIOUS';
  lifestyle_context: string | null;  // e.g. "사진 찍을 때 팔자주름이 보여서"
}

// ─── Smart Chip ─────────────────────────────────────────────
export type ChipType =
  | 'concern_area'
  | 'skin_profile'
  | 'past_experience'
  | 'volume_logic'
  | 'pigment_pattern'
  | 'style'
  | 'pain_tolerance'
  | 'downtime_tolerance'
  | 'treatment_rhythm'
  // ─── Clinical depth chips (Issue #1) ─────────────────────
  | 'tightening_zone'       // → EBD device zone targeting
  | 'scar_type'             // → Protocol selection (acne vs traumatic)
  | 'pigment_detail'        // → Wavelength selection (532/755/1064nm)
  | 'aging_priority'        // → Device ranking weight
  | 'texture_concern'       // → Resurfacing protocol selection
  | 'laxity_severity'       // → Energy level + layer targeting
  | 'treatment_budget';     // → ROI weighting in recommendations

export interface SmartChipOption {
  label: string;        // i18n된 표시 텍스트
  value: string;        // 저장값 (영문 표준)
  selected?: boolean;
}

export interface SmartChip {
  type: ChipType;
  question: string;               // i18n된 질문 텍스트
  options: SmartChipOption[];     // 2~4개 선택지
  priority: number;               // 1(highest) ~ 9(lowest)
  source: 'haiku_needs' | 'conditional' | 'prior_fallback';
}

// ─── Safety ─────────────────────────────────────────────────
export interface SafetySelection {
  medications: string[];    // 선택된 약물 코드
  conditions: string[];     // 선택된 상태 코드
}

export type SafetyFlag =
  | 'SAFETY_ISOTRETINOIN'
  | 'SAFETY_ANTICOAGULANT'
  | 'SAFETY_PHOTOSENSITIVITY'
  | 'HORMONAL_MELASMA'
  | 'RETINOID_PAUSE'
  | 'SAFETY_PREGNANCY'
  | 'SAFETY_KELOID'
  | 'SAFETY_ADVERSE_HISTORY';

export interface SafetyFollowUp {
  flag: SafetyFlag;
  question: string;         // Haiku가 생성한 후속 질문
  options?: SafetyFollowUpOption[];
  answer?: string;
}

export interface SafetyFollowUpOption {
  label: string;
  value: string;
}

// ─── 전체 Signal State ──────────────────────────────────────
export interface SurveyV2State {
  // Step 1
  demographics: Demographics;

  // Step 2
  open_question_raw: string;
  haiku_analysis: HaikuAnalysis | null;

  // Step 3
  smart_chips: SmartChip[];
  smart_chips_shown: ChipType[];
  chip_responses: Record<string, string>;   // ChipType → selected value
  prior_applied: string[];                  // Prior로 자동 채운 시그널 목록
  prior_overridden: string[];               // Open 응답으로 무시된 Prior 목록
  prior_values: Record<string, string>;     // Prior 자동 채운 값

  // Step 4
  safety_selection: SafetySelection;
  safety_flags: SafetyFlag[];
  safety_followups: SafetyFollowUp[];

  // Step 5 (Messenger contact for async notification)
  messenger_contact: MessengerContact | null;

  // Mapped signals (최종 — Opus에 전달)
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
  q3_primary_vector: string | null;
}

// ─── API 요청/응답 ──────────────────────────────────────────
export interface AnalyzeOpenRequest {
  demographics: Demographics;
  open_question_response: string;
}

export interface AnalyzeOpenResponse {
  analysis: HaikuAnalysis;
  prior_block: Record<string, string>;  // 적용된 Prior 값
}

export interface GenerateChipsRequest {
  demographics: Demographics;
  haiku_analysis: HaikuAnalysis;
}

export interface GenerateChipsResponse {
  chips: SmartChip[];
  prior_applied: string[];
  prior_values: Record<string, string>;
}

export interface SafetyFollowUpRequest {
  demographics: Demographics;
  selected_safety_items: string[];
  detected_language: SurveyLang;
}

export interface SafetyFollowUpResponse {
  followup_questions: SafetyFollowUp[];
  flags: SafetyFlag[];
}

// ─── Reducer Actions ────────────────────────────────────────
export type SurveyAction =
  | { type: 'SET_DEMOGRAPHICS'; payload: Demographics }
  | { type: 'SET_OPEN_RESPONSE'; payload: string }
  | { type: 'SET_HAIKU_ANALYSIS'; payload: HaikuAnalysis }
  | { type: 'SET_SMART_CHIPS'; payload: GenerateChipsResponse }
  | { type: 'SET_CHIP_RESPONSE'; payload: { chipType: string; value: string } }
  | { type: 'MAP_CHIP_RESPONSES' }
  | { type: 'SET_SAFETY_SELECTION'; payload: SafetySelection }
  | { type: 'SET_SAFETY_FLAGS'; payload: SafetyFlag[] }
  | { type: 'SET_SAFETY_FOLLOWUPS'; payload: SafetyFollowUp[] }
  | { type: 'SET_FOLLOWUP_ANSWER'; payload: { flag: SafetyFlag; answer: string } }
  | { type: 'SET_MESSENGER_CONTACT'; payload: MessengerContact }
  | { type: 'RESET' };

// ─── WizardData 호환 매핑 (v1 → v2) ─────────────────────────
export interface WizardDataCompat {
  country: string;
  gender: string;
  age: string;
  primaryGoal: string;
  secondaryGoal: string;
  risks: string[];
  concernAreas: string;
  pores: string;
  skinType: string;
  resultStyle: string;
  downtimeTolerance: string;
  budget: string;
  history: string;
  koreaVisitPlan: string;
  triggered_protocols: string[];
  free_text_summary: string;
}
