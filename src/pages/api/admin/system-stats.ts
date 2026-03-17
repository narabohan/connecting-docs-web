// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/system-stats
//  Phase 2 (G-5): 시스템 전체 통계 집계
//
//  Airtable 병렬 조회: Users, Reports, TreatmentPlans, EmailLogs
//  Auth: admin only
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { NextApiResponse } from 'next';
import { apiRoleGuard, type AuthenticatedRequest } from '@/lib/apiRoleGuard';

// ─── Airtable Config ─────────────────────────────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY ?? '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? '';

function tableUrl(tableName: string): string {
  return `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
}

function airtableHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// ─── Types ───────────────────────────────────────────────────

interface SystemStats {
  totalUsers: number;
  todaySignups: number;
  totalReports: number;
  todayReports: number;
  totalPlans: number;
  approvalRate: number;
  emailSuccessRate: number;
  activeSessionCount: number;
}

interface SystemStatsResponse {
  ok: true;
  stats: SystemStats;
}

interface SystemStatsErrorResponse {
  ok: false;
  error: string;
}

// ─── Airtable Record Types ──────────────────────────────────

interface AirtableRecord {
  id: string;
  fields: Record<string, string | number | undefined>;
}

interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

// ─── Helpers ────────────────────────────────────────────────

function isToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
}

/**
 * Fetch all records from an Airtable table (with pagination).
 * Returns empty array on failure (best-effort).
 */
async function fetchAllRecords(
  tableName: string,
  fields: string[],
  maxRecords: number = 200,
): Promise<AirtableRecord[]> {
  const fieldsParam = fields.map((f) => `fields%5B%5D=${encodeURIComponent(f)}`).join('&');
  const url = `${tableUrl(tableName)}?${fieldsParam}&maxRecords=${maxRecords}`;

  try {
    const res = await fetch(url, { headers: airtableHeaders() });
    if (!res.ok) {
      console.warn(`[system-stats] Failed to fetch ${tableName}: ${res.status}`);
      return [];
    }
    const data = (await res.json()) as AirtableListResponse;
    return data.records;
  } catch (err) {
    console.warn(`[system-stats] Error fetching ${tableName}:`, err instanceof Error ? err.message : 'unknown');
    return [];
  }
}

// ─── Handler ────────────────────────────────────────────────

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<SystemStatsResponse | SystemStatsErrorResponse>,
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
    // Parallel fetch from 4 tables
    const [users, reports, plans, emailLogs] = await Promise.all([
      fetchAllRecords('Users', ['email', 'role', 'first_survey_at', 'created_at']),
      fetchAllRecords('Reports', ['report_id', 'created_at']),
      fetchAllRecords('TreatmentPlans', ['plan_id', 'status', 'created_at']),
      fetchAllRecords('EmailLogs', ['emailId', 'status', 'createdAt']),
    ]);

    // ── Users stats
    const totalUsers = users.length;
    const todaySignups = users.filter((u) => {
      const created = (u.fields.created_at ?? u.fields.first_survey_at) as string | undefined;
      return isToday(created);
    }).length;

    // ── Reports stats
    const totalReports = reports.length;
    const todayReports = reports.filter((r) =>
      isToday(r.fields.created_at as string | undefined),
    ).length;

    // ── Plans stats
    const totalPlans = plans.length;
    const approvedPlans = plans.filter((p) =>
      p.fields.status === 'approved' || p.fields.status === 'sent',
    ).length;
    const approvalRate = totalPlans > 0
      ? Math.round((approvedPlans / totalPlans) * 100)
      : 0;

    // ── Email stats
    const totalEmails = emailLogs.length;
    const successEmails = emailLogs.filter((e) => e.fields.status === 'sent').length;
    const emailSuccessRate = totalEmails > 0
      ? Math.round((successEmails / totalEmails) * 100)
      : 0;

    // ── Active sessions (surveys started today)
    const activeSessionCount = users.filter((u) => {
      const surveyAt = u.fields.first_survey_at as string | undefined;
      return isToday(surveyAt);
    }).length;

    res.status(200).json({
      ok: true,
      stats: {
        totalUsers,
        todaySignups,
        totalReports,
        todayReports,
        totalPlans,
        approvalRate,
        emailSuccessRate,
        activeSessionCount,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[system-stats] Error:', msg);
    res.status(500).json({ ok: false, error: msg });
  }
}

export default apiRoleGuard(handler, ['admin']);
