/**
 * /api/survey-chat
 * ─────────────────────────────────────────────────────────────────────────────
 * Haiku Conversation Conductor — Conversational intake survey AI
 *
 * Drives natural multi-turn conversation to collect clinical signals needed for
 * AI skin analysis recommendations. Uses Claude Haiku for fast, empathetic Q&A.
 *
 * POST body:
 *   {
 *     messages: Array<{ role: 'user' | 'assistant', content: string }>,
 *     signalState: SignalState | null,
 *     demographics: { country: string, age_range: string, gender: string },
 *     language?: 'KO' | 'EN'  (default: 'KO')
 *   }
 *
 * Response: JSON (200 OK)
 *   {
 *     message: string,           // Next question/response for patient
 *     signal_state: SignalState, // Updated state
 *     wizard_data: WizardData | null  // Only set when recommendation_ready=true
 *   }
 *
 * Error responses: (400, 500)
 *   { error: string }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

// ─── Type Definitions ──────────────────────────────────────────────────────

export interface SignalState {
  primary_concern: string | null;
  secondary_concern: string | null;
  face_zone: string | null;
  downtime_tolerance: string | null;
  budget_level: string | null;
  treatment_history: string | null;
  recurrence_history: boolean | null;
  volume_loss: boolean | null;
  pore_timeline: string | null;
  triggered_protocols: string[];
  missing_critical: string[];
  recommendation_ready: boolean;
  turn_count: number;
}

export interface WizardData {
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
  triggered_protocols?: string[];
  free_text_summary?: string;
}

interface Demographics {
  country: string;
  age_range: string;
  gender: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SurveyChatRequest {
  messages: ChatMessage[];
  signalState: SignalState | null;
  demographics: Demographics;
  language?: 'KO' | 'EN';
}

interface SurveyChatResponse {
  message: string;
  signal_state: SignalState;
  wizard_data: WizardData | null;
  choice_options?: string[];  // Short tappable options for discrete questions
}

// ─── Initialize Clients ────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Protocol Trigger Keywords ────────────────────────────────────────────

const PROTOCOL_TRIGGERS: Record<string, string[]> = {
  PROTO_01: [
    '처짐', '리프팅', '턱선', '처진', 'sagging', 'jowl', '볼살', '꺼진',
    'lifting', 'tightening', 'jawline', 'contour', 'cheek volume',
  ],
  PROTO_02: [
    '기미', '멜라즈마', 'melasma', '색소침착', '재발', 'pigmentation',
    'dark spot', 'age spot', '점',
  ],
  PROTO_03: [
    '홍조', '혈관', '실핏줄', 'rosacea', '붉은피부', 'vascular',
    'redness', 'flushing', 'telangiectasia',
  ],
  PROTO_04: [
    '피부결', '텍스처', '거칠음', '매끄럽게', 'texture', 'rough',
    'smoothness', 'refinement', '주름',
  ],
  PROTO_05: [
    '모공', 'pore', '모공이 커요', '넓은 모공', 'pore refine',
    'enlarged pore', '모공 개선',
  ],
  PROTO_06: [
    '흑자', '갈색점', 'lentigo', '피부톤', '칙칙함', 'brightening',
    'glow', 'radiance', 'lentigo', 'brown spot',
  ],
};

// ─── Helper: Detect triggered protocols ────────────────────────────────────

function detectProtocols(text: string): string[] {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const triggered = new Set<string>();

  Object.entries(PROTOCOL_TRIGGERS).forEach(([protocol, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        triggered.add(protocol);
      }
    });
  });

  return Array.from(triggered);
}

// ─── Helper: Determine if critical signals are complete ────────────────────

function determineCriticalMissing(state: SignalState): string[] {
  const missing: string[] = [];

  if (!state.primary_concern) {
    missing.push('primary_concern');
  }

  if (!state.downtime_tolerance) {
    missing.push('downtime_tolerance');
  }

  // Check protocol-specific signals
  for (const protocol of state.triggered_protocols) {
    if (protocol === 'PROTO_01' && !state.face_zone && !state.volume_loss) {
      missing.push('PROTO_01:face_zone_or_volume_loss');
    }
    if (protocol === 'PROTO_02' && state.recurrence_history === null) {
      missing.push('PROTO_02:recurrence_history');
    }
    if (protocol === 'PROTO_05' && !state.pore_timeline) {
      missing.push('PROTO_05:pore_timeline');
    }
  }

  return missing;
}

// ─── Country-specific patient profiles ────────────────────────────────────

const COUNTRY_PROFILES: Record<string, {
  topConcerns: string;
  culturalNotes: string;
  questioningStyle: string;
  prioritySignals: string;
}> = {
  KR: {
    topConcerns: '피부결 개선, 기미/색소, 리프팅, 모공',
    culturalNotes: '시술 경험자 비율이 높아 "재시술 최적화" 패턴이 많음. 임상 근거와 효과 지속성을 중시. 다운타임 3~5일 수용도 높음.',
    questioningStyle: '시술 이력을 자연스럽게 먼저 확인. 이미 받아봤다면 무엇이 부족했는지 파악.',
    prioritySignals: 'treatment_history → primary_concern → downtime_tolerance',
  },
  JP: {
    topConcerns: '피부 민감성, 무자극 화이트닝, 최소 다운타임 리프팅',
    culturalNotes: '피부 예민도를 매우 중시함. 침습적 시술에 거부감 큼. 다운타임 0~1일 이하 선호. 안전성 데이터를 효과보다 우선 신뢰.',
    questioningStyle: '피부 반응성(민감도)을 초반에 파악. 비침습 옵션을 언급하며 신뢰 형성.',
    prioritySignals: 'skin_sensitivity → primary_concern → downtime_tolerance(거의 0)',
  },
  CN: {
    topConcerns: 'V라인 윤곽, 화이트닝/미백, 피부톤 균일화',
    culturalNotes: 'V라인과 미백이 압도적 1순위. 예산 허용 범위 넓음. 정품/정식 시술 여부를 중시(모조품 경험 多). 효과 사진 선호.',
    questioningStyle: '얼굴 윤곽과 피부톤을 함께 물어보는 게 자연스러움. 예산은 초반에 확인해도 OK.',
    prioritySignals: 'primary_concern(윤곽 vs 톤) → budget_level → downtime_tolerance',
  },
  TW: {
    topConcerns: '화이트닝, 피부 탄력, 모공',
    culturalNotes: '미백과 탄력을 동시에 원하는 경향. 한국 시술 트렌드에 관심 높음. 중간 예산대 다수.',
    questioningStyle: '복합 고민이 많으므로 주 고민 1가지를 먼저 명확히 확인.',
    prioritySignals: 'primary_concern → secondary_concern → budget_level',
  },
  SG: {
    topConcerns: '색소 침착(UV), 피부 탄력, 땀구멍/모공',
    culturalNotes: '열대성 기후로 UV 노출이 많아 색소/색조 재발 이슈가 큼. 영어권으로 직접적 소통 선호. 예산 민감도 중간.',
    questioningStyle: '야외 활동량/자외선 노출 습관을 자연스럽게 확인. 재발 우려 다루기.',
    prioritySignals: 'primary_concern → treatment_history → downtime_tolerance',
  },
  TH: {
    topConcerns: '미백, 피부톤 개선, 저예산 고효율',
    culturalNotes: '미백 효과가 1위. 열대 기후 특성상 색소 재발 우려 높음. 예산 민감도 높아 가성비 언급 효과적.',
    questioningStyle: '미백 목표를 먼저 파악 후 예산 범위 확인. 저자극 옵션 소개.',
    prioritySignals: 'primary_concern(미백 구체화) → budget_level → downtime_tolerance',
  },
  US: {
    topConcerns: '자연스러운 안티에이징, 주름/볼륨, 피부톤',
    culturalNotes: '"Done look"을 매우 싫어함. 자연스러운 결과 강조 필수. 다운타임 1주일 수용. 근거 기반 설명 선호. 고가여도 결과 보장 시 OK.',
    questioningStyle: '원하는 결과의 "자연스러운 정도"를 먼저 파악. 비용 대비 지속성 언급.',
    prioritySignals: 'primary_concern → result_style(natural) → downtime_tolerance',
  },
  GB: {
    topConcerns: '안티에이징, 피부결, 자연스러운 리프팅',
    culturalNotes: 'US와 유사하나 더 보수적. 과도한 시술 거부감 큼. 신중한 정보 제공 선호.',
    questioningStyle: '부작용/리스크 설명을 충분히 하면서 신뢰 먼저 형성.',
    prioritySignals: 'primary_concern → downtime_tolerance → treatment_history',
  },
};

const DEFAULT_PROFILE = {
  topConcerns: '피부결 개선, 탄력, 색소',
  culturalNotes: '환자의 언어와 문화적 배경에 맞는 접근 필요.',
  questioningStyle: '주 고민을 먼저 파악 후 다운타임 확인.',
  prioritySignals: 'primary_concern → downtime_tolerance → budget_level',
};

// ─── Helper: Build system prompt with demographics ────────────────────────

function buildSystemPrompt(
  demographics: Demographics,
  language: string
): string {
  const { country, age_range, gender } = demographics;
  const profile = COUNTRY_PROFILES[country] || DEFAULT_PROFILE;

  return `You are a warm, professional Korean medical aesthetics consultation assistant for ConnectingDocs.
Conduct a natural conversational intake to collect clinical signals needed for AI skin analysis.

CONVERSATION STYLE:
- Warm, empathetic, professional tone
- Ask ONE focused question per turn — never multiple questions at once
- Briefly acknowledge what the patient said before asking next question
- Respond in ${language === 'KO' ? 'Korean' : 'English'}
- Keep each response to 1-3 sentences max
- Never use medical jargon without explanation

DEMOGRAPHICS CONTEXT (already collected before conversation):
Country: ${country}, Age range: ${age_range}, Gender: ${gender}

COUNTRY-SPECIFIC PROFILE (${country}):
- Top concerns for this patient group: ${profile.topConcerns}
- Cultural notes: ${profile.culturalNotes}
- Recommended questioning style: ${profile.questioningStyle}
- Priority signal order: ${profile.prioritySignals}

Use this country profile to shape your question order and tone. For example:
${country === 'JP' ? '→ Start by acknowledging skin sensitivity concerns, emphasize non-invasive options early.' : ''}
${country === 'CN' ? '→ Naturally ask about both facial contour AND skin tone — patients often want both.' : ''}
${country === 'TH' || country === 'SG' ? '→ Ask about sun exposure habits early — UV-related pigmentation is a common concern.' : ''}
${country === 'US' || country === 'GB' ? '→ Explicitly acknowledge the preference for natural-looking results early in conversation.' : ''}
${country === 'KR' ? '→ If patient mentions prior treatments, ask what was lacking — optimization framing resonates well.' : ''}

SIGNALS TO COLLECT:
ALWAYS required:
- primary_concern: Main skin issue
- downtime_tolerance: Recovery time acceptable (none/1-2일/3-5일/1주일이상)

PROTOCOL-SPECIFIC (collect only if protocol triggered):
- PROTO_01 triggered by: 처짐, 리프팅, 턱선, 처진, sagging, jowl, 볼살, 꺼진
  → also collect: face_zone (하관/중안부/전체), volume_loss (true/false)
- PROTO_02 triggered by: 기미, 멜라즈마, melasma, 색소침착, 재발
  → also collect: recurrence_history (레이저 후 기미 재발 이력 여부)
- PROTO_03 triggered by: 홍조, 혈관, 실핏줄, rosacea, 붉은피부
  → no extra signals needed (diffuse vs spot inferred from description)
- PROTO_04 triggered by: 피부결, 텍스처, 거칠음, 매끄럽게
  → no extra signals needed
- PROTO_05 triggered by: 모공, pore, 모공이 커요, 넓은 모공
  → also collect: pore_timeline (단기빠른효과 or 장기지속효과)
- PROTO_06 triggered by: 흑자, 갈색점, lentigo, 피부톤, 칙칙함, brightening
  → no extra signals needed

OPTIONAL (collect if natural in conversation):
- budget_level: Economy/Mid/Premium (if they mention budget)
- treatment_history: Previous treatments (if they mention)
- secondary_concern: If they mention multiple concerns

DECISION: Set recommendation_ready=true when:
1. primary_concern is collected
2. downtime_tolerance is collected
3. All protocol-specific signals for triggered protocols are collected
4. OR turn_count >= 5 (collect what we have, proceed)

OUTPUT FORMAT — Return ONLY valid JSON, no markdown or other text:
{
  "message": "The question or response to show the patient",
  "choice_options": ["Option A", "Option B", "Option C"],  // OPTIONAL — include ONLY when asking discrete-answer questions (primary concern type, downtime preference, budget level, yes/no). Max 5 options, each ≤ 15 chars. Korean if KO, English if EN. Omit for open-ended questions.
  "signal_state": {
    "primary_concern": string | null,
    "secondary_concern": string | null,
    "face_zone": string | null,
    "downtime_tolerance": string | null,
    "budget_level": string | null,
    "treatment_history": string | null,
    "recurrence_history": boolean | null,
    "volume_loss": boolean | null,
    "pore_timeline": string | null,
    "triggered_protocols": string[],
    "missing_critical": string[],
    "recommendation_ready": boolean,
    "turn_count": number
  },
  "wizard_data": null
}

When recommendation_ready=true, ALSO populate wizard_data:
- Map primary_concern to primaryGoal using:
  처짐/리프팅→"Lifting & Tightening", 기미/색소→"Pigmentation & Melasma",
  홍조/혈관→"Vascular & Redness", 피부결→"Skin Texture & Resurfacing",
  모공→"Pore Refinement", 흑자/브라이트닝→"Brightening & Lentigo"
- Map downtime_tolerance to downtimeTolerance
- Set risks based on recurrence_history (if true, add "pigment_recurrence")
- Set all other fields from demographics and conversation signals
- Include triggered_protocols array
- Include free_text_summary with brief clinical observation`;
}

// ─── Helper: Extract signals from Claude response ──────────────────────────

function extractSignalsFromResponse(
  response: string,
  demographics: Demographics,
  previousState: SignalState | null
): SignalState {
  // Initialize from previous state or default
  let state = previousState || {
    primary_concern: null,
    secondary_concern: null,
    face_zone: null,
    downtime_tolerance: null,
    budget_level: null,
    treatment_history: null,
    recurrence_history: null,
    volume_loss: null,
    pore_timeline: null,
    triggered_protocols: [],
    missing_critical: [],
    recommendation_ready: false,
    turn_count: 0,
  };

  // Increment turn count
  state.turn_count += 1;

  // Detect triggered protocols from entire conversation context
  const allText = response;
  const newProtocols = detectProtocols(allText);
  state.triggered_protocols = Array.from(
    new Set([...state.triggered_protocols, ...newProtocols])
  );

  // Determine missing critical signals
  state.missing_critical = determineCriticalMissing(state);

  // Check if ready: have primary + downtime + all protocol-specific + OR >= 5 turns
  const hasPrimary = state.primary_concern !== null;
  const hasDowntime = state.downtime_tolerance !== null;
  const allProtocolComplete =
    state.triggered_protocols.length === 0 ||
    state.triggered_protocols.every(protocol => {
      if (protocol === 'PROTO_01') {
        return state.face_zone !== null && state.volume_loss !== null;
      }
      if (protocol === 'PROTO_02') {
        return state.recurrence_history !== null;
      }
      if (protocol === 'PROTO_05') {
        return state.pore_timeline !== null;
      }
      return true; // Other protocols have no specific requirements
    });

  state.recommendation_ready =
    (hasPrimary && hasDowntime && allProtocolComplete) ||
    state.turn_count >= 5;

  return state;
}

// ─── Helper: Build wizard data from signals ────────────────────────────────

function buildWizardData(
  state: SignalState,
  demographics: Demographics
): WizardData {
  // Map primary concern to primaryGoal
  const primaryMap: Record<string, string> = {
    sagging: 'Lifting & Tightening',
    '처짐': 'Lifting & Tightening',
    lifting: 'Lifting & Tightening',
    melasma: 'Pigmentation & Melasma',
    '기미': 'Pigmentation & Melasma',
    pigmentation: 'Pigmentation & Melasma',
    rosacea: 'Vascular & Redness',
    '홍조': 'Vascular & Redness',
    texture: 'Skin Texture & Resurfacing',
    '피부결': 'Skin Texture & Resurfacing',
    pore: 'Pore Refinement',
    '모공': 'Pore Refinement',
    lentigo: 'Brightening & Lentigo',
    '흑자': 'Brightening & Lentigo',
    brightening: 'Brightening & Lentigo',
  };

  const primaryGoal = Object.entries(primaryMap).find(
    ([key]) =>
      state.primary_concern?.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(state.primary_concern?.toLowerCase() || '')
  )?.[1] || 'General Skin Improvement';

  // Map downtime to readable format
  const downtimeMap: Record<string, string> = {
    none: 'No downtime',
    '1-2일': '1-2 days',
    '3-5일': '3-5 days',
    '1주일이상': '1+ weeks',
    minimal: 'minimal',
    'moderate (3-5 days)': 'moderate',
    'extended (1+ weeks)': 'extended',
  };

  const downtimeTolerance =
    downtimeMap[state.downtime_tolerance || ''] ||
    state.downtime_tolerance ||
    'unknown';

  // Build risks array
  const risks: string[] = [];
  if (state.recurrence_history === true) {
    risks.push('pigment_recurrence');
  }

  return {
    country: demographics.country,
    gender: demographics.gender,
    age: demographics.age_range,
    primaryGoal,
    secondaryGoal: state.secondary_concern || '',
    risks,
    concernAreas: state.primary_concern || '',
    pores: state.pore_timeline || 'not_applicable',
    skinType: 'to_be_determined',
    resultStyle: 'natural',
    downtimeTolerance,
    budget: state.budget_level || 'mid',
    history: state.treatment_history || 'none',
    koreaVisitPlan: 'undecided',
    triggered_protocols: state.triggered_protocols,
    free_text_summary: `Patient reports ${state.primary_concern}${
      state.secondary_concern ? ` and ${state.secondary_concern}` : ''
    }. Downtime tolerance: ${downtimeTolerance}. ${
      state.triggered_protocols.length > 0
        ? `Protocols triggered: ${state.triggered_protocols.join(', ')}`
        : ''
    }`,
  };
}

// ─── Main Handler ──────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SurveyChatResponse | { error: string }>
) {
  // Check method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ─── Input Validation ──────────────────────────────────────────────

    const { messages, signalState, demographics, language = 'KO' } =
      req.body as SurveyChatRequest;

    if (!messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({ error: 'messages must be an array' });
    }

    if (!demographics || !demographics.country) {
      return res.status(400).json({ error: 'demographics with country required' });
    }

    // ─── Build System Prompt ───────────────────────────────────────────

    const systemPrompt = buildSystemPrompt(demographics, language);

    // ─── Build Conversation for Claude ────────────────────────────────

    // Empty messages = initial greeting request — seed with a silent INIT trigger
    const conversationMessages: ChatMessage[] = messages.length === 0
      ? [{
          role: 'user',
          content: `[INIT] Start the consultation with a warm, friendly greeting. Then ask about their primary skin concern. Respond in ${language === 'KO' ? 'Korean' : 'English'}.`,
        }]
      : [...messages];

    // If we have state, append it as context
    if (signalState) {
      conversationMessages.push({
        role: 'user',
        content: `[INTERNAL STATE - do not mention to patient]\nCurrent signal_state: ${JSON.stringify(
          signalState
        )}\nPlease continue the conversation naturally and update the signal state based on patient's last message.`,
      });
    }

    // ─── Call Claude Haiku ─────────────────────────────────────────────

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0.3,
      system: systemPrompt,
      messages: conversationMessages,
    });

    // ─── Parse Claude's Response ──────────────────────────────────────

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('[Survey Chat] JSON parse error:', parseErr);
      console.error('[Survey Chat] Raw response length:', responseText.length);
      console.error('[Survey Chat] Raw response preview:', responseText.slice(0, 300));

      // Attempt to extract message field via regex even if JSON is truncated
      const messageMatch = responseText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const extractedMessage = messageMatch ? messageMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : null;

      const fallbackState = extractSignalsFromResponse(
        messages[messages.length - 1]?.content || '',
        demographics,
        signalState
      );

      return res.status(200).json({
        message: extractedMessage || (
          language === 'KO'
            ? '죄송합니다. 잠시 후 다시 시도해주세요.'
            : 'I apologize for the error. Please try again.'
        ),
        signal_state: fallbackState,
        wizard_data: null,
      });
    }

    // ─── Extract and enhance state ─────────────────────────────────────

    let signal_state = extractSignalsFromResponse(
      messages[messages.length - 1]?.content || '',
      demographics,
      signalState
    );

    // Override with any state updates from Claude's response if present
    if (parsed.signal_state) {
      signal_state = {
        ...signal_state,
        ...parsed.signal_state,
        turn_count: signal_state.turn_count, // Preserve turn count
      };
    }

    // ─── Build wizard_data if ready ───────────────────────────────────

    let wizard_data: WizardData | null = null;
    if (signal_state.recommendation_ready) {
      wizard_data = buildWizardData(signal_state, demographics);
    }

    // ─── Return Response ───────────────────────────────────────────────

    return res.status(200).json({
      message: parsed.message || 'Thank you for sharing that information.',
      signal_state,
      wizard_data,
      choice_options: Array.isArray(parsed.choice_options) ? parsed.choice_options : undefined,
    });

  } catch (error: any) {
    console.error('[Survey Chat] Unexpected error:', error);

    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
