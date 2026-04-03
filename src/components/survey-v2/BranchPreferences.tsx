// ═══════════════════════════════════════════════════════════════
//  BranchPreferences — Phase 3-B (S-2e)
//  꼬리질문: 시술 선호도 (통증, 다운타임, 예산/세그먼트)
//  참조: SURVEY_CLINICAL_SPEC.md §8 PREFERENCES
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { SurveyLang } from '@/types/survey-v2';
import type { PreferencesBranch } from '@/hooks/useSurveyStateMachine';
import { SURVEY_V2_I18N } from '@/utils/survey-v2-i18n';

interface BranchPreferencesProps {
  lang: SurveyLang;
  stayDays?: number;
  initialData?: PreferencesBranch | null;
  onComplete: (data: PreferencesBranch) => void;
  onBack: () => void;
}

type PainLevel = PreferencesBranch['pain_tolerance'];
type DowntimeOption = PreferencesBranch['downtime_preference'];
type BudgetOption = PreferencesBranch['budget_segment'];

const PAIN_LEVELS: PainLevel[] = [1, 2, 3, 4, 5];

const DOWNTIME_OPTIONS: { value: DowntimeOption; key: 'downtime_0' | 'downtime_1_3' | 'downtime_3_7' | 'downtime_7plus' }[] = [
  { value: '0', key: 'downtime_0' },
  { value: '1-3', key: 'downtime_1_3' },
  { value: '3-7', key: 'downtime_3_7' },
  { value: '7+', key: 'downtime_7plus' },
];

const BUDGET_OPTIONS: { value: BudgetOption; key: 'budget_value' | 'budget_mid' | 'budget_premium' }[] = [
  { value: 'budget', key: 'budget_value' },
  { value: 'mid', key: 'budget_mid' },
  { value: 'premium', key: 'budget_premium' },
];

export default function BranchPreferences({ lang, stayDays, initialData, onComplete, onBack }: BranchPreferencesProps) {
  const t = SURVEY_V2_I18N[lang].branch_preferences;
  const tc = SURVEY_V2_I18N[lang].common;

  // ─── Downtime disable logic based on stay duration ──────────
  const isDowntimeDisabled = (value: DowntimeOption): boolean => {
    if (stayDays == null) return false;
    if (stayDays >= 1 && stayDays <= 3) return value === '3-7' || value === '7+';
    if (stayDays >= 4 && stayDays <= 7) return value === '7+';
    return false;
  };

  const [painTolerance, setPainTolerance] = useState<PainLevel>(initialData?.pain_tolerance ?? 3);
  const [downtime, setDowntime] = useState<DowntimeOption>(initialData?.downtime_preference ?? '1-3');
  const [budget, setBudget] = useState<BudgetOption>(initialData?.budget_segment ?? 'mid');

  // Reset downtime if current selection becomes disabled by stayDays change
  useEffect(() => {
    if (isDowntimeDisabled(downtime)) {
      setDowntime('0');
    }
  }, [stayDays]); // eslint-disable-line react-hooks/exhaustive-deps

  const isComplete = true; // All fields have defaults

  const handleSubmit = () => {
    onComplete({
      pain_tolerance: painTolerance,
      downtime_preference: downtime,
      budget_segment: budget,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
        <p className="text-sm text-gray-500 mt-2">{t.subtitle}</p>
      </div>

      {/* Pain Tolerance (5-level) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">{t.pain_label}</label>
        <div className="grid grid-cols-1 gap-2">
          {PAIN_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setPainTolerance(level)}
              className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                painTolerance === level
                  ? 'bg-blue-50 border-blue-500 text-blue-600 border'
                  : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2 text-xs text-gray-400">{level}</span>
              {t[`pain_${level}` as keyof typeof t]}
            </button>
          ))}
        </div>
      </div>

      {/* Downtime Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">{t.downtime_label}</label>
        <div className="grid grid-cols-2 gap-2">
          {DOWNTIME_OPTIONS.map((opt) => {
            const disabled = isDowntimeDisabled(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => !disabled && setDowntime(opt.value)}
                disabled={disabled}
                title={disabled ? t.downtime_disabled_tooltip : undefined}
                className={`px-4 py-3 rounded-xl text-center text-sm font-medium transition-all ${
                  disabled
                    ? 'bg-gray-100 border border-gray-200 text-gray-400 opacity-40 cursor-not-allowed'
                    : downtime === opt.value
                      ? 'bg-blue-50 border-blue-500 text-blue-600 border'
                      : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t[opt.key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget Segment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">{t.budget_label}</label>
        <div className="grid grid-cols-3 gap-2">
          {BUDGET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBudget(opt.value)}
              className={`px-4 py-3 rounded-xl text-center text-sm font-medium transition-all ${
                budget === opt.value
                  ? opt.value === 'budget' ? 'bg-green-50 border-green-500 text-green-700 border'
                  : opt.value === 'premium' ? 'bg-purple-50 border-purple-500 text-purple-700 border'
                  : 'bg-blue-50 border-blue-500 text-blue-600 border'
                  : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t[opt.key]}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-medium hover:bg-gray-200 transition-all"
        >
          {tc.back}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
            isComplete
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {tc.next}
        </button>
      </div>
    </motion.div>
  );
}
