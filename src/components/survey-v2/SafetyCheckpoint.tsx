import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SurveyLang, SafetySelection, SafetyFollowUp, SafetyFlag } from '@/types/survey-v2';
import { SURVEY_V2_I18N } from '@/utils/survey-v2-i18n';

// ─── Safety Flag Mapping (Frontend) ─────────────────────────
const MEDICATION_FLAG_MAP: Record<string, SafetyFlag | null> = {
  none: null,
  isotretinoin: 'SAFETY_ISOTRETINOIN',
  anticoagulant: 'SAFETY_ANTICOAGULANT',
  antibiotic: 'SAFETY_PHOTOSENSITIVITY',
  hormonal: null,  // HORMONAL flag는 멜라즈마 교차 시에만
  retinoid_topical: 'RETINOID_PAUSE',
};

const CONDITION_FLAG_MAP: Record<string, SafetyFlag | null> = {
  none: null,
  pregnancy: 'SAFETY_PREGNANCY',
  keloid: 'SAFETY_KELOID',
  adverse_history: 'SAFETY_ADVERSE_HISTORY',
};

// Items that show red border
const DANGER_ITEMS = new Set(['isotretinoin', 'anticoagulant', 'pregnancy']);

// Items that need follow-up questions
const FOLLOWUP_ITEMS = new Set(['isotretinoin', 'anticoagulant', 'adverse_history']);

interface SafetyCheckpointProps {
  lang: SurveyLang;
  selection: SafetySelection;
  onChange: (s: SafetySelection) => void;
  followups: SafetyFollowUp[];
  onFollowupAnswer: (flag: SafetyFlag, answer: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function SafetyCheckpoint({
  lang,
  selection,
  onChange,
  followups,
  onFollowupAnswer,
  onSubmit,
  isLoading,
}: SafetyCheckpointProps) {
  const t = SURVEY_V2_I18N[lang].step4;
  const tc = SURVEY_V2_I18N[lang].common;

  // "해당 없음" toggle logic
  const toggleMedication = useCallback((item: string) => {
    const current = selection.medications;
    if (item === 'none') {
      onChange({ ...selection, medications: current.includes('none') ? [] : ['none'] });
    } else {
      const without = current.filter(m => m !== 'none' && m !== item);
      if (current.includes(item)) {
        onChange({ ...selection, medications: without.length ? without : [] });
      } else {
        onChange({ ...selection, medications: [...without, item] });
      }
    }
  }, [selection, onChange]);

  const toggleCondition = useCallback((item: string) => {
    const current = selection.conditions;
    if (item === 'none') {
      onChange({ ...selection, conditions: current.includes('none') ? [] : ['none'] });
    } else {
      const without = current.filter(c => c !== 'none' && c !== item);
      if (current.includes(item)) {
        onChange({ ...selection, conditions: without.length ? without : [] });
      } else {
        onChange({ ...selection, conditions: [...without, item] });
      }
    }
  }, [selection, onChange]);

  // Validation: both groups need at least 1 selection (can be "none")
  const medsValid = selection.medications.length > 0;
  const condsValid = selection.conditions.length > 0;
  const followupsComplete = followups.every(f => f.answer);
  const canSubmit = medsValid && condsValid && followupsComplete && !isLoading;

  const MEDICATION_OPTIONS: { id: string; key: keyof typeof t }[] = [
    { id: 'none', key: 'none' },
    { id: 'isotretinoin', key: 'med_isotretinoin' },
    { id: 'anticoagulant', key: 'med_anticoagulant' },
    { id: 'antibiotic', key: 'med_antibiotic' },
    { id: 'hormonal', key: 'med_hormonal' },
    { id: 'retinoid_topical', key: 'med_retinoid' },
  ];

  const CONDITION_OPTIONS: { id: string; key: keyof typeof t }[] = [
    { id: 'none', key: 'none' },
    { id: 'pregnancy', key: 'cond_pregnancy' },
    { id: 'keloid', key: 'cond_keloid' },
    { id: 'adverse_history', key: 'cond_adverse' },
  ];

  // Find isotretinoin followup if active
  const isoFollowup = followups.find(f => f.flag === 'SAFETY_ISOTRETINOIN');

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5 px-1"
    >
      {/* Title */}
      <div className="text-center mb-1">
        <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-gray-900 whitespace-pre-line">{t.title}</h2>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      {/* Medications Group */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{t.medications_label}</h3>
        <p className="text-xs text-gray-400 mb-3">{t.select_all_hint}</p>
        <div className="flex flex-col gap-2">
          {MEDICATION_OPTIONS.map(opt => {
            const checked = selection.medications.includes(opt.id);
            const isDanger = DANGER_ITEMS.has(opt.id) && checked;

            return (
              <div key={opt.id}>
                <button
                  onClick={() => toggleMedication(opt.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-all',
                    'min-h-[44px]',
                    isDanger && 'bg-red-50 border-2 border-red-300',
                    !isDanger && checked && 'bg-blue-50 border-2 border-blue-300',
                    !checked && 'bg-gray-50 border-2 border-transparent hover:bg-gray-100',
                    opt.id === 'none' && 'border-b-2 border-b-gray-200 mb-1'
                  )}
                >
                  <span className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                    checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                  )}>
                    {checked && <span className="text-xs">✓</span>}
                  </span>
                  <span className={cn(isDanger && 'text-red-700 font-medium', !isDanger && 'text-gray-700')}>
                    {isDanger && <AlertTriangle className="w-4 h-4 inline mr-1 text-red-500" />}
                    {t[opt.key] as string}
                  </span>
                </button>

                {/* Isotretinoin inline follow-up */}
                <AnimatePresence>
                  {opt.id === 'isotretinoin' && checked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 ml-8 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-800 mb-2">{t.followup_title}</p>
                        <p className="text-xs text-amber-700 mb-3">{t.isotretinoin_q}</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: t.isotretinoin_active, value: 'active' },
                            { label: t.isotretinoin_recent, value: 'recent_under_6mo' },
                            { label: t.isotretinoin_cleared, value: 'cleared_over_6mo' },
                          ].map(fopt => (
                            <button
                              key={fopt.value}
                              onClick={() => onFollowupAnswer('SAFETY_ISOTRETINOIN', fopt.value)}
                              className={cn(
                                'px-3 py-2 rounded-md text-xs font-medium transition-all min-h-[36px]',
                                isoFollowup?.answer === fopt.value
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-100'
                              )}
                            >
                              {fopt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conditions Group */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{t.conditions_label}</h3>
        <p className="text-xs text-gray-400 mb-3">{t.select_all_hint}</p>
        <div className="flex flex-col gap-2">
          {CONDITION_OPTIONS.map(opt => {
            const checked = selection.conditions.includes(opt.id);
            const isDanger = DANGER_ITEMS.has(opt.id) && checked;

            return (
              <button
                key={opt.id}
                onClick={() => toggleCondition(opt.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-all',
                  'min-h-[44px]',
                  isDanger && 'bg-red-50 border-2 border-red-300',
                  !isDanger && checked && 'bg-blue-50 border-2 border-blue-300',
                  !checked && 'bg-gray-50 border-2 border-transparent hover:bg-gray-100',
                  opt.id === 'none' && 'border-b-2 border-b-gray-200 mb-1'
                )}
              >
                <span className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                  checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                )}>
                  {checked && <span className="text-xs">✓</span>}
                </span>
                <span className={cn(isDanger && 'text-red-700 font-medium', !isDanger && 'text-gray-700')}>
                  {isDanger && <AlertTriangle className="w-4 h-4 inline mr-1 text-red-500" />}
                  {t[opt.key] as string}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={cn(
          'w-full py-3.5 rounded-xl text-base font-semibold transition-all min-h-[48px] mt-2',
          'flex items-center justify-center gap-2',
          canSubmit
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> {tc.loading}</>
        ) : (
          <>{tc.submit} →</>
        )}
      </button>
    </motion.div>
  );
}

// Export for use in useSurveyV2 hook
export { MEDICATION_FLAG_MAP, CONDITION_FLAG_MAP, FOLLOWUP_ITEMS };
