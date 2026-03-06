import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import { savePatientLog } from '../intelligence/save-log';
import {
    AnalysisResponseV2,
    CategoryRankResult,
    BoosterDeliveryItem,
    SupportingCareItem,
    DeviceSummary,
    RadarScoreData,
    RiskFlagData
} from '@/types/airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

// ─── TABLE IDs ────────────────────────────────────────────────────────────────
const TBL_INDICATION_MAP = 'tbl4xrXM1kllfQSMS';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface SurveySignals {
    // canonical signals from survey — maps directly to indication_map.canonical_signal
    canonicalSignals: string[];        // all survey signals (primary + secondary + risks)
    primarySignals: string[];          // from primaryGoal → ebd_mapped survey_primary_match
    secondarySignals: string[];        // from secondaryGoal
    riskSignals: string[];             // from risks array
    painTolerance: number;             // 1–5
    downtimeTolerance: number;         // 0–3
    budget: string;
    hasThinSkin: boolean;
    hasVolumeConcern: boolean;
    rawLanguage: string;
}

interface EBDCategoryRecord {
    category_id: string;
    category_display_name: string;
    avg_pain_level: string;
    avg_downtime: string;
    thin_skin_fit: string;
    fat_loss_risk: string;
    volume_effect: string;
    recommended_sessions: number;
    session_interval_weeks: number;
    preferred_booster_roles: string;
    recommended_supporting_care: string[];
    booster_pairing_note_KO?: string;
    booster_pairing_note_EN?: string;
    airtable_record_id: string;
}

// ─── Survey goal → canonical signal mapping ───────────────────────────────────
// WizardData.primaryGoal values mapped to indication_map canonical_signal strings
const GOAL_TO_CANONICAL: Record<string, string[]> = {
    // Smooth Texture / Pore / Roughness — matches indication_map: "Texture refinement", "Pores / texture"
    'Smooth Texture': ['Texture refinement', 'Pores / texture'],
    'Texture/Roughness': ['Texture refinement', 'Pores / texture'],
    'Pore': ['Pores / texture', 'Pore & Skin quality'],
    // Glow / Brightening / Hydration — matches: "Brightening / radiance", "Hydration / Regeneration"
    'Glow': ['Brightening / radiance', 'Hydration / Regeneration'],
    'Hydration': ['Hydration / Regeneration', 'Pore & Skin quality'],
    'Skin quality/Glow': ['Brightening / radiance', 'Pore & Skin quality'],
    'Skin quality': ['Pore & Skin quality', 'Hydration / Regeneration'],
    'Brightening': ['Brightening / radiance'],
    // Tone / Pigmentation
    'Tone': ['Brightening / radiance', 'Melasma / pigmentation risk'],
    'Pigmentation': ['Melasma / pigmentation risk'],
    'Melasma': ['Melasma / pigmentation risk'],
    // Tightening / Lifting — matches: "Contouring / lifting", "Jawline / lower face"
    'Tightening': ['Contouring / lifting'],
    'Lifting': ['Contouring / lifting'],
    'Contour/Jawline definition': ['Jawline / lower face', 'Contouring / lifting'],
    'Jawline': ['Jawline / lower face'],
    // Acne / Scars — matches: "Acne / Scar improvement"
    'Acne scar': ['Acne / Scar improvement'],
    'Acne/Scar improvement': ['Acne / Scar improvement'],
    'Acne': ['Acne / Scar improvement'],
    // Sensitive / Barrier — matches: "Sensitive / barrier damage"
    'Sensitive': ['Sensitive / barrier damage'],
    // Vascular / Redness — matches: "Rosacea / vascular"
    'Redness': ['Rosacea / vascular'],
    'Vascular': ['Rosacea / vascular'],
    // Eye Area — matches: "Eye area / Fine lines"
    'Eye area': ['Eye area / Fine lines'],
    // Volume — matches: "Midface volume"
    'Volume loss': ['Midface volume', 'Contouring / lifting'],
    'Midface volume': ['Midface volume'],
    // Body
    'Body': ['Body contouring'],
};

function mapGoalToCanonical(goal: string): string[] {
    if (!goal) return [];
    // exact match
    if (GOAL_TO_CANONICAL[goal]) return GOAL_TO_CANONICAL[goal];
    // partial match
    const key = Object.keys(GOAL_TO_CANONICAL).find(k => goal.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(goal.toLowerCase()));
    return key ? GOAL_TO_CANONICAL[key] : [goal];
}

function parseSurveySignals(body: any): SurveySignals {
    const painMap: Record<string, number> = { 'Low': 2, 'Medium': 3, 'High': 4 };
    const dtMap: Record<string, number> = { 'None': 0, 'Low': 1, 'Short': 1, 'Medium': 2, 'High': 3 };

    const primarySignals = mapGoalToCanonical(body.primaryGoal || '');
    const secondarySignals = mapGoalToCanonical(body.secondaryGoal || '');
    const riskSignals = (Array.isArray(body.risks) ? body.risks : []).flatMap(mapGoalToCanonical);

    return {
        canonicalSignals: [...new Set([...primarySignals, ...secondarySignals, ...riskSignals])],
        primarySignals,
        secondarySignals,
        riskSignals,
        painTolerance: painMap[body.painTolerance] ?? 3,
        downtimeTolerance: dtMap[body.downtimeTolerance] ?? 2,
        budget: body.budget || 'Mid',
        hasThinSkin: body.skinType === 'Thin' || String(body.q4_skin_thickness_MASTER || '').includes('Thin'),
        hasVolumeConcern: body.volumePreference === 'Focus on Fat Loss' || !!body.q3_vol_logic_MASTER,
        rawLanguage: body.language || 'EN',
    };
}

// ─── indication_map bridge ─────────────────────────────────────────────────────

interface IndicationMapEntry {
    canonical_signal: string;
    category_ids: string[];  // parsed from comma-separated recommended_category_ids
}

async function fetchIndicationMap(): Promise<IndicationMapEntry[]> {
    const records = await base(TBL_INDICATION_MAP).select({
        fields: ['canonical_signal', 'recommended_category_ids']
    }).all();

    const entries: IndicationMapEntry[] = [];
    for (const r of records) {
        const rawSignals = String(r.get('canonical_signal') || '').trim();
        const categoryIds = String(r.get('recommended_category_ids') || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        if (!rawSignals || categoryIds.length === 0) continue;

        // A single record can have multiple canonical_signals (comma-separated)
        // Expand each to its own entry so comparison works correctly
        const signals = rawSignals.split(',').map(s => s.trim()).filter(Boolean);
        for (const sig of signals) {
            entries.push({ canonical_signal: sig, category_ids: categoryIds });
        }
    }
    return entries;
}

interface CategoryScoreContext {
    // How many times this category_id was matched across all indication_map entries
    primaryHitCount: number;   // matched by primarySignals
    secondaryHitCount: number;   // matched by secondarySignals
}

function buildCategoryScoreContext(
    indicationMap: IndicationMapEntry[],
    survey: SurveySignals
): Map<string, CategoryScoreContext> {
    const map = new Map<string, CategoryScoreContext>();

    const getOrCreate = (id: string): CategoryScoreContext => {
        if (!map.has(id)) map.set(id, { primaryHitCount: 0, secondaryHitCount: 0 });
        return map.get(id)!;
    };

    for (const entry of indicationMap) {
        const isPrimary = survey.primarySignals.some(s =>
            s.toLowerCase() === entry.canonical_signal.toLowerCase()
        );
        const isSecondary = !isPrimary && survey.secondarySignals.some(s =>
            s.toLowerCase() === entry.canonical_signal.toLowerCase()
        );

        if (isPrimary) {
            for (const catId of entry.category_ids) {
                getOrCreate(catId).primaryHitCount++;
            }
        } else if (isSecondary) {
            for (const catId of entry.category_ids) {
                getOrCreate(catId).secondaryHitCount++;
            }
        }
    }

    return map;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

const PAIN_SCORE: Record<string, number> = {
    'None': 1, 'Very Low': 1.5, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5
};

function scoreCategory(
    category: EBDCategoryRecord,
    survey: SurveySignals,
    scoreCtx: Map<string, CategoryScoreContext>
): number {
    let score = 0;
    const ctx = scoreCtx.get(category.category_id);

    // [A] Indication Match via indication_map bridge (53pt max)
    const primaryHits = ctx?.primaryHitCount ?? 0;
    const secondaryHits = ctx?.secondaryHitCount ?? 0;

    score += primaryHits >= 1 ? 35 : 0;
    score += Math.min(secondaryHits * 9, 18);

    // [B] Pain tolerance fit (12pt)
    const painScore = PAIN_SCORE[category.avg_pain_level] || 3;
    const painFit = Math.max(0, 5 - Math.abs(painScore - survey.painTolerance));
    score += Math.round((painFit / 5) * 12);

    // [B2] Downtime fit (8pt)
    const downtimeLevels = ['None', 'Short (≤3d)', 'Medium (4–7d)', 'Long (≥8d)', 'Low', 'High'];
    const dIdx = Math.min(Math.max(downtimeLevels.indexOf(category.avg_downtime), 0), 3);
    score += dIdx <= survey.downtimeTolerance ? 8 : Math.max(0, 8 - (dIdx - survey.downtimeTolerance) * 3);

    // [C] Budget flat 10pt (budget_tier field not in schema)
    score += 10;

    // [D] Skin Adjustments
    if (category.thin_skin_fit === 'Good' && survey.hasThinSkin) score += 6;
    if (category.thin_skin_fit === 'Contra' && survey.hasThinSkin) score -= 20;
    if (category.fat_loss_risk === 'High' && survey.hasVolumeConcern) score -= 8;
    if (category.volume_effect === 'Increase' && survey.hasVolumeConcern) score += 6;

    return Math.max(0, Math.min(score, 100));
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchEBDCategories(): Promise<EBDCategoryRecord[]> {
    const records = await base('EBD_Category').select({
        fields: [
            'category_id', 'category_display_name',
            'avg_pain_level', 'avg_downtime', 'thin_skin_fit', 'fat_loss_risk',
            'volume_effect', 'recommended_sessions', 'session_interval_weeks', 'preferred_booster_roles',
            'recommended_supporting_care', 'booster_pairing_note_KO', 'booster_pairing_note_EN',
            'contraindicated_conditions'
        ]
    }).all();

    return records.map(r => ({
        category_id: String(r.get('category_id') || r.id),
        category_display_name: String(r.get('category_display_name') || ''),
        avg_pain_level: String(r.get('avg_pain_level') || ''),
        avg_downtime: String(r.get('avg_downtime') || ''),
        thin_skin_fit: String(r.get('thin_skin_fit') || ''),
        fat_loss_risk: String(r.get('fat_loss_risk') || ''),
        volume_effect: String(r.get('volume_effect') || ''),
        recommended_sessions: Number(r.get('recommended_sessions') || 1),
        session_interval_weeks: Number(r.get('session_interval_weeks') || 4),
        preferred_booster_roles: String(r.get('preferred_booster_roles') || ''),
        recommended_supporting_care: (r.get('recommended_supporting_care') as string[]) || [],
        booster_pairing_note_KO: r.get('booster_pairing_note_KO') as string,
        booster_pairing_note_EN: r.get('booster_pairing_note_EN') as string,
        airtable_record_id: r.id,
    }));
}

function checkRiskFlag(survey: SurveySignals): RiskFlagData {
    const hasPigment = survey.primarySignals.some(s => s.includes('Melasma') || s.includes('pigment'));
    const hasAcne = survey.primarySignals.some(s => s.includes('Acne') || s.includes('scar'));

    if (hasPigment) return { triggered: true, reason_KO: '기미/색소 악화 위험이 있어 색소 치료를 우선 권장합니다.', reason_EN: 'Pigmentation risk detected; pigment-stabilizing treatment prioritized.' };
    if (hasAcne) return { triggered: true, reason_KO: '활성 여드름/염증이 있어 항염증 치료를 우선 권장합니다.', reason_EN: 'Acne/inflammation detected; anti-inflammatory treatment prioritized.' };
    return { triggered: false };
}

function isContraindicated(category: EBDCategoryRecord, survey: SurveySignals): boolean {
    if (category.thin_skin_fit === 'Contra' && survey.hasThinSkin) return true;
    return false;
}

function calculateRadarScore(category: EBDCategoryRecord, survey: SurveySignals): RadarScoreData {
    return { efficacy: 90, downtime: 85, discomfort: 80, cost_efficiency: 75, maintenance: 85 };
}

// ─── Booster / Device fetchers ────────────────────────────────────────────────

async function applyInjectableMethodRules(booster: any, survey: SurveySignals): Promise<BoosterDeliveryItem> {
    const targetLayer = booster.injection_target_layer;
    const painToleranceStr = ['Very Low', 'Low', 'Medium', 'High', 'Very High', 'Very High'][survey.painTolerance] || 'Medium';

    let rules: any[] = [];
    try {
        const ruleRecords = await base('injectable_method_rules').select().all();
        rules = ruleRecords.map(r => ({
            target_layer: r.get('target_layer'),
            patient_pain_tolerance: r.get('patient_pain_tolerance'),
            safety_flag: r.get('safety_flag'),
            required_delivery_method_id: (r.get('required_delivery_method_id') as string[])?.[0],
            delivery_method_name: (r.get('delivery_method_name (from required_delivery_method_id)') as string[])?.[0],
            typical_pain_level: (r.get('typical_pain_level (from required_delivery_method_id)') as string[])?.[0] || 'Medium',
            safety_reason_KO: r.get('safety_reason_KO'),
        }));
    } catch (e) { console.error('[injectable_method_rules]', e); }

    const matched = rules.filter(r => r.target_layer === targetLayer && (!r.patient_pain_tolerance || r.patient_pain_tolerance === painToleranceStr));
    const safetyRule = matched.find(r => r.safety_flag === true);

    if (safetyRule) {
        return { booster_id: booster.booster_id, booster_name: booster.booster_name, canonical_role: booster.canonical_role, injection_target_layer: targetLayer, delivery_method_id: safetyRule.required_delivery_method_id, delivery_name: safetyRule.delivery_method_name || '', delivery_pain_level: safetyRule.typical_pain_level, is_safety_required: true, safety_reason_KO: safetyRule.safety_reason_KO };
    }

    const recommended = matched.filter(r => !r.safety_flag).sort((a, b) => (PAIN_SCORE[a.typical_pain_level] || 3) - (PAIN_SCORE[b.typical_pain_level] || 3))[0];
    return { booster_id: booster.booster_id, booster_name: booster.booster_name, canonical_role: booster.canonical_role, injection_target_layer: targetLayer, delivery_method_id: recommended?.required_delivery_method_id || null, delivery_name: recommended?.delivery_method_name || 'Manual Injection', delivery_pain_level: recommended?.typical_pain_level || 'Medium', is_safety_required: false };
}

async function fetchTopBoosters(categories: EBDCategoryRecord[], survey: SurveySignals): Promise<BoosterDeliveryItem[][]> {
    const result: BoosterDeliveryItem[][] = [];
    try {
        const allBoostersRaw = await base('Skin_booster').select({ fields: ['booster_id', 'booster_name', 'canonical_role', 'injection_target_layer'] }).all();
        const allBoosters = allBoostersRaw.map(r => ({
            booster_id: String(r.get('booster_id') || r.id),
            booster_name: String(r.get('booster_name') || ''),
            canonical_role: String(r.get('canonical_role') || ''),
            injection_target_layer: String(r.get('injection_target_layer') || '')
        }));

        for (const cat of categories) {
            const roles = cat.preferred_booster_roles ? cat.preferred_booster_roles.split(',').map(s => s.trim()) : [];
            if (!roles.length) { result.push([]); continue; }

            const matching = allBoosters.filter(b => roles.includes(b.canonical_role));
            const parsed: BoosterDeliveryItem[] = [];
            for (const b of matching.slice(0, 2)) {
                parsed.push(await applyInjectableMethodRules(b, survey));
            }
            result.push(parsed);
        }
    } catch (e) {
        console.error('[fetchTopBoosters]', e);
        for (let i = 0; i < categories.length; i++) result.push([]);
    }
    return result;
}

// EBD_Category doesn't have direct device links currently — returns empty
async function fetchTopDevices(categories: EBDCategoryRecord[]): Promise<DeviceSummary[][]> {
    return categories.map(() => []);
}

function buildRankResult(
    category: EBDCategoryRecord & { score: number },
    devices: DeviceSummary[],
    boosters: BoosterDeliveryItem[],
    radarScore: RadarScoreData
): CategoryRankResult {
    const supportingCare: SupportingCareItem[] = (category.recommended_supporting_care || []).map(id => ({
        supportcare_id: id,
        supportcare_name: id,
        primary_purpose: 'Recovery',
        canonical_role: 'PostCare',
    }));

    return {
        category_id: category.category_id,
        score: category.score,
        why_KO: null,
        why_EN: null,
        radar: radarScore,
        top_devices: devices,
        top_boosters: boosters,
        booster_pairing_note_KO: category.booster_pairing_note_KO ?? null,
        booster_pairing_note_EN: category.booster_pairing_note_EN ?? null,
        recommended_sessions: category.recommended_sessions ?? null,
        session_interval_weeks: category.session_interval_weeks ?? null,
        recommended_supporting_care: supportingCare,
    };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // 1. Parse survey into canonical signals
        const survey = parseSurveySignals(req.body);

        console.log('[Engine V2] canonical signals:', survey.primarySignals, survey.secondarySignals);

        // 2. Fetch indication_map + EBD_Category in parallel
        const [indicationMap, allCategories] = await Promise.all([
            fetchIndicationMap(),
            fetchEBDCategories(),
        ]);

        // 3. Build score context from indication_map bridge
        const scoreCtx = buildCategoryScoreContext(indicationMap, survey);
        console.log('[Engine V2] matched category IDs from indication_map:', [...scoreCtx.keys()]);

        // 4. Risk flag
        const riskFlag = checkRiskFlag(survey);

        // 5. Score + filter + rank
        const scored = allCategories
            .map(cat => ({ ...cat, score: scoreCategory(cat, survey, scoreCtx) }))
            .filter(cat => !isContraindicated(cat, survey))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        // 6. Risk flag override (push pigment/acne category to rank 1)
        if (riskFlag.triggered && scored.length > 0) {
            const targetSignal = survey.primarySignals.some(s => s.includes('Acne')) ? 'Acne / scar improvement' : 'Melasma / pigmentation risk';
            const overrideCats = indicationMap.find(e => e.canonical_signal.toLowerCase() === targetSignal.toLowerCase())?.category_ids ?? [];
            const overrideCat = scored.find(c => overrideCats.includes(c.category_id)) ?? allCategories.find(c => overrideCats.includes(c.category_id));
            if (overrideCat && scored[0]?.category_id !== overrideCat.category_id) {
                const idx = scored.findIndex(c => c.category_id === overrideCat.category_id);
                if (idx > -1) scored.splice(idx, 1);
                scored.unshift({ ...overrideCat, score: 99 });
                if (scored.length > 3) scored.pop();
            }
        }

        const radarScore = calculateRadarScore(scored[0] || ({} as EBDCategoryRecord), survey);

        // 7. Fetch boosters (in parallel per category)
        const [topDevices, topBoosters] = await Promise.all([
            fetchTopDevices(scored),
            fetchTopBoosters(scored, survey),
        ]);

        // 8. ALWAYS save Recommendation_Run — even without patientId, use timestamp as identifier
        const rrFields: Record<string, any> = {
            rank_1_category_id: scored[0]?.category_id,
            rank_2_category_id: scored[1]?.category_id,
            rank_3_category_id: scored[2]?.category_id,
            radar_score_json: JSON.stringify(radarScore),
            top5_booster_ids: topBoosters.flat().map(b => b.booster_id).filter(Boolean).slice(0, 5).join(', '),
        };

        // Link patient record only if we have a real ID
        if (req.body.patientId || req.body.userId) {
            rrFields['Patients_v1'] = [req.body.patientId || req.body.userId];
        }

        let runId: string;
        try {
            const rrRec = await base('Recommendation_Run').create([{ fields: rrFields }]);
            runId = rrRec[0].id;
            console.log('[Engine V2] Recommendation_Run created:', runId);
        } catch (e) {
            console.error('[Recommendation_Run] save failed, falling back to mock id:', e);
            runId = `mock_run_${Date.now()}`;
        }

        const responsePayload: AnalysisResponseV2 = {
            runId,
            rank1: buildRankResult(scored[0], topDevices[0] || [], topBoosters[0] || [], radarScore),
            rank2: scored[1] ? buildRankResult(scored[1], topDevices[1] || [], topBoosters[1] || [], radarScore) : null,
            rank3: scored[2] ? buildRankResult(scored[2], topDevices[2] || [], topBoosters[2] || [], radarScore) : null,
            riskFlag,
            radarScore,
        };

        // 9. Trigger async Tasks 4+5 (fire-and-forget)
        if (!runId.startsWith('mock_')) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://${req.headers.host}`;
            fetch(`${baseUrl}/api/recommendation/generate-report-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId, patientId: req.body.patientId || req.body.userId || '' })
            }).catch(e => console.error('[Engine V2] Async trigger failed:', e));
        }

        // 10. Log
        try {
            savePatientLog({
                sessionId: runId,
                timestamp: new Date().toISOString(),
                userId: req.body.userId,
                userEmail: req.body.userEmail,
                tallyData: req.body,
                analysisInput: {
                    primaryGoal: survey.primarySignals.join(', '),
                    secondaryGoal: survey.secondarySignals.join(', '),
                    downtimeTolerance: survey.downtimeTolerance,
                    budget: survey.budget,
                },
                reportId: runId,
            });
        } catch (e) { console.error('[LOG]', e); }

        return res.status(200).json(responsePayload);

    } catch (error: any) {
        console.error('[Engine V2] Fatal error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
