/**
 * GET /api/detail/device?id=recXXX
 * Returns detailed data for a single EBD_Device record.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'id is required' });

    try {
        const rec = await base('EBD_Device').find(id);

        return res.status(200).json({
            device_name: String(rec.get('device_name') || ''),
            key_value: rec.get('key_value') as string || null,
            budget_tier: rec.get('budget_tier') as string || null,
            brand_tier: rec.get('brand_tier') as string || null,
            avg_pain_level: rec.get('avg_pain_level') as string || null,
            launch_year: rec.get('launch_year') as number || null,
            clinical_evidence_score: rec.get('clinical_evidence_score') as number || null,
            evidence_basis: rec.get('evidence_basis') as string || null,
            patient_review_summary: rec.get('patient_review_summary') as string || null,
            trend_score: rec.get('trend_score') as number || null,
            skin_depth_fit: rec.get('skin_depth_fit') as string || null,
        });
    } catch (error: any) {
        console.error('[detail/device]', error);
        return res.status(404).json({ error: 'Device not found' });
    }
}
