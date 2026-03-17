// ═══════════════════════════════════════════════════════════════
//  plan-approved 이메일 템플릿 — Phase 2 (G-4)
//  Plan 승인 완료 → 환자에게 발송
//  "Your treatment plan has been approved" + Plan 확인 링크 버튼
// ═══════════════════════════════════════════════════════════════

import type { EmailLocale, PlanApprovedData } from '@/schemas/email';
import { baseLayout, ctaButton } from './base-layout';

// ─── Locale Strings ──────────────────────────────────────────

interface PlanApprovedStrings {
  greeting: string;
  intro: string;
  details: string;
  doctorLabel: string;
  cta: string;
  note: string;
}

const STRINGS: Record<EmailLocale, PlanApprovedStrings> = {
  KO: {
    greeting: '안녕하세요',
    intro: 'Treatment Plan이 승인되었습니다!',
    details: '담당 의사가 귀하의 맞춤 Treatment Plan을 검토하고 승인했습니다. 아래 버튼을 클릭하여 상세 내용을 확인하세요.',
    doctorLabel: '담당 의사',
    cta: 'Treatment Plan 확인',
    note: '궁금한 점이 있으시면 담당 의사와 상담을 예약해주세요.',
  },
  EN: {
    greeting: 'Hello',
    intro: 'Your Treatment Plan has been approved!',
    details: 'Your assigned doctor has reviewed and approved your personalized Treatment Plan. Click the button below to view the full details.',
    doctorLabel: 'Your Doctor',
    cta: 'View Treatment Plan',
    note: 'If you have any questions, please schedule a consultation with your doctor.',
  },
  JP: {
    greeting: 'こんにちは',
    intro: 'トリートメントプランが承認されました！',
    details: '担当医がカスタマイズされたトリートメントプランを確認し、承認しました。下のボタンをクリックして詳細をご確認ください。',
    doctorLabel: '担当医',
    cta: 'トリートメントプランを確認',
    note: 'ご質問がございましたら、担当医との相談をご予約ください。',
  },
  'ZH-CN': {
    greeting: '您好',
    intro: '您的治疗方案已获批准！',
    details: '您的负责医生已审核并批准了您的个性化治疗方案。点击下方按钮查看详细内容。',
    doctorLabel: '负责医生',
    cta: '查看治疗方案',
    note: '如有疑问，请预约与医生的咨询。',
  },
};

// ─── Template ────────────────────────────────────────────────

export function renderPlanApproved(data: PlanApprovedData, locale: EmailLocale): string {
  const s = STRINGS[locale] ?? STRINGS.EN;

  const body = `
    <h1 style="margin:0 0 8px;color:#0F172A;font-size:22px;font-weight:700;">
      ${s.greeting}${data.patientName ? `, ${data.patientName}` : ''}!
    </h1>
    <p style="margin:0 0 20px;color:#3B82F6;font-size:16px;font-weight:600;">
      ${s.intro}
    </p>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:22px;">
      ${s.details}
    </p>

    ${data.doctorName ? `
    <!-- Doctor Info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;margin-bottom:8px;">
      <tr>
        <td style="padding:14px 20px;">
          <p style="margin:0 0 4px;color:#15803d;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${s.doctorLabel}</p>
          <p style="margin:0;color:#0F172A;font-size:15px;font-weight:600;">${data.doctorName}</p>
        </td>
      </tr>
    </table>` : ''}

    ${ctaButton(s.cta, data.planUrl || '#')}
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:18px;font-style:italic;">
      ${s.note}
    </p>`;

  return baseLayout(locale, body);
}
