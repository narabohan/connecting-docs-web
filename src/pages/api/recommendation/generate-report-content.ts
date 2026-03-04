/**
 * /api/recommendation/generate-report-content
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 4 비동기 콘텐츠 생성 엔드포인트
 *
 * analyze.ts가 fire-and-forget으로 호출 → 병렬 실행:
 *   1. Claude Sonnet  → why_cat1/2/3_KO + EN + JP + CN (4개국어 JSON, 1 call/rank)
 *   2. Gemini Imagen  → category_image_urls (시술 시각화 이미지, optional)
 *   3. Airtable       → booster_delivery_json
 *
 * 결과를 Recommendation_Run 레코드에 패치(PATCH).
 *
 * 필요 환경변수:
 *   ANTHROPIC_API_KEY  ✅ (필수)
 *   GEMINI_API_KEY     🔑 (없으면 이미지 생성 skip)
 *   AIRTABLE_API_KEY   ✅ (필수)
 *   AIRTABLE_BASE_ID   ✅ (필수)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import Anthropic from '@anthropic-ai/sdk';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID!
);
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── 상수 ──────────────────────────────────────────────────────────────────

const RR_TABLE = 'Recommendation_Run';
const CAT_TABLE = 'EBD_Category';
const BOOSTER_TABLE = 'Skin_booster';

// ─── EBD_Category 데이터 로더 ──────────────────────────────────────────────

interface CatDetail {
    rank: number;
    category_id: string;
    category_display_name: string;
    best_primary_indication: string;
    secondary_indications: string[];
    budget_tier: string;
    avg_pain_level: string;
    avg_downtime: string;
    recommended_sessions: number;
    preferred_booster_roles: string;
    booster_pairing_note_KO?: string;
}

async function fetchCatDetails(catId: string, rank: number): Promise<CatDetail | null> {
    try {
        const recs = await base(CAT_TABLE).select({
            filterByFormula: `{category_id} = "${catId}"`,
            maxRecords: 1,
            fields: [
                'category_id', 'category_display_name', 'best_primary_indication',
                'secondary_indications', 'budget_tier', 'avg_pain_level', 'avg_downtime',
                'recommended_sessions', 'preferred_booster_roles', 'booster_pairing_note_KO'
            ]
        }).all();
        if (!recs[0]) return null;
        const r = recs[0];
        return {
            rank,
            category_id: catId,
            category_display_name: String(r.get('category_display_name') || ''),
            best_primary_indication: String(r.get('best_primary_indication') || ''),
            secondary_indications: (r.get('secondary_indications') as string[]) || [],
            budget_tier: String(r.get('budget_tier') || 'Mid'),
            avg_pain_level: String(r.get('avg_pain_level') || ''),
            avg_downtime: String(r.get('avg_downtime') || ''),
            recommended_sessions: Number(r.get('recommended_sessions') || 1),
            preferred_booster_roles: String(r.get('preferred_booster_roles') || ''),
            booster_pairing_note_KO: r.get('booster_pairing_note_KO') as string || undefined,
        };
    } catch { return null; }
}

// ─── [A] Claude → why_cat KO+EN+JP+CN (4개국어 동시 생성) ─────────────────

interface WhyCatAllLangs {
    KO: string;
    EN: string;
    JP: string;
    CN: string;
}

async function generateWhyCatAllLangs(
    cat: CatDetail,
    patientContext: string
): Promise<WhyCatAllLangs> {
    const fallback: WhyCatAllLangs = { KO: '', EN: '', JP: '', CN: '' };

    const prompt = `You are ConnectingDocs AI — a Korean medical aesthetics specialist.

Generate 2-3 sentences in EACH of the 4 languages below explaining why "${cat.category_display_name}" is ranked #${cat.rank} for this patient.

Treatment info:
- Primary indication: ${cat.best_primary_indication}
- Secondary indications: ${cat.secondary_indications.join(', ')}
- Budget tier: ${cat.budget_tier}
- Pain: ${cat.avg_pain_level} | Downtime: ${cat.avg_downtime}
- Recommended sessions: ${cat.recommended_sessions}x

Patient context: ${patientContext}

Rules:
- Connect the patient's specific concern to how this treatment addresses it
- Be clinically precise and patient-friendly
- 2-3 sentences per language, factual only, no marketing language
- KO must be natural Korean; EN natural English; JP natural Japanese; CN natural Simplified Chinese

Return ONLY valid JSON with exactly these 4 keys (no markdown, no extra text):
{"KO":"...한국어 2-3문장...","EN":"...English 2-3 sentences...","JP":"...日本語2-3文...","CN":"...中文2-3句..."}`;

    try {
        const msg = await claude.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 800,
            messages: [{ role: 'user', content: prompt }]
        });

        const raw = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
        if (!raw) return fallback;

        // JSON 추출 (마크다운 코드블럭 감싸진 경우도 처리)
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error(`[why_cat${cat.rank}] JSON parse fail — raw:`, raw.slice(0, 200));
            return fallback;
        }

        const parsed = JSON.parse(jsonMatch[0]) as Partial<WhyCatAllLangs>;
        return {
            KO: parsed.KO || '',
            EN: parsed.EN || '',
            JP: parsed.JP || '',
            CN: parsed.CN || '',
        };
    } catch (e) {
        console.error(`[why_cat${cat.rank}] Claude error:`, e);
        return fallback;
    }
}

// ─── [B] Gemini Imagen → category_image_urls ──────────────────────────────

const TREATMENT_IMAGE_PROMPTS: Record<string, string> = {
    'Skin Booster': 'Close-up of professional skin hydration treatment at Korean aesthetics clinic, glowing dewy skin, soft studio lighting, clean white medical aesthetic',
    'RF Tightening': 'Korean aesthetics professional RF lifting treatment, elegant minimal clinic setting, facial contouring, warm professional lighting',
    'HIFU Lifting': 'Non-invasive facial lifting ultrasound treatment at premium Korean medical aesthetics clinic, patient relaxed, medical professional setting',
    'Laser Treatment': 'Advanced laser skin rejuvenation at Korean dermatology clinic, precise medical procedure, clean clinical environment',
    'MN RF': 'Microneedling RF skin resurfacing treatment, advanced Korean aesthetic technology, clinical precision',
    'Filler': 'Premium dermal filler aesthetic enhancement procedure, Korean medical clinic, natural results focus',
    'Botox': 'Botulinum toxin precision injection, Korean medical aesthetics, subtle natural enhancement',
};

async function generateCategoryImages(cats: CatDetail[]): Promise<Record<string, string>> {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
        console.warn('[category_images] No GEMINI_API_KEY — skipping image generation');
        return {};
    }

    const imageUrls: Record<string, string> = {};

    for (const cat of cats.slice(0, 3)) {
        const matchKey = Object.keys(TREATMENT_IMAGE_PROMPTS).find(k =>
            cat.category_display_name.toLowerCase().includes(k.toLowerCase()) ||
            cat.best_primary_indication.toLowerCase().includes(k.toLowerCase())
        ) || 'Skin Booster';

        const imagePrompt = TREATMENT_IMAGE_PROMPTS[matchKey] +
            ', professional photography, high quality, aesthetic medicine';

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instances: [{ prompt: imagePrompt }],
                        parameters: { sampleCount: 1, aspectRatio: '16:9' }
                    })
                }
            );

            if (!res.ok) {
                console.error(`[Gemini Imagen] Error ${res.status} for ${cat.category_id}`);
                continue;
            }

            const data = await res.json();
            const b64 = data.predictions?.[0]?.bytesBase64Encoded;
            if (b64) {
                imageUrls[`rank${cat.rank}`] = `data:image/png;base64,${b64}`;
            }
        } catch (e) {
            console.error(`[Gemini Imagen] Error for rank${cat.rank}:`, e);
        }
    }

    return imageUrls;
}

// ─── [C] Booster Delivery JSON 생성 ───────────────────────────────────────

async function buildBoosterDeliveryJson(top5BoosterIds: string[]): Promise<object[]> {
    if (!top5BoosterIds.length) return [];

    try {
        const boosterRecs = await base(BOOSTER_TABLE).select({
            filterByFormula: `OR(${top5BoosterIds.map(id => `RECORD_ID()="${id}"`).join(',')})`,
            fields: ['booster_name', 'canonical_role', 'injection_target_layer', 'Mechanism']
        }).all();

        return boosterRecs.map(r => ({
            booster_id: r.id,
            booster_name: String(r.get('booster_name') || ''),
            canonical_role: String(r.get('canonical_role') || ''),
            injection_target_layer: String(r.get('injection_target_layer') || ''),
            mechanism_short: String(r.get('Mechanism') || '').slice(0, 100)
        }));
    } catch { return []; }
}

// ─── Airtable PATCH helper ────────────────────────────────────────────────

async function patchRecommendationRun(runId: string, fields: Record<string, any>) {
    await base(RR_TABLE).update([{ id: runId, fields }]);
}

// ─── Main Handler ──────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { runId } = req.body;
    if (!runId) return res.status(400).json({ error: 'runId required' });

    // Respond immediately — we do the work async
    res.status(202).json({ message: 'Processing started', runId });

    // ── Background execution ───────────────────────────────────────────────
    ;(async () => {
        try {
            console.log(`[generate-report-content] Starting for runId=${runId}`);

            // 1. Fetch Recommendation_Run
            const runRec = await base(RR_TABLE).find(runId);
            const fields = runRec.fields;

            const rank1CatId = String(fields.rank_1_category_id || '');
            const rank2CatId = String(fields.rank_2_category_id || '');
            const rank3CatId = String(fields.rank_3_category_id || '');
            const boosterIdsRaw = String(fields.top5_booster_ids || '');
            const top5BoosterIds = boosterIdsRaw.split(',').map(s => s.trim()).filter(Boolean);

            // Build patient context from existing RR fields
            const patientContext = [
                fields['q1_primary_goal_CANONICAL (from Patients_v1)'] && `Goal: ${fields['q1_primary_goal_CANONICAL (from Patients_v1)']}`,
                fields['q6_pain_tolerance_CANONICAL (from Patients_v1)'] && `Pain tolerance: ${fields['q6_pain_tolerance_CANONICAL (from Patients_v1)']}`,
                fields['q6_downtime_tolerance_CANONICAL (from Patients_v1)'] && `Downtime: ${fields['q6_downtime_tolerance_CANONICAL (from Patients_v1)']}`,
            ].filter(Boolean).join(', ') || 'General patient seeking skin improvement';

            // 2. Fetch category details (parallel)
            const [cat1, cat2, cat3] = await Promise.all([
                rank1CatId ? fetchCatDetails(rank1CatId, 1) : null,
                rank2CatId ? fetchCatDetails(rank2CatId, 2) : null,
                rank3CatId ? fetchCatDetails(rank3CatId, 3) : null,
            ]);

            const activeCats = [cat1, cat2, cat3].filter((c): c is CatDetail => !!c);

            // 3. Run all AI tasks in parallel:
            //    - One Claude call per rank → 4 languages simultaneously
            //    - Gemini image generation
            //    - Booster delivery JSON
            const [langs1, langs2, langs3, imageUrls, boosterDelivery] = await Promise.all([
                cat1 ? generateWhyCatAllLangs(cat1, patientContext) : Promise.resolve({ KO: '', EN: '', JP: '', CN: '' }),
                cat2 ? generateWhyCatAllLangs(cat2, patientContext) : Promise.resolve({ KO: '', EN: '', JP: '', CN: '' }),
                cat3 ? generateWhyCatAllLangs(cat3, patientContext) : Promise.resolve({ KO: '', EN: '', JP: '', CN: '' }),
                generateCategoryImages(activeCats),
                buildBoosterDeliveryJson(top5BoosterIds),
            ]);

            // 4. Patch Recommendation_Run
            const patchFields: Record<string, any> = {};

            // Rank 1
            if (langs1.KO) patchFields['why_cat1_KO'] = langs1.KO;
            if (langs1.EN) patchFields['why_cat1_EN'] = langs1.EN;
            if (langs1.JP) patchFields['why_cat1_JP'] = langs1.JP;
            if (langs1.CN) patchFields['why_cat1_CN'] = langs1.CN;

            // Rank 2
            if (langs2.KO) patchFields['why_cat2_KO'] = langs2.KO;
            if (langs2.EN) patchFields['why_cat2_EN'] = langs2.EN;
            if (langs2.JP) patchFields['why_cat2_JP'] = langs2.JP;
            if (langs2.CN) patchFields['why_cat2_CN'] = langs2.CN;

            // Rank 3
            if (langs3.KO) patchFields['why_cat3_KO'] = langs3.KO;
            if (langs3.EN) patchFields['why_cat3_EN'] = langs3.EN;
            if (langs3.JP) patchFields['why_cat3_JP'] = langs3.JP;
            if (langs3.CN) patchFields['why_cat3_CN'] = langs3.CN;

            if (Object.keys(imageUrls).length > 0) {
                patchFields['category_image_urls'] = JSON.stringify(imageUrls);
            }
            if (boosterDelivery.length > 0) {
                patchFields['booster_delivery_json'] = JSON.stringify(boosterDelivery);
            }

            if (Object.keys(patchFields).length > 0) {
                await patchRecommendationRun(runId, patchFields);
                console.log(`[generate-report-content] ✅ Patched ${Object.keys(patchFields).length} fields for runId=${runId}`);
            }

        } catch (e) {
            console.error('[generate-report-content] Background error:', e);
        }
    })();
}
