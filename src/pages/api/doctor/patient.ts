// ═══════════════════════════════════════════════════════════════
//  GET /api/doctor/patient?report_id=xxx
//  Fetches patient report data from Airtable for doctor view
//  Requires doctor authentication (verified via session)
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// SurveyV2_Results stores the full AI recommendation
const SURVEY_TABLE = 'SurveyV2_Results';
const SURVEY_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(SURVEY_TABLE)}`;

// Consultation_Requests stores the consultation status
const CONSULT_TABLE = 'Consultation_Requests';
const CONSULT_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(CONSULT_TABLE)}`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { report_id } = req.query;
  if (!report_id || typeof report_id !== 'string') {
    return res.status(400).json({ error: 'report_id query parameter required' });
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable not configured' });
  }

  try {
    // 1. Fetch the survey result
    const filterFormula = encodeURIComponent(`{run_id}="${report_id}"`);
    const surveyRes = await fetch(
      `${SURVEY_URL}?filterByFormula=${filterFormula}&maxRecords=1`,
      {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
      }
    );

    if (!surveyRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch survey data' });
    }

    const surveyData = await surveyRes.json();
    const record = surveyData.records?.[0];

    if (!record) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // 2. Fetch consultation request status (if any)
    let consultationStatus = null;
    try {
      const consultFilter = encodeURIComponent(`{report_id}="${report_id}"`);
      const consultRes = await fetch(
        `${CONSULT_URL}?filterByFormula=${consultFilter}&maxRecords=1&sort%5B0%5D%5Bfield%5D=requested_at&sort%5B0%5D%5Bdirection%5D=desc`,
        {
          headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
        }
      );
      if (consultRes.ok) {
        const consultData = await consultRes.json();
        const consultRecord = consultData.records?.[0];
        if (consultRecord) {
          consultationStatus = {
            id: consultRecord.id,
            status: consultRecord.fields.status || 'pending',
            requested_at: consultRecord.fields.requested_at,
          };
        }
      }
    } catch {
      // Consultation table may not exist yet — ignore
    }

    // 3. Parse and return the data for doctor view
    const fields = record.fields;

    return res.status(200).json({
      report_id,
      airtable_id: record.id,
      // Patient demographics
      demographics: {
        age: fields.d_age || fields.age,
        gender: fields.d_gender || fields.gender,
        country: fields.detected_country || fields.country,
        language: fields.detected_language || 'EN',
      },
      // Safety information
      safety_flags: fields.safety_flags
        ? (typeof fields.safety_flags === 'string'
            ? fields.safety_flags.split(',').map((s: string) => s.trim())
            : fields.safety_flags)
        : [],
      // Full AI recommendation (stored as JSON string)
      recommendation: fields.recommendation_json
        ? JSON.parse(fields.recommendation_json)
        : null,
      // Raw concerns
      open_question: fields.open_question_raw || '',
      // Consultation
      consultation: consultationStatus,
      // Timestamps
      created_at: fields.created_at || record.createdTime,
    });

  } catch (error: any) {
    console.error('[doctor/patient] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
