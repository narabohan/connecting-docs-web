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
    title: '\uBD84\uC11D \uACB0\uACFC\uB97C \uBC1B\uC544\uBCF4\uC138\uC694',
    subtitle: 'AI \uBD84\uC11D\uC774 \uC644\uB8CC\uB418\uBA74 \uBA54\uC2E0\uC800\uB85C \uACB0\uACFC\uB97C \uBCF4\uB0B4\uB4DC\uB9BD\uB2C8\uB2E4',
    name_label: '\uC774\uB984',
    name_placeholder: '\uC131\uD568 \uB610\uB294 \uB2C9\uB124\uC784',
    messenger_label: '\uBA54\uC2E0\uC800',
    contact_label: '\uC5F0\uB77D\uCC98',
    submit: '\uBD84\uC11D \uC694\uCCAD\uD558\uAE30',
    privacy_note: '\uC785\uB825\uD558\uC2E0 \uC815\uBCF4\uB294 \uBD84\uC11D \uACB0\uACFC \uC804\uC1A1 \uBAA9\uC801\uC73C\uB85C\uB9CC \uC0AC\uC6A9\uB429\uB2C8\uB2E4',
    switch_messenger: '\uB2E4\uB978 \uBA54\uC2E0\uC800\uB85C \uBC1B\uAE30',
  },
  EN: {
    title: 'Get Your Analysis Results',
    subtitle: "We'll send your personalized results via messenger when ready",
    name_label: 'Name',
    name_placeholder: 'Your name or nickname',
    messenger_label: 'Messenger',
    contact_label: 'Contact',
    submit: 'Request Analysis',
    privacy_note: 'Your info is only used to deliver your results',
    switch_messenger: 'Use a different messenger',
  },
  JP: {
    title: '\u5206\u6790\u7D50\u679C\u3092\u53D7\u3051\u53D6\u308B',
    subtitle: 'AI\u5206\u6790\u304C\u5B8C\u4E86\u3057\u305F\u3089\u30E1\u30C3\u30BB\u30F3\u30B8\u30E3\u30FC\u3067\u7D50\u679C\u3092\u304A\u9001\u308A\u3057\u307E\u3059',
    name_label: '\u304A\u540D\u524D',
    name_placeholder: '\u304A\u540D\u524D\u307E\u305F\u306F\u30CB\u30C3\u30AF\u30CD\u30FC\u30E0',
    messenger_label: '\u30E1\u30C3\u30BB\u30F3\u30B8\u30E3\u30FC',
    contact_label: '\u9023\u7D61\u5148',
    submit: '\u5206\u6790\u3092\u30EA\u30AF\u30A8\u30B9\u30C8',
    privacy_note: '\u60C5\u5831\u306F\u7D50\u679C\u306E\u9001\u4FE1\u306E\u307F\u306B\u4F7F\u7528\u3055\u308C\u307E\u3059',
    switch_messenger: '\u5225\u306E\u30E1\u30C3\u30BB\u30F3\u30B8\u30E3\u30FC\u3092\u4F7F\u3046',
  },
  'ZH-CN': {
    title: '\u83B7\u53D6\u5206\u6790\u7ED3\u679C',
    subtitle: 'AI\u5206\u6790\u5B8C\u6210\u540E\uFF0C\u6211\u4EEC\u5C06\u901A\u8FC7\u6D88\u606F\u53D1\u9001\u7ED3\u679C',
    name_label: '\u59D3\u540D',
    name_placeholder: '\u60A8\u7684\u59D3\u540D\u6216\u6635\u79F0',
    messenger_label: '\u6D88\u606F\u5E94\u7528',
    contact_label: '\u8054\u7CFB\u65B9\u5F0F',
    submit: '\u8BF7\u6C42\u5206\u6790',
    privacy_note: '\u60A8\u7684\u4FE1\u606F\u4EC5\u7528\u4E8E\u53D1\u9001\u5206\u6790\u7ED3\u679C',
    switch_messenger: '\u4F7F\u7528\u5176\u4ED6\u6D88\u606F\u5E94\u7528',
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
          `${t.submit} →`
        )}
      </button>
    </motion.div>
  );
}
