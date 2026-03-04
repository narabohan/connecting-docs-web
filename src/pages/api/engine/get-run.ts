import type { NextApiRequest, NextApiResponse } from 'next';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;
const BASE_ID = 'appS8kd8H48DMYXct';
const TABLE_ID = 'tblAv5eoTae4Al5zy'; // Recommendation_Run

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { runId } = req.query;

    if (!runId || typeof runId !== 'string') {
        return res.status(400).json({ error: 'runId is required' });
    }

    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${runId}`,
            {
                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({ error: error.error?.message ?? 'Airtable error' });
        }

        const record = await response.json();
        const fields = record.fields;

        // async 필드 존재 여부로 상태 결정
        // why_cat1_KO 또는 legacy why_cat_KO 둘 중 하나라도 있으면 완료
        const hasWhyCat = !!(
            fields.why_cat1_KO || fields.why_cat_KO_json || fields.why_cat_KO
        );
        const hasBoosterDelivery = !!fields.booster_delivery_json;

        const status = hasWhyCat && hasBoosterDelivery
            ? 'complete'
            : (hasWhyCat || hasBoosterDelivery)
                ? 'partial'
                : 'pending';

        return res.status(200).json({
            runId,
            status,
            // Per-rank KO explanations
            why_cat1_KO: fields.why_cat1_KO ?? null,
            why_cat2_KO: fields.why_cat2_KO ?? null,
            why_cat3_KO: fields.why_cat3_KO ?? null,
            // Per-rank EN explanations
            why_cat1_EN: fields.why_cat1_EN ?? null,
            why_cat2_EN: fields.why_cat2_EN ?? null,
            why_cat3_EN: fields.why_cat3_EN ?? null,
            // Per-rank JP explanations
            why_cat1_JP: fields.why_cat1_JP ?? null,
            why_cat2_JP: fields.why_cat2_JP ?? null,
            why_cat3_JP: fields.why_cat3_JP ?? null,
            // Per-rank CN explanations
            why_cat1_CN: fields.why_cat1_CN ?? null,
            why_cat2_CN: fields.why_cat2_CN ?? null,
            why_cat3_CN: fields.why_cat3_CN ?? null,
            // Legacy fallback (단일 필드) — 하위 호환성 유지
            why_cat_KO: fields.why_cat1_KO ?? fields.why_cat_KO_json ?? fields.why_cat_KO ?? null,
            why_cat_EN: fields.why_cat1_EN ?? fields.why_cat_EN_json ?? fields.why_cat_EN ?? null,
            // 기타 async 필드
            booster_delivery_json: fields.booster_delivery_json ?? null,
            category_image_urls: fields.category_image_urls ?? null,
            radar_score_json: fields.radar_score_json ?? null,
        });

    } catch (error) {
        console.error('[get-run] Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
