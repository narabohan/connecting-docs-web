import { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { id } = req.query; // id is runId
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing or invalid runId' });

    try {
        // --- Step 1: Fetch Recommendation_Run record by runId ---
        let rrRec: any;
        try {
            rrRec = await base('Recommendation_Run').find(id);
        } catch (e: any) {
            if (e.statusCode === 404) {
                return res.status(200).json({ error: 'recommendation_not_ready' });
            }
            throw e;
        }

        const rrf = rrRec.fields || {};
        const status = rrf.status;
        const rank1CatId = (rrf.rank_1_category_id as string) || '';
        const rank2CatId = (rrf.rank_2_category_id as string) || '';
        const rank3CatId = (rrf.rank_3_category_id as string) || '';

        // --- Step 2: Check status ---
        if (status === 'error') {
            // Background function failed — stop polling, show error
            return res.status(200).json({ error: 'recommendation_failed' });
        }
        if (!rank1CatId && !rank2CatId && !rank3CatId) {
            // Still processing — keep polling
            return res.status(200).json({ error: 'recommendation_not_ready' });
        }

        // --- Step 3: Fetch EBD_Category for rank1/rank2/rank3 ---
        const categoryIdsToFetch = Array.from(new Set([rank1CatId, rank2CatId, rank3CatId].filter(Boolean)));
        let categoryRecords: any[] = [];

        if (categoryIdsToFetch.length > 0) {
            const catFormulas = categoryIdsToFetch.map(cId => `{category_id}="${cId}"`);
            const catResponse = await base('EBD_Category').select({
                filterByFormula: `OR(${catFormulas.join(',')})`,
                fields: [
                    'category_id', 'category_display_name', 'category_description',
                    'best_primary_indication', 'avg_pain_level', 'avg_downtime', 'recommended_sessions',
                    'session_interval_weeks', 'budget_tier', 'preferred_booster_roles',
                    'booster_pairing_note_KO', 'booster_pairing_note_EN',
                    'category_image', 'reason_why_EN', 'EBD_Device'
                ]
            }).all();
            categoryRecords = catResponse.map(r => ({ record_id: r.id, ...r.fields }));
        }

        // --- Step 4: Fetch EBD_Device ---
        const top10DevicesStr = (rrf.top10_device_ids as string) || '';
        const deviceIds = top10DevicesStr.split(',').map(s => s.trim()).filter(Boolean);
        let deviceRecords: any[] = [];

        if (deviceIds.length > 0) {
            const devFormulas = deviceIds.map(dId => `{device_id}="${dId}"`);
            const devResponse = await base('EBD_Device').select({
                filterByFormula: `OR(${devFormulas.join(',')})`,
                fields: [
                    'device_id', 'device_name', 'primary_indication', 'secondary_indication',
                    'avg_downtime_days', 'avg_pain_level', 'trend_score', 'brand_tier',
                    'clinical_evidence_score', 'signature_technology', 'clinical_charactor',
                    'reason_why', 'evidence_basis', 'launch_year'
                ]
            }).all();
            deviceRecords = devResponse.map(r => ({ record_id: r.id, ...r.fields }));
        }

        // --- Step 5: Fetch Skin_booster ---
        const top5BoostersStr = (rrf.top5_booster_ids as string) || '';
        const boosterIds = top5BoostersStr.split(',').map(s => s.trim()).filter(Boolean);
        let boosterRecords: any[] = [];

        if (boosterIds.length > 0) {
            const boosterFormulas = boosterIds.map(bId => `{booster_id}="${bId}"`);
            const boostResponse = await base('Skin_booster').select({
                filterByFormula: `OR(${boosterFormulas.join(',')})`,
                fields: [
                    'booster_id', 'booster_name', 'canonical_role', 'primary_effect', 'secondary_effect',
                    'target_layer', 'key_value', 'product_page_url'
                ]
            }).all();
            boosterRecords = boostResponse.map(r => ({ record_id: r.id, ...r.fields }));
        }

        // Helper to build rank output mapping devices and boosters
        const buildRank = (catId: string, whyKO: string, whyEN: string) => {
            if (!catId) return null;
            const category = categoryRecords.find(c => c.category_id === catId);
            if (!category) return null;

            // Link devices via the Airtable linked record IDs in category.EBD_Device
            const categoryDeviceRecordIds = (category.EBD_Device as string[]) || [];
            const rankDevices = deviceRecords.filter(d => categoryDeviceRecordIds.includes(d.record_id));

            // Link boosters by comparing category's preferred_booster_roles to booster's canonical_role
            const preferredRoles = (category.preferred_booster_roles as string || '').toLowerCase();
            const rankBoosters = boosterRecords.filter(b =>
                (b.canonical_role as string || '').toLowerCase().split(',').some(role => preferredRoles.includes(role.trim())) || preferredRoles.includes((b.canonical_role as string || '').toLowerCase())
            );

            // Clean internal tracking IDs
            const cleanObj = (obj: any) => { const { record_id, EBD_Device, ...rest } = obj; return rest; };

            return {
                category: cleanObj(category),
                why_KO: whyKO,
                why_EN: whyEN,
                devices: rankDevices.map(cleanObj),
                boosters: rankBoosters.map(cleanObj)
            };
        };

        const rank1 = buildRank(rank1CatId, rrf.why_cat1_KO as string, rrf.why_cat1_EN as string);
        const rank2 = buildRank(rank2CatId, rrf.why_cat2_KO as string, rrf.why_cat2_EN as string);
        const rank3 = buildRank(rank3CatId, rrf.why_cat3_KO as string, rrf.why_cat3_EN as string);

        let surveyMeta = {};
        try {
            if (rrf.survey_meta_json) {
                surveyMeta = JSON.parse(rrf.survey_meta_json as string);
            }
        } catch (e) {
            console.error('Failed to parse survey_meta_json', e);
        }

        // --- Step 6: Build final API response ---
        const apiResponse = {
            runId: id,
            rank1: rank1 || null,
            rank2: rank2 || null,
            rank3: rank3 || null,
            skinAnalysis: {
                ko: rrf.patient_summary as string || '',
                en: rrf.patient_friendly_summary as string || ''
            },
            whatToAvoid: {
                ko: rrf.clinical_warning as string || ''
            },
            overallDirection: {
                ko: rrf.comprehensive_analysis as string || ''
            },
            doctorQuestion: {
                ko: rrf.doctor_question_ko as string || '',
                en: rrf.doctor_question_en as string || ''
            },
            surveyMeta
        };

        return res.status(200).json(apiResponse);

    } catch (error: any) {
        console.error('[Report V3 API Error]', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
