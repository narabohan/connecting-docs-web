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

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface SurveySignals {
    primaryIndications: string[];
    secondaryIndications: string[];
    painTolerance: number; // 1-5
    downtimeTolerance: number; // 0-3
    budget: string; // 'Budget', 'Mid', 'Premium', 'Luxury'
    hasThinSkin: boolean;
    hasVolumeConcern: boolean;
    risks: string[];
    rawLanguage: string;
    koreaVisitPlan: 'resident' | 'short' | 'long' | 'undecided';
    koreaStayDays: number;
    referralCode?: string;
}

interface EBDCategoryRecord {
    category_id: string;
    category_display_name: string;
    best_primary_indication: string;
    secondary_indications: string[];
    avg_pain_level: string;
    avg_downtime: string;
    budget_tier: string;
    thin_skin_fit: string;
    fat_loss_risk: string;
    volume_effect: string;
    recommended_sessions: number;
    session_interval_weeks: number;
    preferred_booster_roles: string;
    recommended_supporting_care: string[];
    booster_pairing_note_KO?: string;
    booster_pairing_note_EN?: string;
    contraindications: string[];
    devices: string[]; // Device IDs
}

// ─── Constants & Parsers ──────────────────────────────────────────────────

const PAIN_SCORE: Record<string, number> = {
    'None': 1, 'Very Low': 1.5, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5
};
const BUDGET_ORDER = ['Budget', 'Mid', 'Premium', 'Luxury'];

// ─── Wizard ID → EBD_Category indication 매핑 ─────────────────────────────
// DiagnosisWizard는 'hydration', 'tone', 'contour' 같은 short ID를 전송
// EBD_Category.best_primary_indication는 'Skin quality / Glow', 'Tone', 'Lifting' 등 전체 텍스트

const GOAL_TO_INDICATION: Record<string, string> = {
    'hydration':   'Skin quality / Glow',
    'texture':     'Skin quality / Glow',
    'volume':      'Lifting',
    'contour':     'Lifting',
    'tone':        'Tone',
    'lifting':     'Lifting',
    'pigment':     'Dermal pigmentation',
    'acne':        'Acne scar',
    'scars':       'Acne scar',
    'pores':       'Skin quality / Glow',
    'guidance':    'Skin quality / Glow',
    // Legacy / Tally canonical strings (하위 호환)
    'Lifting':     'Lifting',
    'Tone':        'Tone',
    'Skin Improvement': 'Skin quality / Glow',
    'Glass Skin':  'Skin quality / Glow',
};

// Pain 내성 매핑 (wizard IDs → 1-5 숫자)
const PAIN_MAP: Record<string, number> = {
    'minimal':  2,  // Low tolerance
    'moderate': 3,  // Medium
    'high':     4,  // High tolerance
    'notsure':  3,
    // Legacy
    'Low': 2, 'Medium': 3, 'High': 4,
};

// 다운타임 매핑 (wizard IDs → 0-3 숫자)
const DOWNTIME_MAP: Record<string, number> = {
    'none':    0,   // Zero downtime
    'short':   2,   // 3-5 days
    'long':    3,   // 1 week+
    'notsure': 1,
    // Legacy
    'None': 0, 'Low': 1, 'Medium': 2, 'High': 3,
};

// Budget 매핑 (wizard IDs → 'Budget'|'Mid'|'Premium'|'Luxury')
const BUDGET_MAP: Record<string, string> = {
    'premium':  'Premium',
    'balanced': 'Mid',
    'economy':  'Budget',
    'notsure':  'Mid',
    // Legacy passthrough
    'Budget': 'Budget', 'Mid': 'Mid', 'Premium': 'Premium', 'Luxury': 'Luxury',
};

function parseSurveyCanonical(body: any): SurveySignals {
    // Goal ID → EBD_Category indication 이름으로 변환
    const mapGoal = (goalId: string) =>
        GOAL_TO_INDICATION[goalId] || goalId || 'Skin quality / Glow';

    const goalId = String(body.primaryGoal || '');
    const secondGoalId = String(body.secondaryGoal || '');

    let primaryIndications = goalId ? [mapGoal(goalId)] : ['Skin quality / Glow'];
    let secondaryIndications = secondGoalId ? [mapGoal(secondGoalId)] : [];

    // risks 배열: 위험 요소가 있으면 secondaryIndications에 추가
    const risks: string[] = body.risks || [];
    if (risks.includes('pigment') && !secondaryIndications.includes('Dermal pigmentation')) {
        secondaryIndications.push('Dermal pigmentation');
    }
    if (risks.includes('acne') && !secondaryIndications.includes('Acne scar')) {
        secondaryIndications.push('Acne scar');
    }

    // Korea visit plan mapping
    let koreaVisitPlan: SurveySignals['koreaVisitPlan'] = 'undecided';
    if (body.koreaVisitPlan === 'resident') koreaVisitPlan = 'resident';
    else if (body.koreaVisitPlan === 'short') koreaVisitPlan = 'short';
    else if (body.koreaVisitPlan === 'long') koreaVisitPlan = 'long';

    return {
        primaryIndications,
        secondaryIndications,
        painTolerance: PAIN_MAP[body.painTolerance] ?? 3,
        downtimeTolerance: DOWNTIME_MAP[body.downtimeTolerance] ?? 1,
        budget: BUDGET_MAP[body.budget] || 'Mid',
        hasThinSkin: body.skinType === 'thin' || body.skinType === 'Thin' || String(body.q4_skin_thickness_MASTER || '').toLowerCase().includes('thin'),
        hasVolumeConcern: body.volumePreference === 'Focus on Fat Loss' || body.volumeLogic === 'instant' || !!body.q3_vol_logic_MASTER,
        risks,
        rawLanguage: body.language || 'EN',
        koreaVisitPlan,
        koreaStayDays: Number(body.koreaStayDays || 0),
        referralCode: body.referralCode || undefined
    };
}

// ─── Engine Scoring Logic ─────────────────────────────────────────────────

function scoreCategory(category: EBDCategoryRecord, surveySignals: SurveySignals): number {
    let score = 0;

    // [A] Indication Match (53pt)
    const primaryMatch = surveySignals.primaryIndications.includes(category.best_primary_indication);
    const secondaryMatches = surveySignals.secondaryIndications.filter(
        ind => category.secondary_indications?.includes(ind)
    ).length;
    score += primaryMatch ? 35 : 0;
    score += Math.min(secondaryMatches * 9, 18); // max 18pt (2 items)

    // [B] Pain & Downtime (20pt)
    const painScore = PAIN_SCORE[category.avg_pain_level] || 3;
    const painFit = Math.max(0, 5 - Math.abs(painScore - surveySignals.painTolerance));
    score += Math.round((painFit / 5) * 12); // Pain 12pt

    const downtimeLevels = ['None', 'Short (≤3d)', 'Medium (4–7d)', 'Long (≥8d)', 'Low', 'High'];
    const downtimeIdx = downtimeLevels.indexOf(category.avg_downtime);
    const dIdx = downtimeIdx >= 0 ? Math.min(downtimeIdx, 3) : 2; // Rough mapping

    score += dIdx <= surveySignals.downtimeTolerance ? 8 : Math.max(0, 8 - (dIdx - surveySignals.downtimeTolerance) * 3);

    // [C] Budget (15pt)
    const categoryBudgetIdx = BUDGET_ORDER.indexOf(category.budget_tier || 'Mid');
    const surveyBudgetIdx = BUDGET_ORDER.indexOf(surveySignals.budget);

    const cBudget = categoryBudgetIdx >= 0 ? categoryBudgetIdx : 1;
    const sBudget = surveyBudgetIdx >= 0 ? surveyBudgetIdx : 1;

    score += cBudget <= sBudget ? 15 : Math.max(0, 15 - (cBudget - sBudget) * 5);

    // [D] Skin Adjustments (12pt)
    if (category.thin_skin_fit === 'Good' && surveySignals.hasThinSkin) score += 6;
    if (category.thin_skin_fit === 'Contra' && surveySignals.hasThinSkin) score -= 20; // Contraindication
    if (category.fat_loss_risk === 'High' && surveySignals.hasVolumeConcern) score -= 8;
    if (category.volume_effect === 'Increase' && surveySignals.hasVolumeConcern) score += 6;

    // [E] Korea Visit Plan modifier (±10pt)
    // Short stay (≤3 days): single-session treatments get a boost; multi-session get penalized
    if (surveySignals.koreaVisitPlan === 'short' && surveySignals.koreaStayDays <= 3) {
        if (category.recommended_sessions === 1) score += 8;
        else if (category.recommended_sessions >= 4) score -= 10;
    }
    // Long stay or resident: no restriction; slight boost to planned courses
    if (surveySignals.koreaVisitPlan === 'resident' || surveySignals.koreaVisitPlan === 'long') {
        if (category.recommended_sessions >= 3) score += 3;
    }

    return Math.max(0, Math.min(score, 100));
}

// ─── Data Fetchers ────────────────────────────────────────────────────────

async function fetchEBDCategories(): Promise<EBDCategoryRecord[]> {
    const records = await base('EBD_Category').select({
        fields: [
            'category_id', 'category_display_name', 'best_primary_indication', 'secondary_indications',
            'avg_pain_level', 'avg_downtime', 'budget_tier', 'thin_skin_fit', 'fat_loss_risk',
            'volume_effect', 'recommended_sessions', 'session_interval_weeks', 'preferred_booster_roles',
            'recommended_supporting_care', 'booster_pairing_note_KO', 'booster_pairing_note_EN',
            'contraindications', 'devices'
        ]
    }).all();

    return records.map(r => ({
        category_id: String(r.get('category_id') || ''),
        category_display_name: String(r.get('category_display_name') || ''),
        best_primary_indication: String(r.get('best_primary_indication') || ''),
        secondary_indications: (r.get('secondary_indications') as string[]) || [],
        avg_pain_level: String(r.get('avg_pain_level') || ''),
        avg_downtime: String(r.get('avg_downtime') || ''),
        budget_tier: String(r.get('budget_tier') || 'Mid'),
        thin_skin_fit: String(r.get('thin_skin_fit') || ''),
        fat_loss_risk: String(r.get('fat_loss_risk') || ''),
        volume_effect: String(r.get('volume_effect') || ''),
        recommended_sessions: Number(r.get('recommended_sessions') || 1),
        session_interval_weeks: Number(r.get('session_interval_weeks') || 4),
        preferred_booster_roles: String(r.get('preferred_booster_roles') || ''),
        recommended_supporting_care: (r.get('recommended_supporting_care') as string[]) || [],
        booster_pairing_note_KO: r.get('booster_pairing_note_KO') as string,
        booster_pairing_note_EN: r.get('booster_pairing_note_EN') as string,
        contraindications: (r.get('contraindications') as string[]) || [],
        devices: (r.get('devices') as string[]) || []
    }));
}

function checkRiskFlag(survey: SurveySignals, categories: EBDCategoryRecord[]): RiskFlagData {
    const hasPigmentRisk = survey.risks.some(r => r.toLowerCase().includes('pigment') || r.toLowerCase().includes('melasma'));
    const hasAcneRisk = survey.risks.some(r => r.toLowerCase().includes('acne'));

    if (hasPigmentRisk) {
        return { triggered: true, reason_KO: '기미/색소 악화 위험이 있어 색소 치료를 우선 권장합니다.', reason_EN: 'Due to pigmentation/melasma risk, pigment-stabilizing treatments are prioritized.' };
    }
    if (hasAcneRisk) {
        return { triggered: true, reason_KO: '활성 여드름/염증이 있어 항염증 치료를 우선 권장합니다.', reason_EN: 'Active acne/inflammation detected; anti-inflammatory treatments are prioritized.' };
    }
    return { triggered: false };
}

function isContraindicated(category: EBDCategoryRecord, survey: SurveySignals): boolean {
    // Add robust logic if necessary
    if (category.thin_skin_fit === 'Contra' && survey.hasThinSkin) return true;
    return false;
}

function calculateRadarScore(category: EBDCategoryRecord, survey: SurveySignals): RadarScoreData {
    return {
        efficacy: 90,
        downtime: 85,
        discomfort: 80,
        cost_efficiency: 75,
        maintenance: 85
    }; // Placeholder radar math pending precise weights
}

// ─── Rules Applicator ─────────────────────────────────────────────────────

async function applyInjectableMethodRules(
    booster: any,
    surveyCanonical: SurveySignals
): Promise<BoosterDeliveryItem> {
    const targetLayer = booster.injection_target_layer;
    const painToleranceStr = ['Very Low', 'Low', 'Medium', 'High', 'Very High', 'Very High'][surveyCanonical.painTolerance] || 'Medium';

    let rules: any[] = [];
    try {
        const ruleRecords = await base('injectable_method_rules').select().all();
        rules = ruleRecords.map(r => ({
            target_layer: r.get('target_layer'),
            patient_pain_tolerance: r.get('patient_pain_tolerance'),
            safety_flag: r.get('safety_flag'),
            required_delivery_method_id: (r.get('required_delivery_method_id') as any)?.[0], // Link ID
            delivery_method_name: (r.get('delivery_method_name (from required_delivery_method_id)') as any)?.[0],
            typical_pain_level: (r.get('typical_pain_level (from required_delivery_method_id)') as any)?.[0] || 'Medium',
            safety_reason_KO: r.get('safety_reason_KO')
        }));
    } catch (e) { console.error('Error fetching injectable rules', e); }

    const matchedRules = rules.filter(r => r.target_layer === targetLayer && (!r.patient_pain_tolerance || r.patient_pain_tolerance === painToleranceStr));

    const safetyRule = matchedRules.find(r => r.safety_flag === true);
    if (safetyRule) {
        return {
            booster_id: booster.booster_id,
            booster_name: booster.booster_name,
            canonical_role: booster.canonical_role,
            injection_target_layer: targetLayer,
            delivery_method_id: safetyRule.required_delivery_method_id,
            delivery_name: safetyRule.delivery_method_name || '',
            delivery_pain_level: safetyRule.typical_pain_level,
            is_safety_required: true,
            safety_reason_KO: safetyRule.safety_reason_KO,
        };
    }

    const recommended = matchedRules
        .filter(r => !r.safety_flag)
        .sort((a, b) => (PAIN_SCORE[a.typical_pain_level] || 3) - (PAIN_SCORE[b.typical_pain_level] || 3))
    [0];

    return {
        booster_id: booster.booster_id,
        booster_name: booster.booster_name,
        canonical_role: booster.canonical_role,
        injection_target_layer: targetLayer,
        delivery_method_id: recommended?.required_delivery_method_id || null,
        delivery_name: recommended?.delivery_method_name || 'Manual Injection',
        delivery_pain_level: recommended?.typical_pain_level || 'Medium',
        is_safety_required: false,
    };
}

// Budget tier numeric index for comparison
const BUDGET_TIER_ORDER: Record<string, number> = { 'Budget': 0, 'Mid': 1, 'Premium': 2, 'Luxury': 3 };

async function fetchTopDevices(categories: EBDCategoryRecord[], survey: SurveySignals): Promise<DeviceSummary[][]> {
    const result: DeviceSummary[][] = [];
    const surveyBudgetIdx = BUDGET_TIER_ORDER[survey.budget] ?? 1;
    const currentYear = new Date().getFullYear();

    for (const cat of categories) {
        if (!cat.devices || cat.devices.length === 0) {
            result.push([]);
            continue;
        }

        type ScoredDevice = DeviceSummary & { subScore: number };
        const deviceSub: ScoredDevice[] = [];

        try {
            const deviceIdList = cat.devices.join(',');
            const dRecs = await base('EBD_Device').select({
                filterByFormula: `FIND(RECORD_ID(), '${deviceIdList}') > 0`,
                fields: [
                    'device_name', 'pain_modifier',
                    'trend_score',        // fld0F33GXXt9tFrAC: 1-10 (added this session)
                    'skin_depth_fit',     // fldOccPo2Fb8EpESY: Shallow/Medium/Deep/Universal
                    'budget_tier',        // flduA112tlP7RgKgE: Budget/Mid/Premium/Luxury
                    'evidence_basis',     // fldUk1LMb7qS6QGcp: text (e.g. "FDA-cleared RCT")
                    'launch_year',        // numeric year
                    'brand_tier',         // fldVDVn2sZeGh65TE: Premium/Standard/Budget (new)
                    'clinical_evidence_score' // fldVHXiwbc1Rvuk9g: 1-5 (new)
                ]
            }).all();

            dRecs.forEach(r => {
                // ── Sub-score Calculation (100pt) ──────────────────────────────

                // [A] Trend Score: 35pt  (stored 1-10, scale to 0-35)
                const trendScore = Number(r.get('trend_score') || 5);
                const scoreA = (trendScore / 10) * 35;

                // [B] Budget Match: 25pt
                const devBudgetTier = String(r.get('budget_tier') || 'Mid');
                const devBudgetIdx = BUDGET_TIER_ORDER[devBudgetTier] ?? 1;
                const budgetDiff = Math.abs(devBudgetIdx - surveyBudgetIdx);
                const scoreB = budgetDiff === 0 ? 25 : budgetDiff === 1 ? 17 : budgetDiff === 2 ? 8 : 2;

                // [C] Clinical Evidence: 20pt  (evidence_score 1-5 OR evidence_basis text heuristic)
                let clinicalScore = Number(r.get('clinical_evidence_score') || 0);
                if (!clinicalScore) {
                    // Fallback heuristic: if evidence_basis contains quality keywords, give score
                    const evText = String(r.get('evidence_basis') || '').toLowerCase();
                    if (evText.includes('rct') || evText.includes('fda')) clinicalScore = 5;
                    else if (evText.includes('clinical') || evText.includes('trial')) clinicalScore = 4;
                    else if (evText.includes('study') || evText.includes('paper')) clinicalScore = 3;
                    else clinicalScore = 2;
                }
                const scoreC = (Math.min(clinicalScore, 5) / 5) * 20;

                // [D] Recency / Launch Year: 10pt
                const launchYear = Number(r.get('launch_year') || 2018);
                const age = currentYear - launchYear;
                const scoreD = age <= 2 ? 10 : age <= 5 ? 8 : age <= 10 ? 5 : 2;

                // [E] Brand Tier bonus: 10pt
                const brandTier = String(r.get('brand_tier') || '');
                const scoreE = brandTier === 'Premium' ? 10 : brandTier === 'Standard' ? 6 : 2;

                const subScore = scoreA + scoreB + scoreC + scoreD + scoreE;

                deviceSub.push({
                    device_id: r.id,
                    device_name: String(r.get('device_name') || ''),
                    pain_modifier: Number(r.get('pain_modifier') || 0),
                    subScore
                });
            });

            // Sort by sub-score descending, return top 2 (strip subScore from response)
            deviceSub.sort((a, b) => b.subScore - a.subScore);
            result.push(deviceSub.slice(0, 2).map(({ subScore, ...d }) => d as DeviceSummary));
        } catch (e) {
            console.error('[fetchTopDevices] Error:', e);
            result.push([]);
        }
    }
    return result;
}

async function fetchTopBoosters(categories: EBDCategoryRecord[], survey: SurveySignals): Promise<BoosterDeliveryItem[][]> {
    const result: BoosterDeliveryItem[][] = [];
    try {
        const allBoostersRaw = await base('Skin_booster').select({
            fields: ['booster_id', 'booster_name', 'canonical_role', 'injection_target_layer']
        }).all();
        const allBoosters = allBoostersRaw.map(r => ({
            booster_id: String(r.get('booster_id') || r.id),
            booster_name: String(r.get('booster_name') || ''),
            canonical_role: String(r.get('canonical_role') || ''),
            injection_target_layer: String(r.get('injection_target_layer') || '')
        }));

        for (const cat of categories) {
            const roles = cat.preferred_booster_roles ? cat.preferred_booster_roles.split(',').map(s => s.trim()) : [];
            if (roles.length === 0) {
                result.push([]);
                continue;
            }
            const matchingBoosters = allBoosters.filter(b => roles.includes(b.canonical_role));
            // Apply Injectable Method Rules
            const parsedBoosters: BoosterDeliveryItem[] = [];
            for (const b of matchingBoosters.slice(0, 2)) {
                const ruleMatched = await applyInjectableMethodRules(b, survey);
                parsedBoosters.push(ruleMatched);
            }
            result.push(parsedBoosters);
        }
    } catch (e) {
        console.error(e);
        result.push([], [], []);
    }
    return result;
}

function buildRankResult(category: EBDCategoryRecord & { score: number }, devices: DeviceSummary[], boosters: BoosterDeliveryItem[], radarScore: RadarScoreData): CategoryRankResult {
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
        recommended_supporting_care: category.recommended_supporting_care ? category.recommended_supporting_care.map((id, i) => ({
            supportcare_id: id,
            supportcare_name: `Supporting Care ${i}`, // Usually mapped using lookup
            primary_purpose: 'Recovery',
            canonical_role: 'PostCare'
        })) : []
    };
}

// ─── Main Handler ─────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const surveyCanonical = parseSurveyCanonical(req.body);
        const allCategories = await fetchEBDCategories();

        // Check Risk Flags
        const riskFlag = checkRiskFlag(surveyCanonical, allCategories);

        // Boost score if risk flag applies to specific categories (Optional logic enhancement)
        // Score & Sort
        const scoredCategories = allCategories
            .map(cat => ({ ...cat, score: scoreCategory(cat, surveyCanonical) }))
            .filter(cat => !isContraindicated(cat, surveyCanonical))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        // Overwrite Rank 1 if Risk Flag is triggered and we need to push a specific category
        if (riskFlag.triggered && scoredCategories.length > 0) {
            // Find best match for the risk category (case-insensitive)
            const isAcneRisk = surveyCanonical.risks.join(',').toLowerCase().includes('acne');
            const targetIndication = isAcneRisk ? 'acne scar' : 'pigmentation';
            const overrideCat = allCategories.find(c =>
                c.best_primary_indication.toLowerCase().includes(targetIndication) ||
                c.category_display_name.toLowerCase().includes(isAcneRisk ? 'acne' : 'pigment') ||
                c.category_id.toLowerCase().includes(isAcneRisk ? 'mn_rf' : 'pico')
            );
            if (overrideCat) {
                const idx = scoredCategories.findIndex(c => c.category_id === overrideCat.category_id);
                if (idx > -1) scoredCategories.splice(idx, 1);
                scoredCategories.unshift({ ...overrideCat, score: 99 });
                if (scoredCategories.length > 3) scoredCategories.pop();
            }
        }

        const topDevicesPerCategory = await fetchTopDevices(scoredCategories, surveyCanonical);
        const topBoostersPerCategory = await fetchTopBoosters(scoredCategories, surveyCanonical);

        // Calculate Radar only for Rank 1 for now
        const radarScore = calculateRadarScore(scoredCategories[0] || {} as EBDCategoryRecord, surveyCanonical);

        // Save to Recommendation_Run — 로그인 여부와 무관하게 항상 저장
        const patientLink = [req.body.patientId || req.body.userId].filter(Boolean) as string[];
        const rrPayload: Record<string, any> = {
            rank_1_category_id: scoredCategories[0]?.category_id,
            rank_2_category_id: scoredCategories[1]?.category_id,
            rank_3_category_id: scoredCategories[2]?.category_id,
            radar_score_json: JSON.stringify(radarScore),
            top5_booster_ids: topBoostersPerCategory.flat().map(b => b.booster_id).slice(0, 5).join(', ')
        };
        // 로그인 사용자만 patients_v1 링크 포함
        if (patientLink.length > 0) {
            rrPayload.patients_v1 = patientLink;
        }
        // Optionally attach korea visit plan if available
        if (surveyCanonical.koreaVisitPlan !== 'undecided') {
            rrPayload.survey_meta_json = JSON.stringify({
                koreaVisitPlan: surveyCanonical.koreaVisitPlan,
                koreaStayDays: surveyCanonical.koreaStayDays,
                referralCode: surveyCanonical.referralCode || null
            });
        }
        // 항상 Recommendation_Run 레코드 생성 (비로그인도 포함)
        let runId: string | null = null;
        try {
            const rrRec = await base('Recommendation_Run').create([{ fields: rrPayload }]);
            runId = rrRec[0].id;
        } catch (rrCreateErr: any) {
            console.error('[analyze] Recommendation_Run create failed:', rrCreateErr?.message || rrCreateErr);
        }

        const finalRunId = runId || `mock_run_${Date.now()}`;
        const responsePayload: AnalysisResponseV2 = {
            runId: finalRunId,
            reportId: finalRunId, // alias — DeepDiveModal + report page polling 호환
            rank1: buildRankResult(scoredCategories[0], topDevicesPerCategory[0], topBoostersPerCategory[0], radarScore),
            rank2: scoredCategories[1] ? buildRankResult(scoredCategories[1], topDevicesPerCategory[1], topBoostersPerCategory[1], radarScore) : null,
            rank3: scoredCategories[2] ? buildRankResult(scoredCategories[2], topDevicesPerCategory[2], topBoostersPerCategory[2], radarScore) : null,
            riskFlag,
            radarScore,
        };

        // Fire and forget Async Generation Tasks (Task 4 & 5 endpoint)
        if (runId) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://${req.headers.host}`;
            fetch(`${baseUrl}/api/recommendation/generate-report-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId, patientId: req.body.patientId || req.body.userId || '' })
            }).catch(e => console.error('[Analyze Engine] Async trigger failed:', e));
        }

        try {
            savePatientLog({
                sessionId: runId ?? `anon_${Date.now()}`,
                timestamp: new Date().toISOString(),
                userId: req.body.userId,
                userEmail: req.body.userEmail,
                tallyData: req.body,
                analysisInput: { primaryGoal: surveyCanonical.primaryIndications[0], secondaryGoal: surveyCanonical.secondaryIndications[0], downtimeTolerance: surveyCanonical.downtimeTolerance, budget: surveyCanonical.budget },
                reportId: runId ?? undefined
            });
        } catch (e) { console.error('[LOG]', e); }

        return res.status(200).json(responsePayload);

    } catch (error: any) {
        console.error('[ENGINE] Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
