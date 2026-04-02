// ═══════════════════════════════════════════════════════════════
//  POST /api/survey-v2/generate-chips
//  Generates Smart Chips based on Haiku analysis + Prior skip logic
//  Synced with SURVEY_CLINICAL_SPEC.md §3 chip pool
//  Based on FRONTEND_UI_COMPONENT_DESIGN_v2.md §6-3
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  GenerateChipsRequest,
  GenerateChipsResponse,
  SmartChip,
  ChipType,
  SurveyLang,
} from '@/types/survey-v2';
import { CHIP_TEMPLATES } from '@/utils/survey-v2-i18n';

// ─── CLINICAL_SPEC §3: Concern Area Hint → Chip Pool Mapping ──
// Maps haiku concern_area_hint keywords to CLINICAL_SPEC chip values
// Used to prioritize relevant concern_area chips based on AI analysis

const CONCERN_HINT_TO_CHIPS: Record<string, ChipType[]> = {
  // Lifting/Tightening keywords
  'wrinkle': ['tightening_zone', 'laxity_severity'],
  'tightening': ['tightening_zone', 'laxity_severity'],
  'lifting': ['tightening_zone', 'laxity_severity'],
  'jawline': ['tightening_zone', 'laxity_severity'],
  'sagging': ['tightening_zone', 'laxity_severity'],
  'volume_loss': ['volume_logic'],
  'volume': ['volume_logic'],
  // Pigment keywords
  'pigment': ['pigment_detail', 'pigment_pattern'],
  'melasma': ['pigment_detail', 'pigment_pattern'],
  'dark_spots': ['pigment_detail'],
  'freckles': ['pigment_detail'],
  'dull_skin': ['pigment_detail'],
  'brightening': ['pigment_detail', 'pigment_pattern'],
  // Texture keywords
  'pores': ['texture_concern'],
  'large_pores': ['texture_concern'],
  'acne_scars': ['texture_concern', 'scar_type'],
  'scarring': ['texture_concern', 'scar_type'],
  'dryness': ['texture_concern'],
  'redness': ['texture_concern'],
  'texture': ['texture_concern'],
};

// ─── CLINICAL_SPEC §3: Demographic-based chip priority ────────
// Age + gender → prioritize relevant chips (SPEC §3 동적 질문 규칙)
function getDemographicPriorityChips(
  age: string | undefined,
  gender: string | undefined,
): ChipType[] {
  const chips: ChipType[] = [];
  const ageNum = parseInt(age ?? '', 10);

  if (!isNaN(ageNum)) {
    if (ageNum < 30) {
      // 20대 → 모공/여드름흉터/피부톤
      chips.push('texture_concern');
    } else if (ageNum < 40) {
      // 30대 → 초기 노화/탄력/색소
      chips.push('aging_priority', 'pigment_pattern');
    } else if (ageNum < 50) {
      // 40대
      if (gender === 'female') {
        chips.push('tightening_zone', 'pigment_detail', 'volume_logic');
      } else {
        chips.push('tightening_zone', 'texture_concern');
      }
    } else {
      // 50대+ → 리프팅 + 색소 자동 포함
      chips.push('tightening_zone', 'laxity_severity', 'pigment_detail');
    }
  }

  return chips;
}

// ─── Get chip template from i18n ─────────────────────────────
function getChipTemplate(signal: string, lang: SurveyLang): SmartChip | null {
  const template = CHIP_TEMPLATES[signal];
  if (!template) return null;

  return {
    type: signal as ChipType,
    question: template.question[lang],
    options: template.options.map(opt => ({
      label: opt.label[lang],
      value: opt.value,
    })),
    priority: template.priority,
    source: 'haiku_needs',
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { demographics, haiku_analysis } = req.body as GenerateChipsRequest;

    if (!demographics || !haiku_analysis) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { detected_country, detected_language, d_age, d_gender } = demographics;
    const { needs_confirmation, q1_primary_goal, already_known_signals, concern_area_hint } = haiku_analysis;

    let chipList: SmartChip[] = [];

    // 1. Generate chips from needs_confirmation (haiku direct requests)
    for (const signal of needs_confirmation) {
      const chip = getChipTemplate(signal, detected_language);
      if (chip) {
        chip.source = 'haiku_needs';
        chipList.push(chip);
      }
    }

    // ── Helper: conditionally add a chip if not already known/present ──
    function addConditionalChip(signal: string, source: SmartChip['source'] = 'conditional') {
      if (!already_known_signals.includes(signal) && !chipList.find(c => c.type === signal)) {
        const chip = getChipTemplate(signal, detected_language);
        if (chip) { chip.source = source; chipList.push(chip); }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 2. CLINICAL_SPEC §3 — Concern Area Hint → Clinical Depth Chips
    //    Map haiku concern_area_hint to prioritized clinical chips
    // ═══════════════════════════════════════════════════════════

    // 2a. Parse concern_area_hint from haiku and map to clinical chips
    const hintStr = typeof concern_area_hint === 'string' ? concern_area_hint : '';
    const hintKeywords = hintStr.toLowerCase().split(/[,\s/]+/).filter(Boolean);
    const hintDerivedChips = new Set<ChipType>();

    for (const keyword of hintKeywords) {
      const mapped = CONCERN_HINT_TO_CHIPS[keyword];
      if (mapped) {
        mapped.forEach(c => hintDerivedChips.add(c));
      }
    }

    // Add hint-derived chips with high priority
    for (const chipType of hintDerivedChips) {
      addConditionalChip(chipType, 'haiku_needs');
    }

    // 2b. Goal-specific clinical depth chips (CLINICAL_SPEC §3 카테고리 A)
    if (['Contouring/lifting', 'Volume/elasticity'].includes(q1_primary_goal)) {
      addConditionalChip('concern_area');
      addConditionalChip('volume_logic');
      addConditionalChip('tightening_zone');
      addConditionalChip('laxity_severity');
    }

    if (q1_primary_goal === 'Brightening/radiance') {
      addConditionalChip('pigment_pattern');
      addConditionalChip('pigment_detail');
    }

    if (q1_primary_goal === 'Anti-aging/prevention') {
      addConditionalChip('aging_priority');
      addConditionalChip('laxity_severity');
    }

    if (q1_primary_goal === 'Skin texture/pores') {
      addConditionalChip('texture_concern');
    }

    if (q1_primary_goal === 'Acne/scarring') {
      addConditionalChip('scar_type');
      addConditionalChip('texture_concern');
    }

    // 2c. CLINICAL_SPEC §3 — Demographic-based chip priority
    const demoPriorityChips = getDemographicPriorityChips(d_age, d_gender);
    for (const chipType of demoPriorityChips) {
      addConditionalChip(chipType);
    }

    // Budget chip is always relevant for clinical-depth recommendations
    addConditionalChip('treatment_budget');

    // ═══════════════════════════════════════════════════════════
    // 3. CLINICAL_SPEC §3 — 카테고리 B (skin_signal) + 카테고리 C (past_experience)
    //    FSM signal mapping:
    //      skin_profile chip → chip_responses.skin_profile → BRANCH_SKIN_PROFILE trigger
    //      past_experience chip → chip_responses.past_experience → BRANCH_PAST_HISTORY trigger
    //    These are ALWAYS included as fallback (required for FSM branching)
    // ═══════════════════════════════════════════════════════════
    for (const fallback of ['skin_profile', 'past_experience'] as const) {
      if (!already_known_signals.includes(fallback) && !chipList.find(c => c.type === fallback)) {
        const chip = getChipTemplate(fallback, detected_language);
        if (chip) { chip.source = 'prior_fallback'; chipList.push(chip); }
      }
    }

    // 3. Prior skip logic
    const priorApplied: string[] = [];
    const priorValues: Record<string, string> = {};

    if (detected_country === 'JP') {
      if (chipList.find(c => c.type === 'pain_tolerance')) {
        chipList = chipList.filter(c => c.type !== 'pain_tolerance');
        priorApplied.push('pain_tolerance');
        priorValues['pain_tolerance'] = 'minimal';
      }
      if (chipList.find(c => c.type === 'style')) {
        chipList = chipList.filter(c => c.type !== 'style');
        priorApplied.push('style');
        priorValues['style'] = 'natural';
      }
    }

    if (detected_country === 'CN') {
      if (chipList.find(c => c.type === 'style')) {
        chipList = chipList.filter(c => c.type !== 'style');
        priorApplied.push('style');
        priorValues['style'] = 'dramatic';
      }
    }

    // SEA countries: skip downtime
    if (['SG', 'TH', 'VN'].includes(detected_country)) {
      if (chipList.find(c => c.type === 'downtime_tolerance')) {
        chipList = chipList.filter(c => c.type !== 'downtime_tolerance');
        priorApplied.push('downtime_tolerance');
        priorValues['downtime_tolerance'] = 'minimal';
      }
    }

    // 4. Sort by priority and limit to 8 (increased from 6 for clinical depth)
    chipList.sort((a, b) => a.priority - b.priority);
    chipList = chipList.slice(0, 8);

    // Deduplicate by type
    const seen = new Set<string>();
    chipList = chipList.filter(c => {
      if (seen.has(c.type)) return false;
      seen.add(c.type);
      return true;
    });

    const response: GenerateChipsResponse = {
      chips: chipList,
      prior_applied: priorApplied,
      prior_values: priorValues,
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error('[generate-chips] Error:', err);
    return res.status(500).json({
      error: 'Failed to generate chips',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
