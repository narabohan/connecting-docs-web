import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appS8kd8H48DMYXct';
const TABLE_ID = 'Recommendation_Run'; // Use name for clarity if possible, or tblAv5eoTae4Al5zy

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(BASE_ID);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { runId } = req.query;

    if (!runId || typeof runId !== 'string') {
        return res.status(400).json({ error: 'runId is required' });
    }

    // Mock handling for dev/test
    if (runId.startsWith('mock_')) {
        return res.status(200).json({
            runId,
            status: 'pending',
            why_cat_KO: null,
            why_cat_EN: null,
            booster_delivery_json: null
        });
    }

    try {
        const record = await base(TABLE_ID).find(runId);
        const fields = record.fields;

        // Construction of the why_cat mapping for the frontend state
        const whyCatKO: Record<string, string> = {};
        const whyCatEN: Record<string, string> = {};

        const rank1Id = fields.rank_1_category_id as string;
        const rank2Id = fields.rank_2_category_id as string;
        const rank3Id = fields.rank_3_category_id as string;

        if (rank1Id && fields.why_cat1_KO) whyCatKO[rank1Id] = fields.why_cat1_KO as string;
        if (rank2Id && fields.why_cat2_KO) whyCatKO[rank2Id] = fields.why_cat2_KO as string;
        if (rank3Id && fields.why_cat3_KO) whyCatKO[rank3Id] = fields.why_cat3_KO as string;

        if (rank1Id && fields.why_cat1_EN) whyCatEN[rank1Id] = fields.why_cat1_EN as string;
        if (rank2Id && fields.why_cat2_EN) whyCatEN[rank2Id] = fields.why_cat2_EN as string;
        if (rank3Id && fields.why_cat3_EN) whyCatEN[rank3Id] = fields.why_cat3_EN as string;

        // Determination of status based on async fields completion
        const hasWhyCat = !!(fields.why_cat1_KO);
        const hasBoosterDelivery = !!fields.booster_delivery_json;

        const status = hasWhyCat && hasBoosterDelivery
            ? 'complete'
            : (hasWhyCat || hasBoosterDelivery)
                ? 'partial'
                : 'pending';

        return res.status(200).json({
            runId,
            status,
            why_cat_KO: Object.keys(whyCatKO).length > 0 ? JSON.stringify(whyCatKO) : null,
            why_cat_EN: Object.keys(whyCatEN).length > 0 ? JSON.stringify(whyCatEN) : null,
            booster_delivery_json: fields.booster_delivery_json || null,
            category_image_urls: fields.category_image_urls || null,
            radar_score_json: fields.radar_score_json || null,
        });

    } catch (error: any) {
        if (error.statusCode === 404) {
            return res.status(404).json({ error: 'Run not found' });
        }
        console.error('[get-run] Airtable fetch error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
