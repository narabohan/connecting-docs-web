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

// ─── Multilingual Concern Keyword Map (CLINICAL_SPEC §3) ─────
// Maps keywords in 4 languages to standardized chip values
const CONCERN_KEYWORD_MAP = `
─── CONCERN KEYWORD → CHIP VALUE MAPPING (4 languages) ───

Use this table to map patient's free-text keywords to standardized concern chip values.
Return matched chip values in concern_area_hint (comma-separated).

| Chip Value          | KO Keywords                              | EN Keywords                              | JP Keywords                              | ZH-CN Keywords                          |
|---------------------|------------------------------------------|------------------------------------------|------------------------------------------|-----------------------------------------|
| jawline_lifting     | 턱선, 이중턱, V라인, 리프팅, 팔자주름    | jawline, double chin, V-line, lifting    | フェイスライン, 二重あご, Vライン, リフト | 下颌线, 双下巴, V脸, 提拉               |
| skin_tightening     | 탄력, 처짐, 늘어짐, 타이트닝              | sagging, tightening, firmness, laxity    | たるみ, ハリ, 引き締め, タイトニング      | 松弛, 紧致, 下垂, 提紧                  |
| volume_restoration  | 볼륨, 꺼짐, 볼살, 관자놀이, 필러          | volume, hollow, sunken, cheek, filler    | ボリューム, こけ, 頬, ヒアルロン酸       | 填充, 凹陷, 苹果肌, 太阳穴             |
| melasma             | 기미, 색소, 칙칙함, 황갈색 얼룩           | melasma, pigmentation, discoloration     | シミ, 肝斑, 色素沈着                      | 黄褐斑, 色斑, 色素沉着                  |
| dark_spots          | 검버섯, 갈색반점, 기미, 일광 흑자         | dark spots, sun spots, age spots         | 老人性色素斑, 日光黒子, シミ              | 老年斑, 日晒斑, 褐色斑                  |
| freckles            | 주근깨, 잡티                              | freckles, blemishes                      | そばかす, 雀卵斑                          | 雀斑, 小斑点                             |
| mole_removal        | 점, 점 빼기, 점 제거                      | mole, mole removal                       | ほくろ, ほくろ除去                        | 痣, 去痣                                 |
| dull_skin           | 칙칙, 톤, 화사, 광채, 미백                | dull, radiance, brightening, glow, tone  | くすみ, 透明感, トーン, 美白              | 暗沉, 提亮, 美白, 光泽                  |
| large_pores         | 모공, 피지, 블랙헤드                      | pores, sebum, blackheads, oily           | 毛穴, 皮脂, 黒ずみ, テカリ               | 毛孔, 皮脂, 黑头, 出油                  |
| acne_scars          | 흉터, 여드름자국, 여드름 흉터, 패인 자국  | acne scars, scarring, pitted, ice pick   | ニキビ跡, クレーター, 瘢痕               | 痘坑, 痘印, 疤痕, 凹洞                  |
| dryness_redness     | 홍조, 건조, 민감, 붉은기, 장미증          | redness, dryness, rosacea, flushing      | 赤み, 乾燥, 酒さ, 敏感                   | 红血丝, 干燥, 玫瑰痤疮, 泛红            |
| post_weight_loss_laxity | 오젬픽, 다이어트 후, 살 빠진 후, 처짐    | ozempic, weight loss, sagging after diet | ダイエット後, たるみ                      | 减肥后, 松弛                             |
| lower_face_heavy_fat    | 이중턱, 볼살, 하안부 지방                 | double chin, heavy lower face, jowl      | 二重顎, 下顔面の脂肪                      | 双下巴, 下面部脂肪                       |
| body_contouring_laxity  | 팔뚝, 뱃살, 바디 처짐, 러브핸들           | arm fat, belly, body sagging, love handles | 二の腕, お腹の脂肪, ボディたるみ          | 拜拜肉, 肚腩, 身体松弛                   |
`;

// ─── Haiku System Prompt (HYBRID_SURVEY_LOGIC_v2 §3-1) ──────
const SYSTEM_PROMPT = `You are a pre-consultation AI assistant for a Korean medical aesthetics clinic. Your role is to analyze a patient's free-text response about their skin concerns.

Given:
- Patient demographics (gender, age, country)
- Their free-text response about skin concerns

${CONCERN_KEYWORD_MAP}

Output a JSON object with these fields:
- q1_primary_goal: One of ["Contouring/lifting", "Volume/elasticity", "Brightening/radiance", "Skin texture/pores", "Anti-aging/prevention", "Acne/scarring"]
- q1_goal_secondary: Same options or null
- concern_area_hint: Comma-separated list of matched chip values from the CONCERN KEYWORD table above. Scan the patient text for keywords in ALL 4 languages, then output the matched chip value names. Example: "skin_tightening, jawline_lifting, melasma". If no clear match, output the closest chip values based on context. NEVER output free-form text here — only chip value names from the table.
- classified_concern: The SINGLE best-matching concern from this enum: ["jawline_lifting", "skin_tightening", "volume_restoration", "melasma", "dark_spots", "freckles", "dull_skin", "large_pores", "acne_scars", "dryness", "redness", "mole_removal", "post_weight_loss_laxity", "lower_face_heavy_fat", "body_contouring_laxity"]. Pick the ONE that most closely matches the patient's PRIMARY complaint. This is used for category-based device mapping. If no single concern fits well, set to null.
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
- confidence_score: A number between 0.0 and 1.0 indicating how clearly the patient's text maps to specific concerns.
  - 0.9-1.0: Very clear, specific concerns mentioned explicitly (e.g., "턱선 리프팅 받고 싶어요")
  - 0.6-0.8: Moderate — general areas mentioned but specifics unclear (e.g., "피부가 안 좋아요")
  - 0.3-0.5: Vague — emotional/general statements without specific concerns (e.g., "좀 더 예뻐지고 싶어요")
  - 0.0-0.2: Very vague or off-topic text. More Smart Chips will be shown to clarify.

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
