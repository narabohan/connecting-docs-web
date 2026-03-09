// ═══════════════════════════════════════════════════════════════
//  POST /api/survey-v2/safety-followup
//  Generates follow-up questions for safety flags via Haiku
//  Based on FRONTEND_UI_COMPONENT_DESIGN_v2.md §8-3
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import type {
  SafetyFollowUpRequest,
  SafetyFollowUpResponse,
  SafetyFlag,
  SafetyFollowUp,
  SurveyLang,
} from '@/types/survey-v2';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Items that need follow-up questions ─────────────────────
const FOLLOWUP_PRIORITY: { item: string; flag: SafetyFlag }[] = [
  { item: 'isotretinoin', flag: 'SAFETY_ISOTRETINOIN' },
  { item: 'anticoagulant', flag: 'SAFETY_ANTICOAGULANT' },
  { item: 'adverse_history', flag: 'SAFETY_ADVERSE_HISTORY' },
];

// ─── Flag mapping ────────────────────────────────────────────
const ITEM_TO_FLAG: Record<string, SafetyFlag | null> = {
  isotretinoin: 'SAFETY_ISOTRETINOIN',
  anticoagulant: 'SAFETY_ANTICOAGULANT',
  antibiotic: 'SAFETY_PHOTOSENSITIVITY',
  hormonal: null,
  retinoid_topical: 'RETINOID_PAUSE',
  pregnancy: 'SAFETY_PREGNANCY',
  keloid: 'SAFETY_KELOID',
  adverse_history: 'SAFETY_ADVERSE_HISTORY',
};

// ─── Haiku system prompt for follow-up generation ────────────
const SYSTEM_PROMPT = `You are a medical safety screening assistant for a Korean aesthetics clinic. Generate concise follow-up questions for patients who have indicated potential safety concerns.

Rules:
- Generate 1-2 follow-up questions maximum
- Questions should be clear, non-alarming, and professional
- Include 2-3 multiple choice options for each question when appropriate
- Respond in the patient's language
- Output valid JSON array of objects: [{ "flag": "FLAG_NAME", "question": "...", "options": [{"label": "...", "value": "..."}] }]

Respond ONLY with valid JSON, no other text.`;

// ─── Language name mapping ───────────────────────────────────
const LANG_NAME: Record<SurveyLang, string> = {
  KO: 'Korean',
  EN: 'English',
  JP: 'Japanese',
  'ZH-CN': 'Simplified Chinese',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { demographics, selected_safety_items, detected_language } = req.body as SafetyFollowUpRequest;

    if (!selected_safety_items || !detected_language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Compute all flags
    const allFlags: SafetyFlag[] = [];
    for (const item of selected_safety_items) {
      const flag = ITEM_TO_FLAG[item];
      if (flag && !allFlags.includes(flag)) {
        allFlags.push(flag);
      }
    }

    // Determine which items need follow-up (priority order, max 2)
    const needsFollowup = FOLLOWUP_PRIORITY
      .filter(fp => selected_safety_items.includes(fp.item))
      .slice(0, 2);

    let followup_questions: SafetyFollowUp[] = [];

    if (needsFollowup.length > 0) {
      // Build Haiku prompt
      const itemDescriptions = needsFollowup.map(fp => {
        switch (fp.item) {
          case 'isotretinoin':
            return 'isotretinoin (acne medication) — need to know: currently taking or stopped, and how long ago';
          case 'anticoagulant':
            return 'blood thinning medication — need to know: type and if they can pause before procedures';
          case 'adverse_history':
            return 'previous adverse reaction to skin procedures — need to know: what procedure and what reaction';
          default:
            return fp.item;
        }
      });

      const userMessage = `Patient info:
- Gender: ${demographics?.d_gender || 'unknown'}
- Age: ${demographics?.d_age || 'unknown'}
- Country: ${demographics?.detected_country || 'unknown'}

The patient selected these safety items that need follow-up:
${itemDescriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Generate follow-up questions in ${LANG_NAME[detected_language]}. Use these exact flag names: ${needsFollowup.map(fp => fp.flag).join(', ')}`;

      try {
        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        });

        const content = message.content[0];
        if (content.type === 'text') {
          let jsonStr = content.text.trim();
          if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          }
          followup_questions = JSON.parse(jsonStr);
        }
      } catch (haikuErr) {
        console.error('[safety-followup] Haiku error, using fallback:', haikuErr);

        // Fallback: generate static follow-up questions
        followup_questions = needsFollowup.map(fp => {
          const fallback = getFallbackFollowup(fp.flag, detected_language);
          return fallback;
        });
      }
    }

    const response: SafetyFollowUpResponse = {
      followup_questions,
      flags: allFlags,
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error('[safety-followup] Error:', err);
    return res.status(500).json({
      error: 'Failed to generate safety follow-up',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

// ─── Fallback follow-up questions (no Haiku needed) ──────────
function getFallbackFollowup(flag: SafetyFlag, lang: SurveyLang): SafetyFollowUp {
  const FALLBACKS: Record<SafetyFlag, Record<SurveyLang, { question: string; options: { label: string; value: string }[] }>> = {
    SAFETY_ISOTRETINOIN: {
      KO: {
        question: '현재 복용 중인가요, 중단하셨나요?',
        options: [
          { label: '현재 복용 중', value: 'active' },
          { label: '중단 6개월 미만', value: 'recent_under_6mo' },
          { label: '중단 6개월 이상', value: 'cleared_over_6mo' },
        ],
      },
      EN: {
        question: 'Are you currently taking it or have you stopped?',
        options: [
          { label: 'Currently taking', value: 'active' },
          { label: 'Stopped less than 6 months ago', value: 'recent_under_6mo' },
          { label: 'Stopped 6+ months ago', value: 'cleared_over_6mo' },
        ],
      },
      JP: {
        question: '現在服用中ですか、中止しましたか？',
        options: [
          { label: '現在服用中', value: 'active' },
          { label: '中止6ヶ月未満', value: 'recent_under_6mo' },
          { label: '中止6ヶ月以上', value: 'cleared_over_6mo' },
        ],
      },
      'ZH-CN': {
        question: '您目前在服用还是已经停药？',
        options: [
          { label: '目前在服用', value: 'active' },
          { label: '停药不到6个月', value: 'recent_under_6mo' },
          { label: '停药6个月以上', value: 'cleared_over_6mo' },
        ],
      },
    },
    SAFETY_ANTICOAGULANT: {
      KO: {
        question: '어떤 종류의 혈액 관련 약을 복용 중이신가요?',
        options: [
          { label: '아스피린', value: 'aspirin' },
          { label: '와파린/기타 항응고제', value: 'warfarin_other' },
          { label: '잘 모르겠음', value: 'unknown' },
        ],
      },
      EN: {
        question: 'What type of blood-related medication are you taking?',
        options: [
          { label: 'Aspirin', value: 'aspirin' },
          { label: 'Warfarin/other anticoagulant', value: 'warfarin_other' },
          { label: 'Not sure', value: 'unknown' },
        ],
      },
      JP: {
        question: 'どのような血液関連の薬を服用中ですか？',
        options: [
          { label: 'アスピリン', value: 'aspirin' },
          { label: 'ワーファリン/その他', value: 'warfarin_other' },
          { label: 'わからない', value: 'unknown' },
        ],
      },
      'ZH-CN': {
        question: '您在服用哪种血液相关药物？',
        options: [
          { label: '阿司匹林', value: 'aspirin' },
          { label: '华法林/其他抗凝药', value: 'warfarin_other' },
          { label: '不确定', value: 'unknown' },
        ],
      },
    },
    SAFETY_ADVERSE_HISTORY: {
      KO: {
        question: '어떤 시술에서 어떤 반응이 있었나요?',
        options: [
          { label: '발적/부종이 오래 지속', value: 'prolonged_inflammation' },
          { label: '색소침착/흉터', value: 'scarring' },
          { label: '기타', value: 'other' },
        ],
      },
      EN: {
        question: 'What procedure caused the adverse reaction, and what happened?',
        options: [
          { label: 'Prolonged redness/swelling', value: 'prolonged_inflammation' },
          { label: 'Pigmentation/scarring', value: 'scarring' },
          { label: 'Other', value: 'other' },
        ],
      },
      JP: {
        question: 'どの施術でどのような反応がありましたか？',
        options: [
          { label: '赤み/腫れが長引いた', value: 'prolonged_inflammation' },
          { label: '色素沈着/傷跡', value: 'scarring' },
          { label: 'その他', value: 'other' },
        ],
      },
      'ZH-CN': {
        question: '是什么治疗引起了不良反应？发生了什么？',
        options: [
          { label: '红肿持续时间长', value: 'prolonged_inflammation' },
          { label: '色素沉着/疤痕', value: 'scarring' },
          { label: '其他', value: 'other' },
        ],
      },
    },
    // These flags don't typically need follow-up questions
    SAFETY_PHOTOSENSITIVITY: {
      KO: { question: '', options: [] },
      EN: { question: '', options: [] },
      JP: { question: '', options: [] },
      'ZH-CN': { question: '', options: [] },
    },
    HORMONAL_MELASMA: {
      KO: { question: '', options: [] },
      EN: { question: '', options: [] },
      JP: { question: '', options: [] },
      'ZH-CN': { question: '', options: [] },
    },
    RETINOID_PAUSE: {
      KO: { question: '', options: [] },
      EN: { question: '', options: [] },
      JP: { question: '', options: [] },
      'ZH-CN': { question: '', options: [] },
    },
    SAFETY_PREGNANCY: {
      KO: { question: '', options: [] },
      EN: { question: '', options: [] },
      JP: { question: '', options: [] },
      'ZH-CN': { question: '', options: [] },
    },
    SAFETY_KELOID: {
      KO: { question: '', options: [] },
      EN: { question: '', options: [] },
      JP: { question: '', options: [] },
      'ZH-CN': { question: '', options: [] },
    },
  };

  const fallback = FALLBACKS[flag]?.[lang];
  return {
    flag,
    question: fallback?.question || '',
    options: fallback?.options,
  };
}
