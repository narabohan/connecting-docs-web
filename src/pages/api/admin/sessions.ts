// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/sessions
//  Phase 2 (G-5): 세션 로그 조회 (admin 전용)
//
//  SurveyV2_Results 테이블에서 최근 세션 목록 조회
//  Auth: admin only
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { NextApiResponse } from 'next';
import { apiRoleGuard, type AuthenticatedRequest } from '@/lib/apiRoleGuard';

// ─── Airtable Config ─────────────────────────────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY ?? '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? '';
const SESSIONS_TABLE = 'SurveyV2_Results';

function sessionsUrl(): string {
  return `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(SESSIONS_TABLE)}`;
}

function airtableHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// ─── Types ───────────────────────────────────────────────────

interface AdminSession {
  id: string;
  runId: string;
  createdAt: string;
  country: string;
  language: string;
  aestheticGoal: string;
  hasDangerFlag: boolean;
  topDevice: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  completed: boolean;
}

interface SessionsListResponse {
  ok: true;
  sessions: AdminSession[];
  total: number;
}

interface SessionsErrorResponse {
  ok: false;
  error: string;
}

// ─── Airtable Types ─────────────────────────────────────────

interface AirtableSessionFields {
  run_id?: string;
  created_at?: string;
  patient_country?: string;
  survey_lang?: string;
  aesthetic_goal?: string;
  has_danger_flag?: boolean;
  device_1_name?: string;
  model_used?: string;
  input_tokens?: number;
  output_tokens?: number;
  recommendation_json?: string;
}

interface AirtableSessionRecord {
  id: string;
  fields: AirtableSessionFields;
}

interface AirtableListResponse {
  records: AirtableSessionRecord[];
  offset?: string;
}

// ─── Handler ────────────────────────────────────────────────

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<SessionsListResponse | SessionsErrorResponse>,
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    res.status(500).json({ ok: false, error: 'Airtable not configured' });
    return;
  }

  try {
    const fields = [
      'run_id', 'created_at', 'patient_country', 'survey_lang',
      'aesthetic_goal', 'has_danger_flag', 'device_1_name',
      'model_used', 'input_tokens', 'output_tokens', 'recommendation_json',
    ];
    const fieldsParam = fields
      .map((f) => `fields%5B%5D=${encodeURIComponent(f)}`)
      .join('&');
    const url = `${sessionsUrl()}?${fieldsParam}&sort%5B0%5D%5Bfield%5D=created_at&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=200`;

    const fetchRes = await fetch(url, { headers: airtableHeaders() });

    if (!fetchRes.ok) {
      console.error('[admin/sessions] Airtable fetch failed:', fetchRes.status);
      res.status(502).json({ ok: false, error: 'Failed to fetch sessions' });
      return;
    }

    const data = (await fetchRes.json()) as AirtableListResponse;

    const sessions: AdminSession[] = data.records.map((r) => ({
      id: r.id,
      runId: r.fields.run_id ?? '',
      createdAt: r.fields.created_at ?? '',
      country: r.fields.patient_country ?? '',
      language: r.fields.survey_lang ?? '',
      aestheticGoal: r.fields.aesthetic_goal ?? '',
      hasDangerFlag: r.fields.has_danger_flag === true,
      topDevice: r.fields.device_1_name ?? '',
      modelUsed: r.fields.model_used ?? '',
      inputTokens: r.fields.input_tokens ?? 0,
      outputTokens: r.fields.output_tokens ?? 0,
      // completed = has recommendation_json content
      completed: Boolean(r.fields.recommendation_json && r.fields.recommendation_json.length > 10),
    }));

    res.status(200).json({
      ok: true,
      sessions,
      total: sessions.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[admin/sessions] Error:', msg);
    res.status(500).json({ ok: false, error: msg });
  }
}

export default apiRoleGuard(handler, ['admin']);
