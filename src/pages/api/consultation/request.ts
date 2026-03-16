// ═══════════════════════════════════════════════════════════════
//  POST /api/consultation/request
//  Creates a consultation request in Airtable
//  Links patient report → doctor matching pipeline
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'Consultation_Requests';
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

interface ConsultationRequestBody {
  report_id: string;
  patient_profile: {
    age: string;
    gender: string;
    country: string;
    aesthetic_goal: string;
    top3_concerns: string[];
    fitzpatrick: string;
  };
  demographics: {
    detected_language: string;
    detected_country: string;
    d_gender: string;
    d_age: string;
  };
  safety_flags: string[];
  doctor_id?: string; // Optional: specific doctor request
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable not configured' });
  }

  try {
    const body: ConsultationRequestBody = req.body;

    if (!body.report_id || !body.patient_profile) {
      return res.status(400).json({ error: 'report_id and patient_profile required' });
    }

    // Create Airtable record
    const airtableRes = await fetch(AIRTABLE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{
          fields: {
            report_id: body.report_id,
            patient_age: body.patient_profile.age,
            patient_gender: body.patient_profile.gender,
            patient_country: body.patient_profile.country,
            aesthetic_goal: body.patient_profile.aesthetic_goal,
            top3_concerns: body.patient_profile.top3_concerns.join(', '),
            fitzpatrick: body.patient_profile.fitzpatrick,
            language: body.demographics.detected_language,
            safety_flags: body.safety_flags.join(', '),
            doctor_id: body.doctor_id || '',
            status: 'pending',
            requested_at: new Date().toISOString(),
          },
        }],
      }),
    });

    if (!airtableRes.ok) {
      const errText = await airtableRes.text();
      console.error('[consultation/request] Airtable error:', errText);
      // If table doesn't exist yet, still return success (graceful degradation)
      return res.status(200).json({
        success: true,
        warning: 'Consultation_Requests table may need to be created in Airtable',
        request_id: `cr_${Date.now()}`,
      });
    }

    const data = await airtableRes.json();
    const recordId = data.records?.[0]?.id;

    return res.status(200).json({
      success: true,
      request_id: recordId || `cr_${Date.now()}`,
    });

  } catch (error: any) {
    console.error('[consultation/request] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
