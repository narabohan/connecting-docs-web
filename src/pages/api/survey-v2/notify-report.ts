// ═══════════════════════════════════════════════════════════════
//  POST /api/survey-v2/notify-report
//  Send report completion emails:
//    1. Admin notification (always)
//    2. Patient email (if provided)
//  Fire-and-forget from useSurveyV2 hook
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://connectingdocs.com';

// ─── Request Type ────────────────────────────────────────────

interface NotifyReportRequest {
  report_id: string;
  patient_email?: string;       // Firebase user email (optional)
  patient_country: string;
  patient_age: string;
  patient_gender: string;
  lang: string;                 // KO | EN | JP | ZH-CN
  primary_goal: string;
  top_device: string;
  top_injectable: string;
  model: string;
  cost_usd?: number;
}

// ─── HTML Email Templates ────────────────────────────────────

function buildAdminEmail(data: NotifyReportRequest): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:20px;background:#f8fafc;">
  <div style="max-width:540px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px 28px;">
      <h1 style="color:white;margin:0;font-size:18px;">🔔 새 리포트 생성 완료</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">ConnectingDocs Admin Alert</p>
    </div>

    <!-- Body -->
    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;width:120px;">Report ID</td>
          <td style="padding:8px 0;font-weight:600;"><code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px;">${data.report_id}</code></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">환자 정보</td>
          <td style="padding:8px 0;">${data.patient_country} / ${data.patient_gender} / ${data.patient_age}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">이메일</td>
          <td style="padding:8px 0;">${data.patient_email || '비회원 (미수집)'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">언어</td>
          <td style="padding:8px 0;">${data.lang}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">주요 목표</td>
          <td style="padding:8px 0;font-weight:600;">${data.primary_goal || '-'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Top 장비</td>
          <td style="padding:8px 0;">${data.top_device || '-'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Top 스킨부스터/인젝터블</td>
          <td style="padding:8px 0;">${data.top_injectable || '-'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">AI 모델</td>
          <td style="padding:8px 0;">${data.model}</td>
        </tr>
        ${data.cost_usd ? `<tr>
          <td style="padding:8px 0;color:#6b7280;">API 비용</td>
          <td style="padding:8px 0;">$${data.cost_usd.toFixed(4)}</td>
        </tr>` : ''}
      </table>

      <!-- Report Link -->
      <div style="margin-top:20px;text-align:center;">
        <a href="${BASE_URL}/report-v2/${data.report_id}"
           style="display:inline-block;background:#2563eb;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
          리포트 보기 →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:11px;">
        ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} KST · ConnectingDocs Auto Alert
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildPatientEmail(data: NotifyReportRequest): string {
  const reportUrl = `${BASE_URL}/report-v2/${data.report_id}`;

  // Multi-language email content
  const content: Record<string, { subject: string; greeting: string; body: string; cta: string; footer: string }> = {
    KO: {
      subject: '피부 분석 리포트가 완성되었습니다',
      greeting: '안녕하세요!',
      body: 'AI 피부 분석이 완료되어 맞춤 시술 리포트가 준비되었습니다. 아래 버튼을 클릭하여 결과를 확인하세요.',
      cta: '내 리포트 확인하기',
      footer: '이 이메일은 ConnectingDocs 피부 분석 서비스에서 발송되었습니다.',
    },
    EN: {
      subject: 'Your Skin Analysis Report is Ready',
      greeting: 'Hello!',
      body: 'Your AI skin analysis is complete and your personalized treatment report is ready. Click the button below to view your results.',
      cta: 'View My Report',
      footer: 'This email was sent by ConnectingDocs skin analysis service.',
    },
    JP: {
      subject: '肌分析レポートが完成しました',
      greeting: 'こんにちは！',
      body: 'AI肌分析が完了し、カスタマイズ施術レポートが準備できました。下のボタンをクリックして結果をご確認ください。',
      cta: 'レポートを確認する',
      footer: 'このメールはConnectingDocs肌分析サービスより送信されました。',
    },
    'ZH-CN': {
      subject: '您的皮肤分析报告已完成',
      greeting: '您好！',
      body: 'AI皮肤分析已完成，您的个性化治疗报告已准备就绪。请点击下方按钮查看结果。',
      cta: '查看我的报告',
      footer: '此邮件由ConnectingDocs皮肤分析服务发送。',
    },
  };

  const c = content[data.lang] || content['EN'];

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:20px;background:#f0f9ff;">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 28px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">✨</div>
      <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">${c.subject}</h1>
    </div>

    <!-- Body -->
    <div style="padding:28px;">
      <p style="font-size:16px;color:#1f2937;margin:0 0 12px;">${c.greeting}</p>
      <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 24px;">${c.body}</p>

      <!-- CTA -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${reportUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;font-weight:700;box-shadow:0 4px 12px rgba(37,99,235,0.3);">
          ${c.cta} →
        </a>
      </div>

      <!-- Report URL fallback -->
      <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px;word-break:break-all;">
        ${reportUrl}
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:11px;">${c.footer}</p>
      <p style="margin:4px 0 0;color:#d1d5db;font-size:10px;">ConnectingDocs © ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Main Handler ────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body as NotifyReportRequest;

  if (!data.report_id) {
    return res.status(400).json({ error: 'Missing report_id' });
  }

  // Gracefully handle missing API key
  if (!process.env.RESEND_API_KEY) {
    console.warn('[notify-report] RESEND_API_KEY not set. Logging instead.');
    console.log(`[notify-report] Report ${data.report_id} for ${data.patient_email || 'anonymous'}`);
    return res.status(200).json({ success: true, mock: true });
  }

  const results: string[] = [];

  try {
    // 1. Admin notification (always send if ADMIN_EMAIL is set)
    if (ADMIN_EMAIL) {
      const adminResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `[CD] 새 리포트: ${data.patient_country}/${data.patient_gender}/${data.patient_age} — ${data.primary_goal || 'N/A'}`,
        html: buildAdminEmail(data),
      });
      results.push(`admin:${adminResult.data?.id || 'sent'}`);
      console.log(`[notify-report] ✅ Admin email sent → ${ADMIN_EMAIL}`);
    }

    // 2. Patient notification (only if email available)
    if (data.patient_email) {
      const langContent: Record<string, string> = {
        KO: '피부 분석 리포트가 완성되었습니다',
        EN: 'Your Skin Analysis Report is Ready',
        JP: '肌分析レポートが完成しました',
        'ZH-CN': '您的皮肤分析报告已完成',
      };
      const subject = `[ConnectingDocs] ${langContent[data.lang] || langContent['EN']}`;

      const patientResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: [data.patient_email],
        subject,
        html: buildPatientEmail(data),
      });
      results.push(`patient:${patientResult.data?.id || 'sent'}`);
      console.log(`[notify-report] ✅ Patient email sent → ${data.patient_email}`);
    }

    return res.status(200).json({ success: true, results });
  } catch (err: any) {
    console.error('[notify-report] ❌ Email error:', err.message);
    // Don't fail the request — this is non-critical
    return res.status(200).json({ success: false, error: err.message });
  }
}
