// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs E2E Integration Test — Survey v2 Pipeline
//  Validates: SurveyV2State → FinalRecommendationRequest →
//             Mock Opus Output → ReportPayload → report-v2 consumption
// ═══════════════════════════════════════════════════════════════

import type {
  SurveyV2State,
  Demographics,
  HaikuAnalysis,
  SafetyFlag,
  SafetySelection,
  SafetyFollowUp,
  SurveyLang,
} from '@/types/survey-v2';

import type {
  FinalRecommendationRequest,
  FinalRecommendationResponse,
  OpusRecommendationOutput,
  OpusPatientProfile,
  OpusDeviceRecommendation,
  OpusInjectableRecommendation,
  OpusSignatureSolution,
  OpusTreatmentPlan,
  OpusTreatmentPhase,
  OpusHomecare,
  OpusDoctorTab,
} from '@/pages/api/survey-v2/final-recommendation';

// ═══════════════════════════════════════════════════════════════
//  1. MOCK SURVEY STATES — Multiple Patient Scenarios
// ═══════════════════════════════════════════════════════════════

/** Scenario A: JP 38F — Hormonal Melasma + Retinoid Pause */
const SCENARIO_A_STATE: SurveyV2State = {
  demographics: {
    d_gender: 'female',
    d_age: '30s',
    detected_country: 'JP',
    detected_language: 'JP',
  },
  open_question_raw: '出産後にシミがひどくなりました。自然な改善を希望します。急激な変化よりも徐々に効果が出ることを望みます。',
  haiku_analysis: {
    q1_primary_goal: 'Brightening/radiance',
    q1_goal_secondary: 'Skin texture/pores',
    concern_area_hint: 'melasma + texture',
    emotion_tone: 'serious',
    prior_alignment: 'aligned',
    already_known_signals: ['hormonal_melasma', 'post_partum'],
    needs_confirmation: ['pain_tolerance', 'downtime_tolerance'],
    expectation_tag: 'REALISTIC',
    communication_style: 'EMOTIONAL',
    lifestyle_context: '出産後にシミがひどくなった',
  },
  smart_chips: [],
  smart_chips_shown: ['concern_area', 'pain_tolerance', 'downtime_tolerance'],
  chip_responses: {
    concern_area: 'melasma_pigmentation',
    pain_tolerance: 'moderate',
    downtime_tolerance: 'minimal_1_2_days',
  },
  prior_applied: ['style', 'pain_tolerance'],
  prior_overridden: [],
  prior_values: {
    style: 'natural',
    pain_tolerance: 'low_moderate',
  },
  safety_selection: { medications: [], conditions: ['hormonal_melasma', 'retinoid_use'] },
  safety_flags: ['HORMONAL_MELASMA', 'RETINOID_PAUSE'],
  safety_followups: [
    { flag: 'RETINOID_PAUSE', question: 'レチノイドの使用状況を教えてください', answer: 'using_regularly' },
  ],
  q1_primary_goal: 'Brightening/radiance',
  q1_goal_secondary: 'Skin texture/pores',
  q3_concern_area: 'melasma_pigmentation',
  q4_skin_profile: null,
  q5_style: 'natural',
  q6_pain_tolerance: 'moderate',
  q6_downtime_tolerance: 'minimal_1_2_days',
  q7_past_experience: null,
  q2_risk_flags: [],
  q2_pigment_pattern: 'hormonal_melasma',
  q3_volume_logic: null,
  q3_primary_vector: null,
};

/** Scenario B: CN 25F — Brightening + K-Beauty interest */
const SCENARIO_B_STATE: SurveyV2State = {
  demographics: {
    d_gender: 'female',
    d_age: '20s',
    detected_country: 'CN',
    detected_language: 'ZH-CN',
  },
  open_question_raw: '我想让皮肤变得更白更亮，韩国有什么最新的美白技术吗？',
  haiku_analysis: {
    q1_primary_goal: 'Brightening/radiance',
    q1_goal_secondary: null,
    concern_area_hint: 'brightening',
    emotion_tone: 'exploratory',
    prior_alignment: 'aligned',
    already_known_signals: ['brightening'],
    needs_confirmation: ['skin_profile', 'style'],
    expectation_tag: 'AMBITIOUS',
    communication_style: 'EMOTIONAL',
    lifestyle_context: '韩国美白技术感兴趣',
  },
  smart_chips: [],
  smart_chips_shown: ['skin_profile', 'style'],
  chip_responses: {
    skin_profile: 'combination_oily',
    style: 'dramatic',
  },
  prior_applied: ['downtime_tolerance'],
  prior_overridden: [],
  prior_values: { downtime_tolerance: 'flexible' },
  safety_selection: { medications: [], conditions: [] },
  safety_flags: [],
  safety_followups: [],
  q1_primary_goal: 'Brightening/radiance',
  q1_goal_secondary: null,
  q3_concern_area: null,
  q4_skin_profile: 'combination_oily',
  q5_style: 'dramatic',
  q6_pain_tolerance: null,
  q6_downtime_tolerance: 'flexible',
  q7_past_experience: null,
  q2_risk_flags: [],
  q2_pigment_pattern: null,
  q3_volume_logic: null,
  q3_primary_vector: null,
};

/** Scenario C: SG 40M — Anti-aging + Isotretinoin (danger flag) */
const SCENARIO_C_STATE: SurveyV2State = {
  demographics: {
    d_gender: 'male',
    d_age: '40s',
    detected_country: 'SG',
    detected_language: 'EN',
  },
  open_question_raw: 'I want to look younger and reduce wrinkles. I have been taking isotretinoin for acne.',
  haiku_analysis: {
    q1_primary_goal: 'Anti-aging/prevention',
    q1_goal_secondary: 'Contouring/lifting',
    concern_area_hint: 'wrinkles + aging',
    emotion_tone: 'casual',
    prior_alignment: 'neutral',
    already_known_signals: ['anti_aging', 'isotretinoin_user'],
    needs_confirmation: ['pain_tolerance', 'past_experience'],
    expectation_tag: 'REALISTIC',
    communication_style: 'LOGICAL',
    lifestyle_context: null,
  },
  smart_chips: [],
  smart_chips_shown: ['pain_tolerance', 'past_experience'],
  chip_responses: {
    pain_tolerance: 'high',
    past_experience: 'botox_filler',
  },
  prior_applied: [],
  prior_overridden: [],
  prior_values: {},
  safety_selection: { medications: ['isotretinoin'], conditions: [] },
  safety_flags: ['SAFETY_ISOTRETINOIN'],
  safety_followups: [
    { flag: 'SAFETY_ISOTRETINOIN', question: 'When did you last take isotretinoin?', answer: 'within_6mo' },
  ],
  q1_primary_goal: 'Anti-aging/prevention',
  q1_goal_secondary: 'Contouring/lifting',
  q3_concern_area: null,
  q4_skin_profile: null,
  q5_style: null,
  q6_pain_tolerance: 'high',
  q6_downtime_tolerance: null,
  q7_past_experience: 'botox_filler',
  q2_risk_flags: [],
  q2_pigment_pattern: null,
  q3_volume_logic: null,
  q3_primary_vector: null,
};

// ═══════════════════════════════════════════════════════════════
//  2. REQUEST BUILDER — SurveyV2State → FinalRecommendationRequest
// ═══════════════════════════════════════════════════════════════

function buildRequestFromState(state: SurveyV2State): FinalRecommendationRequest {
  const followupAnswers: Record<string, string> = {};
  for (const fu of state.safety_followups) {
    if (fu.answer) followupAnswers[fu.flag] = fu.answer;
  }

  return {
    demographics: state.demographics,
    haiku_analysis: state.haiku_analysis!,
    chip_responses: state.chip_responses,
    prior_applied: state.prior_applied,
    prior_values: state.prior_values,
    safety_flags: state.safety_flags,
    safety_followup_answers: followupAnswers,
    open_question_raw: state.open_question_raw,
    q1_primary_goal: state.q1_primary_goal,
    q1_goal_secondary: state.q1_goal_secondary,
    q3_concern_area: state.q3_concern_area,
    q4_skin_profile: state.q4_skin_profile,
    q5_style: state.q5_style,
    q6_pain_tolerance: state.q6_pain_tolerance,
    q6_downtime_tolerance: state.q6_downtime_tolerance,
    q7_past_experience: state.q7_past_experience,
    q2_risk_flags: state.q2_risk_flags,
    q2_pigment_pattern: state.q2_pigment_pattern,
    q3_volume_logic: state.q3_volume_logic,
  };
}

// ═══════════════════════════════════════════════════════════════
//  3. MOCK OPUS OUTPUT — Matching TS interfaces exactly
// ═══════════════════════════════════════════════════════════════

/** Mock Opus output for Scenario A (JP 38F Melasma) */
function createMockOpusOutput_ScenarioA(): OpusRecommendationOutput {
  const patient: OpusPatientProfile = {
    age: '30s',
    gender: 'female',
    country: 'JP',
    aesthetic_goal: '出産後のシミ改善と自然な肌質向上',
    top3_concerns: ['シミ/色素沈着', '弾力低下', '毛穴/肌質'],
    past_treatments: [],
    fitzpatrick: 'III-IV',
    pain_sensitivity: 4,
  };

  const ebd_recommendations: OpusDeviceRecommendation[] = [
    {
      rank: 1,
      device_name: 'SylfirmX',
      device_id: 'SylfirmX',
      moa_category: 'MN_RF',
      moa_category_label: 'PW MN-RF · パルスウェーブマイクロニードルRF',
      evidence_level: 4,
      confidence: 92,
      skin_layer: 'upd',
      pain_level: 2,
      downtime_level: 1,
      safety_level: 3,
      badge: null,
      badge_color: undefined,
      subtitle: 'Pulsed Wave MN-RF · DE Junction 選択的ターゲット · 50°C未満',
      summary_html: '<strong class="ebd-hl">PW Mode</strong>がDE junctionを選択的に再建し、シミ治療に最適化されたMN-RFです。',
      why_fit_html: '1. <span class="hl-cyan">ホルモン性シミ対応</span> — PWモードの選択的DE junction再建<br>2. <span class="hl-cyan">低温エネルギー安全性</span> — 50°C未満',
      moa_summary_title: 'PW MN-RF · SylfirmX',
      moa_summary_short: 'PW Mode → DE Junction → Melanocyte Stabilization → Collagen ↑',
      moa_description_html: 'SylfirmXの<strong>Pulsed Wave(PW)モード</strong>はDE junctionを選択的にターゲットします。',
      target_tags: ['DE Junction', 'Tight +', 'Pigment ↓', '効果 2~4ヶ月'],
      practical: { sessions: '3~5回', interval: '2~4週', duration: '30~40分', onset: '2~4週', maintain: '6~12ヶ月' },
      scores: { tightening: 7, lifting: 5, volume: 3, brightening: 9, texture: 7, evidence: 8, synergy: 8, longevity: 6, roi: 7, trend: 9, popularity: 8 },
      ai_description_html: '<strong>SylfirmX PW</strong>はシミ治療に最も安全なエネルギーベースデバイスです。',
    },
    {
      rank: 2,
      device_name: 'PicoSure Pro',
      device_id: 'PicoSure_Pro',
      moa_category: 'PICO',
      moa_category_label: 'Picosecond · 755nm アレキサンドライト',
      evidence_level: 4,
      confidence: 88,
      skin_layer: 'epi',
      pain_level: 2,
      downtime_level: 2,
      safety_level: 3,
      badge: '色素 Gold Standard',
      badge_color: 'amber',
      subtitle: '755nm Alexandrite Picosecond · FOCUS Lens Array · LIOBs',
      summary_html: '755nmピコ秒レーザーの<strong class="ebd-hl">FOCUS Lens Array</strong>でLIOBsを生成。',
      why_fit_html: '1. <span class="hl-cyan">シミ色素分解</span><br>2. <span class="hl-cyan">PIHリスク最小</span>',
      moa_summary_title: 'Picosecond · PicoSure Pro',
      moa_summary_short: '755nm → LIOBs → Melanin Shatter → Collagen Remodeling',
      moa_description_html: 'PicoSure Proの<strong>755nm</strong>はメラニンに選択的に吸収されます。',
      target_tags: ['表皮~真皮上層', 'Pigment ↓↓', 'Texture +'],
      practical: { sessions: '5~8回', interval: '2~4週', duration: '20~30分', onset: '1~2週', maintain: '3~6ヶ月' },
      scores: { tightening: 4, lifting: 2, volume: 1, brightening: 10, texture: 8, evidence: 8, synergy: 7, longevity: 5, roi: 7, trend: 8, popularity: 9 },
      ai_description_html: '<strong>PicoSure Pro</strong>は色素治療のゴールドスタンダードです。',
    },
    {
      rank: 3,
      device_name: 'LaseMD Ultra',
      device_id: 'LaseMD_Ultra',
      moa_category: 'LASER',
      moa_category_label: '1927nm Thulium · LADD',
      evidence_level: 3,
      confidence: 85,
      skin_layer: 'epi',
      pain_level: 1,
      downtime_level: 1,
      safety_level: 3,
      badge: '最小ダウンタイム',
      badge_color: 'green',
      subtitle: '1927nm Thulium Laser · LADD · マイクロチャネル薬物送達',
      summary_html: '1927nmツリウムレーザーで<strong class="ebd-hl">マイクロチャネル</strong>を生成。',
      why_fit_html: '1. <span class="hl-cyan">LADDシナジー</span><br>2. <span class="hl-cyan">ダウンタイム0日</span>',
      moa_summary_title: '1927nm Thulium · LaseMD Ultra',
      moa_summary_short: '1927nm → Microchannel → LADD → Active Ingredient Delivery',
      moa_description_html: 'LaseMD Ultraの<strong>1927nm</strong>は水分に選択的に吸収されます。',
      target_tags: ['表皮 0.1~0.3mm', 'Bright ++', 'Texture +'],
      practical: { sessions: '3~6回', interval: '2~4週', duration: '15~20分', onset: '即時', maintain: '3~6ヶ月' },
      scores: { tightening: 2, lifting: 1, volume: 1, brightening: 8, texture: 9, evidence: 6, synergy: 9, longevity: 4, roi: 8, trend: 7, popularity: 7 },
      ai_description_html: '<strong>LaseMD Ultra</strong>はLADD機序でスキンブースターシナジーを最大化します。',
    },
  ];

  const injectable_recommendations: OpusInjectableRecommendation[] = [
    {
      rank: 1,
      name: 'Rejuran Healer',
      injectable_id: 'rejuran_healer',
      category: 'PN_PDRN',
      category_label: 'PDRN/PN · ポリヌクレオチド',
      evidence_level: 4,
      confidence: 90,
      skin_layer: 'upd',
      subtitle: 'Salmon DNA · PDRN/PN · 自己再生促進',
      summary_html: '<strong class="inj-hl">PN</strong>が損傷した細胞の自己再生を促進します。',
      why_fit_html: '1. <span class="hl-rose">シミ皮膚再生</span><br>2. <span class="hl-rose">SylfirmXシナジー</span>',
      moa_summary_title: 'PDRN/PN · Rejuran',
      moa_summary_short: 'PN Fragment → A2A Receptor → Cell Regeneration → Collagen ↑',
      moa_description_html: 'Rejuranの<strong>PN</strong>がA2A受容体に結合して抗炎症反応を誘導します。',
      practical: { sessions: '3~4回', interval: '2~4週', onset: '2~4週', maintain: '6~12ヶ月' },
      scores: { hydration: 6, repair: 9, collagen: 7, brightening: 7, elasticity: 6, evidence: 7, synergy: 9, longevity: 7 },
    },
    {
      rank: 2,
      name: 'Juvelook',
      injectable_id: 'juvelook',
      category: 'PDLLA',
      category_label: 'PDLLA+HA · ハイブリッドバイオスティミュレーター',
      evidence_level: 3,
      confidence: 86,
      skin_layer: 'upd',
      subtitle: 'PDLLA+HA Hybrid · 即時水分 + 長期コラーゲン',
      summary_html: '<strong class="inj-hl">PDLLA</strong>とHAのハイブリッドで即時水分+長期コラーゲン。',
      why_fit_html: '1. <span class="hl-rose">二重作用</span><br>2. <span class="hl-rose">肌質改善</span>',
      moa_summary_title: 'PDLLA+HA · Juvelook',
      moa_summary_short: 'PDLLA Microsphere + HA → Dual Action → Collagen + Hydration',
      moa_description_html: 'Juvelookの<strong>PDLLAマイクロスフィア</strong>は真皮内で徐々に分解されます。',
      practical: { sessions: '2~3回', interval: '4週', onset: '即時 (HA) / 4週 (PDLLA)', maintain: '12~18ヶ月' },
      scores: { hydration: 8, repair: 5, collagen: 8, brightening: 6, elasticity: 7, evidence: 6, synergy: 8, longevity: 8 },
    },
    {
      rank: 3,
      name: 'Sculptra',
      injectable_id: 'sculptra',
      category: 'PLLA',
      category_label: 'PLLA · バイオスティミュレーター',
      evidence_level: 5,
      confidence: 82,
      skin_layer: 'lod',
      subtitle: 'PLLA Biostimulator · 長期ボリューム再建 18~24ヶ月',
      summary_html: '<strong class="inj-hl">PLLA微粒子</strong>が真皮下層で自己コラーゲン生成を誘導。',
      why_fit_html: '1. <span class="hl-rose">弾力低下対応</span><br>2. <span class="hl-rose">自然な変化</span>',
      moa_summary_title: 'PLLA · Sculptra',
      moa_summary_short: 'PLLA Microsphere → Macrophage → TGF-β → Collagen I/III ↑↑',
      moa_description_html: 'Sculptraの<strong>PLLA</strong>はマクロファージを活性化してコラーゲン合成を促進します。',
      practical: { sessions: '2~3回', interval: '4~6週', onset: '4~8週', maintain: '18~24ヶ月' },
      scores: { hydration: 3, repair: 5, collagen: 10, brightening: 3, elasticity: 8, evidence: 9, synergy: 6, longevity: 10 },
    },
  ];

  const signature_solutions: OpusSignatureSolution[] = [
    {
      name: 'シミ征服プログラム',
      description: 'シミ+弾力同時改善: PW MN-RFでDE junction再建後ピコトーニングで色素分解、Rejuranで皮膚自己再生誘導',
      devices: ['SylfirmX', 'PicoSure_Pro'],
      injectables: ['rejuran_healer'],
      total_sessions: '11~16回',
      synergy_score: 94,
    },
    {
      name: 'グロウリニューアルコース',
      description: '肌質+ツヤ中心: LADDで有効成分浸透最大化、Juvelookで即時水分+長期コラーゲン',
      devices: ['LaseMD_Ultra', 'PicoSure_Pro'],
      injectables: ['juvelook'],
      total_sessions: '9~13回',
      synergy_score: 89,
    },
  ];

  const treatment_plan: OpusTreatmentPlan = {
    phases: [
      { phase: 1, name: 'SylfirmX PWシミ治療', period: 'Day 1', treatments: ['PW Mode MN-RF 全顔', 'DE junction再建'], goal: 'メラノサイト安定化 + 基底膜再建' },
      { phase: 2, name: 'PicoSure + Rejuran', period: 'Day 3', treatments: ['755nm ピコ秒トーニング', 'Rejuran Healer 2cc'], goal: '色素分解 + 皮膚自己再生開始' },
      { phase: 3, name: 'LaseMD + Juvelook', period: 'Day 6', treatments: ['1927nm マイクロチャネル', 'Juvelook 2cc LADD'], goal: 'バイオスティミュレーター浸透最大化' },
      { phase: 4, name: '経過確認', period: 'Day 9', treatments: ['中間点検', '必要時PicoSure追加トーニング'], goal: '治療反応評価 + 調整' },
    ],
  };

  const homecare: OpusHomecare = {
    morning: ['SPF 50+ 日焼け止め必須', 'ビタミンC セラム (低濃度)', 'セラミド保湿剤'],
    evening: ['低刺激クレンジング', 'トラネキサム酸セラム', 'セラミド保湿剤 (厚塗り)'],
    weekly: ['シートマスク (鎮静タイプ) 2~3回'],
    avoid: ['レチノイド MN-RF施術2週前中断', '直射日光 4週間', '刺激性成分 (AHA/BHA) 2週間', 'サウナ/激しい運動 48時間'],
  };

  const doctor_tab: OpusDoctorTab = {
    clinical_summary: '38세 일본 여성, 출산 후 호르몬성 기미 + 피부결 개선 요구.\n38-year-old Japanese female, post-partum hormonal melasma with texture concerns. Conservative approach indicated per JP-Safety weight profile.',
    triggered_protocols: ['PROTO_02', 'PROTO_04'],
    country_note: '일본 환자: 안전성 최우선, 자연스러운 변화 선호, 통증 최소화 필수.\nJP patient: Safety-first approach, natural results preferred, pain minimization essential.',
    parameter_guidance: {
      'SylfirmX': 'PW Mode only. Energy: 2.0-2.5MHz, Depth: 1.5mm. No CW mode for melasma patients.',
      'PicoSure Pro': '755nm, 0.4-0.6 J/cm², Spot size 6mm. Low fluence toning protocol.',
      'LaseMD Ultra': 'Level 3-5, 2 passes. Combine with TXA ampoule for LADD.',
    },
    contraindications: [
      'RETINOID_PAUSE: Discontinue retinoid 2 weeks prior to MN-RF. Resume low-concentration 48h post-procedure.',
      'HORMONAL_MELASMA: Avoid aggressive energy settings. Monitor for PIH at 2-week follow-up.',
    ],
    alternative_options: [
      'If PIH occurs post-PicoSure: Switch to 1064nm Nd:YAG low-fluence toning',
      'If retinoid cannot be paused: Defer MN-RF, proceed with LaseMD + injectable only',
    ],
    patient_intelligence: {
      expectation_tag: 'REALISTIC',
      expectation_note: 'Patient has realistic expectations for gradual improvement.',
      budget_timeline: {
        budget_tier: 'Standard' as const,
        decision_speed: 'Slow' as const,
        urgency: 'LOW' as const,
        stay_duration: '2 weeks',
      },
      communication_style: 'EMOTIONAL',
      communication_note: 'Patient shows emotional communication style. Empathetic approach recommended.',
    },
    consultation_strategy: {
      recommended_order: ['安全性説明', 'ビフォーアフター', 'オプション提示'],
      expected_complaints: ['痛みへの不安', 'ダウンタイムの懸念'],
      scenario_summary: 'Safety-first approach for JP patient with hormonal melasma. Natural improvement preferred.',
    },
  };

  return {
    lang: 'jp',
    generated_at: new Date().toISOString(),
    model: 'claude-opus-4-6',
    patient,
    safety_flags: {
      hormonal_melasma: true,
      retinoid_pause: true,
      isotretinoin: { status: 'none' },
      anticoagulant: { status: 'none' },
      pregnancy: false,
      keloid_history: false,
      photosensitive_drug: false,
    },
    mirror: {
      headline: '写真を避けてしまう気持ち、わかります',
      empathy_paragraphs: '50代になると、たるみが気になって写真を避けてしまう方は本当に多いです。',
      transition: '同じお悩みの方がたくさんいらっしゃいます。そして、方法があります。',
    },
    confidence: {
      reason_why: '加齢とともにコラーゲンの産生が減少し、皮膚の弾力が低下します。',
      social_proof: '「もっと早くやればよかった」とおっしゃる方が本当に多いです。',
      commitment: 'お悩みに対する方法があります。そして、選択肢は一つではありません。',
    },
    ebd_recommendations,
    injectable_recommendations,
    signature_solutions,
    treatment_plan,
    homecare,
    doctor_tab,
  };
}

// ═══════════════════════════════════════════════════════════════
//  4. REPORT PAYLOAD — Matching report-v2/[id].tsx consumption
// ═══════════════════════════════════════════════════════════════

interface ReportPayload {
  recommendation: OpusRecommendationOutput;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
  survey_state: {
    demographics: { detected_language: SurveyLang; detected_country: string; d_gender: string; d_age: string };
    safety_flags: SafetyFlag[];
    open_question_raw: string;
  };
  created_at: string;
}

function buildReportPayload(
  state: SurveyV2State,
  opusOutput: OpusRecommendationOutput,
): ReportPayload {
  return {
    recommendation: opusOutput,
    model: 'claude-opus-4-6',
    usage: { input_tokens: 8500, output_tokens: 6200 },
    survey_state: {
      demographics: state.demographics,
      safety_flags: state.safety_flags,
      open_question_raw: state.open_question_raw,
    },
    created_at: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
//  5. TESTS
// ═══════════════════════════════════════════════════════════════

describe('Survey v2 E2E Pipeline', () => {
  // ─── 5.1 Request Builder Tests ─────────────────────────────
  describe('FinalRecommendationRequest builder', () => {
    test('Scenario A (JP 38F Melasma) → builds valid request', () => {
      const req = buildRequestFromState(SCENARIO_A_STATE);

      // Demographics
      expect(req.demographics.d_gender).toBe('female');
      expect(req.demographics.d_age).toBe('30s');
      expect(req.demographics.detected_country).toBe('JP');
      expect(req.demographics.detected_language).toBe('JP');

      // Haiku analysis present
      expect(req.haiku_analysis).toBeDefined();
      expect(req.haiku_analysis.q1_primary_goal).toBe('Brightening/radiance');

      // Mapped signals
      expect(req.q1_primary_goal).toBe('Brightening/radiance');
      expect(req.q1_goal_secondary).toBe('Skin texture/pores');
      expect(req.q3_concern_area).toBe('melasma_pigmentation');
      expect(req.q5_style).toBe('natural');
      expect(req.q6_pain_tolerance).toBe('moderate');
      expect(req.q2_pigment_pattern).toBe('hormonal_melasma');

      // Safety
      expect(req.safety_flags).toContain('HORMONAL_MELASMA');
      expect(req.safety_flags).toContain('RETINOID_PAUSE');
      expect(req.safety_followup_answers).toHaveProperty('RETINOID_PAUSE', 'using_regularly');

      // Priors
      expect(req.prior_applied).toContain('style');
      expect(req.prior_values).toHaveProperty('style', 'natural');
    });

    test('Scenario B (CN 25F Brightening) → no safety flags', () => {
      const req = buildRequestFromState(SCENARIO_B_STATE);

      expect(req.demographics.detected_country).toBe('CN');
      expect(req.safety_flags).toHaveLength(0);
      expect(req.safety_followup_answers).toEqual({});
      expect(req.q5_style).toBe('dramatic');
      expect(req.q4_skin_profile).toBe('combination_oily');
    });

    test('Scenario C (SG 40M Isotretinoin) → danger flag present', () => {
      const req = buildRequestFromState(SCENARIO_C_STATE);

      expect(req.demographics.d_gender).toBe('male');
      expect(req.demographics.detected_country).toBe('SG');
      expect(req.safety_flags).toContain('SAFETY_ISOTRETINOIN');
      expect(req.safety_followup_answers).toHaveProperty('SAFETY_ISOTRETINOIN', 'within_6mo');
      expect(req.q7_past_experience).toBe('botox_filler');
    });
  });

  // ─── 5.2 Opus Output Validation ────────────────────────────
  describe('OpusRecommendationOutput structure', () => {
    const output = createMockOpusOutput_ScenarioA();

    test('top-level fields present', () => {
      expect(output.lang).toBe('jp');
      expect(output.model).toBe('claude-opus-4-6');
      expect(output.generated_at).toBeDefined();
      expect(output.patient).toBeDefined();
      expect(output.ebd_recommendations).toHaveLength(3);
      expect(output.injectable_recommendations).toHaveLength(3);
      expect(output.signature_solutions.length).toBeGreaterThanOrEqual(1);
      expect(output.treatment_plan.phases.length).toBeGreaterThanOrEqual(1);
      expect(output.homecare).toBeDefined();
      expect(output.doctor_tab).toBeDefined();
    });

    test('patient profile matches OpusPatientProfile interface', () => {
      const p = output.patient;
      expect(typeof p.age).toBe('string');
      expect(typeof p.gender).toBe('string');
      expect(typeof p.country).toBe('string');
      expect(typeof p.aesthetic_goal).toBe('string');
      expect(Array.isArray(p.top3_concerns)).toBe(true);
      expect(Array.isArray(p.past_treatments)).toBe(true);
      expect(typeof p.fitzpatrick).toBe('string');
      expect(typeof p.pain_sensitivity).toBe('number');
    });

    test('EBD device matches OpusDeviceRecommendation interface', () => {
      const d = output.ebd_recommendations[0];
      expect(d.rank).toBe(1);
      expect(typeof d.device_name).toBe('string');
      expect(typeof d.device_id).toBe('string');
      expect(typeof d.moa_category).toBe('string');
      expect(typeof d.evidence_level).toBe('number');
      expect(typeof d.confidence).toBe('number');
      expect(typeof d.skin_layer).toBe('string');
      expect(typeof d.pain_level).toBe('number');
      expect(typeof d.downtime_level).toBe('number');
      expect(typeof d.safety_level).toBe('number');
      expect(typeof d.summary_html).toBe('string');
      expect(typeof d.why_fit_html).toBe('string');
      expect(Array.isArray(d.target_tags)).toBe(true);
      // Practical object
      expect(d.practical).toHaveProperty('sessions');
      expect(d.practical).toHaveProperty('interval');
      expect(d.practical).toHaveProperty('duration');
      expect(d.practical).toHaveProperty('onset');
      expect(d.practical).toHaveProperty('maintain');
      // Scores
      expect(typeof d.scores['tightening']).toBe('number');
      expect(typeof d.scores['evidence']).toBe('number');
    });

    test('injectable matches OpusInjectableRecommendation interface (name, not product_name)', () => {
      const inj = output.injectable_recommendations[0];
      expect(inj).toHaveProperty('name'); // NOT product_name
      expect(inj).toHaveProperty('injectable_id'); // NOT product_id
      expect(inj).not.toHaveProperty('product_name');
      expect(inj).not.toHaveProperty('product_id');
      expect(typeof inj.category).toBe('string');
      expect(typeof inj.category_label).toBe('string');
      expect(inj.practical).toHaveProperty('sessions');
      expect(inj.practical).toHaveProperty('interval');
      expect(inj.practical).toHaveProperty('onset');
      expect(inj.practical).toHaveProperty('maintain');
      // Injectable practical does NOT have 'duration'
      expect(inj.practical).not.toHaveProperty('duration');
    });

    test('signature solution matches OpusSignatureSolution interface', () => {
      const sig = output.signature_solutions[0];
      expect(sig).toHaveProperty('name');
      expect(sig).toHaveProperty('description');
      expect(Array.isArray(sig.devices)).toBe(true);
      expect(Array.isArray(sig.injectables)).toBe(true);
      expect(typeof sig.total_sessions).toBe('string');
      expect(typeof sig.synergy_score).toBe('number');
      // NOT solution_name, NOT tagline, NOT ebd_device
      expect(sig).not.toHaveProperty('solution_name');
      expect(sig).not.toHaveProperty('tagline');
    });

    test('treatment phase matches OpusTreatmentPhase interface', () => {
      const phase = output.treatment_plan.phases[0];
      expect(typeof phase.phase).toBe('number');
      expect(typeof phase.name).toBe('string');
      expect(typeof phase.period).toBe('string');
      expect(Array.isArray(phase.treatments)).toBe(true);
      expect(typeof phase.treatments[0]).toBe('string'); // treatments are strings, NOT objects
      expect(typeof phase.goal).toBe('string');
      // NOT phase_label, NOT description_html
      expect(phase).not.toHaveProperty('phase_label');
      expect(phase).not.toHaveProperty('description_html');
    });

    test('homecare matches OpusHomecare interface (arrays of strings)', () => {
      const hc = output.homecare;
      expect(Array.isArray(hc.morning)).toBe(true);
      expect(Array.isArray(hc.evening)).toBe(true);
      expect(Array.isArray(hc.weekly)).toBe(true);
      expect(Array.isArray(hc.avoid)).toBe(true);
      expect(typeof hc.morning[0]).toBe('string');
      // NOT icon/title/description_html objects
    });

    test('doctor tab matches OpusDoctorTab interface', () => {
      const doc = output.doctor_tab;
      expect(typeof doc.clinical_summary).toBe('string');
      expect(Array.isArray(doc.triggered_protocols)).toBe(true);
      expect(typeof doc.country_note).toBe('string'); // NOT country_context_note
      expect(typeof doc.parameter_guidance).toBe('object');
      expect(Array.isArray(doc.contraindications)).toBe(true);
      expect(typeof doc.contraindications[0]).toBe('string'); // strings, NOT objects
      expect(Array.isArray(doc.alternative_options)).toBe(true); // NOT alternatives
      expect(typeof doc.alternative_options[0]).toBe('string');
      // Verify parameter_guidance is Record<string, string>
      const [key, val] = Object.entries(doc.parameter_guidance)[0];
      expect(typeof key).toBe('string');
      expect(typeof val).toBe('string');
    });
  });

  // ─── 5.3 Report Payload Tests ──────────────────────────────
  describe('ReportPayload for report-v2 page', () => {
    test('builds valid ReportPayload from state + Opus output', () => {
      const opus = createMockOpusOutput_ScenarioA();
      const payload = buildReportPayload(SCENARIO_A_STATE, opus);

      expect(payload.recommendation).toBe(opus);
      expect(payload.model).toBe('claude-opus-4-6');
      expect(payload.usage.input_tokens).toBeGreaterThan(0);
      expect(payload.usage.output_tokens).toBeGreaterThan(0);
      expect(payload.survey_state.demographics.detected_language).toBe('JP');
      expect(payload.survey_state.demographics.detected_country).toBe('JP');
      expect(payload.survey_state.safety_flags).toContain('HORMONAL_MELASMA');
      expect(payload.survey_state.open_question_raw.length).toBeGreaterThan(0);
      expect(payload.created_at).toBeDefined();
    });

    test('sessionStorage serialization round-trip', () => {
      const opus = createMockOpusOutput_ScenarioA();
      const payload = buildReportPayload(SCENARIO_A_STATE, opus);

      const serialized = JSON.stringify(payload);
      const deserialized: ReportPayload = JSON.parse(serialized);

      // Verify critical fields survive serialization
      expect(deserialized.recommendation.patient.country).toBe('JP');
      expect(deserialized.recommendation.ebd_recommendations).toHaveLength(3);
      expect(deserialized.recommendation.injectable_recommendations[0].name).toBe('Rejuran Healer');
      expect(deserialized.recommendation.treatment_plan.phases).toHaveLength(4);
      expect(deserialized.recommendation.doctor_tab.triggered_protocols).toContain('PROTO_02');
      expect(deserialized.survey_state.safety_flags).toContain('RETINOID_PAUSE');
    });
  });

  // ─── 5.4 Safety Flag Rendering Logic ───────────────────────
  describe('Safety flag classification', () => {
    const DANGER_FLAGS: SafetyFlag[] = ['SAFETY_ISOTRETINOIN', 'SAFETY_ANTICOAGULANT', 'SAFETY_PREGNANCY'];

    test('Scenario A (HORMONAL_MELASMA, RETINOID_PAUSE) → warning, not danger', () => {
      const flags = SCENARIO_A_STATE.safety_flags;
      const hasDanger = flags.some(f => DANGER_FLAGS.includes(f));
      expect(hasDanger).toBe(false);
      expect(flags).toContain('HORMONAL_MELASMA');
      expect(flags).toContain('RETINOID_PAUSE');
    });

    test('Scenario C (SAFETY_ISOTRETINOIN) → danger', () => {
      const flags = SCENARIO_C_STATE.safety_flags;
      const hasDanger = flags.some(f => DANGER_FLAGS.includes(f));
      expect(hasDanger).toBe(true);
      expect(flags).toContain('SAFETY_ISOTRETINOIN');
    });

    test('Scenario B (no flags) → no banner shown', () => {
      const flags = SCENARIO_B_STATE.safety_flags;
      expect(flags).toHaveLength(0);
    });

    test('all SafetyFlag values are valid enum values', () => {
      const validFlags: SafetyFlag[] = [
        'SAFETY_ISOTRETINOIN', 'SAFETY_ANTICOAGULANT', 'SAFETY_PHOTOSENSITIVITY',
        'HORMONAL_MELASMA', 'RETINOID_PAUSE', 'SAFETY_PREGNANCY',
        'SAFETY_KELOID', 'SAFETY_ADVERSE_HISTORY',
      ];
      for (const scenario of [SCENARIO_A_STATE, SCENARIO_B_STATE, SCENARIO_C_STATE]) {
        for (const flag of scenario.safety_flags) {
          expect(validFlags).toContain(flag);
        }
      }
    });
  });

  // ─── 5.5 Cross-Scenario Request Consistency ────────────────
  describe('Cross-scenario request consistency', () => {
    const reqA = buildRequestFromState(SCENARIO_A_STATE);
    const reqB = buildRequestFromState(SCENARIO_B_STATE);
    const reqC = buildRequestFromState(SCENARIO_C_STATE);

    test('all requests have required fields', () => {
      for (const req of [reqA, reqB, reqC]) {
        expect(req.demographics).toBeDefined();
        expect(req.haiku_analysis).toBeDefined();
        expect(req.chip_responses).toBeDefined();
        expect(typeof req.open_question_raw).toBe('string');
        expect(req.open_question_raw.length).toBeGreaterThan(0);
        expect(Array.isArray(req.safety_flags)).toBe(true);
        expect(typeof req.safety_followup_answers).toBe('object');
        expect(Array.isArray(req.prior_applied)).toBe(true);
        expect(typeof req.prior_values).toBe('object');
      }
    });

    test('different countries use different languages', () => {
      expect(reqA.demographics.detected_language).toBe('JP');
      expect(reqB.demographics.detected_language).toBe('ZH-CN');
      expect(reqC.demographics.detected_language).toBe('EN');
    });

    test('all q1_primary_goal values are valid protocol-mappable goals', () => {
      const validGoals = [
        'Contouring/lifting', 'Volume/elasticity', 'Brightening/radiance',
        'Skin texture/pores', 'Anti-aging/prevention', 'Acne/scarring',
      ];
      for (const req of [reqA, reqB, reqC]) {
        if (req.q1_primary_goal) {
          expect(validGoals).toContain(req.q1_primary_goal);
        }
      }
    });
  });

  // ─── 5.5b v1.2 Mirror + Confidence Layer Verification ──────
  // Tests: KR 42F Tightening, US 35F Body, JP 52F Lifting
  describe('v1.2 Mirror + Confidence layer verification', () => {
    test('Scenario D: KR 42F Tightening — v1.2 열 에너지, 콜라겐 수축+신생', () => {
      const mock: OpusRecommendationOutput = {
        ...createMockOpusOutput_ScenarioA(),
        lang: 'ko',
        patient: {
          age: '40s', gender: 'female', country: 'KR',
          aesthetic_goal: '볼살 빠지면서 더 나이들어 보이는 느낌 개선',
          top3_concerns: ['탄력저하', '볼살빠짐', '주름'],
          past_treatments: [],
          fitzpatrick: 'III',
          pain_sensitivity: 3,
        },
        mirror: {
          headline: '관리해도 달라지지 않는 느낌, 아시죠?',
          empathy_paragraphs: '운동도 열심히 하시고, 관리도 꾸준히 하시는데 — 거울을 볼 때마다 볼살이 빠지면서 오히려 더 나이들어 보이는 느낌.\n\n40대에 접어들면서 \"꾸준히 하는데도 왜 달라지지 않지?\"라는 생각이 드셨을 거예요.',
          transition: '많은 분들이 같은 고민을 하고 계세요. 그리고 방법이 있습니다.',
        },
        confidence: {
          reason_why: '보통 \'콜라겐을 채워 넣는다\'고 생각하기 쉬운데, 사실은 반대입니다. 진피층에 있는 기존 콜라겐 섬유를 열 에너지로 수축시키는 것이 첫 번째 원리예요. 느슨해진 스프링을 다시 팽팽하게 당기는 것과 비슷합니다. 그리고 이 열 자극이 신호가 되어 수주에 걸쳐 새로운 콜라겐이 만들어지면서, 피부가 스스로 탄탄해지는 두 번째 단계가 이어집니다.',
          social_proof: '비슷한 고민으로 상담받으신 분들 중 대부분이 \'진작에 할걸\'이라고 하세요. 충분히 알아보신 후에 결정하시는 것 — 가장 현명한 방법입니다.',
          commitment: '당신의 피부가 다시 달라질 수 있는 방법이 있습니다. 그리고 그 방법은 하나가 아닙니다.',
        },
      };

      // v1.2 check: "열 에너지" used (NOT "고주파 열")
      expect(mock.confidence.reason_why).toContain('열 에너지');
      expect(mock.confidence.reason_why).not.toContain('고주파 열');
      // v1.2 check: 콜라겐 수축 + 신콜라겐 생성 2단계
      expect(mock.confidence.reason_why).toContain('수축');
      expect(mock.confidence.reason_why).toContain('새로운 콜라겐');
      // Mirror layer KR tone
      expect(mock.mirror.headline.length).toBeLessThanOrEqual(30);
      expect(mock.mirror.empathy_paragraphs).toContain('거울');
      expect(mock.mirror.transition).toContain('방법이 있습니다');
      // JSON parse round-trip
      const roundTrip = JSON.parse(JSON.stringify(mock));
      expect(roundTrip.mirror.headline).toBe(mock.mirror.headline);
      expect(roundTrip.confidence.reason_why).toBe(mock.confidence.reason_why);
    });

    test('Scenario E: US 35F Body Contouring — post-pregnancy narrative', () => {
      const mock: OpusRecommendationOutput = {
        ...createMockOpusOutput_ScenarioA(),
        lang: 'en',
        patient: {
          age: '30s', gender: 'female', country: 'US',
          aesthetic_goal: 'Post-pregnancy body restoration',
          top3_concerns: ['loose skin', 'stubborn fat', 'stretch marks'],
          past_treatments: [],
          fitzpatrick: 'II',
          pain_sensitivity: 3,
        },
        mirror: {
          headline: 'Your body changed. Your identity didn\'t.',
          empathy_paragraphs: 'After pregnancy, your body went through something extraordinary. You\'ve done everything right — diet, exercise — but some changes are structural, not behavioral.\n\nWanting your body back isn\'t vanity — it\'s about feeling like yourself again.',
          transition: 'You\'re definitely not alone — and there are real options.',
        },
        confidence: {
          reason_why: 'Pregnancy permanently changes certain tissue structures — diastasis recti, skin laxity, and stubborn fat deposits. These changes aren\'t about willpower or effort. They\'re structural changes that respond to targeted medical approaches.',
          social_proof: 'Many women describe this as reclaiming something that pregnancy changed — and finding that it was absolutely worth it. Patients who take the time to research consistently report the highest satisfaction.',
          commitment: 'There are proven approaches designed for exactly what you\'re experiencing. And you have options.',
        },
      };

      // v1.2 check: recovery narrative
      expect(mock.mirror.empathy_paragraphs).toContain('pregnancy');
      expect(mock.mirror.empathy_paragraphs).toContain('feeling like yourself');
      // v1.2 check: social proof with "reclaiming"
      expect(mock.confidence.social_proof).toContain('reclaiming');
      // v1.2 check: post-pregnancy context
      expect(mock.confidence.reason_why).toContain('structural');
      // Mirror in English
      expect(mock.mirror.headline.length).toBeLessThanOrEqual(60);
      // JSON round-trip
      const roundTrip = JSON.parse(JSON.stringify(mock));
      expect(roundTrip.confidence.commitment).toBe(mock.confidence.commitment);
    });

    test('Scenario F: JP 52F Lifting — Age≥50 Confidence Insight (NOT Warning)', () => {
      const mock: OpusRecommendationOutput = {
        ...createMockOpusOutput_ScenarioA(),
        lang: 'jp',
        patient: {
          age: '50s', gender: 'female', country: 'JP',
          aesthetic_goal: 'たるみ改善',
          top3_concerns: ['たるみ', '輪郭ぼやけ', '法令線'],
          past_treatments: [],
          fitzpatrick: 'III-IV',
          pain_sensitivity: 4,
        },
        mirror: {
          headline: '写真を避けてしまう気持ち、わかります',
          empathy_paragraphs: 'たるみが気になって写真を撮るのを避けてしまう方は本当に多いです。\n\n50歳を過ぎたから仕方ない…と思いつつも、やっぱり気になる。その気持ちはとても自然なことです。',
          transition: '同じお悩みの方がたくさんいらっしゃいます。そして、方法があります。',
        },
        confidence: {
          // v1.2: Age≥50 Confidence Insight embedded in reason_why (NOT Warning popup)
          reason_why: '「リフティング」と聞くと、物理的に皮膚を引っ張るイメージかもしれません。実際はもう少し精密です。集束エネルギーが深い組織層に微細な収縮ポイントを作り、見えないアンカーのように組織を元の位置に引き上げます。お客様の肌状態を考慮して、ボリュームを保ちながらたるみだけを精密にリフトする機器をお勧めします。この機器を選んだ理由は、50代以降は強い超音波がお顔のボリュームを減らす可能性があるためです。',
          social_proof: '同じお悩みでカウンセリングを受けた方の多くが「もっと早くやればよかった」とおっしゃいます。回復期間は最小限に抑えられます。',
          commitment: 'お悩みに対する方法があります。そして、選択肢は一つではありません。',
        },
      };

      // v1.2 check: Age≥50 Confidence Insight (NOT Warning)
      expect(mock.confidence.reason_why).toContain('ボリュームを保ちながら');
      expect(mock.confidence.reason_why).toContain('50代以降');
      // v1.2 check: This is reasoning, not a warning message
      expect(mock.confidence.reason_why).toContain('この機器を選んだ理由');
      // v1.2 check: JP ダウンタイム mention in social proof
      expect(mock.confidence.social_proof).toContain('もっと早くやればよかった');
      // Mirror: バレたくない sensitivity (photo avoidance)
      expect(mock.mirror.empathy_paragraphs).toContain('写真');
      expect(mock.mirror.empathy_paragraphs).toContain('50歳');
      // JSON round-trip
      const roundTrip = JSON.parse(JSON.stringify(mock));
      expect(roundTrip.mirror.headline).toBe(mock.mirror.headline);
      expect(roundTrip.confidence.reason_why).toContain('ボリュームを保ちながら');
    });
  });

  // ─── 5.6 Score Validation ──────────────────────────────────
  describe('Score validation', () => {
    const output = createMockOpusOutput_ScenarioA();

    test('EBD device scores are all 0-10 integers', () => {
      for (const device of output.ebd_recommendations) {
        for (const [key, val] of Object.entries(device.scores)) {
          expect(Number.isInteger(val)).toBe(true);
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(10);
        }
      }
    });

    test('Injectable scores are all 0-10 integers', () => {
      for (const inj of output.injectable_recommendations) {
        for (const [key, val] of Object.entries(inj.scores)) {
          expect(Number.isInteger(val)).toBe(true);
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(10);
        }
      }
    });

    test('Confidence scores in 80-100 range', () => {
      for (const device of output.ebd_recommendations) {
        expect(device.confidence).toBeGreaterThanOrEqual(80);
        expect(device.confidence).toBeLessThanOrEqual(100);
      }
      for (const inj of output.injectable_recommendations) {
        expect(inj.confidence).toBeGreaterThanOrEqual(80);
        expect(inj.confidence).toBeLessThanOrEqual(100);
      }
    });

    test('Synergy scores in 0-100 range', () => {
      for (const sig of output.signature_solutions) {
        expect(sig.synergy_score).toBeGreaterThanOrEqual(0);
        expect(sig.synergy_score).toBeLessThanOrEqual(100);
      }
    });
  });
});
