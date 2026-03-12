// ═══════════════════════════════════════════════════════════════
//  MessengerContactStep — Collect messenger contact for async notification
//  Country-aware: KakaoTalk (KR), LINE (JP/TH/TW), WeChat (CN),
//  Zalo (VN), WhatsApp (default), Email (fallback)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { SurveyLang, MessengerType, MessengerContact } from '@/types/survey-v2';
import { COUNTRY_MESSENGER_MAP, MESSENGER_LABELS } from '@/types/survey-v2';

// ─── i18n ───────────────────────────────────────────────────
const I18N: Record<SurveyLang, {
  title: string;
  subtitle: string;
  name_label: string;
  name_placeholder: string;
  messenger_label: string;
  contact_label: string;
  submit: string;
  privacy_note: string;
  switch_messenger: string;
}> = {
  KO: {
    title: '분석 결과를 받아보세요',
    subtitle: '연락처를 남겨주시면 리포트가 준비되면 안내해 드리겠습니다',
    name_label: '이름',
    name_placeholder: '성함 또는 닉네임',
    messenger_label: '메신저',
    contact_label: '연락처',
    submit: '분석 요청하기 →',
    privacy_note: '입력하신 정보는 분석 결과 안내 목적으로만 사용됩니다',
    switch_messenger: '다른 메신저로 받기',
  },
  EN: {
    title: 'Get Your Analysis Results',
    subtitle: "Leave your contact info and we'll notify you when your report is ready",
    name_label: 'Name',
    name_placeholder: 'Your name or nickname',
    messenger_label: 'Messenger',
    contact_label: 'Contact',
    submit: 'Request Analysis →',
    privacy_note: 'Your info is only used to notify you when results are ready',
    switch_messenger: 'Use a different messenger',
  },
  JP: {
    title: '分析結果を受け取る',
    subtitle: 'ご連絡先をお残しいただければ、レポートの準備ができ次第ご案内いたします',
    name_label: 'お名前',
    name_placeholder: 'お名前またはニックネーム',
    messenger_label: 'メッセンジャー',
    contact_label: '連絡先',
    submit: '分析をリクエスト →',
    privacy_note: '情報は結果のご案内のみに使用されます',
    switch_messenger: '別のメッセンジャーを使う',
  },
  'ZH-CN': {
    title: '获取分析结果',
    subtitle: '请留下您的联系方式，报告准备好后我们会通知您',
    name_label: '姓名',
    name_placeholder: '您的姓名或昵称',
    messenger_label: '消息应用',
    contact_label: '联系方式',
    submit: '请求分析 →',
    privacy_note: '您的信息仅用于通知分析结果就绪',
    switch_messenger: '使用其他消息应用',
  },
};

const ALL_MESSENGERS: MessengerType[] = ['kakao', 'whatsapp', 'line', 'wechat', 'zalo', 'email'];

interface MessengerContactStepProps {
  lang: SurveyLang;
  country: string;
  onSubmit: () => void;
  onChange: (contact: MessengerContact) => void;
  isLoading: boolean;
}

export default function MessengerContactStep({
  lang,
  country,
  onSubmit,
  onChange,
  isLoading,
}: MessengerContactStepProps) {
  const t = I18N[lang];
  const defaultMessenger = COUNTRY_MESSENGER_MAP[country] || 'whatsapp';

  const [name, setName] = useState('');
  const [messengerType, setMessengerType] = useState<MessengerType>(defaultMessenger);
  const [contactId, setContactId] = useState('');
  const [showAllMessengers, setShowAllMessengers] = useState(false);

  // Update parent state when fields change
  useEffect(() => {
    if (name && contactId) {
      onChange({ type: messengerType, contact_id: contactId, name });
    }
  }, [name, messengerType, contactId, onChange]);

  const isValid = name.trim().length >= 1 && contactId.trim().length >= 3;
  const currentMessenger = MESSENGER_LABELS[messengerType];

  const handleSubmit = () => {
    if (!isValid) return;
    onChange({ type: messengerType, contact_id: contactId.trim(), name: name.trim() });
    onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-3">💬</div>
        <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.name_label}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.name_placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
          autoFocus
        />
      </div>

      {/* Messenger Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.messenger_label}
        </label>

        {/* Primary messenger (auto-selected based on country) */}
        <div className="space-y-2">
          {/* Show default + optionally all messengers */}
          {(showAllMessengers ? ALL_MESSENGERS : [defaultMessenger]).map((type) => {
            const info = MESSENGER_LABELS[type];
            const isSelected = messengerType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setMessengerType(type)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{info.icon}</span>
                <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                  {info.name}
                </span>
                {isSelected && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Toggle to show all messengers */}
        {!showAllMessengers && (
          <button
            type="button"
            onClick={() => setShowAllMessengers(true)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {t.switch_messenger}
          </button>
        )}
      </div>

      {/* Contact ID Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {currentMessenger.name} {t.contact_label}
        </label>
        <input
          type="text"
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          placeholder={currentMessenger.placeholder[lang]}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Privacy Note */}
      <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
        <span>🔒</span> {t.privacy_note}
      </p>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all ${
          isValid && !isLoading
            ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            ...
          </span>
        ) : (
          t.submit
        )}
      </button>
    </motion.div>
  );
}
