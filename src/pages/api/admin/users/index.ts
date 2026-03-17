// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/users
//  Phase 2 (G-5): 사용자 목록 조회 (admin 전용)
//
//  Returns: list of users with role, email, name, stage, dates
//  Auth: admin only
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { NextApiResponse } from 'next';
import { apiRoleGuard, type AuthenticatedRequest } from '@/lib/apiRoleGuard';

// ─── Airtable Config ─────────────────────────────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY ?? '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? '';
const USERS_TABLE = 'Users';

function usersUrl(): string {
  return `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(USERS_TABLE)}`;
}

function airtableHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// ─── Types ───────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  stage: string;
  firebaseUid: string;
  country: string;
  language: string;
  createdAt: string;
  lastActivityAt: string;
}

interface UsersListResponse {
  ok: true;
  users: AdminUser[];
  total: number;
}

interface UsersErrorResponse {
  ok: false;
  error: string;
}

// ─── Airtable Types ─────────────────────────────────────────

interface AirtableUserFields {
  email?: string;
  name?: string;
  role?: string;
  stage?: string;
  firebase_uid?: string;
  country?: string;
  language?: string;
  created_at?: string;
  first_survey_at?: string;
  last_activity_at?: string;
}

interface AirtableUserRecord {
  id: string;
  fields: AirtableUserFields;
}

interface AirtableListResponse {
  records: AirtableUserRecord[];
  offset?: string;
}

// ─── Handler ────────────────────────────────────────────────

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<UsersListResponse | UsersErrorResponse>,
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
    const url = `${usersUrl()}?sort[0][field]=created_at&sort[0][direction]=desc&maxRecords=200`;
    const fetchRes = await fetch(url, { headers: airtableHeaders() });

    if (!fetchRes.ok) {
      console.error('[admin/users] Airtable fetch failed:', fetchRes.status);
      res.status(502).json({ ok: false, error: 'Failed to fetch users' });
      return;
    }

    const data = (await fetchRes.json()) as AirtableListResponse;

    const users: AdminUser[] = data.records.map((r) => ({
      id: r.id,
      email: r.fields.email ?? '',
      name: r.fields.name ?? '',
      role: r.fields.role ?? 'patient',
      stage: r.fields.stage ?? '',
      firebaseUid: r.fields.firebase_uid ?? '',
      country: r.fields.country ?? '',
      language: r.fields.language ?? '',
      createdAt: r.fields.created_at ?? r.fields.first_survey_at ?? '',
      lastActivityAt: r.fields.last_activity_at ?? '',
    }));

    res.status(200).json({
      ok: true,
      users,
      total: users.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[admin/users] Error:', msg);
    res.status(500).json({ ok: false, error: msg });
  }
}

export default apiRoleGuard(handler, ['admin']);
