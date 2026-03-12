// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs Survey v2 — Thank You / Complete Step
//  Shown after messenger contact is submitted and background
//  analysis is triggered. Reassures user that results will
//  be delivered via their chosen messenger.
// ═══════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import type { SurveyLang, MessengerType, MessengerContact } from '@/types/survey-v2';

// ─── i18n ────────────────────────────────────────────────────
const THANK_YOU_TEXT: Record<SurveyLang, {
  title: string;
  subtitle: string;
  message_template: string; // {name}, {messenger} placeholders
  what_next_title: string;
  what_next_items: string[];
  footer: string;
}> = {
  KO: {
    title: '상담이 접수되었습니다!',
    subtitle: 'AI가 맞춤 피부 분석을 진행하고 있어요',
    message_template: '{name}님, 분석이 완료되면\n{messenger}로 결과를 보내드리겠습니다.',
    what_next_title: '앞으로의 과정',
    what_next_items: [
      'AI가 80개 이상의 임상 프로토콜을 분석합니다 (약 3-5분)',
      '맞춤 시술 리포트가 자동 생성됩니다',
      '완료되면 입력하신 메신저로 알림을 보내드립니다',
    ],
    footer: '이 페이지를 닫으셔도 분석은 계속 진행됩니다.',
  },
  EN: {
    title: 'Consultation Received!',
    subtitle: 'AI is analyzing your personalized skin profile',
    message_template: '{name}, we\'ll send your results\nvia {messenger} when ready.',
    what_next_title: 'What happens next',
    what_next_items: [
      'AI analyzes 80+ clinical protocols (about 3-5 minutes)',
      'Your personalized treatment report is generated',
      'You\'ll receive a notification via your messenger',
    ],
    footer: 'You can safely close this page — analysis continues in the background.',
  },
  JP: {
    title: '相談を受け付けました！',
    subtitle: 'AIがカスタマイズ肌分析を行っています',
    message_template: '{name}様、分析が完了しましたら\n{messenger}で結果をお送りします。',
    what_next_title: '今後の流れ',
    what_next_items: [
      'AIが80以上の臨床プロトコルを分析します（約3-5分）',
      'カスタマイズ施術レポートが自動生成されます',
      '完了次第、メッセンジャーで通知をお送りします',
    ],
    footer: 'このページを閉じても分析は続行されます。',
  },
  'ZH-CN': {
    title: '咨询已受理！',
    subtitle: 'AI正在为您进行个性化皮肤分析',
    message_template: '{name}，分析完成后\n我们将通过{messenger}发送结果。',
    what_next_title: '接下来的流程',
    what_next_items: [
      'AI分析80多种临床方案（约3-5分钟）',
      '自动生成您的个性化治疗报告',
      '完成后通过您的社交软件发送通知',
    ],
    footer: '您可以安全关闭此页面——分析将在后台继续进行。',
  },
};

const MESSENGER_DISPLAY: Record<MessengerType, string> = {
  kakao: 'KakaoTalk',
  whatsapp: 'WhatsApp',
  line: 'LINE',
  wechat: 'WeChat',
  zalo: 'Zalo',
  email: 'Email',
};

const MESSENGER_EMOJI: Record<MessengerType, string> = {
  kakao: '\uD83D\uDFE1',
  whatsapp: '\uD83D\uDFE2',
  line: '\uD83D\uDFE2',
  wechat: '\uD83D\uDFE2',
  zalo: '\uD83D\uDD35',
  email: '\uD83D\uDCE7',
};

// ─── Component ───────────────────────────────────────────────

interface ThankYouStepProps {
  lang: SurveyLang;
  messengerContact: MessengerContact | null;
}

export default function ThankYouStep({ lang, messengerContact }: ThankYouStepProps) {
  const t = THANK_YOU_TEXT[lang];
  const messengerName = messengerContact
    ? MESSENGER_DISPLAY[messengerContact.type]
    : 'messenger';
  const messengerEmoji = messengerContact
    ? MESSENGER_EMOJI[messengerContact.type]
    : '\uD83D\uDCE8';
  const patientName = messengerContact?.name || '';

  const personalizedMessage = t.message_template
    .replace('{name}', patientName)
    .replace('{messenger}', messengerName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center py-4"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
      >
        <span className="text-4xl">&#x2705;</span>
      </motion.div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {t.title}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {t.subtitle}
      </p>

      {/* Messenger delivery card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{messengerEmoji}</span>
          <span className="font-semibold text-blue-800">{messengerName}</span>
        </div>
        <p className="text-sm text-blue-700 whitespace-pre-line">
          {personalizedMessage}
        </p>
      </motion.div>

      {/* What happens next */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full text-left"
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {t.what_next_title}
        </h3>
        <div className="space-y-3">
          {t.what_next_items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + idx * 0.15 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                {idx + 1}
              </div>
              <p className="text-sm text-gray-600">{item}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-xs text-gray-400 mt-6 italic"
      >
        {t.footer}
      </motion.p>

      {/* Animated progress dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="flex gap-1.5 mt-4"
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-blue-400 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
