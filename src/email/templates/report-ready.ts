// ═══════════════════════════════════════════════════════════════
//  report-ready 이메일 템플릿 — Phase 2 (G-4)
//  리포트 생성 완료 → 환자에게 발송
//  "Your consultation report is ready" + 리포트 링크 버튼
// ═══════════════════════════════════════════════════════════════

import type { EmailLocale, ReportReadyData } from '@/schemas/email';
import { baseLayout, ctaButton } from './base-layout';

// ─── Locale Strings ──────────────────────────────────────────

interface ReportReadyStrings {
  greeting: string;
  intro: string;
  details: string;
  cta: string;
  note: string;
}

const STRINGS: Record<EmailLocale, ReportReadyStrings> = {
  KO: {
    greeting: '안녕하세요',
    intro: 'AI 사전 상담 리포트가 준비되었습니다.',
    details: '개인 맞춤 피부 분석과 시술 추천을 확인해보세요. 리포트에는 피부 상태 분석, EBD 디바이스 추천, 인젝터블 추천, 그리고 맞춤 시그니처 솔루션이 포함되어 있습니다.',
    cta: '리포트 확인하기',
    note: '리포트는 AI 기반 사전 상담 자료이며, 실제 시술은 반드시 전문의 상담 후 결정해주세요.',
  },
  EN: {
    greeting: 'Hello',
    intro: 'Your AI pre-consultation report is ready.',
    details: 'Review your personalized skin analysis and treatment recommendations. Your report includes skin condition analysis, EBD device recommendations, injectable recommendations, and tailored signature solutions.',
    cta: 'View Your Report',
    note: 'This report is an AI-based pre-consultation guide. Please consult with a medical professional before proceeding with any treatments.',
  },
  JP: {
    greeting: 'こんにちは',
    intro: 'AI事前カウンセリングレポートが準備できました。',
    details: 'パーソナライズされた肌分析と施術推薦をご確認ください。レポートには肌状態分析、EBDデバイス推薦、注入剤推薦、カスタマイズされたシグネチャーソリューションが含まれています。',
    cta: 'レポートを確認する',
    note: 'このレポートはAIベースの事前カウンセリング資料です。実際の施術は必ず専門医にご相談の上お決めください。',
  },
  'ZH-CN': {
    greeting: '您好',
    intro: '您的AI预咨询报告已准备就绪。',
    details: '查看您的个性化皮肤分析和治疗建议。报告包括皮肤状况分析、EBD设备推荐、注射类推荐和定制签名方案。',
    cta: '查看报告',
    note: '本报告为AI预咨询指南，实际治疗请务必咨询专业医师后决定。',
  },
};

// ─── Template ────────────────────────────────────────────────

export function renderReportReady(data: ReportReadyData, locale: EmailLocale): string {
  const s = STRINGS[locale] ?? STRINGS.EN;
  const name = data.patientName || s.greeting;

  const body = `
    <h1 style="margin:0 0 8px;color:#0F172A;font-size:22px;font-weight:700;">
      ${s.greeting}${data.patientName ? `, ${data.patientName}` : ''}!
    </h1>
    <p style="margin:0 0 20px;color:#3B82F6;font-size:16px;font-weight:600;">
      ${s.intro}
    </p>
    <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:22px;">
      ${s.details}
    </p>
    ${ctaButton(s.cta, data.reportUrl || '#')}
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:18px;font-style:italic;">
      ${s.note}
    </p>`;

  return baseLayout(locale, body);
}
