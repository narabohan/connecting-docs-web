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

// ─── Helper: Build system prompt with demographics ────────────────────────

function buildSystemPrompt(
  demographics: Demographics,
  language: string
): string {
  const { country, age_range, gender } = demographics;

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
Use this to contextualize your questions — e.g., a 40s female asking about "lifting" likely needs HIFU/MN_RF guidance.

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
      max_tokens: 400,
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
      console.error('[Survey Chat] Claude response:', responseText);

      // Fallback: return graceful error response
      const fallbackState = extractSignalsFromResponse(
        messages[messages.length - 1]?.content || '',
        demographics,
        signalState
      );

      return res.status(200).json({
        message:
          language === 'KO'
            ? '죄송합니다. 다시 시도해주세요.'
            : 'I apologize for the error. Please try again.',
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
    });

  } catch (error: any) {
    console.error('[Survey Chat] Unexpected error:', error);

    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
