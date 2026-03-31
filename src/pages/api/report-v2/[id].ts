// ═══════════════════════════════════════════════════════════════
//  GET /api/report-v2/[id]
//  Fetches report data from Airtable by run_id
//
//  Phase 1: Airtable fallback for useReportData hook
//  When sessionStorage is empty (new tab, shared link, refresh),
//  the client calls this API to load recommendation_json from Airtable.
//
//  Returns: StoredReportPayload-compatible shape
//  Auth: None required (report links are unguessable v2_<timestamp> IDs)
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'SurveyV2_Results';
const TABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

// ─── Response types ──────────────────────────────────────────

interface ReportApiSuccess {
  recommendation: unknown;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
  survey_state: {
    demographics: {
      detected_language: string;
      detected_country: string;
      d_gender: string;
      d_age: string;
    };
    safety_flags: string[];
    open_question_raw: string;
  };
  created_at: string;
}

interface ReportApiError {
  error: string;
}

type ReportApiResponse = ReportApiSuccess | ReportApiError;

// ─── Handler ─────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReportApiResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Report ID required' });
  }

  // Basic ID format validation (v2_<timestamp>)
  if (!id.startsWith('v2_')) {
    return res.status(400).json({ error: 'Invalid report ID format' });
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable not configured' });
  }

  try {
    // ── Fetch from Airtable by run_id ──────────────────────────
    const filterFormula = encodeURIComponent(`{run_id}="${id}"`);
    const airtableRes = await fetch(
      `${TABLE_URL}?filterByFormula=${filterFormula}&maxRecords=1`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      },
    );

    if (!airtableRes.ok) {
      console.error(`[report-v2/${id}] Airtable HTTP ${airtableRes.status}`);
      return res.status(502).json({ error: 'Failed to fetch from database' });
    }

    const airtableData = await airtableRes.json();
    const record = airtableData.records?.[0];

    if (!record) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const fields = record.fields as Record<string, unknown>;

    // ── Parse recommendation_json ────────────────────────────
    const recRaw = fields.recommendation_json;
    if (!recRaw || typeof recRaw !== 'string') {
      return res.status(404).json({ error: 'Report data incomplete — no recommendation found' });
    }

    let recommendation: unknown;
    try {
      recommendation = JSON.parse(recRaw);
    } catch {
      return res.status(500).json({ error: 'Failed to parse recommendation data' });
    }

    // ── Parse demographics ───────────────────────────────────
    // Try demographics_json first, fall back to flat fields
    let demographics = {
      detected_language: (fields.survey_lang as string) || 'EN',
      detected_country: (fields.patient_country as string) || '',
      d_gender: (fields.patient_gender as string) || '',
      d_age: (fields.patient_age_range as string) || '',
    };

    if (fields.demographics_json && typeof fields.demographics_json === 'string') {
      try {
        const parsed = JSON.parse(fields.demographics_json);
        demographics = {
          detected_language: parsed.detected_language || demographics.detected_language,
          detected_country: parsed.detected_country || demographics.detected_country,
          d_gender: parsed.d_gender || demographics.d_gender,
          d_age: parsed.d_age || demographics.d_age,
        };
      } catch {
        // Use flat field fallbacks (already set above)
      }
    }

    // ── Parse safety_flags ───────────────────────────────────
    let safetyFlags: string[] = [];
    if (fields.safety_flags_json && typeof fields.safety_flags_json === 'string') {
      try {
        const parsed = JSON.parse(fields.safety_flags_json);
        if (Array.isArray(parsed)) {
          safetyFlags = parsed;
        }
      } catch {
        // Fall back to safety_flags_summary (comma-separated)
        const summary = fields.safety_flags_summary;
        if (typeof summary === 'string' && summary !== 'NONE') {
          safetyFlags = summary.split(',').map((s: string) => s.trim());
        }
      }
    }

    // ── Build StoredReportPayload-compatible response ─────────
    const payload: ReportApiSuccess = {
      recommendation,
      model: (fields.model_used as string) || 'unknown',
      usage: {
        input_tokens: (fields.input_tokens as number) || 0,
        output_tokens: (fields.output_tokens as number) || 0,
      },
      survey_state: {
        demographics,
        safety_flags: safetyFlags,
        open_question_raw: (fields.open_question_raw as string) || '',
      },
      created_at: (fields.created_at as string) || record.createdTime || '',
    };

    // ── Cache for 5 min (report data doesn't change) ─────────
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return res.status(200).json(payload);
  } catch (err) {
    console.error(`[report-v2/${id}] Error:`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
