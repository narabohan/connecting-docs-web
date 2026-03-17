// ═══════════════════════════════════════════════════════════════
//  welcome 이메일 템플릿 — Phase 2 (G-4)
//  회원가입 환영 → 환자에게 발송
//  "Welcome to ConnectingDocs" + 시작하기 링크 버튼
// ═══════════════════════════════════════════════════════════════

import type { EmailLocale, WelcomeData } from '@/schemas/email';
import { baseLayout, ctaButton } from './base-layout';

// ─── Locale Strings ──────────────────────────────────────────

interface WelcomeStrings {
  greeting: string;
  intro: string;
  features: string[];
  cta: string;
  note: string;
}

const STRINGS: Record<EmailLocale, WelcomeStrings> = {
  KO: {
    greeting: '환영합니다',
    intro: 'ConnectingDocs에 가입해주셔서 감사합니다! AI 기반 사전 상담을 통해 나에게 맞는 시술을 찾아보세요.',
    features: [
      'AI 피부 분석 및 맞춤 시술 추천',
      'EBD 의료기기 + 인젝터블 시너지 솔루션',
      '전문의 검증 Treatment Plan',
    ],
    cta: '시작하기',
    note: 'ConnectingDocs는 의료미용 AI 사전 상담 플랫폼입니다.',
  },
  EN: {
    greeting: 'Welcome',
    intro: 'Thank you for joining ConnectingDocs! Discover the right treatments for you through our AI-powered pre-consultation.',
    features: [
      'AI skin analysis & personalized treatment recommendations',
      'EBD device + injectable synergy solutions',
      'Doctor-verified Treatment Plans',
    ],
    cta: 'Get Started',
    note: 'ConnectingDocs is an AI pre-consultation platform for medical aesthetics.',
  },
  JP: {
    greeting: 'ようこそ',
    intro: 'ConnectingDocsへのご登録ありがとうございます！AIベースの事前カウンセリングで、あなたに合った施術を見つけましょう。',
    features: [
      'AI肌分析とパーソナライズされた施術推薦',
      'EBDデバイス＋注入剤のシナジーソリューション',
      '専門医認証トリートメントプラン',
    ],
    cta: '始める',
    note: 'ConnectingDocsは医療美容AIの事前カウンセリングプラットフォームです。',
  },
  'ZH-CN': {
    greeting: '欢迎',
    intro: '感谢您加入ConnectingDocs！通过AI预咨询找到适合您的治疗方案。',
    features: [
      'AI皮肤分析和个性化治疗推荐',
      'EBD设备+注射类协同方案',
      '医生认证的治疗方案',
    ],
    cta: '开始使用',
    note: 'ConnectingDocs是医疗美容AI预咨询平台。',
  },
};

// ─── Template ────────────────────────────────────────────────

export function renderWelcome(data: WelcomeData, locale: EmailLocale): string {
  const s = STRINGS[locale] ?? STRINGS.EN;

  const featuresHtml = s.features
    .map(
      (f) => `
      <tr>
        <td style="padding:6px 0;color:#475569;font-size:14px;line-height:20px;">
          <span style="color:#3B82F6;font-weight:bold;margin-right:8px;">&#10003;</span>
          ${f}
        </td>
      </tr>`,
    )
    .join('');

  const body = `
    <h1 style="margin:0 0 8px;color:#0F172A;font-size:22px;font-weight:700;">
      ${s.greeting}${data.userName ? `, ${data.userName}` : ''}!
    </h1>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:22px;">
      ${s.intro}
    </p>

    <!-- Features -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;margin-bottom:8px;">
      <tr>
        <td style="padding:16px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${featuresHtml}
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton(s.cta, data.startUrl || '#')}
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:18px;font-style:italic;">
      ${s.note}
    </p>`;

  return baseLayout(locale, body);
}
