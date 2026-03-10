// ═══════════════════════════════════════════════════════════════
//  POST /api/survey-v2/analyze-open
//  Haiku analyzes the open-ended response + demographic priors
//  Based on FRONTEND_UI_COMPONENT_DESIGN_v2.md §8-1
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import type { AnalyzeOpenRequest, AnalyzeOpenResponse, HaikuAnalysis } from '@/types/survey-v2';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Demographic Prior Matrix (HYBRID_SURVEY_LOGIC_v2 §2) ───
const DEMOGRAPHIC_PRIORS: Record<string, Record<string, string>> = {
  JP: {
    pain_tolerance: 'minimal',
    style: 'natural',
    treatment_rhythm: 'incremental',
  },
  CN: {
    style: 'dramatic',
    downtime_tolerance: 'flexible',
  },
  SG: {
    downtime_tolerance: 'minimal',
  },
  TH: {
    downtime_tolerance: 'minimal',
  },
  VN: {
    downtime_tolerance: 'minimal',
  },
  KR: {},  // No strong priors — full survey
  US: {},
  AU: {},
};

// ─── Haiku System Prompt (HYBRID_SURVEY_LOGIC_v2 §3-1) ──────
const SYSTEM_PROMPT = `You are a pre-consultation AI assistant for a Korean medical aesthetics clinic. Your role is to analyze a patient's free-text response about their skin concerns.

Given:
- Patient demographics (gender, age, country)
- Their free-text response about skin concerns

Output a JSON object with these fields:
- q1_primary_goal: One of ["Contouring/lifting", "Volume/elasticity", "Brightening/radiance", "Skin texture/pores", "Anti-aging/prevention", "Acne/scarring"]
- q1_goal_secondary: Same options or null
- concern_area_hint: Brief description of specific areas mentioned
- emotion_tone: One of ["urgent", "casual", "serious", "exploratory"]
- prior_alignment: Compare response with demographic priors. "aligned" if consistent, "diverged" if surprising, "neutral" if insufficient info
- already_known_signals: Array of signal types clearly expressed (e.g., "q1_primary_goal", "concern_area", "pain_tolerance", "style", "scar_type", "pigment_detail")
- needs_confirmation: Array of signal types still needed. Choose from BOTH generic and clinical-depth signals:
  Generic: "concern_area", "skin_profile", "past_experience", "volume_logic", "pigment_pattern", "style", "pain_tolerance", "downtime_tolerance", "treatment_rhythm"
  Clinical depth (use when the primary goal clearly maps to a clinical domain):
    - "tightening_zone" — if goal involves lifting/contouring and specific zone is unclear
    - "scar_type" — if acne/scarring is mentioned but scar type is unspecified
    - "pigment_detail" — if brightening is the goal but specific pigment type is unclear
    - "aging_priority" — if anti-aging is the goal but priority (wrinkles vs sagging vs volume) is unclear
    - "texture_concern" — if texture/pore issues are mentioned but type is unspecified
    - "laxity_severity" — if sagging/lifting is discussed but severity is unknown
    - "treatment_budget" — if no budget preference is expressed

─── Doctor Intelligence Signals (Issue 0-5) ───
Analyze the patient's text to infer these 3 additional fields for doctor-facing intelligence:

- expectation_tag: One of ["REALISTIC", "AMBITIOUS", "CAUTION"]
  - REALISTIC: Patient has measured, natural-improvement expectations (e.g., "자연스럽게 개선", "subtle change")
  - AMBITIOUS: Patient wants dramatic transformation (e.g., "완전히 달라지고 싶어", "want to look 10 years younger")
  - CAUTION: Unrealistic expectations detected (e.g., "한번에 다 해결", "one session fix everything"). Flag for doctor to manage expectations.

- communication_style: One of ["LOGICAL", "EMOTIONAL", "ANXIOUS"]
  - LOGICAL: Uses factual, specific language. Mentions devices/procedures by name, asks about evidence/data.
  - EMOTIONAL: Focuses on feelings, self-image, social situations. Rich in emotional context.
  - ANXIOUS: Expresses fear, doubt, past bad experiences. Mentions pain, side effects, risks prominently.
  Determine from the overall tone, vocabulary, sentence structure, and emotional content of the text.

- lifestyle_context: A short string (max 80 chars) capturing the specific real-life situation or moment the patient mentions as their trigger. Extract their exact lifestyle context.
  Examples: "사진 찍을 때 팔자주름이 보여서", "wedding in 2 months", "job interviews coming up"
  If no specific lifestyle moment is mentioned, set to null.

Respond ONLY with valid JSON, no other text.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { demographics, open_question_response } = req.body as AnalyzeOpenRequest;

    if (!demographics || !open_question_response) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { detected_country, d_gender, d_age, detected_language } = demographics;

    // Build demographic context for Haiku
    const priors = DEMOGRAPHIC_PRIORS[detected_country] || {};
    const priorDesc = Object.entries(priors)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const userMessage = `
Patient Demographics:
- Gender: ${d_gender}
- Age: ${d_age}
- Country: ${detected_country}
- Language: ${detected_language}
${priorDesc ? `- Demographic Priors: ${priorDesc}` : ''}

Patient Response:
"${open_question_response}"

Analyze this response and return the JSON analysis.`;

    // Call Haiku
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Parse response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = content.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const analysis: HaikuAnalysis = JSON.parse(jsonStr);

    // Build prior block
    const prior_block: Record<string, string> = { ...priors };

    const response: AnalyzeOpenResponse = {
      analysis,
      prior_block,
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error('[analyze-open] Error:', err);
    return res.status(500).json({
      error: 'Failed to analyze response',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
