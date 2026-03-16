// ═══════════════════════════════════════════════════════════════
//  POST /api/survey-v2/save-result
//  Persist v2 Opus recommendation + survey metadata to Airtable
//  Table: SurveyV2_Results (auto-created if needed)
//  Based on SESSION 13 pipeline architecture
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  Demographics,
  SafetyFlag,
  SurveyLang,
  BudgetSelection,
  ManagementFrequency,
  EventInfo,
  LocationPreference,
} from '@/types/survey-v2';
import type {
  OpusRecommendationOutput,
} from './final-recommendation';
import { findOrCreateUser, updateStage } from '@/services/crm-service';

// ─── Airtable Config ─────────────────────────────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = 'SurveyV2_Results';
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

// ─── Request / Response Types ────────────────────────────────

export interface SaveResultRequest {
  run_id: string;
  // Survey state snapshot
  demographics: Demographics;
  lang: SurveyLang;
  safety_flags: SafetyFlag[];
  open_question_raw: string;
  chip_responses: Record<string, string>;
  // Opus output
  recommendation: OpusRecommendationOutput;
  // API metadata
  model: string;
  usage: { input_tokens: number; output_tokens: number };
  // Phase 2 fields
  budget?: BudgetSelection | null;
  stay_duration?: number | null;
  management_frequency?: ManagementFrequency | null;
  event_info?: EventInfo | null;
  location_preference?: LocationPreference | null;
  // Auth context (optional — from Firebase)
  user_id?: string;
  user_email?: string;
}

export interface SaveResultResponse {
  success: boolean;
  airtable_record_id?: string;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────

/** Truncate to Airtable's 100k char long-text limit */
function truncJSON(obj: unknown, maxLen = 90_000): string {
  const raw = JSON.stringify(obj) ?? '';
  return raw.length > maxLen ? raw.slice(0, maxLen) + '...[TRUNCATED]' : raw;
}

/** Extract top device names for quick Airtable querying */
function topDeviceNames(rec: OpusRecommendationOutput): string {
  return (rec.ebd_recommendations || [])
    .slice(0, 5)
    .map((d) => d.device_name)
    .join(', ');
}

/** Extract top injectable names */
function topInjectableNames(rec: OpusRecommendationOutput): string {
  return (rec.injectable_recommendations || [])
    .slice(0, 5)
    .map((i) => i.name)
    .join(', ');
}

/** Extract safety flag types (SafetyFlag is a string union, not an object) */
function safetyFlagSummary(flags: SafetyFlag[]): string {
  if (!flags || flags.length === 0) return 'NONE';
  return flags.join(', ');
}

/** Classify danger vs warning */
function hasDangerFlag(flags: SafetyFlag[]): boolean {
  const DANGER_TYPES: SafetyFlag[] = ['SAFETY_ISOTRETINOIN', 'SAFETY_ANTICOAGULANT', 'SAFETY_PREGNANCY'];
  return flags.some((f) => DANGER_TYPES.includes(f));
}

// ─── Main Handler ────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveResultResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // ── Validate env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('[save-result] Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
    return res.status(500).json({
      success: false,
      error: 'Airtable configuration missing',
    });
  }

  // ── Parse body
  const body = req.body as SaveResultRequest;

  if (!body.run_id || !body.recommendation || !body.demographics) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: run_id, recommendation, demographics',
    });
  }

  // ── Build Airtable record fields
  // Flat fields for quick filtering + JSON blobs for full data
  const fields: Record<string, unknown> = {
    // Identifiers
    run_id: body.run_id,
    created_at: new Date().toISOString(),

    // Demographics (flat for filtering)
    patient_country: body.demographics.detected_country,
    patient_age_range: body.demographics.d_age,
    patient_gender: body.demographics.d_gender,
    survey_lang: body.lang,

    // Safety summary (flat)
    safety_flags_summary: safetyFlagSummary(body.safety_flags),
    has_danger_flag: hasDangerFlag(body.safety_flags),

    // Top recommendations (flat — for quick Airtable views)
    top_devices: topDeviceNames(body.recommendation),
    top_injectables: topInjectableNames(body.recommendation),
    aesthetic_goal: body.recommendation.patient?.aesthetic_goal || '',

    // Scores snapshot
    device_1_confidence: body.recommendation.ebd_recommendations?.[0]?.confidence ?? null,
    device_1_name: body.recommendation.ebd_recommendations?.[0]?.device_name ?? '',

    // API metadata
    model_used: body.model,
    input_tokens: body.usage?.input_tokens ?? 0,
    output_tokens: body.usage?.output_tokens ?? 0,
    total_tokens: (body.usage?.input_tokens ?? 0) + (body.usage?.output_tokens ?? 0),

    // Open question (raw text)
    open_question_raw: (body.open_question_raw || '').slice(0, 5000),

    // Full JSON blobs (Long Text fields in Airtable)
    recommendation_json: truncJSON(body.recommendation),
    demographics_json: truncJSON(body.demographics),
    safety_flags_json: truncJSON(body.safety_flags),
    chip_responses_json: truncJSON(body.chip_responses),
    doctor_tab_json: truncJSON(body.recommendation?.doctor_tab),
    treatment_plan_json: truncJSON(body.recommendation?.treatment_plan),

    // Phase 2 fields (optional — only sent if non-null)
    ...(body.budget ? {
      budget_range: body.budget.range,
      budget_type: body.budget.type,
    } : {}),
    ...(body.stay_duration != null ? { stay_duration: body.stay_duration } : {}),
    ...(body.management_frequency ? { management_frequency: body.management_frequency } : {}),
    ...(body.event_info ? {
      event_type: body.event_info.type,
      event_date: body.event_info.date || null,
    } : {}),
    ...(body.location_preference ? { location_preference: body.location_preference } : {}),

    // Auth (anonymized in Airtable — store hash prefix only)
    user_id_prefix: body.user_id ? body.user_id.slice(0, 8) + '...' : '',
  };

  // ── POST to Airtable REST API
  try {
    const airtableRes = await fetch(AIRTABLE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!airtableRes.ok) {
      const errBody = await airtableRes.text();
      console.error('[save-result] Airtable error:', airtableRes.status, errBody);

      // If table doesn't exist yet, return a helpful message
      if (airtableRes.status === 404) {
        return res.status(500).json({
          success: false,
          error: `Airtable table "${AIRTABLE_TABLE_NAME}" not found. Please create it first. Fields needed: ${Object.keys(fields).join(', ')}`,
        });
      }

      // If field doesn't exist, Airtable returns 422
      if (airtableRes.status === 422) {
        return res.status(500).json({
          success: false,
          error: `Airtable schema mismatch (422). Some fields may not exist in "${AIRTABLE_TABLE_NAME}". Details: ${errBody}`,
        });
      }

      return res.status(500).json({
        success: false,
        error: `Airtable API error: ${airtableRes.status}`,
      });
    }

    const result = await airtableRes.json();
    const recordId = result.id as string;

    console.log(`[save-result] ✅ Saved run_id=${body.run_id} → Airtable record=${recordId}`);

    // ── CRM Integration (best-effort — never blocks survey save) ──
    try {
      const crmUser = await findOrCreateUser({
        email: body.user_email,
        firebase_uid: body.user_id,
        country: body.demographics.detected_country,
        lang: body.lang,
      });

      await updateStage(crmUser.airtable_id, 'survey_completed');

      // Link SurveyV2_Results record to Users via crm_user_id field
      try {
        await fetch(
          `${AIRTABLE_URL}/${recordId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: { crm_user_id: crmUser.airtable_id },
            }),
          }
        );
      } catch (linkErr) {
        console.error('[save-result] CRM link update failed (non-blocking):', linkErr);
      }

      console.log(`[save-result] CRM updated: user=${crmUser.airtable_id} stage=survey_completed`);
    } catch (crmErr) {
      // CRM failure must NOT block the survey save response
      console.error('[save-result] CRM update failed (non-blocking):', crmErr);
    }

    return res.status(200).json({
      success: true,
      airtable_record_id: recordId,
    });
  } catch (err) {
    console.error('[save-result] Network error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to connect to Airtable API',
    });
  }
}
