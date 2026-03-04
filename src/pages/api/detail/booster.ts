/**
 * GET /api/detail/booster?id=recXXX
 * Returns detailed data for a single Skin_booster record.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'id is required' });

    try {
        const rec = await base('Skin_booster').find(id);

        return res.status(200).json({
            booster_name: String(rec.get('booster_name') || ''),
            canonical_role: rec.get('canonical_role') as string || null,
            Mechanism: rec.get('Mechanism') as string || null,
            Indication: rec.get('Indication') as string || null,
            Protocol: rec.get('Protocol') as string || null,
            Description: rec.get('Description') as string || null,
            injection_target_layer: rec.get('injection_target_layer') as string || null,
            key_value: rec.get('key_value') as string || null,
        });
    } catch (error: any) {
        console.error('[detail/booster]', error);
        return res.status(404).json({ error: 'Booster not found' });
    }
}
