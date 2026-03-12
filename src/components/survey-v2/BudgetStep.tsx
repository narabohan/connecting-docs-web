// ═══════════════════════════════════════════════════════════════
//  BudgetStep — Collect budget range + optional event info
//  KR: monthly budget (4 options) + per-session toggle
//  Foreign: per-visit budget (4 options)
//  Bottom: optional event toggle with type + date
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import type {
  SurveyLang,
  BudgetRange,
  BudgetType,
  BudgetSelection,
  EventInfo,
  EventType,
} from '@/types/survey-v2';

// ─── i18n ───────────────────────────────────────────────────

interface BudgetOption {
  label: string;
  desc: string;
}

interface BudgetI18n {
  title: string;
  subtitle: string;
  options: Record<BudgetRange, BudgetOption>;
  per_session_toggle?: string;
  per_session_options?: Record<string, string>;
  event_toggle: string;
  event_types: Record<EventType, string>;
  event_date_label: string;
  event_hint: string;
  next: string;
}

const BUDGET_I18N: Record<SurveyLang, BudgetI18n> = {
  KO: {
    title: '나에게 맞는 피부 관리 투자 범위는?',
    subtitle: '정확한 금액이 아니어도 괜찮아요. 대략적인 범위를 알려주세요.',
    options: {
      light: { label: '월 30만원 이하', desc: '가벼운 정기 관리' },
      standard: { label: '월 30~70만원', desc: '정기 관리 + 집중 시술' },
      premium: { label: '월 70~150만원', desc: '프리미엄 맞춤 관리' },
      vip: { label: '월 150만원 이상', desc: 'VIP 종합 관리' },
    },
    per_session_toggle: '1회 시술 기준으로 알려주세요',
    per_session_options: {
      light: '₩10만원 이하',
      standard: '₩10~30만원',
      premium: '₩30~70만원',
      vip: '₩70~150만원',
    },
    event_toggle: '특별한 일정이 있으신가요?',
    event_types: {
      wedding: '\uD83D\uDC8D 결혼',
      interview: '\uD83D\uDCBC 면접',
      photoshoot: '\uD83D\uDCF8 촬영',
      reunion: '\uD83C\uDF89 행사/모임',
      other: '\uD83D\uDCCC 기타',
    },
    event_date_label: '일정',
    event_hint: '일정에 맞춰 시술 타이밍을 조절해 드립니다',
    next: '다음',
  },
  EN: {
    title: "What's your budget for this visit?",
    subtitle: 'An approximate range is fine — this helps us tailor your plan.',
    options: {
      light: { label: 'Under $500', desc: 'Light care — booster + essentials' },
      standard: { label: '$500 ~ $1,500', desc: 'Standard package — 2-3 procedures' },
      premium: { label: '$1,500 ~ $3,000', desc: 'Premium — full treatment plan' },
      vip: { label: '$3,000+', desc: 'VIP comprehensive care' },
    },
    event_toggle: 'Do you have a special occasion coming up?',
    event_types: {
      wedding: '\uD83D\uDC8D Wedding',
      interview: '\uD83D\uDCBC Interview',
      photoshoot: '\uD83D\uDCF8 Photoshoot',
      reunion: '\uD83C\uDF89 Event/Reunion',
      other: '\uD83D\uDCCC Other',
    },
    event_date_label: 'Date',
    event_hint: "We'll time your treatments to look your best on the day",
    next: 'Next',
  },
  JP: {
    title: 'ご予算の目安を教えてください',
    subtitle: '大まかな範囲で結構です。最適なプランをご提案します。',
    options: {
      light: { label: '5万円以下', desc: 'ライトケア' },
      standard: { label: '5~15万円', desc: 'スタンダード' },
      premium: { label: '15~30万円', desc: 'プレミアム' },
      vip: { label: '30万円以上', desc: 'VIP総合ケア' },
    },
    event_toggle: '特別な予定はありますか？',
    event_types: {
      wedding: '\uD83D\uDC8D 結婚式',
      interview: '\uD83D\uDCBC 面接',
      photoshoot: '\uD83D\uDCF8 撮影',
      reunion: '\uD83C\uDF89 イベント',
      other: '\uD83D\uDCCC その他',
    },
    event_date_label: '日程',
    event_hint: 'イベントに合わせた最適なタイミングでご提案します',
    next: '次へ',
  },
  'ZH-CN': {
    title: '您的预算范围是？',
    subtitle: '大概范围即可，帮助我们为您定制最佳方案。',
    options: {
      light: { label: '3000元以下', desc: '轻护理' },
      standard: { label: '3000~10000元', desc: '标准套餐' },
      premium: { label: '10000~20000元', desc: '高端定制' },
      vip: { label: '20000元以上', desc: 'VIP综合护理' },
    },
    event_toggle: '您有什么特别的日程安排吗？',
    event_types: {
      wedding: '\uD83D\uDC8D 婚礼',
      interview: '\uD83D\uDCBC 面试',
      photoshoot: '\uD83D\uDCF8 拍摄',
      reunion: '\uD83C\uDF89 聚会/活动',
      other: '\uD83D\uDCCC 其他',
    },
    event_date_label: '日期',
    event_hint: '我们会根据您的日程安排最佳治疗时间',
    next: '下一步',
  },
};

const BUDGET_ICONS: Record<BudgetRange, string> = {
  light: '\uD83C\uDF31',
  standard: '\u2728',
  premium: '\uD83D\uDC8E',
  vip: '\uD83D\uDC51',
};

const EVENT_TYPES: EventType[] = ['wedding', 'interview', 'photoshoot', 'reunion', 'other'];

// ─── Props ────────────────────────────────────────────────────

interface BudgetStepProps {
  lang: SurveyLang;
  country: string;
  onSubmit: () => void;
  onBudgetChange: (budget: BudgetSelection) => void;
  onEventChange: (event: EventInfo | null) => void;
  isLoading?: boolean;
}

// ─── Component ───────────────────────────────────────────────

export default function BudgetStep({
  lang,
  country,
  onSubmit,
  onBudgetChange,
  onEventChange,
}: BudgetStepProps) {
  const t = BUDGET_I18N[lang];
  const isKR = country === 'KR';

  const [selectedRange, setSelectedRange] = useState<BudgetRange | null>(null);
  const [isPerSession, setIsPerSession] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [eventDate, setEventDate] = useState('');

  const handleSelectRange = (range: BudgetRange) => {
    setSelectedRange(range);
    const budgetType: BudgetType = isKR
      ? (isPerSession ? 'per_session' : 'monthly')
      : 'per_visit';
    onBudgetChange({ range, type: budgetType });
  };

  const handleTogglePerSession = () => {
    const next = !isPerSession;
    setIsPerSession(next);
    setSelectedRange(null); // reset selection when toggling
  };

  const handleEventTypeSelect = (type: EventType) => {
    setEventType(type);
    if (eventDate) {
      onEventChange({ type, date: eventDate });
    }
  };

  const handleEventDateChange = (date: string) => {
    setEventDate(date);
    if (eventType) {
      onEventChange({ type: eventType, date });
    }
  };

  const handleToggleEvent = () => {
    const next = !showEvent;
    setShowEvent(next);
    if (!next) {
      setEventType(null);
      setEventDate('');
      onEventChange(null);
    }
  };

  const canSubmit = selectedRange !== null;

  const budgetRanges: BudgetRange[] = ['light', 'standard', 'premium', 'vip'];

  // For KR per-session mode, show different labels
  const getOptionLabel = (range: BudgetRange): string => {
    if (isKR && isPerSession && t.per_session_options) {
      return t.per_session_options[range] || t.options[range].label;
    }
    return t.options[range].label;
  };

  const getOptionDesc = (range: BudgetRange): string => {
    if (isKR && isPerSession) return '';
    return t.options[range].desc;
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

      {/* Budget Options */}
      <div className="space-y-2.5 mb-4">
        {budgetRanges.map((range) => (
          <button
            key={range}
            onClick={() => handleSelectRange(range)}
            className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
              selectedRange === range
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{BUDGET_ICONS[range]}</span>
              <div>
                <div className="font-medium text-gray-900 text-sm">
                  {getOptionLabel(range)}
                </div>
                {getOptionDesc(range) && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {getOptionDesc(range)}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* KR: Per-session toggle */}
      {isKR && t.per_session_toggle && (
        <button
          onClick={handleTogglePerSession}
          className={`w-full text-center text-sm py-2 rounded-lg transition-colors mb-4 ${
            isPerSession
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.per_session_toggle}
        </button>
      )}

      {/* Event Toggle */}
      <div className="border-t border-gray-100 pt-4 mt-2">
        <button
          onClick={handleToggleEvent}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${showEvent ? 'rotate-90' : ''}`}>
            &#9654;
          </span>
          {t.event_toggle}
        </button>

        {showEvent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 space-y-3"
          >
            {/* Event Type Buttons */}
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleEventTypeSelect(type)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    eventType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t.event_types[type]}
                </button>
              ))}
            </div>

            {/* Date Picker */}
            {eventType && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  {t.event_date_label}
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => handleEventDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <p className="text-xs text-gray-400">{t.event_hint}</p>
          </motion.div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`w-full mt-5 py-3 rounded-xl text-sm font-medium transition-all ${
          canSubmit
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {t.next}
      </button>
    </motion.div>
  );
}
