// ═══════════════════════════════════════════════════════════════
//  useSurveyStateMachine.test.ts — Phase 3-B (S-1)
//  FSM 전이 로직 단위 테스트
// ═══════════════════════════════════════════════════════════════

import {
  getNextNode,
  calculateProgress,
  type SurveyNode,
  type SurveySignals,
} from '@/hooks/useSurveyStateMachine';

// ─── Helpers ────────────────────────────────────────────────

function makeSignals(overrides: Partial<SurveySignals> = {}): SurveySignals {
  return {
    demographics: {
      d_gender: 'female',
      d_age: '30s',
      detected_country: 'KR',
      detected_language: 'KO',
    },
    haiku_analysis: null,
    chip_responses: {},
    branch_responses: {
      skin_profile: null,
      past_history: null,
      visit_plan: null,
      adverse: null,
      preferences: null,
    },
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────

describe('Survey State Machine — getNextNode', () => {
  // ── 기본 선형 흐름 ──
  it('DEMOGRAPHIC → OPEN_TEXT (always)', () => {
    expect(getNextNode('DEMOGRAPHIC', makeSignals())).toBe('OPEN_TEXT');
  });

  it('OPEN_TEXT → SMART_CHIPS (always)', () => {
    expect(getNextNode('OPEN_TEXT', makeSignals())).toBe('SMART_CHIPS');
  });

  // ── SMART_CHIPS 분기 ──
  it('SMART_CHIPS → BRANCH_SKIN_PROFILE when skin_profile=thin', () => {
    const signals = makeSignals({ chip_responses: { skin_profile: 'thin' } });
    expect(getNextNode('SMART_CHIPS', signals)).toBe('BRANCH_SKIN_PROFILE');
  });

  it('SMART_CHIPS → BRANCH_SKIN_PROFILE when skin_profile=sensitive', () => {
    const signals = makeSignals({ chip_responses: { skin_profile: 'sensitive' } });
    expect(getNextNode('SMART_CHIPS', signals)).toBe('BRANCH_SKIN_PROFILE');
  });

  it('SMART_CHIPS → BRANCH_SKIN_PROFILE when haiku detects wrinkle', () => {
    const signals = makeSignals({
      haiku_analysis: {
        q1_primary_goal: 'wrinkle_reduction',
        q1_goal_secondary: null,
        concern_area_hint: 'wrinkle around eyes',
        classified_concern: 'skin_tightening',
        emotion_tone: 'serious',
        prior_alignment: 'neutral',
        already_known_signals: [],
        needs_confirmation: [],
        expectation_tag: 'REALISTIC',
        communication_style: 'LOGICAL',
        lifestyle_context: null,
      },
    });
    expect(getNextNode('SMART_CHIPS', signals)).toBe('BRANCH_SKIN_PROFILE');
  });

  it('SMART_CHIPS → BRANCH_PAST_HISTORY when past_experience=yes_multiple (no skin trigger)', () => {
    const signals = makeSignals({
      chip_responses: { past_experience: 'yes_multiple', skin_profile: 'normal' },
    });
    expect(getNextNode('SMART_CHIPS', signals)).toBe('BRANCH_PAST_HISTORY');
  });

  it('SMART_CHIPS → BRANCH_SKIN_PROFILE as fallback (universal Fitzpatrick)', () => {
    const signals = makeSignals({ chip_responses: { past_experience: 'none', skin_profile: 'normal' } });
    expect(getNextNode('SMART_CHIPS', signals)).toBe('BRANCH_SKIN_PROFILE');
  });

  // ── BRANCH_SKIN_PROFILE 분기 ──
  it('BRANCH_SKIN_PROFILE → BRANCH_PAST_HISTORY when past_experience exists', () => {
    const signals = makeSignals({ chip_responses: { past_experience: 'yes_recent' } });
    expect(getNextNode('BRANCH_SKIN_PROFILE', signals)).toBe('BRANCH_PAST_HISTORY');
  });

  it('BRANCH_SKIN_PROFILE → BRANCH_VISIT_PLAN when foreign patient (no past experience)', () => {
    const signals = makeSignals({
      demographics: { d_gender: 'female', d_age: '30s', detected_country: 'JP', detected_language: 'JP' },
      chip_responses: { past_experience: 'none' },
    });
    expect(getNextNode('BRANCH_SKIN_PROFILE', signals)).toBe('BRANCH_VISIT_PLAN');
  });

  it('BRANCH_SKIN_PROFILE → PREFERENCES as fallback (KR, no past)', () => {
    const signals = makeSignals({ chip_responses: { past_experience: 'none' } });
    expect(getNextNode('BRANCH_SKIN_PROFILE', signals)).toBe('PREFERENCES');
  });

  // ── BRANCH_PAST_HISTORY 분기 ──
  it('BRANCH_PAST_HISTORY → BRANCH_ADVERSE when had_adverse=true', () => {
    const signals = makeSignals({
      branch_responses: {
        skin_profile: null,
        past_history: { treatments: [], had_adverse: true },
        visit_plan: null,
        adverse: null,
        preferences: null,
      },
    });
    expect(getNextNode('BRANCH_PAST_HISTORY', signals)).toBe('BRANCH_ADVERSE');
  });

  it('BRANCH_PAST_HISTORY → BRANCH_VISIT_PLAN for foreign patient (no adverse)', () => {
    const signals = makeSignals({
      demographics: { d_gender: 'male', d_age: '40s', detected_country: 'CN', detected_language: 'ZH-CN' },
      branch_responses: {
        skin_profile: null,
        past_history: { treatments: [], had_adverse: false },
        visit_plan: null,
        adverse: null,
        preferences: null,
      },
    });
    expect(getNextNode('BRANCH_PAST_HISTORY', signals)).toBe('BRANCH_VISIT_PLAN');
  });

  it('BRANCH_PAST_HISTORY → PREFERENCES as fallback', () => {
    const signals = makeSignals({
      branch_responses: {
        skin_profile: null,
        past_history: { treatments: [], had_adverse: false },
        visit_plan: null,
        adverse: null,
        preferences: null,
      },
    });
    expect(getNextNode('BRANCH_PAST_HISTORY', signals)).toBe('PREFERENCES');
  });

  // ── BRANCH_ADVERSE 분기 ──
  it('BRANCH_ADVERSE → BRANCH_VISIT_PLAN for foreign patient', () => {
    const signals = makeSignals({
      demographics: { d_gender: 'female', d_age: '20s', detected_country: 'US', detected_language: 'EN' },
    });
    expect(getNextNode('BRANCH_ADVERSE', signals)).toBe('BRANCH_VISIT_PLAN');
  });

  it('BRANCH_ADVERSE → PREFERENCES for KR patient', () => {
    expect(getNextNode('BRANCH_ADVERSE', makeSignals())).toBe('PREFERENCES');
  });

  // ── Terminal nodes ──
  it('BRANCH_VISIT_PLAN → PREFERENCES (always)', () => {
    expect(getNextNode('BRANCH_VISIT_PLAN', makeSignals())).toBe('PREFERENCES');
  });

  it('PREFERENCES → SAFETY_CHECKPOINT (always)', () => {
    expect(getNextNode('PREFERENCES', makeSignals())).toBe('SAFETY_CHECKPOINT');
  });

  it('SAFETY_CHECKPOINT → ANALYZING (always)', () => {
    expect(getNextNode('SAFETY_CHECKPOINT', makeSignals())).toBe('ANALYZING');
  });

  it('ANALYZING → COMPLETE (always)', () => {
    expect(getNextNode('ANALYZING', makeSignals())).toBe('COMPLETE');
  });
});

describe('Survey State Machine — calculateProgress', () => {
  it('DEMOGRAPHIC = 0%', () => {
    expect(calculateProgress('DEMOGRAPHIC', ['DEMOGRAPHIC'])).toBe(0);
  });

  it('OPEN_TEXT = 16%', () => {
    expect(calculateProgress('OPEN_TEXT', ['DEMOGRAPHIC', 'OPEN_TEXT'])).toBe(16);
  });

  it('SMART_CHIPS = 32%', () => {
    expect(calculateProgress('SMART_CHIPS', ['DEMOGRAPHIC', 'OPEN_TEXT', 'SMART_CHIPS'])).toBe(32);
  });

  it('ANALYZING = 95%', () => {
    expect(calculateProgress('ANALYZING', [])).toBe(95);
  });

  it('COMPLETE = 100%', () => {
    expect(calculateProgress('COMPLETE', [])).toBe(100);
  });

  it('branch node returns value between 40-80', () => {
    const progress = calculateProgress('BRANCH_SKIN_PROFILE', [
      'DEMOGRAPHIC', 'OPEN_TEXT', 'SMART_CHIPS', 'BRANCH_SKIN_PROFILE',
    ]);
    expect(progress).toBeGreaterThanOrEqual(40);
    expect(progress).toBeLessThanOrEqual(80);
  });
});

describe('Survey State Machine — Full Path Scenarios', () => {
  it('KR patient with thin skin + past treatments: full branch path', () => {
    const signals = makeSignals({
      chip_responses: { skin_profile: 'thin', past_experience: 'yes_multiple' },
      branch_responses: {
        skin_profile: null,
        past_history: { treatments: [], had_adverse: false },
        visit_plan: null,
        adverse: null,
        preferences: null,
      },
    });

    const path: SurveyNode[] = ['DEMOGRAPHIC'];
    let current: SurveyNode = 'DEMOGRAPHIC';

    for (let i = 0; i < 12; i++) {
      current = getNextNode(current, signals);
      path.push(current);
      if (current === 'COMPLETE') break;
    }

    expect(path).toEqual([
      'DEMOGRAPHIC',
      'OPEN_TEXT',
      'SMART_CHIPS',
      'BRANCH_SKIN_PROFILE',
      'BRANCH_PAST_HISTORY',
      'PREFERENCES',
      'SAFETY_CHECKPOINT',
      'ANALYZING',
      'COMPLETE',
    ]);
  });

  it('JP patient with adverse history: includes all branches', () => {
    const signals = makeSignals({
      demographics: { d_gender: 'female', d_age: '30s', detected_country: 'JP', detected_language: 'JP' },
      chip_responses: { skin_profile: 'sensitive', past_experience: 'yes_recent' },
      branch_responses: {
        skin_profile: null,
        past_history: { treatments: [], had_adverse: true },
        visit_plan: null,
        adverse: null,
        preferences: null,
      },
    });

    const path: SurveyNode[] = ['DEMOGRAPHIC'];
    let current: SurveyNode = 'DEMOGRAPHIC';

    for (let i = 0; i < 12; i++) {
      current = getNextNode(current, signals);
      path.push(current);
      if (current === 'COMPLETE') break;
    }

    expect(path).toEqual([
      'DEMOGRAPHIC',
      'OPEN_TEXT',
      'SMART_CHIPS',
      'BRANCH_SKIN_PROFILE',
      'BRANCH_PAST_HISTORY',
      'BRANCH_ADVERSE',
      'BRANCH_VISIT_PLAN',
      'PREFERENCES',
      'SAFETY_CHECKPOINT',
      'ANALYZING',
      'COMPLETE',
    ]);
  });

  it('Simple KR patient with no triggers: includes BRANCH_SKIN_PROFILE + PREFERENCES', () => {
    const signals = makeSignals({
      chip_responses: { skin_profile: 'normal', past_experience: 'none' },
    });

    const path: SurveyNode[] = ['DEMOGRAPHIC'];
    let current: SurveyNode = 'DEMOGRAPHIC';

    for (let i = 0; i < 12; i++) {
      current = getNextNode(current, signals);
      path.push(current);
      if (current === 'COMPLETE') break;
    }

    // CLINICAL_SPEC V2: even "first_time" users go through BRANCH_SKIN_PROFILE + PREFERENCES
    expect(path).toEqual([
      'DEMOGRAPHIC',
      'OPEN_TEXT',
      'SMART_CHIPS',
      'BRANCH_SKIN_PROFILE',
      'PREFERENCES',
      'SAFETY_CHECKPOINT',
      'ANALYZING',
      'COMPLETE',
    ]);
  });
});
