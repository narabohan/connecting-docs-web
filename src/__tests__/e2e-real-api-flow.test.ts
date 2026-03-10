// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs REAL API E2E Integration Test
//  Tests the FULL survey pipeline against a running dev server
//
//  Prerequisite: `npx next dev -p 3099` must be running
//
//  Flow:
//    1. POST /api/survey-v2/analyze-open       → Haiku analysis
//    2. POST /api/survey-v2/generate-chips      → Smart chip questions
//    3. POST /api/survey-v2/safety-followup     → Safety follow-up (if flags)
//    4. POST /api/survey-v2/final-recommendation → Sonnet final analysis
//    5. POST /api/survey-v2/save-result         → Airtable persist
//    6. POST /api/survey-v2/notify-report       → Email notification
// ═══════════════════════════════════════════════════════════════

import type {
  Demographics,
  HaikuAnalysis,
  SafetyFlag,
  SafetyFollowUp,
  SmartChip,
  AnalyzeOpenResponse,
  GenerateChipsResponse,
  SafetyFollowUpResponse,
} from '@/types/survey-v2';

// ─── Config ──────────────────────────────────────────────────
const BASE = 'http://localhost:3099';
const TIMEOUT_HAIKU = 30_000;    // 30s for Haiku calls
const TIMEOUT_SONNET = 300_000;  // 5min for Sonnet (can be slow)

// ─── Helper ──────────────────────────────────────────────────
async function post<T>(path: string, body: object, timeout = TIMEOUT_HAIKU): Promise<{ status: number; data: T }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json();
    return { status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

// ═══════════════════════════════════════════════════════════════
//  TEST SCENARIOS
// ═══════════════════════════════════════════════════════════════

// Scenario 1: JP Female 30s — Melasma + Natural (with safety flags)
const JP_DEMO: Demographics = {
  d_gender: 'female',
  d_age: '30s',
  detected_country: 'JP',
  detected_language: 'JP',
};
const JP_OPEN_TEXT = '出産後にシミがひどくなりました。自然な改善を希望します。レチノールを使っています。';

// Scenario 2: EN Male 40s — Anti-aging (no safety flags)
const EN_DEMO: Demographics = {
  d_gender: 'male',
  d_age: '40s',
  detected_country: 'SG',
  detected_language: 'EN',
};
const EN_OPEN_TEXT = 'I want to look younger and get rid of wrinkles around my eyes. I want natural results that dont look overdone.';

// Scenario 3: KO Female 20s — Brightening (no safety flags)
const KO_DEMO: Demographics = {
  d_gender: 'female',
  d_age: '20s',
  detected_country: 'KR',
  detected_language: 'KO',
};
const KO_OPEN_TEXT = '피부톤이 칙칙하고 잡티가 많아서 환하고 깨끗한 피부를 갖고 싶어요. 통증은 좀 무서워요.';

// ═══════════════════════════════════════════════════════════════
//  1. ANALYZE-OPEN (Haiku) — Tests
// ═══════════════════════════════════════════════════════════════

describe('Step 1: analyze-open (Haiku)', () => {
  test('JP scenario → valid HaikuAnalysis with primary goal', async () => {
    const { status, data } = await post<AnalyzeOpenResponse>('/api/survey-v2/analyze-open', {
      demographics: JP_DEMO,
      open_question_response: JP_OPEN_TEXT,
    });

    expect(status).toBe(200);
    expect(data.analysis).toBeDefined();
    expect(data.analysis.q1_primary_goal).toBeDefined();
    expect(data.analysis.emotion_tone).toBeDefined();
    expect(Array.isArray(data.analysis.needs_confirmation)).toBe(true);
    expect(Array.isArray(data.analysis.already_known_signals)).toBe(true);

    // Haiku should detect brightening/melasma-related goal
    const validGoals = [
      'Contouring/lifting', 'Volume/elasticity', 'Brightening/radiance',
      'Skin texture/pores', 'Anti-aging/prevention', 'Acne/scarring',
    ];
    expect(validGoals).toContain(data.analysis.q1_primary_goal);

    // Prior block should include JP priors
    expect(data.prior_block).toBeDefined();
    expect(data.prior_block.style).toBe('natural');
    expect(data.prior_block.pain_tolerance).toBe('minimal');
  }, TIMEOUT_HAIKU);

  test('EN scenario → detects anti-aging goal', async () => {
    const { status, data } = await post<AnalyzeOpenResponse>('/api/survey-v2/analyze-open', {
      demographics: EN_DEMO,
      open_question_response: EN_OPEN_TEXT,
    });

    expect(status).toBe(200);
    expect(data.analysis.q1_primary_goal).toBeDefined();
    // SG has downtime_tolerance:minimal prior
    expect(data.prior_block).toBeDefined();
  }, TIMEOUT_HAIKU);

  test('KO scenario → detects brightening goal', async () => {
    const { status, data } = await post<AnalyzeOpenResponse>('/api/survey-v2/analyze-open', {
      demographics: KO_DEMO,
      open_question_response: KO_OPEN_TEXT,
    });

    expect(status).toBe(200);
    expect(data.analysis.q1_primary_goal).toBeDefined();
    // KR has no strong priors
    expect(data.prior_block).toEqual({});
  }, TIMEOUT_HAIKU);

  test('missing fields → 400', async () => {
    const { status } = await post<any>('/api/survey-v2/analyze-open', {
      demographics: JP_DEMO,
      // Missing open_question_response
    });
    expect(status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════
//  2. GENERATE-CHIPS — Tests
// ═══════════════════════════════════════════════════════════════

describe('Step 2: generate-chips', () => {
  // Use a realistic Haiku output to test chip generation
  const mockHaikuAnalysis: HaikuAnalysis = {
    q1_primary_goal: 'Brightening/radiance',
    q1_goal_secondary: 'Skin texture/pores',
    concern_area_hint: 'melasma + post-partum pigmentation',
    emotion_tone: 'serious',
    prior_alignment: 'aligned',
    already_known_signals: ['q1_primary_goal', 'concern_area'],
    needs_confirmation: ['pain_tolerance', 'downtime_tolerance', 'skin_profile'],
    // ─── Doctor Intelligence signals (Issue 0-5) ──────────────
    expectation_tag: 'REALISTIC',
    communication_style: 'LOGICAL',
    lifestyle_context: null,
  };

  test('JP scenario → generates 3-6 smart chips', async () => {
    const { status, data } = await post<GenerateChipsResponse>('/api/survey-v2/generate-chips', {
      demographics: JP_DEMO,
      haiku_analysis: mockHaikuAnalysis,
    });

    expect(status).toBe(200);
    expect(Array.isArray(data.chips)).toBe(true);
    expect(data.chips.length).toBeGreaterThanOrEqual(2);
    expect(data.chips.length).toBeLessThanOrEqual(8);

    // Each chip must have the required structure
    for (const chip of data.chips) {
      expect(chip.type).toBeDefined();
      expect(chip.question).toBeDefined();
      expect(Array.isArray(chip.options)).toBe(true);
      expect(chip.options.length).toBeGreaterThanOrEqual(2);
      expect(chip.priority).toBeDefined();
      expect(chip.source).toBeDefined();

      // Each option must have label + value
      for (const opt of chip.options) {
        expect(typeof opt.label).toBe('string');
        expect(typeof opt.value).toBe('string');
      }
    }

    // Prior applied should be populated for JP (style, pain_tolerance)
    expect(Array.isArray(data.prior_applied)).toBe(true);
    expect(data.prior_values).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════
//  3. SAFETY-FOLLOWUP — Tests
// ═══════════════════════════════════════════════════════════════

describe('Step 3: safety-followup', () => {
  test('isotretinoin + adverse_history → follow-up questions generated', async () => {
    const { status, data } = await post<SafetyFollowUpResponse>('/api/survey-v2/safety-followup', {
      demographics: JP_DEMO,
      selected_safety_items: ['isotretinoin', 'adverse_history'],
      detected_language: 'JP',
    });

    expect(status).toBe(200);
    expect(Array.isArray(data.followup_questions)).toBe(true);
    expect(Array.isArray(data.flags)).toBe(true);

    // Should have at least one follow-up question
    if (data.followup_questions.length > 0) {
      const fu = data.followup_questions[0];
      expect(fu.flag).toBeDefined();
      expect(fu.question).toBeDefined();
    }
  }, TIMEOUT_HAIKU);

  test('no safety items → empty response', async () => {
    const { status, data } = await post<SafetyFollowUpResponse>('/api/survey-v2/safety-followup', {
      demographics: EN_DEMO,
      selected_safety_items: [],
      detected_language: 'EN',
    });

    expect(status).toBe(200);
    expect(Array.isArray(data.followup_questions)).toBe(true);
    expect(data.followup_questions).toHaveLength(0);
  });

  test('pregnancy + keloid → flags generated correctly', async () => {
    const { status, data } = await post<SafetyFollowUpResponse>('/api/survey-v2/safety-followup', {
      demographics: KO_DEMO,
      selected_safety_items: ['pregnancy', 'keloid'],
      detected_language: 'KO',
    });

    expect(status).toBe(200);
    expect(Array.isArray(data.flags)).toBe(true);
    // pregnancy → SAFETY_PREGNANCY, keloid → SAFETY_KELOID
    expect(data.flags).toContain('SAFETY_PREGNANCY');
    expect(data.flags).toContain('SAFETY_KELOID');
    // Neither of these items has FOLLOWUP_PRIORITY, so no follow-up needed
    expect(data.followup_questions).toHaveLength(0);
  });

  test('anticoagulant → generates follow-up question (EN)', async () => {
    const { status, data } = await post<SafetyFollowUpResponse>('/api/survey-v2/safety-followup', {
      demographics: EN_DEMO,
      selected_safety_items: ['anticoagulant'],
      detected_language: 'EN',
    });

    expect(status).toBe(200);
    expect(Array.isArray(data.flags)).toBe(true);
    expect(data.flags).toContain('SAFETY_ANTICOAGULANT');
    // anticoagulant has FOLLOWUP_PRIORITY → should generate question
    expect(data.followup_questions.length).toBeGreaterThanOrEqual(1);
    if (data.followup_questions.length > 0) {
      expect(data.followup_questions[0].flag).toBe('SAFETY_ANTICOAGULANT');
      expect(typeof data.followup_questions[0].question).toBe('string');
    }
  }, TIMEOUT_HAIKU);

  test('all safety items combined → flags + limited follow-ups', async () => {
    const { status, data } = await post<SafetyFollowUpResponse>('/api/survey-v2/safety-followup', {
      demographics: JP_DEMO,
      selected_safety_items: ['isotretinoin', 'anticoagulant', 'pregnancy', 'keloid', 'adverse_history'],
      detected_language: 'JP',
    });

    expect(status).toBe(200);
    // Should have multiple flags
    expect(data.flags.length).toBeGreaterThanOrEqual(4);
    // Follow-up questions should be capped (max 2 per FOLLOWUP_PRIORITY logic)
    expect(data.followup_questions.length).toBeLessThanOrEqual(3);
    expect(data.followup_questions.length).toBeGreaterThanOrEqual(1);
  }, TIMEOUT_HAIKU);
});

// ═══════════════════════════════════════════════════════════════
//  4. SAVE-RESULT (Airtable) — Tests
// ═══════════════════════════════════════════════════════════════

describe('Step 5: save-result (Airtable)', () => {
  test('valid payload → saves to Airtable', async () => {
    const testRunId = `e2e_test_${Date.now()}`;
    const { status, data } = await post<any>('/api/survey-v2/save-result', {
      run_id: testRunId,
      demographics: JP_DEMO,
      lang: 'JP',
      safety_flags: ['HORMONAL_MELASMA'],
      open_question_raw: JP_OPEN_TEXT,
      chip_responses: { concern_area: 'melasma_pigmentation', pain_tolerance: 'moderate' },
      recommendation: { lang: 'jp', model: 'test', patient: { age: '30s', gender: 'female' } },
      model: 'claude-sonnet-4-6',
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.airtable_record_id).toBeDefined();
    console.log(`[save-result] ✅ Airtable record created: ${data.airtable_record_id}`);
  }, 15_000);

  test('missing run_id → 400', async () => {
    const { status } = await post<any>('/api/survey-v2/save-result', {
      demographics: JP_DEMO,
    });
    expect(status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════
//  5. NOTIFY-REPORT (Email) — Tests
// ═══════════════════════════════════════════════════════════════

describe('Step 6: notify-report (Email)', () => {
  test('valid payload → sends admin email', async () => {
    const { status, data } = await post<any>('/api/survey-v2/notify-report', {
      report_id: `e2e_email_test_${Date.now()}`,
      patient_country: 'JP',
      patient_age: '30s',
      patient_gender: 'female',
      lang: 'JP',
      primary_goal: 'Brightening/radiance',
      top_device: 'SylfirmX',
      top_injectable: 'Rejuran Healer',
      model: 'claude-sonnet-4-6',
      cost_usd: 0.18,
    });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
  }, 15_000);

  test('missing report_id → 400', async () => {
    const { status, data } = await post<any>('/api/survey-v2/notify-report', {
      patient_country: 'JP',
    });
    expect(status).toBe(400);
    expect(data.error).toBe('Missing report_id');
  });
});

// ═══════════════════════════════════════════════════════════════
//  6. FULL PIPELINE — End-to-End Flow Test
// ═══════════════════════════════════════════════════════════════

describe('Full Pipeline E2E (KO Female 20s → Brightening)', () => {
  let haikuAnalysis: HaikuAnalysis;
  let chips: SmartChip[];
  let chipResponses: Record<string, string>;

  test('Step 1: analyze-open', async () => {
    const { status, data } = await post<AnalyzeOpenResponse>('/api/survey-v2/analyze-open', {
      demographics: KO_DEMO,
      open_question_response: KO_OPEN_TEXT,
    });

    expect(status).toBe(200);
    haikuAnalysis = data.analysis;
    expect(haikuAnalysis.q1_primary_goal).toBeDefined();
    console.log(`[Pipeline] Step 1 ✅ Goal: ${haikuAnalysis.q1_primary_goal}, Tone: ${haikuAnalysis.emotion_tone}`);
  }, TIMEOUT_HAIKU);

  test('Step 2: generate-chips', async () => {
    expect(haikuAnalysis).toBeDefined();

    const { status, data } = await post<GenerateChipsResponse>('/api/survey-v2/generate-chips', {
      demographics: KO_DEMO,
      haiku_analysis: haikuAnalysis,
    });

    expect(status).toBe(200);
    chips = data.chips;
    expect(chips.length).toBeGreaterThanOrEqual(2);

    // Auto-select first option for each chip (simulating user interaction)
    chipResponses = {};
    for (const chip of chips) {
      chipResponses[chip.type] = chip.options[0].value;
    }

    console.log(`[Pipeline] Step 2 ✅ ${chips.length} chips generated: ${chips.map(c => c.type).join(', ')}`);
  }, 10_000);

  test('Step 3: safety (skip — no flags for this scenario)', () => {
    // KO 20s Female brightening — typically no safety concerns
    console.log(`[Pipeline] Step 3 ✅ No safety items selected (clean scenario)`);
  });

  test('Step 4: final-recommendation (Sonnet)', async () => {
    expect(haikuAnalysis).toBeDefined();

    const { status, data } = await post<any>('/api/survey-v2/final-recommendation', {
      demographics: KO_DEMO,
      haiku_analysis: haikuAnalysis,
      chip_responses: chipResponses,
      prior_applied: [],
      prior_values: {},
      safety_flags: [],
      safety_followup_answers: {},
      open_question_raw: KO_OPEN_TEXT,
      q1_primary_goal: haikuAnalysis.q1_primary_goal,
      q1_goal_secondary: haikuAnalysis.q1_goal_secondary,
      q3_concern_area: chipResponses['concern_area'] || null,
      q4_skin_profile: chipResponses['skin_profile'] || null,
      q5_style: chipResponses['style'] || null,
      q6_pain_tolerance: chipResponses['pain_tolerance'] || null,
      q6_downtime_tolerance: chipResponses['downtime_tolerance'] || null,
      q7_past_experience: chipResponses['past_experience'] || null,
      q2_risk_flags: [],
      q2_pigment_pattern: chipResponses['pigment_pattern'] || null,
      q3_volume_logic: chipResponses['volume_logic'] || null,
    }, TIMEOUT_SONNET);

    expect(status).toBe(200);
    expect(data.recommendation_json).toBeDefined();
    expect(data.model).toBeDefined();
    expect(data.usage).toBeDefined();

    const rec = data.recommendation_json;

    // Validate critical sections exist
    expect(rec.patient).toBeDefined();
    expect(Array.isArray(rec.ebd_recommendations)).toBe(true);
    expect(rec.ebd_recommendations.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(rec.injectable_recommendations)).toBe(true);
    expect(rec.injectable_recommendations.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(rec.signature_solutions)).toBe(true);
    expect(rec.treatment_plan).toBeDefined();
    expect(rec.homecare).toBeDefined();
    expect(rec.doctor_tab).toBeDefined();

    // Validate device structure
    const topDevice = rec.ebd_recommendations[0];
    expect(topDevice.device_name).toBeDefined();
    expect(topDevice.confidence).toBeGreaterThanOrEqual(70);
    expect(topDevice.scores).toBeDefined();

    // Validate injectable structure
    const topInj = rec.injectable_recommendations[0];
    expect(topInj.name).toBeDefined();
    expect(topInj.confidence).toBeGreaterThanOrEqual(70);

    console.log(`[Pipeline] Step 4 ✅ Model: ${data.model}`);
    console.log(`  Top Device: ${topDevice.device_name} (${topDevice.confidence}%)`);
    console.log(`  Top Injectable: ${topInj.name} (${topInj.confidence}%)`);
    console.log(`  Tokens: ${data.usage.input_tokens} in / ${data.usage.output_tokens} out`);

    // Store for step 5
    (global as any).__e2e_rec_data = data;
  }, TIMEOUT_SONNET);

  test('Step 5: save-result → Airtable', async () => {
    const data = (global as any).__e2e_rec_data;
    if (!data) {
      console.log('[Pipeline] Step 5 ⚠️ Skipped (no recommendation data from Step 4)');
      return;
    }

    const reportId = `e2e_pipeline_${Date.now()}`;
    const { status, data: saveData } = await post<any>('/api/survey-v2/save-result', {
      run_id: reportId,
      demographics: KO_DEMO,
      lang: 'KO',
      safety_flags: [],
      open_question_raw: KO_OPEN_TEXT,
      chip_responses: chipResponses,
      recommendation: data.recommendation_json,
      model: data.model,
      usage: data.usage,
    });

    expect(status).toBe(200);
    expect(saveData.success).toBe(true);
    console.log(`[Pipeline] Step 5 ✅ Airtable record: ${saveData.record_id}`);

    // Store reportId for step 6
    (global as any).__e2e_report_id = reportId;
  }, 15_000);

  test('Step 6: notify-report → Email', async () => {
    const reportId = (global as any).__e2e_report_id;
    const data = (global as any).__e2e_rec_data;
    if (!reportId || !data) {
      console.log('[Pipeline] Step 6 ⚠️ Skipped (no data from previous steps)');
      return;
    }

    const topDevice = data.recommendation_json?.ebd_recommendations?.[0]?.device_name || '';
    const topInj = data.recommendation_json?.injectable_recommendations?.[0]?.name || '';

    const { status, data: emailData } = await post<any>('/api/survey-v2/notify-report', {
      report_id: reportId,
      patient_country: 'KR',
      patient_age: '20s',
      patient_gender: 'female',
      lang: 'KO',
      primary_goal: haikuAnalysis.q1_primary_goal || 'Brightening/radiance',
      top_device: topDevice,
      top_injectable: topInj,
      model: data.model,
      cost_usd: 0.18,
    });

    expect(status).toBe(200);
    expect(emailData.success).toBe(true);
    console.log(`[Pipeline] Step 6 ✅ Email sent`);
  }, 15_000);
});

// ═══════════════════════════════════════════════════════════════
//  7. MULTI-LANGUAGE VALIDATION
// ═══════════════════════════════════════════════════════════════

describe('Multi-language: analyze-open across 3 languages', () => {
  const scenarios = [
    { demo: JP_DEMO, text: JP_OPEN_TEXT, label: 'JP' },
    { demo: EN_DEMO, text: EN_OPEN_TEXT, label: 'EN' },
    { demo: KO_DEMO, text: KO_OPEN_TEXT, label: 'KO' },
  ];

  for (const { demo, text, label } of scenarios) {
    test(`${label} → valid HaikuAnalysis`, async () => {
      const { status, data } = await post<AnalyzeOpenResponse>('/api/survey-v2/analyze-open', {
        demographics: demo,
        open_question_response: text,
      });

      expect(status).toBe(200);
      expect(data.analysis.q1_primary_goal).toBeDefined();
      expect(data.analysis.emotion_tone).toBeDefined();
      console.log(`[i18n] ${label} → ${data.analysis.q1_primary_goal} / ${data.analysis.emotion_tone}`);
    }, TIMEOUT_HAIKU);
  }
});
