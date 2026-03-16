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
import type { SurveyLang } from '@/types/survey-v2';
import { findOrCreateUser, updateStage } from '@/services/crm-service';

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

    // ── 4. TODO Phase 2: Send report link email via SendGrid/Resend
    // const reportUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/report-v2/${report_id}`;
    // await sendReportLinkEmail({ to: email, reportUrl, lang });
    console.log(`[email-capture] TODO: Send report email to ${email} for report ${report_id}`);

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
