// ═══════════════════════════════════════════════════════════════
//  POST /api/consent/save — Phase 1 (C-7)
//  동의 기록을 Airtable UserConsents 테이블에 저장
//  참조: MASTER_PLAN_V4.md §13 (글로벌 컴플라이언스)
//
//  동작:
//    1. Zod로 ConsentRecord 검증
//    2. Airtable UserConsents 테이블에 레코드 생성
//    3. (선택) 기존 Users 레코드에 consent_version 업데이트
//  best-effort: 항상 200 반환 (동의 저장 실패가 UX 차단 안 함)
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// ─── Airtable Config ────────────────────────────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const CONSENTS_TABLE = 'UserConsents';
const USERS_TABLE = 'Users';

// ─── Zod Schema ─────────────────────────────────────────────

const consentCategorySchema = z.enum(['essential', 'analytics', 'ai_processing', 'marketing']);

const consentSaveSchema = z.object({
  user_id: z.string().nullable(),
  session_id: z.string().min(1, 'session_id is required'),
  consents: z.record(consentCategorySchema, z.boolean()),
  ip_country: z.string().min(1, 'ip_country is required'),
  consented_at: z.string().min(1, 'consented_at is required'),
  version: z.string().min(1, 'version is required'),
});

export type ConsentSaveInput = z.infer<typeof consentSaveSchema>;

// ─── Response Types ─────────────────────────────────────────

interface ConsentSaveResponse {
  success: boolean;
  record_id?: string;
  error?: string;
}

// ─── Helpers ────────────────────────────────────────────────

function airtableHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function sanitizeForFormula(value: string): string {
  return value.replace(/'/g, "\\'");
}

// ─── Handler ────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConsentSaveResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // ── Validate input
  const parsed = consentSaveSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid input';
    return res.status(400).json({ success: false, error: firstError });
  }

  const { user_id, session_id, consents, ip_country, consented_at, version } = parsed.data;

  // ── Check Airtable config
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('[consent/save] Missing Airtable config — consent not persisted');
    return res.status(200).json({ success: true }); // best-effort
  }

  try {
    // ── 1. Create UserConsents record
    const consentsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(CONSENTS_TABLE)}`;

    const createRes = await fetch(consentsUrl, {
      method: 'POST',
      headers: airtableHeaders(),
      body: JSON.stringify({
        fields: {
          user_id: user_id || '',
          session_id,
          consent_essential: consents.essential ?? false,
          consent_analytics: consents.analytics ?? false,
          consent_ai_processing: consents.ai_processing ?? false,
          consent_marketing: consents.marketing ?? false,
          ip_country,
          consented_at,
          version,
        },
      }),
    });

    interface AirtableCreateResponse {
      id: string;
      fields: Record<string, string | boolean>;
    }

    let recordId: string | undefined;
    if (createRes.ok) {
      const created = await createRes.json() as AirtableCreateResponse;
      recordId = created.id;
    } else {
      const errText = await createRes.text();
      console.error('[consent/save] Airtable create failed:', createRes.status, errText);
      // best-effort: don't fail the request
    }

    // ── 2. Update Users record consent_version (if user_id provided)
    if (user_id) {
      try {
        const usersUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(USERS_TABLE)}`;
        const formula = `{firebase_uid} = '${sanitizeForFormula(user_id)}'`;
        const searchUrl = `${usersUrl}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&fields[]=firebase_uid`;

        const searchRes = await fetch(searchUrl, { headers: airtableHeaders() });
        if (searchRes.ok) {
          interface AirtableSearchRecord {
            id: string;
            fields: { firebase_uid?: string };
          }

          const data = await searchRes.json() as { records: AirtableSearchRecord[] };
          if (data.records.length > 0) {
            const userRecordId = data.records[0].id;
            await fetch(`${usersUrl}/${userRecordId}`, {
              method: 'PATCH',
              headers: airtableHeaders(),
              body: JSON.stringify({
                fields: { consent_version: version },
              }),
            });
          }
        }
      } catch (err) {
        console.warn('[consent/save] Users consent_version update failed (non-blocking):', err);
      }
    }

    return res.status(200).json({
      success: true,
      record_id: recordId,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[consent/save] Error:', errMsg);
    // best-effort: still return 200
    return res.status(200).json({ success: true });
  }
}
