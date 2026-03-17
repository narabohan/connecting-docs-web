// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/reports
//  Phase 2 (G-5): 전체 리포트 목록 조회 (admin 전용)
//
//  Returns: list of reports with id, date, status, patient info
//  Auth: admin only
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { NextApiResponse } from 'next';
import { apiRoleGuard, type AuthenticatedRequest } from '@/lib/apiRoleGuard';

// ─── Airtable Config ─────────────────────────────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY ?? '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? '';
const REPORTS_TABLE = 'Reports';

function reportsUrl(): string {
  return `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(REPORTS_TABLE)}`;
}

function airtableHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// ─── Types ───────────────────────────────────────────────────

interface AdminReport {
  id: string;
  date: string;
  status: string;
  title: string;
  primaryGoal: string;
  skinType: string;
  topRecommendation: string;
  matchScore: number | null;
}

interface ReportsListResponse {
  ok: true;
  reports: AdminReport[];
  total: number;
}

interface ReportsErrorResponse {
  ok: false;
  error: string;
}

// ─── Airtable Types ─────────────────────────────────────────

interface AirtableReportFields {
  Created_at?: string;
  created_at?: string;
  Status?: string;
  Title?: string;
  Output_JSON?: string;
  Input_JSON?: string;
}

interface AirtableReportRecord {
  id: string;
  fields: AirtableReportFields;
}

interface AirtableListResponse {
  records: AirtableReportRecord[];
  offset?: string;
}

// ─── Parse Helpers ───────────────────────────────────────────

interface ParsedRank {
  protocol?: string;
  score?: number;
}

interface ParsedInput {
  primaryGoal?: string;
  skinType?: string;
}

function safeParseOutputJson(jsonStr: string | undefined): ParsedRank {
  if (!jsonStr) return {};
  try {
    const parsed = JSON.parse(jsonStr) as { rank1?: ParsedRank };
    return parsed.rank1 ?? {};
  } catch {
    return {};
  }
}

function safeParseInputJson(jsonStr: string | undefined): ParsedInput {
  if (!jsonStr) return {};
  try {
    return JSON.parse(jsonStr) as ParsedInput;
  } catch {
    return {};
  }
}

// ─── Handler ────────────────────────────────────────────────

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ReportsListResponse | ReportsErrorResponse>,
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
    const fieldsParam = ['Created_at', 'created_at', 'Status', 'Title', 'Output_JSON', 'Input_JSON']
      .map((f) => `fields%5B%5D=${encodeURIComponent(f)}`)
      .join('&');
    const url = `${reportsUrl()}?${fieldsParam}&sort%5B0%5D%5Bfield%5D=Created_at&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=200`;

    const fetchRes = await fetch(url, { headers: airtableHeaders() });

    if (!fetchRes.ok) {
      console.error('[admin/reports] Airtable fetch failed:', fetchRes.status);
      res.status(502).json({ ok: false, error: 'Failed to fetch reports' });
      return;
    }

    const data = (await fetchRes.json()) as AirtableListResponse;

    const reports: AdminReport[] = data.records.map((r) => {
      const rank1 = safeParseOutputJson(r.fields.Output_JSON);
      const input = safeParseInputJson(r.fields.Input_JSON);

      return {
        id: r.id,
        date: r.fields.Created_at ?? r.fields.created_at ?? '',
        status: r.fields.Status ?? 'completed',
        title: r.fields.Title ?? `Report ${r.id.slice(0, 8)}`,
        primaryGoal: input.primaryGoal ?? '',
        skinType: input.skinType ?? '',
        topRecommendation: rank1.protocol ?? '',
        matchScore: typeof rank1.score === 'number' ? rank1.score : null,
      };
    });

    res.status(200).json({
      ok: true,
      reports,
      total: reports.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[admin/reports] Error:', msg);
    res.status(500).json({ ok: false, error: msg });
  }
}

export default apiRoleGuard(handler, ['admin']);
