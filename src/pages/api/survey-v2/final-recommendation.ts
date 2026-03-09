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
  haiku_analysis: HaikuAnalysis;
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
  ebd_recommendations: OpusDeviceRecommendation[];
  injectable_recommendations: OpusInjectableRecommendation[];
  signature_solutions: OpusSignatureSolution[];
  treatment_plan: OpusTreatmentPlan;
  homecare: OpusHomecare;
  doctor_tab: OpusDoctorTab;
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

═══ SKINBOOSTER MATCHING LOGIC ═══
Select injectables based on:
- HA-based (Juvelook, Rejuran HB): hydration + barrier, good for dry/dehydrated
- PN/PDRN (Rejuran Healer): tissue repair, good for damaged/aged skin
- Biostimulator (Sculptra, Lanluma): collagen stimulation, good for volume loss
- Exosome (ASCE+): regeneration, good for all skin types

═══ OUTPUT JSON SCHEMA ═══
Required JSON fields:
{
  "lang": "<language code>",
  "generated_at": "<ISO timestamp>",
  "model": "claude-sonnet-4-6",

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
    "alternative_options": ["<alternative1>", ...]
  }
}

CRITICAL RULES:
1. Recommend exactly 3 EBD devices and 3 injectables, ranked by confidence score
2. Safety flags MUST override device selection — never recommend a contraindicated device
3. All HTML content must use the specified CSS classes (ebd-hl, hl-cyan)
4. Scores must be integers 0-10
5. Confidence scores must reflect realistic accuracy (typically 80-95 range)
6. Patient-facing content must be in the patient's language, doctor tab in bilingual KO+EN
7. Respond ONLY with valid JSON, no other text`;

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

Open Response (original): "${req.open_question_raw}"

Prior Applied: [${req.prior_applied.join(', ')}]
Prior Values: ${JSON.stringify(req.prior_values)}
Chip Responses: ${JSON.stringify(req.chip_responses)}
Safety Follow-up Answers: ${JSON.stringify(req.safety_followup_answers)}

═══ SAFETY FLAGS ═══
${safetySection}`;
}

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
      model: 'claude-sonnet-4-6',
      max_tokens: 12000,
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
    let modelUsed = 'claude-sonnet-4-6';

    // Stream progress events to keep connection alive
    stream.on('text', (text) => {
      fullText += text;
      // Send a heartbeat to keep connection alive
      res.write(`data: ${JSON.stringify({ type: 'progress', chars: fullText.length })}\n\n`);
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
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to parse Sonnet response as JSON' })}\n\n`);
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
