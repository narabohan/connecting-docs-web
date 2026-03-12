import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SmartChip, SurveyLang } from '@/types/survey-v2';
import { SURVEY_V2_I18N } from '@/utils/survey-v2-i18n';

interface SmartChipStepProps {
  chips: SmartChip[];
  responses: Record<string, string>;
  onRespond: (chipType: string, value: string) => void;
  onSubmit: () => void;
  lang: SurveyLang;
  onBack: () => void;
}

export default function SmartChipStep({
  chips,
  responses,
  onRespond,
  onSubmit,
  lang,
  onBack,
}: SmartChipStepProps) {
  const t = SURVEY_V2_I18N[lang].step3;
  const tc = SURVEY_V2_I18N[lang].common;

  // All chips must have a response
  const allAnswered = chips.every(c => responses[c.type]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5 px-1"
    >
      {/* Back */}
      <button
        onClick={onBack}
        className="self-start flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {tc.back}
      </button>

      {/* Title */}
      <div className="text-center mb-1">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
        </div>
        <p className="text-sm text-gray-500">{t.subtitle}</p>
      </div>

      {/* Chip Cards */}
      <div className="flex flex-col gap-4">
        {chips.map((chip, idx) => (
          <motion.div
            key={chip.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <p className="text-sm font-semibold text-gray-800 mb-3">{chip.question}</p>
            <div className="flex flex-wrap gap-2">
              {chip.options.map(opt => {
                const selected = responses[chip.type] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onRespond(chip.type, opt.value)}
                    className={cn(
                      'px-4 py-3 rounded-lg text-sm font-medium transition-all',
                      'min-h-[44px]',
                      selected
                        ? 'bg-blue-600 text-white shadow-sm scale-[1.02]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Next */}
      <button
        onClick={onSubmit}
        disabled={!allAnswered}
        className={cn(
          'w-full py-3.5 rounded-xl text-base font-semibold transition-all min-h-[48px] mt-2',
          allAnswered
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        )}
      >
        {tc.next}
      </button>
    </motion.div>
  );
}
