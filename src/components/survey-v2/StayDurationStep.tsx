// ═══════════════════════════════════════════════════════════════
//  StayDurationStep — Foreigners only: How long are you staying?
//  6 options in a 3×2 grid. Values map to days.
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SurveyLang } from '@/types/survey-v2';

// ─── i18n ───────────────────────────────────────────────────

interface DurationOption {
  label: string;
  emoji: string;
  days: number;
}

interface StayI18n {
  title: string;
  subtitle: string;
  options: DurationOption[];
  next: string;
}

const STAY_I18N: Record<SurveyLang, StayI18n> = {
  KO: {
    // KR users should never see this step, but fallback i18n
    title: '한국 체류 기간은?',
    subtitle: '시술 스케줄에 반영됩니다.',
    options: [
      { label: '3~4일', emoji: '✈️', days: 4 },
      { label: '5~6일', emoji: '🗓️', days: 6 },
      { label: '약 1주일', emoji: '📅', days: 7 },
      { label: '10~14일', emoji: '🏨', days: 14 },
      { label: '2주 이상', emoji: '🏠', days: 21 },
      { label: '아직 미정', emoji: '🤔', days: 0 },
    ],
    next: '다음 →',
  },
  EN: {
    title: 'How long will you be in Korea?',
    subtitle: "We'll fit your treatment schedule to your stay.",
    options: [
      { label: '3–4 days', emoji: '✈️', days: 4 },
      { label: '5–6 days', emoji: '🗓️', days: 6 },
      { label: 'About 1 week', emoji: '📅', days: 7 },
      { label: '10–14 days', emoji: '🏨', days: 14 },
      { label: '2+ weeks', emoji: '🏠', days: 21 },
      { label: 'Not sure yet', emoji: '🤔', days: 0 },
    ],
    next: 'Next →',
  },
  JP: {
    title: '韓国滞在期間はどのくらいですか？',
    subtitle: '滞在期間に合わせて施術スケジュールをご提案します。',
    options: [
      { label: '3〜4日', emoji: '✈️', days: 4 },
      { label: '5〜6日', emoji: '🗓️', days: 6 },
      { label: '約1週間', emoji: '📅', days: 7 },
      { label: '10〜14日', emoji: '🏨', days: 14 },
      { label: '2週間以上', emoji: '🏠', days: 21 },
      { label: 'まだ未定', emoji: '🤔', days: 0 },
    ],
    next: '次へ →',
  },
  'ZH-CN': {
    title: '您在韩国停留多长时间？',
    subtitle: '我们会根据您的停留时间安排治疗计划。',
    options: [
      { label: '3-4天', emoji: '✈️', days: 4 },
      { label: '5-6天', emoji: '🗓️', days: 6 },
      { label: '约1周', emoji: '📅', days: 7 },
      { label: '10-14天', emoji: '🏨', days: 14 },
      { label: '2周以上', emoji: '🏠', days: 21 },
      { label: '尚未确定', emoji: '🤔', days: 0 },
    ],
    next: '下一步 →',
  },
};

// ─── Props ────────────────────────────────────────────────────

interface StayDurationStepProps {
  lang: SurveyLang;
  onSubmit: () => void;
  onDurationChange: (days: number) => void;
  isLoading?: boolean;
}

// ─── Component ───────────────────────────────────────────────

export default function StayDurationStep({
  lang,
  onSubmit,
  onDurationChange,
}: StayDurationStepProps) {
  const t = STAY_I18N[lang];
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (days: number) => {
    setSelected(days);
    onDurationChange(days === 0 ? 7 : days); // 0 = "not sure" → default 7
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        {t.title}
      </h2>
      <p className="text-sm text-gray-500 mb-5">{t.subtitle}</p>

      {/* 3×2 Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {t.options.map((opt) => (
          <button
            key={opt.days}
            onClick={() => handleSelect(opt.days)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
              selected === opt.days
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <span className="text-xl mb-1">{opt.emoji}</span>
            <span className="text-sm font-medium text-gray-800">
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={selected === null}
        className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
          selected !== null
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {t.next}
      </button>
    </motion.div>
  );
}
