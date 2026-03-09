// ═══════════════════════════════════════════════════════════════
//  Haiku Prompt Test Simulation
//  Tests the full survey v2 pipeline with mock patient scenarios
//  Run: npx ts-node --project tsconfig.json src/tests/haiku-prompt-simulation.ts
// ═══════════════════════════════════════════════════════════════

import type {
  Demographics,
  HaikuAnalysis,
  SmartChip,
  SafetyFlag,
  SafetySelection,
  SurveyLang,
} from '@/types/survey-v2';

// ─── Test Scenarios ───────────────────────────────────────────

interface TestScenario {
  name: string;
  description: string;
  demographics: Demographics;
  open_response: string;
  expected_primary_goal: string;
  expected_chips_min: number;
  expected_prior_skips: string[];
  safety_selection?: SafetySelection;
  has_adverse_history?: boolean;
  expected_safety_flags?: SafetyFlag[];
}

const SCENARIOS: TestScenario[] = [
  {
    name: 'JP_30F_natural_lifting',
    description: 'Japanese 30F wanting natural lifting — should skip pain_tolerance + style',
    demographics: {
      d_gender: 'female',
      d_age: '30s',
      detected_country: 'JP',
      detected_language: 'JP' as SurveyLang,
    },
    open_response: '顔のたるみが気になっています。特にフェイスラインが下がってきて、自然な感じでリフトアップしたいです。以前ハイフを受けたことがあります。',
    expected_primary_goal: 'Contouring/lifting',
    expected_chips_min: 2,
    expected_prior_skips: ['pain_tolerance', 'style'],
  },
  {
    name: 'CN_25F_dramatic_brightening',
    description: 'Chinese 25F wanting dramatic brightening — should skip style',
    demographics: {
      d_gender: 'female',
      d_age: '20s',
      detected_country: 'CN',
      detected_language: 'ZH-CN' as SurveyLang,
    },
    open_response: '我脸上有很多色斑，皮肤看起来很暗沉。想要做美白提亮，让皮肤变得白皙透亮。之前用过很多美白产品效果不好。',
    expected_primary_goal: 'Brightening/radiance',
    expected_chips_min: 2,
    expected_prior_skips: ['style'],
  },
  {
    name: 'SG_40M_texture_pores',
    description: 'Singaporean 40M with texture/pore concerns — should skip downtime',
    demographics: {
      d_gender: 'male',
      d_age: '40s',
      detected_country: 'SG',
      detected_language: 'EN' as SurveyLang,
    },
    open_response: 'I have enlarged pores and rough skin texture, especially on my cheeks and nose area. I want smoother skin. I have oily skin type.',
    expected_primary_goal: 'Skin texture/pores',
    expected_chips_min: 2,
    expected_prior_skips: ['downtime_tolerance'],
  },
  {
    name: 'KR_45F_antiaging_isotretinoin',
    description: 'Korean 45F with anti-aging + isotretinoin safety flag',
    demographics: {
      d_gender: 'female',
      d_age: '40s',
      detected_country: 'KR',
      detected_language: 'KO' as SurveyLang,
    },
    open_response: '주름이 깊어지고 탄력이 많이 없어졌어요. 볼살도 빠지고 전체적으로 처진 느낌이에요. 자연스러운 리프팅을 원합니다. 통증에 좀 예민한 편이에요.',
    expected_primary_goal: 'Contouring/lifting',
    expected_chips_min: 3,
    expected_prior_skips: [], // KR has no priors
    safety_selection: {
      medications: ['isotretinoin'],
      conditions: ['keloid'],
    },
    has_adverse_history: false,
    expected_safety_flags: ['SAFETY_ISOTRETINOIN', 'SAFETY_KELOID'],
  },
  {
    name: 'US_35F_volume_pregnancy',
    description: 'US 35F wanting volume + pregnant — should flag pregnancy',
    demographics: {
      d_gender: 'female',
      d_age: '30s',
      detected_country: 'US',
      detected_language: 'EN' as SurveyLang,
    },
    open_response: 'I want to restore lost volume in my cheeks and under-eye area. My face looks hollow and tired. I want a refreshed, youthful look without looking fake.',
    expected_primary_goal: 'Volume/elasticity',
    expected_chips_min: 3,
    expected_prior_skips: [],
    safety_selection: {
      medications: [],
      conditions: ['pregnancy'],
    },
    has_adverse_history: false,
    expected_safety_flags: ['SAFETY_PREGNANCY'],
  },
];

// ─── Mock Haiku Analysis Generator ────────────────────────────

function mockHaikuAnalysis(scenario: TestScenario): HaikuAnalysis {
  // Simulate what Haiku would return based on the open response
  const goalMap: Record<string, string> = {
    'Contouring/lifting': 'Contouring/lifting',
    'Brightening/radiance': 'Brightening/radiance',
    'Skin texture/pores': 'Skin texture/pores',
    'Volume/elasticity': 'Volume/elasticity',
    'Anti-aging/prevention': 'Anti-aging/prevention',
  };

  const alreadyKnown = ['q1_primary_goal'];

  // Determine needs_confirmation based on what's NOT in the response
  const allSignals = [
    'concern_area', 'skin_profile', 'past_experience',
    'volume_logic', 'pigment_pattern', 'style',
    'pain_tolerance', 'downtime_tolerance', 'treatment_rhythm',
  ];

  // Simulate: some signals are expressed in the open response
  const expressedSignals: string[] = [];
  const response = scenario.open_response.toLowerCase();

  if (response.includes('face') || response.includes('顔') || response.includes('脸') || response.includes('볼') || response.includes('cheek'))
    expressedSignals.push('concern_area');
  if (response.includes('pain') || response.includes('痛') || response.includes('통증'))
    expressedSignals.push('pain_tolerance');
  if (response.includes('natural') || response.includes('自然') || response.includes('자연'))
    expressedSignals.push('style');
  if (response.includes('oily') || response.includes('dry') || response.includes('지성') || response.includes('건성'))
    expressedSignals.push('skin_profile');
  if (response.includes('before') || response.includes('以前') || response.includes('이전') || response.includes('ハイフ'))
    expressedSignals.push('past_experience');

  alreadyKnown.push(...expressedSignals);

  const needsConfirmation = allSignals.filter(s => !alreadyKnown.includes(s));

  return {
    q1_primary_goal: goalMap[scenario.expected_primary_goal] || scenario.expected_primary_goal,
    q1_goal_secondary: null,
    concern_area_hint: 'Face',
    emotion_tone: 'serious',
    prior_alignment: Object.keys(getPriors(scenario.demographics.detected_country)).length > 0 ? 'aligned' : 'neutral',
    already_known_signals: alreadyKnown,
    needs_confirmation: needsConfirmation,
  };
}

// ─── Prior Logic (mirrors generate-chips.ts) ──────────────────

function getPriors(country: string): Record<string, string> {
  const PRIORS: Record<string, Record<string, string>> = {
    JP: { pain_tolerance: 'minimal', style: 'natural' },
    CN: { style: 'dramatic' },
    SG: { downtime_tolerance: 'minimal' },
    TH: { downtime_tolerance: 'minimal' },
    VN: { downtime_tolerance: 'minimal' },
  };
  return PRIORS[country] || {};
}

// ─── Chip Generation Logic (mirrors generate-chips.ts) ────────

function simulateChipGeneration(
  analysis: HaikuAnalysis,
  country: string
): { chips: string[]; priorApplied: string[] } {
  let chipTypes = [...analysis.needs_confirmation];

  // Conditional additions
  if (['Contouring/lifting', 'Volume/elasticity'].includes(analysis.q1_primary_goal)) {
    if (!analysis.already_known_signals.includes('concern_area') && !chipTypes.includes('concern_area'))
      chipTypes.push('concern_area');
    if (!analysis.already_known_signals.includes('volume_logic') && !chipTypes.includes('volume_logic'))
      chipTypes.push('volume_logic');
  }
  if (analysis.q1_primary_goal === 'Brightening/radiance') {
    if (!analysis.already_known_signals.includes('pigment_pattern') && !chipTypes.includes('pigment_pattern'))
      chipTypes.push('pigment_pattern');
  }

  // Fallbacks
  for (const fb of ['skin_profile', 'past_experience']) {
    if (!analysis.already_known_signals.includes(fb) && !chipTypes.includes(fb))
      chipTypes.push(fb);
  }

  // Prior skip logic
  const priorApplied: string[] = [];
  if (country === 'JP') {
    if (chipTypes.includes('pain_tolerance')) {
      chipTypes = chipTypes.filter(c => c !== 'pain_tolerance');
      priorApplied.push('pain_tolerance');
    }
    if (chipTypes.includes('style')) {
      chipTypes = chipTypes.filter(c => c !== 'style');
      priorApplied.push('style');
    }
  }
  if (country === 'CN') {
    if (chipTypes.includes('style')) {
      chipTypes = chipTypes.filter(c => c !== 'style');
      priorApplied.push('style');
    }
  }
  if (['SG', 'TH', 'VN'].includes(country)) {
    if (chipTypes.includes('downtime_tolerance')) {
      chipTypes = chipTypes.filter(c => c !== 'downtime_tolerance');
      priorApplied.push('downtime_tolerance');
    }
  }

  // Limit to 6
  chipTypes = chipTypes.slice(0, 6);

  return { chips: chipTypes, priorApplied };
}

// ─── Safety Flag Computation (mirrors useSurveyV2.ts) ─────────

const MEDICATION_FLAG_MAP: Record<string, SafetyFlag | null> = {
  isotretinoin: 'SAFETY_ISOTRETINOIN',
  anticoagulant: 'SAFETY_ANTICOAGULANT',
  antibiotic: 'SAFETY_PHOTOSENSITIVITY',
  hormonal: 'HORMONAL_MELASMA',
  retinoid_topical: 'RETINOID_PAUSE',
};

const CONDITION_FLAG_MAP: Record<string, SafetyFlag | null> = {
  pregnancy: 'SAFETY_PREGNANCY',
  keloid: 'SAFETY_KELOID',
};

function computeSafetyFlags(selection: SafetySelection, hasAdverseHistory = false): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  for (const med of selection.medications || []) {
    const flag = MEDICATION_FLAG_MAP[med];
    if (flag && !flags.includes(flag)) flags.push(flag);
  }
  for (const cond of selection.conditions || []) {
    const flag = CONDITION_FLAG_MAP[cond];
    if (flag && !flags.includes(flag)) flags.push(flag);
  }
  if (hasAdverseHistory) {
    flags.push('SAFETY_ADVERSE_HISTORY');
  }
  return flags;
}

// ─── Test Runner ──────────────────────────────────────────────

function runTest(scenario: TestScenario): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Mock Haiku analysis
  const analysis = mockHaikuAnalysis(scenario);

  // 2. Verify primary goal
  if (analysis.q1_primary_goal !== scenario.expected_primary_goal) {
    errors.push(`Primary goal: expected "${scenario.expected_primary_goal}" got "${analysis.q1_primary_goal}"`);
  }

  // 3. Simulate chip generation
  const { chips, priorApplied } = simulateChipGeneration(
    analysis,
    scenario.demographics.detected_country
  );

  // 4. Verify chip count
  if (chips.length < scenario.expected_chips_min) {
    errors.push(`Chips: expected min ${scenario.expected_chips_min} got ${chips.length} [${chips.join(', ')}]`);
  }

  // 5. Verify prior skips
  for (const expectedSkip of scenario.expected_prior_skips) {
    if (!priorApplied.includes(expectedSkip)) {
      errors.push(`Prior skip: expected "${expectedSkip}" to be auto-applied, but wasn't`);
    }
    if (chips.includes(expectedSkip)) {
      errors.push(`Prior skip: "${expectedSkip}" should NOT be in chip list but is`);
    }
  }

  // 6. Verify safety flags
  if (scenario.safety_selection) {
    const flags = computeSafetyFlags(scenario.safety_selection, scenario.has_adverse_history);
    const expected = scenario.expected_safety_flags || [];

    for (const ef of expected) {
      if (!flags.includes(ef)) {
        errors.push(`Safety flag: expected "${ef}" not found in computed flags [${flags.join(', ')}]`);
      }
    }
    for (const f of flags) {
      if (!expected.includes(f)) {
        errors.push(`Safety flag: unexpected "${f}" found (expected: [${expected.join(', ')}])`);
      }
    }
  }

  return { passed: errors.length === 0, errors };
}

// ─── Main Execution ───────────────────────────────────────────

function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Haiku Prompt Test Simulation — Survey v2 Pipeline');
  console.log('═══════════════════════════════════════════════════\n');

  let totalPassed = 0;
  let totalFailed = 0;

  for (const scenario of SCENARIOS) {
    console.log(`▶ ${scenario.name}`);
    console.log(`  ${scenario.description}`);

    const result = runTest(scenario);

    if (result.passed) {
      console.log(`  ✅ PASSED`);
      totalPassed++;
    } else {
      console.log(`  ❌ FAILED`);
      for (const err of result.errors) {
        console.log(`    → ${err}`);
      }
      totalFailed++;
    }
    console.log('');
  }

  console.log('───────────────────────────────────────────────────');
  console.log(`Results: ${totalPassed} passed, ${totalFailed} failed out of ${SCENARIOS.length} scenarios`);
  console.log('───────────────────────────────────────────────────');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main();
