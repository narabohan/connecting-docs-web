// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs Survey v2 — Master Container
//  Based on FRONTEND_UI_COMPONENT_DESIGN_v2.md §3
//  Phase 2: Dynamic step flow (budget → stay_duration / management_frequency)
//  Phase 3-B: FSM-driven branching (skin profile → past history → visit plan → adverse)
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSurveyV2 } from '@/hooks/useSurveyV2';
import { useSurveyStateMachine } from '@/hooks/useSurveyStateMachine';
import type { SurveyNode, SurveySignals, BranchResponses } from '@/hooks/useSurveyStateMachine';
import { SURVEY_V2_I18N } from '@/utils/survey-v2-i18n';

import DemographicStep from './DemographicStep';
import OpenQuestionStep from './OpenQuestionStep';
import SmartChipStep from './SmartChipStep';
import SafetyCheckpoint from './SafetyCheckpoint';
import BudgetStep from './BudgetStep';
import StayDurationStep from './StayDurationStep';
import ManagementFrequencyStep from './ManagementFrequencyStep';
import MessengerContactStep from './MessengerContactStep';
import AnalyzingStep from './AnalyzingStep';
import ThankYouStep from './ThankYouStep';

// Phase 3-B: Branch question components
import BranchSkinProfile from './BranchSkinProfile';
import BranchPastHistory from './BranchPastHistory';
import BranchVisitPlan from './BranchVisitPlan';
import BranchAdverse from './BranchAdverse';
import BranchPreferences from './BranchPreferences';

interface SurveyV2ContainerProps {
  onComplete: (runId: string) => void;
}

const BRANCH_NODE_SET = new Set<SurveyNode>([
  'BRANCH_SKIN_PROFILE',
  'BRANCH_PAST_HISTORY',
  'BRANCH_VISIT_PLAN',
  'BRANCH_ADVERSE',
  'PREFERENCES',
]);

export default function SurveyV2Container({ onComplete }: SurveyV2ContainerProps) {
  const {
    step,
    steps,
    lang,
    demographics,
    openResponse,
    smartChips,
    chipResponses,
    safetySelection,
    safetyFlags,
    safetyFollowups,
    priorApplied,
    isLoading,
    error,
    clearError,
    setDemographics,
    submitDemographics,
    setOpenResponse,
    submitOpen,
    setChipResponse,
    submitChips,
    setSafetySelection,
    setFollowupAnswer,
    submitSafety,
    // Phase 2
    setBudget,
    setEventInfo,
    submitBudget,
    stayDuration,
    setStayDuration,
    submitStayDuration,
    setManagementFrequency,
    submitManagementFrequency,
    // Messenger
    setMessengerContact,
    submitMessenger,
    messengerContact,
    goBack,
    // Phase 3-B FSM integration
    haikuAnalysis,
    mapChipResponses,
    navigateTo,
  } = useSurveyV2({ onComplete });

  // ─── FSM Hook (Phase 3-B) ──────────────────────────────────
  // Initialize at SMART_CHIPS — FSM is only used for branch routing
  // between chips and safety.
  const fsm = useSurveyStateMachine('SMART_CHIPS');
  const [fsmBranchActive, setFsmBranchActive] = useState(false);

  const t = SURVEY_V2_I18N[lang];

  // ─── FSM Signal Builder ──────────────────────────────────────
  const buildSignals = useCallback(
    (branchOverride?: Partial<BranchResponses>): SurveySignals => ({
      demographics,
      haiku_analysis: haikuAnalysis,
      chip_responses: chipResponses,
      branch_responses: branchOverride
        ? { ...fsm.branchResponses, ...branchOverride }
        : fsm.branchResponses,
    }),
    [demographics, haikuAnalysis, chipResponses, fsm.branchResponses]
  );

  // ─── FSM-aware Chips Submit ──────────────────────────────────
  // Instead of going straight to safety, let FSM decide if branches needed
  const handleSubmitChips = useCallback(() => {
    mapChipResponses();

    // Reset FSM to SMART_CHIPS for a clean branch traversal
    fsm.reset();
    const signals = buildSignals();
    const nextNode = fsm.advance(signals);

    if (BRANCH_NODE_SET.has(nextNode)) {
      setFsmBranchActive(true);
    } else {
      // No branches — go straight to safety (existing flow)
      navigateTo('safety');
    }
  }, [mapChipResponses, fsm, buildSignals, navigateTo]);

  // ─── Branch Complete Handler ─────────────────────────────────
  const handleBranchComplete = useCallback(
    (branchKey: keyof BranchResponses, data: BranchResponses[keyof BranchResponses]) => {
      fsm.setBranchResponse(branchKey, data);

      // Build signals with just-set branch data (setBranchResponse is async)
      const signals = buildSignals({ [branchKey]: data });
      const nextNode = fsm.advance(signals);

      if (!BRANCH_NODE_SET.has(nextNode)) {
        // All branches done — resume main flow at safety
        setFsmBranchActive(false);
        navigateTo('safety');
      }
      // Otherwise stays in branch mode; component re-renders with new fsm.currentNode
    },
    [fsm, buildSignals, navigateTo]
  );

  // ─── Branch Back Handler ─────────────────────────────────────
  const handleBranchBack = useCallback(() => {
    if (fsm.history.length <= 2) {
      // Going back to SMART_CHIPS — exit FSM mode
      fsm.goBack();
      setFsmBranchActive(false);
    } else {
      fsm.goBack();
    }
  }, [fsm]);

  // ─── Progress Calculation ────────────────────────────────────
  const currentStepIdx = steps.indexOf(step);
  const currentStepNum = currentStepIdx >= 0 ? currentStepIdx + 1 : 1;
  const totalSteps = steps.length;

  // When FSM branches are active, use FSM progress
  const progressPercent = fsmBranchActive
    ? fsm.progress
    : (currentStepNum / totalSteps) * 100;

  // Progress label
  const progressLabel = fsmBranchActive
    ? `${t.common.branch_step ?? 'Detail'} (${Math.round(fsm.progress)}%)`
    : `${t.progress[step]} (${currentStepNum}/${totalSteps})`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* ─── Progress Bar ──────────────────────────── */}
        {step !== 'analyzing' && step !== 'complete' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">
                {progressLabel}
              </span>
              {!fsmBranchActive && priorApplied.length > 0 && step === 'chips' && (
                <span className="text-xs text-green-600 font-medium">
                  ✨ {priorApplied.length} auto-filled
                </span>
              )}
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* ─── Error Banner ──────────────────────────── */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="text-xs text-red-600 underline mt-1"
            >
              {t.common.error_generic}
            </button>
          </div>
        )}

        {/* ─── Step Content ──────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* ═══ FSM Branch Nodes (Phase 3-B) ════════════ */}
            {fsmBranchActive && fsm.currentNode === 'BRANCH_SKIN_PROFILE' && (
              <BranchSkinProfile
                key="branch_skin_profile"
                lang={lang}
                initialData={fsm.branchResponses.skin_profile}
                onComplete={(data) => handleBranchComplete('skin_profile', data)}
                onBack={handleBranchBack}
              />
            )}

            {fsmBranchActive && fsm.currentNode === 'BRANCH_PAST_HISTORY' && (
              <BranchPastHistory
                key="branch_past_history"
                lang={lang}
                initialData={fsm.branchResponses.past_history}
                onComplete={(data) => handleBranchComplete('past_history', data)}
                onBack={handleBranchBack}
              />
            )}

            {fsmBranchActive && fsm.currentNode === 'BRANCH_VISIT_PLAN' && (
              <BranchVisitPlan
                key="branch_visit_plan"
                lang={lang}
                initialData={fsm.branchResponses.visit_plan}
                onComplete={(data) => handleBranchComplete('visit_plan', data)}
                onBack={handleBranchBack}
              />
            )}

            {fsmBranchActive && fsm.currentNode === 'BRANCH_ADVERSE' && (
              <BranchAdverse
                key="branch_adverse"
                lang={lang}
                initialData={fsm.branchResponses.adverse}
                onComplete={(data) => handleBranchComplete('adverse', data)}
                onBack={handleBranchBack}
              />
            )}

            {fsmBranchActive && fsm.currentNode === 'PREFERENCES' && (
              <BranchPreferences
                key="preferences"
                lang={lang}
                stayDays={stayDuration ?? undefined}
                initialData={fsm.branchResponses.preferences}
                onComplete={(data) => handleBranchComplete('preferences', data)}
                onBack={handleBranchBack}
              />
            )}

            {/* ═══ Main Flow Steps ═════════════════════════ */}
            {!fsmBranchActive && step === 'demographics' && (
              <DemographicStep
                key="demographics"
                demographics={demographics}
                onChange={setDemographics}
                onNext={submitDemographics}
                lang={lang}
              />
            )}

            {!fsmBranchActive && step === 'open' && (
              <OpenQuestionStep
                key="open"
                lang={lang}
                country={demographics.detected_country}
                value={openResponse}
                onChange={setOpenResponse}
                onSubmit={submitOpen}
                isLoading={isLoading}
                onBack={goBack}
              />
            )}

            {!fsmBranchActive && step === 'chips' && (
              <SmartChipStep
                key="chips"
                chips={smartChips}
                responses={chipResponses}
                onRespond={setChipResponse}
                onSubmit={handleSubmitChips}
                lang={lang}
                onBack={goBack}
              />
            )}

            {!fsmBranchActive && step === 'safety' && (
              <SafetyCheckpoint
                key="safety"
                lang={lang}
                selection={safetySelection}
                onChange={setSafetySelection}
                followups={safetyFollowups}
                onFollowupAnswer={setFollowupAnswer}
                onSubmit={submitSafety}
                isLoading={isLoading}
              />
            )}

            {!fsmBranchActive && step === 'budget' && (
              <BudgetStep
                key="budget"
                lang={lang}
                country={demographics.detected_country}
                onSubmit={submitBudget}
                onBudgetChange={setBudget}
                onEventChange={setEventInfo}
                isLoading={isLoading}
              />
            )}

            {!fsmBranchActive && step === 'stay_duration' && (
              <StayDurationStep
                key="stay_duration"
                lang={lang}
                onSubmit={submitStayDuration}
                onDurationChange={setStayDuration}
                isLoading={isLoading}
              />
            )}

            {!fsmBranchActive && step === 'management_frequency' && (
              <ManagementFrequencyStep
                key="management_frequency"
                lang={lang}
                onSubmit={submitManagementFrequency}
                onFrequencyChange={setManagementFrequency}
                isLoading={isLoading}
              />
            )}

            {!fsmBranchActive && step === 'messenger' && (
              <MessengerContactStep
                key="messenger"
                lang={lang}
                country={demographics.detected_country}
                onSubmit={submitMessenger}
                onChange={setMessengerContact}
                isLoading={isLoading}
              />
            )}

            {!fsmBranchActive && step === 'analyzing' && (
              <AnalyzingStep
                key="analyzing"
                lang={lang}
                isLoading={isLoading}
                error={error}
                onRetry={submitMessenger}
              />
            )}

            {!fsmBranchActive && step === 'complete' && (
              <ThankYouStep
                key="complete"
                lang={lang}
                messengerContact={messengerContact}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ─── Footer ────────────────────────────────── */}
        <p className="text-center text-xs text-gray-400 mt-6">
          ConnectingDocs © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
