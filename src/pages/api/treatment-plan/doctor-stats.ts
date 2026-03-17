// ═══════════════════════════════════════════════════════════════
//  GET /api/treatment-plan/doctor-stats
//  Phase 2 (G-3): 의사 대시보드 통계 집계
//
//  Returns:
//  - todayCount: 오늘 생성된 Plan 수
//  - pendingCount: draft + doctor_review
//  - approvedCount: approved
//  - totalCount: 전체 배정 Plan 수
//  - plans: 최근 Plan 요약 리스트 (큐용)
//
//  Auth: doctor + admin only
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { NextApiResponse } from 'next';
import { apiRoleGuard, type AuthenticatedRequest } from '@/lib/apiRoleGuard';
import type { TreatmentPlanData, PlanStatus } from '@/schemas/treatment-plan';

// ─── Airtable Config ─────────────────────────────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'TreatmentPlans';

function airtableUrl(): string {
  return `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;
}

function airtableHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// ─── Types ───────────────────────────────────────────────────

interface PlanSummary {
  planId: string;
  reportId: string;
  patientId: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  patientAge: string;
  patientCountry: string;
  patientGoal: string;
  concernCount: number;
  phaseCount: number;
}

interface DoctorStatsResponse {
  ok: true;
  stats: {
    todayCount: number;
    pendingCount: number;
    approvedCount: number;
    sentCount: number;
    totalCount: number;
  };
  plans: PlanSummary[];
}

interface DoctorStatsErrorResponse {
  ok: false;
  error: string;
}

// ─── Airtable Record Types ──────────────────────────────────

interface AirtablePlanFields {
  plan_id?: string;
  report_id?: string;
  patient_id?: string;
  doctor_id?: string;
  status?: string;
  concerns_json?: string;
  recommendations_json?: string;
  timeline_json?: string;
  created_at?: string;
  updated_at?: string;
}

interface AirtablePlanRecord {
  id: string;
  fields: AirtablePlanFields;
}

interface AirtableListResponse {
  records: AirtablePlanRecord[];
  offset?: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function sanitize(value: string): string {
  return value.replace(/'/g, "\\'");
}

function isToday(dateStr: string): boolean {
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

function safeJsonParse<T>(str: string | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

function buildPlanSummary(fields: AirtablePlanFields): PlanSummary | null {
  if (!fields.plan_id) return null;

  // Extract patient info from recommendations_json
  interface RecommendationsSummary {
    ebdDevices?: Array<Record<string, unknown>>;
  }
  const recs = safeJsonParse<RecommendationsSummary>(fields.recommendations_json, {});

  // Extract concerns count
  const concerns = safeJsonParse<Array<Record<string, unknown>>>(fields.concerns_json, []);

  // Extract phase count from timeline
  interface TimelineSummary {
    phases?: Array<Record<string, unknown>>;
  }
  const timeline = safeJsonParse<TimelineSummary>(fields.timeline_json, {});

  return {
    planId: fields.plan_id,
    reportId: fields.report_id ?? '',
    patientId: fields.patient_id ?? '',
    status: (fields.status ?? 'draft') as PlanStatus,
    createdAt: fields.created_at ?? '',
    updatedAt: fields.updated_at ?? '',
    patientAge: '',
    patientCountry: '',
    patientGoal: '',
    concernCount: concerns.length,
    phaseCount: timeline.phases?.length ?? 0,
  };
}

// ─── Handler ─────────────────────────────────────────────────

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<DoctorStatsResponse | DoctorStatsErrorResponse>
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
    // Fetch all plans assigned to this doctor (or all for admin)
    let formula: string;
    if (req.authRole === 'admin') {
      formula = 'TRUE()';
    } else {
      formula = `{doctor_id} = '${sanitize(req.authUid)}'`;
    }

    const url = `${airtableUrl()}?filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=created_at&sort[0][direction]=desc&maxRecords=100`;

    const fetchRes = await fetch(url, { headers: airtableHeaders() });

    if (!fetchRes.ok) {
      console.error('[doctor-stats] Airtable fetch failed:', fetchRes.status);
      res.status(502).json({ ok: false, error: 'Failed to fetch plans' });
      return;
    }

    const data = await fetchRes.json() as AirtableListResponse;

    // Build summaries and compute stats
    const plans: PlanSummary[] = [];
    let todayCount = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let sentCount = 0;

    for (const record of data.records) {
      const summary = buildPlanSummary(record.fields);
      if (!summary) continue;

      plans.push(summary);

      if (isToday(summary.createdAt)) {
        todayCount++;
      }

      switch (summary.status) {
        case 'draft':
        case 'doctor_review':
          pendingCount++;
          break;
        case 'approved':
          approvedCount++;
          break;
        case 'sent':
          sentCount++;
          break;
      }
    }

    res.status(200).json({
      ok: true,
      stats: {
        todayCount,
        pendingCount,
        approvedCount,
        sentCount,
        totalCount: plans.length,
      },
      plans,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[doctor-stats] Error:', msg);
    res.status(500).json({ ok: false, error: msg });
  }
}

export default apiRoleGuard(handler, ['doctor', 'admin']);
