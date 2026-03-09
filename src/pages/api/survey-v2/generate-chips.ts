// ═══════════════════════════════════════════════════════════════
//  POST /api/survey-v2/generate-chips
//  Generates Smart Chips based on Haiku analysis + Prior skip logic
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

    const { detected_country, detected_language } = demographics;
    const { needs_confirmation, q1_primary_goal, already_known_signals } = haiku_analysis;

    let chipList: SmartChip[] = [];

    // 1. Generate chips from needs_confirmation
    for (const signal of needs_confirmation) {
      const chip = getChipTemplate(signal, detected_language);
      if (chip) {
        chip.source = 'haiku_needs';
        chipList.push(chip);
      }
    }

    // 2. Conditional additions based on primary goal
    if (['Contouring/lifting', 'Volume/elasticity'].includes(q1_primary_goal)) {
      if (!already_known_signals.includes('concern_area') && !chipList.find(c => c.type === 'concern_area')) {
        const chip = getChipTemplate('concern_area', detected_language);
        if (chip) { chip.source = 'conditional'; chipList.push(chip); }
      }
      if (!already_known_signals.includes('volume_logic') && !chipList.find(c => c.type === 'volume_logic')) {
        const chip = getChipTemplate('volume_logic', detected_language);
        if (chip) { chip.source = 'conditional'; chipList.push(chip); }
      }
    }

    if (q1_primary_goal === 'Brightening/radiance') {
      if (!already_known_signals.includes('pigment_pattern') && !chipList.find(c => c.type === 'pigment_pattern')) {
        const chip = getChipTemplate('pigment_pattern', detected_language);
        if (chip) { chip.source = 'conditional'; chipList.push(chip); }
      }
    }

    // Always ensure skin_profile and past_experience are included (fallback)
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

    // 4. Sort by priority and limit to 6
    chipList.sort((a, b) => a.priority - b.priority);
    chipList = chipList.slice(0, 6);

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
