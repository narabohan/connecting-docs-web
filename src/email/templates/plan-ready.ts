// ═══════════════════════════════════════════════════════════════
//  plan-ready 이메일 템플릿 — Phase 2 (G-4)
//  Treatment Plan 생성 → 의사에게 발송
//  "New treatment plan needs your review" + 대시보드 링크 버튼
// ═══════════════════════════════════════════════════════════════

import type { EmailLocale, PlanReadyData } from '@/schemas/email';
import { baseLayout, ctaButton } from './base-layout';

// ─── Locale Strings ──────────────────────────────────────────

interface PlanReadyStrings {
  greeting: string;
  intro: string;
  details: string;
  planIdLabel: string;
  patientIdLabel: string;
  cta: string;
  note: string;
}

const STRINGS: Record<EmailLocale, PlanReadyStrings> = {
  KO: {
    greeting: '안녕하세요',
    intro: '새로운 Treatment Plan이 검토를 기다리고 있습니다.',
    details: '환자의 AI 분석 결과를 바탕으로 생성된 Treatment Plan이 의사 대시보드에서 검토 가능합니다. 확인 후 승인 또는 수정해주세요.',
    planIdLabel: 'Plan ID',
    patientIdLabel: '환자',
    cta: '대시보드에서 확인',
    note: '이 알림은 담당 의사에게만 발송됩니다.',
  },
  EN: {
    greeting: 'Hello',
    intro: 'A new Treatment Plan needs your review.',
    details: 'A Treatment Plan generated from the patient\'s AI analysis is ready for review on your doctor dashboard. Please review and approve or modify as needed.',
    planIdLabel: 'Plan ID',
    patientIdLabel: 'Patient',
    cta: 'Review on Dashboard',
    note: 'This notification is sent only to the assigned doctor.',
  },
  JP: {
    greeting: 'こんにちは',
    intro: '新しいトリートメントプランのレビューが必要です。',
    details: '患者のAI分析結果に基づいて作成されたトリートメントプランが、医師ダッシュボードでレビュー可能です。確認後、承認または修正をお願いします。',
    planIdLabel: 'プランID',
    patientIdLabel: '患者',
    cta: 'ダッシュボードで確認',
    note: 'この通知は担当医にのみ送信されます。',
  },
  'ZH-CN': {
    greeting: '您好',
    intro: '有新的治疗方案需要您审核。',
    details: '根据患者AI分析结果生成的治疗方案已准备就绪，可在医生仪表盘上进行审核。请查看后批准或修改。',
    planIdLabel: '方案ID',
    patientIdLabel: '患者',
    cta: '在仪表盘查看',
    note: '此通知仅发送给负责医生。',
  },
};

// ─── Template ────────────────────────────────────────────────

export function renderPlanReady(data: PlanReadyData, locale: EmailLocale): string {
  const s = STRINGS[locale] ?? STRINGS.EN;

  const body = `
    <h1 style="margin:0 0 8px;color:#0F172A;font-size:22px;font-weight:700;">
      ${s.greeting}${data.doctorName ? `, ${data.doctorName}` : ''}!
    </h1>
    <p style="margin:0 0 20px;color:#3B82F6;font-size:16px;font-weight:600;">
      ${s.intro}
    </p>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:22px;">
      ${s.details}
    </p>

    <!-- Info Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;border-radius:8px;margin-bottom:8px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${s.planIdLabel}</p>
          <p style="margin:0;color:#0F172A;font-size:14px;font-weight:600;font-family:monospace;">${data.planId || '—'}</p>
        </td>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${s.patientIdLabel}</p>
          <p style="margin:0;color:#0F172A;font-size:14px;font-weight:600;">${data.patientId || '—'}</p>
        </td>
      </tr>
    </table>

    ${ctaButton(s.cta, data.dashboardUrl || '#')}
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:18px;font-style:italic;">
      ${s.note}
    </p>`;

  return baseLayout(locale, body);
}
