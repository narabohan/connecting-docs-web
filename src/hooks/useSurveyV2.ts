// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs Survey v2 — Custom Hook (State + API)
//  Based on FRONTEND_UI_COMPONENT_DESIGN_v2.md §9
// ═══════════════════════════════════════════════════════════════

import { useState, useReducer, useCallback } from 'react';
import type {
  SurveyStep,
  SurveyLang,
  Demographics,
  HaikuAnalysis,
  SafetySelection,
  SafetyFlag,
  SafetyFollowUp,
  SmartChip,
  SurveyV2State,
  SurveyAction,
  GenerateChipsResponse,
  WizardDataCompat,
  ChipType,
} from '@/types/survey-v2';
import type { FinalRecommendationRequest, FinalRecommendationResponse } from '@/pages/api/survey-v2/final-recommendation';
import { MEDICATION_FLAG_MAP, CONDITION_FLAG_MAP, FOLLOWUP_ITEMS } from '@/components/survey-v2/SafetyCheckpoint';

// ─── Initial State ───────────────────────────────────────────
const initialState: SurveyV2State = {
  demographics: {
    d_gender: 'female',
    d_age: '30s',
    detected_country: 'KR',
    detected_language: 'KO',
  },
  open_question_raw: '',
  haiku_analysis: null,
  smart_chips: [],
  smart_chips_shown: [],
  chip_responses: {},
  prior_applied: [],
  prior_overridden: [],
  prior_values: {},
  safety_selection: { medications: [], conditions: [] },
  safety_flags: [],
  safety_followups: [],
  q1_primary_goal: null,
  q1_goal_secondary: null,
  q3_concern_area: null,
  q4_skin_profile: null,
  q5_style: null,
  q6_pain_tolerance: null,
  q6_downtime_tolerance: null,
  q7_past_experience: null,
  q2_risk_flags: [],
  q2_pigment_pattern: null,
  q3_volume_logic: null,
  q3_primary_vector: null,
};

// ─── Reducer ─────────────────────────────────────────────────
function surveyReducer(state: SurveyV2State, action: SurveyAction): SurveyV2State {
  switch (action.type) {
    case 'SET_DEMOGRAPHICS':
      return { ...state, demographics: action.payload };

    case 'SET_OPEN_RESPONSE':
      return { ...state, open_question_raw: action.payload };

    case 'SET_HAIKU_ANALYSIS':
      return {
        ...state,
        haiku_analysis: action.payload,
        q1_primary_goal: action.payload.q1_primary_goal,
        q1_goal_secondary: action.payload.q1_goal_secondary,
      };

    case 'SET_SMART_CHIPS':
      return {
        ...state,
        smart_chips: action.payload.chips,
        smart_chips_shown: action.payload.chips.map(c => c.type),
        prior_applied: action.payload.prior_applied,
        prior_values: action.payload.prior_values,
      };

    case 'SET_CHIP_RESPONSE':
      return {
        ...state,
        chip_responses: {
          ...state.chip_responses,
          [action.payload.chipType]: action.payload.value,
        },
      };

    case 'MAP_CHIP_RESPONSES': {
      // Map chip responses + prior values to signal fields
      const merged = { ...state.prior_values, ...state.chip_responses };
      return {
        ...state,
        q3_concern_area: merged['concern_area'] ?? state.q3_concern_area,
        q4_skin_profile: merged['skin_profile'] ?? state.q4_skin_profile,
        q5_style: merged['style'] ?? state.q5_style,
        q6_pain_tolerance: merged['pain_tolerance'] ?? state.q6_pain_tolerance,
        q6_downtime_tolerance: merged['downtime_tolerance'] ?? state.q6_downtime_tolerance,
        q7_past_experience: merged['past_experience'] ?? state.q7_past_experience,
        q2_pigment_pattern: merged['pigment_pattern'] ?? state.q2_pigment_pattern,
        q3_volume_logic: merged['volume_logic'] ?? state.q3_volume_logic,
      };
    }

    case 'SET_SAFETY_SELECTION':
      return { ...state, safety_selection: action.payload };

    case 'SET_SAFETY_FLAGS':
      return { ...state, safety_flags: action.payload };

    case 'SET_SAFETY_FOLLOWUPS':
      return { ...state, safety_followups: action.payload };

    case 'SET_FOLLOWUP_ANSWER':
      return {
        ...state,
        safety_followups: state.safety_followups.map(f =>
          f.flag === action.payload.flag
            ? { ...f, answer: action.payload.answer }
            : f
        ),
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ─── Step Order ──────────────────────────────────────────────
const STEP_ORDER: SurveyStep[] = ['demographics', 'open', 'chips', 'safety', 'analyzing'];

// ─── Goal Mapping (v2 → WizardData) ─────────────────────────
function mapGoalToWizard(goal: string | null): string {
  if (!goal) return '';
  const MAP: Record<string, string> = {
    'Contouring/lifting': 'contouring',
    'Volume/elasticity': 'volume',
    'Brightening/radiance': 'brightening',
    'Skin texture/pores': 'texture',
    'Anti-aging/prevention': 'anti-aging',
    'Acne/scarring': 'acne',
  };
  return MAP[goal] || goal.toLowerCase().replace(/[^a-z]/g, '_');
}

// ─── Protocol Detection ──────────────────────────────────────
function detectProtocolsFromState(state: SurveyV2State): string[] {
  const protocols: string[] = [];

  // PROTO_01: Contouring/Lifting
  if (state.q1_primary_goal === 'Contouring/lifting') protocols.push('PROTO_01');
  // PROTO_02: Volume/Elasticity
  if (state.q1_primary_goal === 'Volume/elasticity') protocols.push('PROTO_02');
  // PROTO_03: Brightening
  if (state.q1_primary_goal === 'Brightening/radiance') protocols.push('PROTO_03');
  // PROTO_04: Texture/Pores
  if (state.q1_primary_goal === 'Skin texture/pores') protocols.push('PROTO_04');
  // PROTO_05: Anti-aging
  if (state.q1_primary_goal === 'Anti-aging/prevention') protocols.push('PROTO_05');
  // PROTO_06: Acne
  if (state.q1_primary_goal === 'Acne/scarring') protocols.push('PROTO_06');

  // Secondary goal protocol
  if (state.q1_goal_secondary) {
    const secondaryMap: Record<string, string> = {
      'Brightening/radiance': 'PROTO_03',
      'Skin texture/pores': 'PROTO_04',
      'Volume/elasticity': 'PROTO_02',
    };
    const p = secondaryMap[state.q1_goal_secondary];
    if (p && !protocols.includes(p)) protocols.push(p);
  }

  return protocols;
}

// ─── v2 → WizardData Mapping ─────────────────────────────────
function mapV2ToWizardData(state: SurveyV2State): WizardDataCompat {
  return {
    country: state.demographics.detected_country,
    gender: state.demographics.d_gender,
    age: state.demographics.d_age,
    primaryGoal: mapGoalToWizard(state.q1_primary_goal),
    secondaryGoal: state.q1_goal_secondary || '',
    risks: state.safety_flags.map(f => f.toLowerCase()),
    concernAreas: state.q3_concern_area || '',
    pores: state.chip_responses['concern_area'] || 'not_applicable',
    skinType: state.q4_skin_profile || 'to_be_determined',
    resultStyle: state.q5_style || 'natural',
    downtimeTolerance: state.q6_downtime_tolerance || 'unknown',
    budget: 'mid',
    history: state.q7_past_experience || 'none',
    koreaVisitPlan: 'undecided',
    triggered_protocols: detectProtocolsFromState(state),
    free_text_summary: state.open_question_raw,
  };
}

// ─── Compute Safety Flags from Selection ─────────────────────
function computeSafetyFlags(selection: SafetySelection): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  for (const med of selection.medications) {
    const flag = MEDICATION_FLAG_MAP[med];
    if (flag) flags.push(flag);
  }
  for (const cond of selection.conditions) {
    const flag = CONDITION_FLAG_MAP[cond];
    if (flag) flags.push(flag);
  }
  return flags;
}

// ─── Check if follow-up API call is needed ───────────────────
function needsFollowupApi(selection: SafetySelection): boolean {
  const allItems = [...selection.medications, ...selection.conditions];
  return allItems.some(item => FOLLOWUP_ITEMS.has(item));
}

// ═══════════════════════════════════════════════════════════════
//  Main Hook
// ═══════════════════════════════════════════════════════════════

interface UseSurveyV2Props {
  onComplete: (runId: string) => void;
}

export function useSurveyV2({ onComplete }: UseSurveyV2Props) {
  const [step, setStep] = useState<SurveyStep>('demographics');
  const [state, dispatch] = useReducer(surveyReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Language shortcut ────────────────────────────────────
  const lang: SurveyLang = state.demographics.detected_language;

  // ─── Step Navigation ──────────────────────────────────────
  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0 && step !== 'analyzing') {
      setStep(STEP_ORDER[idx - 1]);
      setError(null);
    }
  }, [step]);

  // ─── Demographics Handlers ────────────────────────────────
  const setDemographics = useCallback((d: Demographics) => {
    dispatch({ type: 'SET_DEMOGRAPHICS', payload: d });
  }, []);

  const submitDemographics = useCallback(() => {
    setStep('open');
    setError(null);
  }, []);

  // ─── Open Question Handlers ───────────────────────────────
  const setOpenResponse = useCallback((text: string) => {
    dispatch({ type: 'SET_OPEN_RESPONSE', payload: text });
  }, []);

  const submitOpen = useCallback(async () => {
    if (state.open_question_raw.trim().length < 5) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Analyze open question with Haiku
      const analyzeRes = await fetch('/api/survey-v2/analyze-open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demographics: state.demographics,
          open_question_response: state.open_question_raw,
        }),
      });

      if (!analyzeRes.ok) throw new Error('Failed to analyze response');
      const analyzeData = await analyzeRes.json();

      dispatch({ type: 'SET_HAIKU_ANALYSIS', payload: analyzeData.analysis });

      // 2. Generate smart chips
      const chipsRes = await fetch('/api/survey-v2/generate-chips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demographics: state.demographics,
          haiku_analysis: analyzeData.analysis,
        }),
      });

      if (!chipsRes.ok) throw new Error('Failed to generate chips');
      const chipsData: GenerateChipsResponse = await chipsRes.json();

      dispatch({ type: 'SET_SMART_CHIPS', payload: chipsData });

      setStep('chips');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [state.demographics, state.open_question_raw]);

  // ─── Chip Handlers ────────────────────────────────────────
  const setChipResponse = useCallback((chipType: string, value: string) => {
    dispatch({ type: 'SET_CHIP_RESPONSE', payload: { chipType, value } });
  }, []);

  const submitChips = useCallback(() => {
    dispatch({ type: 'MAP_CHIP_RESPONSES' });
    setStep('safety');
    setError(null);
  }, []);

  // ─── Safety Handlers ──────────────────────────────────────
  const setSafetySelection = useCallback((s: SafetySelection) => {
    dispatch({ type: 'SET_SAFETY_SELECTION', payload: s });

    // Immediately compute flags
    const flags = computeSafetyFlags(s);
    dispatch({ type: 'SET_SAFETY_FLAGS', payload: flags });

    // Auto-create isotretinoin followup placeholder if selected
    const allItems = [...s.medications, ...s.conditions];
    const existingFollowupFlags = state.safety_followups.map(f => f.flag);

    // Add followup for isotretinoin if selected and not already present
    if (s.medications.includes('isotretinoin') && !existingFollowupFlags.includes('SAFETY_ISOTRETINOIN')) {
      dispatch({
        type: 'SET_SAFETY_FOLLOWUPS',
        payload: [
          ...state.safety_followups,
          { flag: 'SAFETY_ISOTRETINOIN', question: '' },
        ],
      });
    }
    // Remove isotretinoin followup if deselected
    if (!s.medications.includes('isotretinoin') && existingFollowupFlags.includes('SAFETY_ISOTRETINOIN')) {
      dispatch({
        type: 'SET_SAFETY_FOLLOWUPS',
        payload: state.safety_followups.filter(f => f.flag !== 'SAFETY_ISOTRETINOIN'),
      });
    }
  }, [state.safety_followups]);

  const setFollowupAnswer = useCallback((flag: SafetyFlag, answer: string) => {
    dispatch({ type: 'SET_FOLLOWUP_ANSWER', payload: { flag, answer } });

    // Special: isotretinoin cleared_over_6mo → remove flag
    if (flag === 'SAFETY_ISOTRETINOIN' && answer === 'cleared_over_6mo') {
      const currentFlags = computeSafetyFlags(state.safety_selection);
      dispatch({
        type: 'SET_SAFETY_FLAGS',
        payload: currentFlags.filter(f => f !== 'SAFETY_ISOTRETINOIN'),
      });
    }
  }, [state.safety_selection]);

  const submitSafety = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if server-side follow-up is needed
      // (for adverse_history and anticoagulant — isotretinoin is handled inline)
      const nonIsoFollowupItems = [...state.safety_selection.medications, ...state.safety_selection.conditions]
        .filter(item => FOLLOWUP_ITEMS.has(item) && item !== 'isotretinoin');

      if (nonIsoFollowupItems.length > 0) {
        const res = await fetch('/api/survey-v2/safety-followup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            demographics: state.demographics,
            selected_safety_items: [...state.safety_selection.medications, ...state.safety_selection.conditions],
            detected_language: state.demographics.detected_language,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // Merge with existing followups (keep isotretinoin inline)
          const existingIso = state.safety_followups.filter(f => f.flag === 'SAFETY_ISOTRETINOIN');
          dispatch({
            type: 'SET_SAFETY_FOLLOWUPS',
            payload: [...existingIso, ...data.followup_questions],
          });
        }
      }

      // Transition to analyzing
      setStep('analyzing');

      // Start final analysis
      await startAnalysis();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  }, [state]);

  // ─── Final Analysis (Opus Final Recommendation) ──────────
  const startAnalysis = useCallback(async () => {
    try {
      // Build the request payload from full survey state
      const followupAnswers: Record<string, string> = {};
      for (const fu of state.safety_followups) {
        if (fu.answer) followupAnswers[fu.flag] = fu.answer;
      }

      const requestBody: FinalRecommendationRequest = {
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

      // H-2: 120s timeout for Opus analysis (SSE streaming may take long)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120_000);

      const res = await fetch('/api/survey-v2/final-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Opus analysis failed');
      }

      // Parse SSE streaming response (keeps connection alive to avoid Netlify timeout)
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let data: FinalRecommendationResponse | null = null;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'done') {
              data = {
                recommendation_json: event.recommendation_json,
                model: event.model,
                usage: event.usage,
              };
            } else if (event.type === 'error') {
              throw new Error(event.error || 'Analysis stream error');
            }
            // 'progress' events are just heartbeats — ignore
          } catch (parseErr) {
            // Skip unparseable lines (heartbeats, empty lines)
            if ((parseErr as Error).message?.includes('Analysis stream error')) throw parseErr;
          }
        }
      }

      if (!data) throw new Error('No final result received from analysis');

      // Store the Opus output in sessionStorage for the report page to consume
      if (typeof window !== 'undefined') {
        const reportPayload = {
          recommendation: data.recommendation_json,
          model: data.model,
          usage: data.usage,
          survey_state: {
            demographics: state.demographics,
            safety_flags: state.safety_flags,
            open_question_raw: state.open_question_raw,
          },
          created_at: new Date().toISOString(),
        };
        sessionStorage.setItem('connectingdocs_v2_report', JSON.stringify(reportPayload));
      }

      // Generate a report ID
      const reportId = `v2_${Date.now()}`;

      // Fire-and-forget: persist to Airtable (non-blocking)
      fetch('/api/survey-v2/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: reportId,
          demographics: state.demographics,
          lang: state.demographics.detected_language || 'KO',
          safety_flags: state.safety_flags,
          open_question_raw: state.open_question_raw,
          chip_responses: state.chip_responses,
          recommendation: data.recommendation_json,
          model: data.model,
          usage: data.usage,
        }),
      }).catch((err) => console.warn('[save-result] Airtable save failed (non-blocking):', err));

      // Fire-and-forget: send email notifications (admin + patient if logged in)
      const topDevice = data.recommendation_json?.ebd_recommendations?.[0]?.device_name || '';
      const topInjectable = data.recommendation_json?.injectable_recommendations?.[0]?.name || '';
      const inputCost = (data.usage?.input_tokens || 0) / 1_000_000;
      const outputCost = (data.usage?.output_tokens || 0) / 1_000_000;
      // Sonnet pricing: $3/$15 per M tokens
      const costUsd = inputCost * 3 + outputCost * 15;

      fetch('/api/survey-v2/notify-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportId,
          patient_country: state.demographics.detected_country,
          patient_age: state.demographics.d_age,
          patient_gender: state.demographics.d_gender,
          lang: state.demographics.detected_language || 'KO',
          primary_goal: state.q1_primary_goal || '',
          top_device: topDevice,
          top_injectable: topInjectable,
          model: data.model,
          cost_usd: costUsd,
        }),
      }).catch((err) => console.warn('[notify-report] Email send failed (non-blocking):', err));

      onComplete(reportId);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('분석 시간이 초과되었습니다. 다시 시도해 주세요. (Analysis timed out — please try again)');
      } else {
        setError(err instanceof Error ? err.message : 'Analysis failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, [state, onComplete]);

  // ─── Return ───────────────────────────────────────────────
  return {
    // Current step
    step,
    lang,

    // State
    demographics: state.demographics,
    openResponse: state.open_question_raw,
    smartChips: state.smart_chips,
    chipResponses: state.chip_responses,
    safetySelection: state.safety_selection,
    safetyFlags: state.safety_flags,
    safetyFollowups: state.safety_followups,
    priorApplied: state.prior_applied,
    priorValues: state.prior_values,

    // Loading / Error
    isLoading,
    error,
    clearError: () => setError(null),

    // Handlers
    setDemographics,
    submitDemographics,
    setOpenResponse,
    submitOpen,
    setChipResponse,
    submitChips,
    setSafetySelection,
    setFollowupAnswer,
    submitSafety,
    goBack,
  };
}
