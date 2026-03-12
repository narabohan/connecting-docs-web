import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SurveyLang } from '@/types/survey-v2';
import { SURVEY_V2_I18N } from '@/utils/survey-v2-i18n';

// ─── Country-based question text (MIRROR_CONFIDENCE_PROMPT §5.1) ──
// TW and CN are separate countries sharing ZH-CN lang but need distinct questions.
const COUNTRY_QUESTION_OVERRIDES: Record<string, {
  title: string;
  subtitle: string;
  placeholder: string;
}> = {
  KR: {
    title: '피부 때문에 가장 신경 쓰이는 순간은 언제인가요?',
    subtitle: '거울 볼 때, 사진 찍을 때, 화장할 때 — 어떤 순간이 가장 불편하세요?',
    placeholder: '자유롭게 피부 고민을 적어주세요...',
  },
  US: {
    title: 'When does your skin bother you the most?',
    subtitle: 'Looking in the mirror, taking photos, before a big event — what moment frustrates you?',
    placeholder: 'Describe your skin concerns freely...',
  },
  JP: {
    title: 'お肌のことで一番気になる瞬間はいつですか？',
    subtitle: '鏡を見るとき、写真を撮るとき、人に会うとき — どんなときが一番気になりますか？',
    placeholder: 'お肌のお悩みを自由にお書きください...',
  },
  TW: {
    title: '皮膚最讓您在意的時刻是什麼？',
    subtitle: '例如照鏡子的時候、拍照的時候、見朋友的時候 — 什麼時候最困擾？',
    placeholder: '自由填寫您的皮膚煩惱...',
  },
  CN: {
    title: '皮肤最让您在意的时刻是什么？',
    subtitle: '比如照镜子的时候、拍照的时候、见朋友的时候 — 什么时候最困扰？',
    placeholder: '自由填写您的皮肤烦恼...',
  },
};

interface OpenQuestionStepProps {
  lang: SurveyLang;
  country?: string;  // detected_country for TW/CN branching (§5.1)
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onBack: () => void;
}

const MIN_CHARS = 5;

export default function OpenQuestionStep({
  lang,
  country,
  value,
  onChange,
  onSubmit,
  isLoading,
  onBack,
}: OpenQuestionStepProps) {
  // Country-based override for TW/CN; otherwise fall back to lang-based i18n
  const countryOverride = country ? COUNTRY_QUESTION_OVERRIDES[country] : undefined;
  const t = useMemo(() => {
    const base = SURVEY_V2_I18N[lang].step2;
    if (countryOverride) {
      return { ...base, ...countryOverride };
    }
    return base;
  }, [lang, countryOverride]);
  const tc = SURVEY_V2_I18N[lang].common;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(120, el.scrollHeight)}px`;
  }, [value]);

  // Autofocus
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const canSubmit = value.trim().length >= MIN_CHARS && !isLoading;

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
        disabled={isLoading}
        className="self-start flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {tc.back}
      </button>

      {/* Title */}
      <div className="text-center">
        <div className="text-3xl mb-3">💬</div>
        <h2 className="text-xl font-bold text-gray-900 whitespace-pre-line leading-snug">{t.title}</h2>
        <p className="text-sm text-gray-500 mt-2">{t.subtitle}</p>
      </div>

      {/* Textarea */}
      <div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={t.placeholder}
          disabled={isLoading}
          className={cn(
            'w-full min-h-[120px] max-h-[300px] p-4 rounded-xl border-2 text-base',
            'resize-none transition-all focus:outline-none',
            'placeholder:text-gray-400',
            isLoading
              ? 'border-gray-200 bg-gray-50 text-gray-400'
              : 'border-gray-200 focus:border-blue-400 bg-white text-gray-900'
          )}
          rows={4}
        />
        {/* Hint */}
        <p className="text-xs text-gray-400 mt-2 italic">{t.hint}</p>
        {/* Character indicator */}
        {value.length > 0 && value.trim().length < MIN_CHARS && (
          <p className="text-xs text-amber-500 mt-1">{t.min_chars}</p>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={cn(
          'w-full py-3.5 rounded-xl text-base font-semibold transition-all min-h-[48px]',
          'flex items-center justify-center gap-2',
          canSubmit
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {tc.loading}
          </>
        ) : (
          <>{tc.analyze}</>
        )}
      </button>
    </motion.div>
  );
}
