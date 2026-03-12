// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs Survey v2 — Master Container
//  Based on FRONTEND_UI_COMPONENT_DESIGN_v2.md §3
// ═══════════════════════════════════════════════════════════════

import { AnimatePresence } from 'framer-motion';
import { useSurveyV2 } from '@/hooks/useSurveyV2';
import { SURVEY_V2_I18N } from '@/utils/survey-v2-i18n';
import type { SurveyStep } from '@/types/survey-v2';

import DemographicStep from './DemographicStep';
import OpenQuestionStep from './OpenQuestionStep';
import SmartChipStep from './SmartChipStep';
import SafetyCheckpoint from './SafetyCheckpoint';
import MessengerContactStep from './MessengerContactStep';
import AnalyzingStep from './AnalyzingStep';

// ─── Progress Config ─────────────────────────────────────────
const STEPS: SurveyStep[] = ['demographics', 'open', 'chips', 'safety', 'messenger', 'analyzing'];
const STEP_NUMBERS: Record<SurveyStep, number> = {
  demographics: 1,
  open: 2,
  chips: 3,
  safety: 4,
  messenger: 5,
  analyzing: 6,
};

interface SurveyV2ContainerProps {
  onComplete: (runId: string) => void;
}

export default function SurveyV2Container({ onComplete }: SurveyV2ContainerProps) {
  const {
    step,
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
    setMessengerContact,
    submitMessenger,
    messengerContact,
    goBack,
  } = useSurveyV2({ onComplete });

  const t = SURVEY_V2_I18N[lang];
  const currentStepNum = STEP_NUMBERS[step];
  const totalSteps = STEPS.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* ─── Progress Bar ──────────────────────────── */}
        {step !== 'analyzing' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">
                {t.progress[step]} ({currentStepNum}/{totalSteps})
              </span>
              {priorApplied.length > 0 && step === 'chips' && (
                <span className="text-xs text-green-600 font-medium">
                  ✨ {priorApplied.length} auto-filled
                </span>
              )}
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStepNum / totalSteps) * 100}%` }}
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
            {step === 'demographics' && (
              <DemographicStep
                key="demographics"
                demographics={demographics}
                onChange={setDemographics}
                onNext={submitDemographics}
                lang={lang}
              />
            )}

            {step === 'open' && (
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

            {step === 'chips' && (
              <SmartChipStep
                key="chips"
                chips={smartChips}
                responses={chipResponses}
                onRespond={setChipResponse}
                onSubmit={submitChips}
                lang={lang}
                onBack={goBack}
              />
            )}

            {step === 'safety' && (
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

            {step === 'messenger' && (
              <MessengerContactStep
                key="messenger"
                lang={lang}
                country={demographics.detected_country}
                onSubmit={submitMessenger}
                onChange={setMessengerContact}
                isLoading={isLoading}
              />
            )}

            {step === 'analyzing' && (
              <AnalyzingStep
                key="analyzing"
                lang={lang}
                isLoading={isLoading}
                error={error}
                onRetry={() => {
                  // Re-trigger analysis by going back to safety then forward
                  // The hook's submitSafety will restart the flow
                  submitSafety();
                }}
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
