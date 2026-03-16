// ═══════════════════════════════════════════════════════════════
//  GET /api/doctor/consultations
//  Returns consultation requests for the authenticated doctor.
//  Query: ?email=doctor@example.com
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing email parameter' });
  }

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Query Consultation_Requests table
    const filterFormula = encodeURIComponent(`{doctor_id}="${email}"`);
    const sortParam = encodeURIComponent('sort[0][field]=requested_at&sort[0][direction]=desc');
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Consultation_Requests?filterByFormula=${filterFormula}&${sortParam}&maxRecords=20`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });

    if (!response.ok) {
      // Table might not exist yet — return empty
      if (response.status === 404 || response.status === 422) {
        return res.status(200).json({ consultations: [] });
      }
      throw new Error(`Airtable error: ${response.status}`);
    }

    const data = await response.json();

    const consultations = (data.records || []).map((record: any) => ({
      id: record.id,
      report_id: record.fields.report_id || '',
      aesthetic_goal: record.fields.aesthetic_goal || '',
      patient_age: record.fields.patient_age || '',
      patient_gender: record.fields.patient_gender || '',
      patient_country: record.fields.patient_country || '',
      status: record.fields.status || 'pending',
      requested_at: record.fields.requested_at || record.fields.created_at || '',
    }));

    return res.status(200).json({ consultations });
  } catch (error) {
    console.error('[consultations] Error:', error);
    return res.status(200).json({ consultations: [] });
  }
}
