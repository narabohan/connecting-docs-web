// ═══════════════════════════════════════════════════════════════
//  ManagementFrequencyStep — KR only: How often do you want care?
//  3 options: monthly / quarterly / once
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SurveyLang, ManagementFrequency } from '@/types/survey-v2';

// ─── i18n ───────────────────────────────────────────────────

interface FreqOption {
  value: ManagementFrequency;
  label: string;
  desc: string;
  emoji: string;
}

interface FreqI18n {
  title: string;
  subtitle: string;
  options: FreqOption[];
  next: string;
}

// KR-only step — only Korean i18n is primary, others are fallback
const FREQ_I18N: Record<SurveyLang, FreqI18n> = {
  KO: {
    title: '어떤 주기로 관리받고 싶으세요?',
    subtitle: '추천 플랜의 기간과 시술 간격에 반영됩니다.',
    options: [
      {
        value: 'monthly',
        label: '정기 관리 (매월)',
        desc: '꾸준한 유지 + 점진적 개선',
        emoji: '🔄',
      },
      {
        value: 'quarterly',
        label: '분기 관리 (3개월)',
        desc: '핵심 시술 위주 집중 케어',
        emoji: '📋',
      },
      {
        value: 'once',
        label: '1회 방문',
        desc: '한 번에 최대 효과',
        emoji: '⚡',
      },
    ],
    next: '다음 →',
  },
  EN: {
    title: 'How often would you like treatment?',
    subtitle: 'This shapes your plan duration and treatment intervals.',
    options: [
      {
        value: 'monthly',
        label: 'Monthly care',
        desc: 'Steady maintenance + gradual improvement',
        emoji: '🔄',
      },
      {
        value: 'quarterly',
        label: 'Quarterly (every 3 months)',
        desc: 'Focused sessions on key treatments',
        emoji: '📋',
      },
      {
        value: 'once',
        label: 'One-time visit',
        desc: 'Maximum impact in a single session',
        emoji: '⚡',
      },
    ],
    next: 'Next →',
  },
  JP: {
    title: 'どのくらいの頻度で施術を受けたいですか？',
    subtitle: 'プランの期間と施術間隔に反映されます。',
    options: [
      {
        value: 'monthly',
        label: '毎月の定期ケア',
        desc: '継続的なメンテナンス＋段階的改善',
        emoji: '🔄',
      },
      {
        value: 'quarterly',
        label: '3ヶ月ごと',
        desc: '重点施術に集中',
        emoji: '📋',
      },
      {
        value: 'once',
        label: '1回の来院',
        desc: '1回で最大効果',
        emoji: '⚡',
      },
    ],
    next: '次へ →',
  },
  'ZH-CN': {
    title: '您希望多久接受一次治疗？',
    subtitle: '这将影响您的治疗计划周期和间隔。',
    options: [
      {
        value: 'monthly',
        label: '每月定期管理',
        desc: '持续维护 + 逐步改善',
        emoji: '🔄',
      },
      {
        value: 'quarterly',
        label: '每季度（3个月）',
        desc: '集中进行核心治疗',
        emoji: '📋',
      },
      {
        value: 'once',
        label: '一次性治疗',
        desc: '一次获得最大效果',
        emoji: '⚡',
      },
    ],
    next: '下一步 →',
  },
};

// ─── Props ────────────────────────────────────────────────────

interface ManagementFrequencyStepProps {
  lang: SurveyLang;
  onSubmit: () => void;
  onFrequencyChange: (freq: ManagementFrequency) => void;
  isLoading?: boolean;
}

// ─── Component ───────────────────────────────────────────────

export default function ManagementFrequencyStep({
  lang,
  onSubmit,
  onFrequencyChange,
}: ManagementFrequencyStepProps) {
  const t = FREQ_I18N[lang];
  const [selected, setSelected] = useState<ManagementFrequency | null>(null);

  const handleSelect = (freq: ManagementFrequency) => {
    setSelected(freq);
    onFrequencyChange(freq);
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

      {/* Options */}
      <div className="space-y-2.5 mb-6">
        {t.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
              selected === opt.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{opt.emoji}</span>
              <div>
                <div className="font-medium text-gray-900 text-sm">
                  {opt.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {opt.desc}
                </div>
              </div>
            </div>
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
