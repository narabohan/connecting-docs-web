// ═══════════════════════════════════════════════════════════════
//  POST /api/crm/email-capture — Phase 1 (C-4)
//  비인증 유저의 이메일을 캡처하여 CRM Users 테이블에 연결
//  참조: MASTER_PLAN_V4.md §16.2 (비인증 유저 3-Layer 안전망)
//
//  동작:
//    1. Zod로 email, report_id 검증
//    2. findOrCreateUser({ email }) → Users 레코드 생성/조회
//    3. SurveyV2_Results 레코드에 crm_user_id 링크
//    4. (Phase 2 TODO) 이메일로 리포트 링크 발송
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { Resend } from 'resend';
import type { SurveyLang } from '@/types/survey-v2';
import { findOrCreateUser, updateStage } from '@/services/crm-service';

// ─── Resend Config ──────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://connectingdocs.ai';

// ─── Airtable Config ─────────────────────────────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const SURVEY_RESULTS_TABLE = 'SurveyV2_Results';

// ─── Zod Schema ──────────────────────────────────────────────

const emailCaptureSchema = z.object({
  email: z.string().email('Invalid email format'),
  report_id: z.string().min(1, 'report_id is required'),
  lang: z.enum(['KO', 'EN', 'JP', 'ZH-CN']).default('EN'),
});

export type EmailCaptureInput = z.infer<typeof emailCaptureSchema>;

// ─── Response Types ──────────────────────────────────────────

interface EmailCaptureResponse {
  success: boolean;
  user_id?: string;
  error?: string;
}

// ─── Email Templates (KO / EN / JP / ZH-CN) ────────────────

interface ReportEmailContent {
  subject: string;
  heading: string;
  body: string;
  cta: string;
  footer: string;
}

function getEmailContent(lang: string): ReportEmailContent {
  const templates: Record<string, ReportEmailContent> = {
    KO: {
      subject: '🔬 ConnectingDocs AI 피부 분석 리포트가 준비되었습니다',
      heading: '피부 분석 리포트 완성!',
      body: 'AI 기반 피부 분석 리포트가 준비되었습니다. 아래 버튼을 클릭하여 맞춤형 시술 추천과 상세 분석 결과를 확인하세요.',
      cta: '리포트 보기',
      footer: '본 메일은 ConnectingDocs.ai 설문 완료 후 발송됩니다. 문의사항은 support@connectingdocs.ai로 연락해 주세요.',
    },
    EN: {
      subject: '🔬 Your ConnectingDocs AI Skin Analysis Report is Ready',
      heading: 'Your Skin Analysis Report is Ready!',
      body: 'Your AI-powered skin analysis report has been prepared. Click the button below to view your personalized treatment recommendations and detailed analysis.',
      cta: 'View Report',
      footer: 'This email was sent after completing the ConnectingDocs.ai survey. For questions, contact support@connectingdocs.ai.',
    },
    JP: {
      subject: '🔬 ConnectingDocs AI 肌分析レポートの準備ができました',
      heading: '肌分析レポートが完成しました！',
      body: 'AI搭載の肌分析レポートが準備できました。下のボタンをクリックして、パーソナライズされた施術推奨と詳細な分析結果をご確認ください。',
      cta: 'レポートを見る',
      footer: '本メールはConnectingDocs.aiのアンケート完了後に送信されます。ご質問はsupport@connectingdocs.aiまでお問い合わせください。',
    },
    'ZH-CN': {
      subject: '🔬 ConnectingDocs AI 皮肤分析报告已准备就绪',
      heading: '您的皮肤分析报告已完成！',
      body: '您的AI皮肤分析报告已准备就绪。请点击下方按钮查看个性化治疗推荐和详细分析结果。',
      cta: '查看报告',
      footer: '本邮件在完成ConnectingDocs.ai问卷后发送。如有疑问，请联系support@connectingdocs.ai。',
    },
  };
  return templates[lang] || templates.EN;
}

function buildReportEmailHtml(reportUrl: string, lang: string): string {
  const c = getEmailContent(lang);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="${SITE_URL}/logo-light.png" alt="ConnectingDocs" height="28" style="height:28px;" />
    </div>
    <div style="background:#111118;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px 24px;text-align:center;">
      <div style="font-size:28px;margin-bottom:12px;">🔬</div>
      <h1 style="color:#f0f0f5;font-size:20px;font-weight:700;margin:0 0 12px;">${c.heading}</h1>
      <p style="color:#a0a0b0;font-size:14px;line-height:1.7;margin:0 0 24px;">${c.body}</p>
      <a href="${reportUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#06b6d4,#22d3ee);color:#0a0a0f;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.02em;">${c.cta}</a>
    </div>
    <p style="text-align:center;color:#555;font-size:11px;line-height:1.6;margin-top:24px;">${c.footer}</p>
  </div>
</body>
</html>`.trim();
}

/**
 * Send the report link email via Resend. Non-blocking — errors are logged but don't fail the request.
 */
async function sendReportLinkEmail(to: string, reportId: string, lang: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email-capture] RESEND_API_KEY not set — skipping email send');
    return;
  }

  const reportUrl = `${SITE_URL}/report-v2/${reportId}`;
  const content = getEmailContent(lang);

  try {
    await resend.emails.send({
      from: `ConnectingDocs <${FROM_EMAIL}>`,
      to,
      subject: content.subject,
      html: buildReportEmailHtml(reportUrl, lang),
    });
    console.log(`[email-capture] Report email sent to ${to} for report ${reportId}`);
  } catch (err) {
    console.error('[email-capture] Failed to send report email (non-blocking):', err);
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function sanitizeForFormula(value: string): string {
  return value.replace(/'/g, "\\'");
}

/**
 * Find a SurveyV2_Results record by run_id and link it to a CRM user.
 * Best-effort: failure doesn't block the response.
 */
async function linkResultToUser(reportId: string, crmUserId: string): Promise<void> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return;

  const formula = `{run_id} = '${sanitizeForFormula(reportId)}'`;
  const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(SURVEY_RESULTS_TABLE)}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&fields[]=run_id`;

  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const searchRes = await fetch(searchUrl, { headers });
    if (!searchRes.ok) return;

    interface AirtableSearchRecord {
      id: string;
      fields: { run_id?: string };
    }

    const data = await searchRes.json() as { records: AirtableSearchRecord[] };
    if (data.records.length === 0) return;

    const recordId = data.records[0].id;

    // PATCH to add crm_user_id link
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(SURVEY_RESULTS_TABLE)}/${recordId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          fields: { crm_user_id: crmUserId },
        }),
      }
    );
  } catch (err) {
    console.error('[email-capture] Failed to link result to user (non-blocking):', err);
  }
}

// ─── Handler ─────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmailCaptureResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // ── Validate input
  const parsed = emailCaptureSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid input';
    return res.status(400).json({ success: false, error: firstError });
  }

  const { email, report_id, lang } = parsed.data;

  try {
    // ── 1. Find or create CRM user
    const crmUser = await findOrCreateUser({
      email,
      country: '',  // Not available from email capture
      lang: lang as SurveyLang,
    });

    // ── 2. Update stage (best-effort, non-blocking)
    try {
      await updateStage(crmUser.airtable_id, 'survey_completed');
    } catch {
      console.warn('[email-capture] Stage update failed (non-blocking)');
    }

    // ── 3. Link SurveyV2_Results to user (best-effort)
    await linkResultToUser(report_id, crmUser.airtable_id);

    // ── 4. Send report link email (non-blocking)
    await sendReportLinkEmail(email, report_id, lang);

    return res.status(200).json({
      success: true,
      user_id: crmUser.airtable_id,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[email-capture] Error:', errMsg);
    return res.status(500).json({
      success: false,
      error: 'Failed to capture email',
    });
  }
}
