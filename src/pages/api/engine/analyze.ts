import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { savePatientLog } from '../intelligence/save-log';
import {
    AnalysisResponseV2,
    CategoryRankResult,
    BoosterDeliveryItem,
    DeviceSummary,
    RadarScoreData,
    RiskFlagData
} from '@/types/airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

// ─── Table IDs ──────────────────────────────────────────────────────────────
const TBL_INDICATION_MAP = 'tbl4xrXM1kllfQSMS';
const TBL_EBD_CATEGORY = 'tblCCnizVeFcNpjbj';
const TBL_EBD_DEVICE = 'tblZrp328Yu9HETOj';
const TBL_SKIN_BOOSTER = 'tblta0NVjbNgh8Avs';
const TBL_INJECTABLE_RULES = 'tblNESYb9m7kKabAX';
const TBL_RECOMMENDATION_RUN = 'tblAv5eoTae4Al5zy';

// ─── TypeScript Types for Fetched Data ──────────────────────────────────────
interface IndicationMapRecord {
    id: string;
    indication_name: string;
    canonical_signal: string;
    recommended_category_ids: string;
    survey_signals: string;
    notes: string;
    concern_domain: string;
}

interface EBDCategoryRecord {
    id: string;
    category_id: string;
    category_display_name: string;
    category_description: string;
    budget_tier: string;
    avg_pain_level: string;
    avg_downtime: string;
    recommended_sessions: number;
    contraindicated_conditions: string;
    thin_skin_fit: string;
    risk_flag_trigger: string;
    preferred_booster_roles: string;
    reason_why_template: string;
    reason_why_EN: string;
    best_primary_indication: string;
    secondary_indications: string;
    target_layer: string;
    aggressiveness_score: number;
    safety_margin: string;
    survey_primary_match: string;
    survey_secondary_match: string;
    booster_pairing_note_KO: string;
    booster_pairing_note_EN: string;
    recommended_supporting_care: string;
}

interface EBDDeviceRecord {
    id: string;
    device_id: string;
    device_name: string;
    primary_indication: string;
    secondary_indication: string;
    avg_downtime_days: number;
    avg_pain_level: string;
    trend_score: number;
    brand_tier: string;
    clinical_evidence_score: number;
    signature_technology: string;
    clinical_charactor: string;
    reason_why: string;
    evidence_basis: string;
    launch_year: number;
    EBD_Category: string[]; // Linked record IDs
}

interface SkinBoosterRecord {
    id: string;
    booster_id: string;
    booster_name: string;
    canonical_role: string;
    primary_effect: string;
    secondary_effect: string;
    target_layer: string;
    key_value: string;
    product_page_url: string;
    delivery_method_ids: string[];
}

interface InjectableRuleRecord {
    id: string;
    rule_id: string;
    target_layer: string;
    rule_rationale: string;
    safety_flag: boolean;
    rule_category: string;
    relaxation_logic: string;
    priority: number;
}

// ─── Data Fetchers (Pure Data) ─────────────────────────────────────────────

async function fetchIndicationMap(): Promise<IndicationMapRecord[]> {
    const records = await base(TBL_INDICATION_MAP).select().all();
    return records.map(r => ({
        id: r.id,
        indication_name: (r.get('indication_name') as string) || '',
        canonical_signal: (r.get('canonical_signal') as string) || '',
        recommended_category_ids: (r.get('recommended_category_ids') as string) || '',
        survey_signals: (r.get('survey_signals') as string) || '',
        notes: (r.get('notes') as string) || '',
        concern_domain: (r.get('concern_domain') as string) || ''
    }));
}

async function fetchEBDCategories(): Promise<EBDCategoryRecord[]> {
    const records = await base(TBL_EBD_CATEGORY).select().all();
    return records.map(r => ({
        id: r.id,
        category_id: (r.get('category_id') as string) || '',
        category_display_name: (r.get('category_display_name') as string) || '',
        category_description: (r.get('category_description') as string) || '',
        budget_tier: (r.get('budget_tier') as string) || '',
        avg_pain_level: (r.get('avg_pain_level') as string) || '',
        avg_downtime: (r.get('avg_downtime') as string) || '',
        recommended_sessions: Number(r.get('recommended_sessions') || 1),
        contraindicated_conditions: (r.get('contraindicated_conditions') as string) || '',
        thin_skin_fit: (r.get('thin_skin_fit') as string) || '',
        risk_flag_trigger: (r.get('risk_flag_trigger') as string) || '',
        preferred_booster_roles: (r.get('preferred_booster_roles') as string) || '',
        reason_why_template: (r.get('reason_why_template') as string) || '',
        reason_why_EN: (r.get('reason_why_EN') as string) || '',
        best_primary_indication: (r.get('best_primary_indication') as string) || '',
        secondary_indications: (r.get('secondary_indications') as string) || '',
        target_layer: (r.get('target_layer') as string) || '',
        aggressiveness_score: Number(r.get('aggressiveness_score') || 0),
        safety_margin: (r.get('safety_margin') as string) || '',
        survey_primary_match: (r.get('survey_primary_match') as string) || '',
        survey_secondary_match: (r.get('survey_secondary_match') as string) || '',
        booster_pairing_note_KO: (r.get('booster_pairing_note_KO') as string) || '',
        booster_pairing_note_EN: (r.get('booster_pairing_note_EN') as string) || '',
        recommended_supporting_care: (r.get('recommended_supporting_care') as string) || '',
    }));
}

async function fetchEBDDevices(): Promise<EBDDeviceRecord[]> {
    const records = await base(TBL_EBD_DEVICE).select().all();
    return records.map(r => ({
        id: r.id,
        device_id: (r.get('device_id') as string) || '',
        device_name: (r.get('device_name') as string) || '',
        primary_indication: (r.get('primary_indication') as string) || '',
        secondary_indication: (r.get('secondary_indication') as string) || '',
        avg_downtime_days: Number(r.get('avg_downtime_days') || 0),
        avg_pain_level: (r.get('avg_pain_level') as string) || '',
        trend_score: Number(r.get('trend_score') || 0),
        brand_tier: (r.get('brand_tier') as string) || '',
        clinical_evidence_score: Number(r.get('clinical_evidence_score') || 0),
        signature_technology: (r.get('signature_technology') as string) || '',
        clinical_charactor: (r.get('clinical_charactor') as string) || '',
        reason_why: (r.get('reason_why') as string) || '',
        evidence_basis: (r.get('evidence_basis') as string) || '',
        launch_year: Number(r.get('launch_year') || 0),
        EBD_Category: (r.get('EBD_Category') as string[]) || [], // Link IDs
    }));
}

async function fetchSkinBoosters(): Promise<SkinBoosterRecord[]> {
    const records = await base(TBL_SKIN_BOOSTER).select().all();
    return records.map(r => ({
        id: r.id,
        booster_id: (r.get('booster_id') as string) || '',
        booster_name: (r.get('booster_name') as string) || '',
        canonical_role: (r.get('canonical_role') as string) || '',
        primary_effect: (r.get('primary_effect') as string) || '',
        secondary_effect: (r.get('secondary_effect') as string) || '',
        target_layer: (r.get('target_layer') as string) || '',
        key_value: (r.get('key_value') as string) || '',
        product_page_url: (r.get('product_page_url') as string) || '',
        delivery_method_ids: (r.get('delivery_method_ids') as string[]) || [],
    }));
}

async function fetchInjectableRules(): Promise<InjectableRuleRecord[]> {
    const records = await base(TBL_INJECTABLE_RULES).select().all();
    return records.map(r => ({
        id: r.id,
        rule_id: (r.get('rule_id') as string) || '',
        target_layer: (r.get('target_layer') as string) || '',
        rule_rationale: (r.get('rule_rationale') as string) || '',
        safety_flag: Boolean(r.get('safety_flag')),
        rule_category: (r.get('rule_category') as string) || '',
        relaxation_logic: (r.get('relaxation_logic') as string) || '',
        priority: Number(r.get('priority') || 0),
    }));
}

// ─── Constants & AI Config ────────────────────────────────────────────────

const CLINICAL_SYSTEM_PROMPT = `You are a Korean medical aesthetics clinical AI advisor specializing in EBD
(Evidence-Based Dermatology). You receive a patient profile and a complete
proprietary knowledge base of aesthetic treatments, devices, and boosters
used in Korean medical aesthetic clinics.

YOUR TASK: Analyze the patient profile and select the 3 best-fit treatment
categories. Use the clinical indication map, category knowledge base, and
device data to reason carefully.

HARD RULES (never violate):
1. Budget constraint: If patient budget is 'Economy' or 'Mid', never assign
   a category with budget_tier='Luxury' as rank_1. Economy patients MUST get
   Economy/Mid rank_1.
2. Melasma + Sun-worsened pigmentation: NEVER recommend as rank_1 any category
   whose contraindicated_conditions contains 'melasma' or 'pigmentation' risk.
   PREFER: PICO, Q_SWITCH. AVOID: IPL at high power, CO2, aggressive ablative.
3. Active inflammatory acne: AVOID ablative resurfacing (CO2, ERYAG) as rank_1.
   PREFER: MN_RF (bypasses epidermis), LED, Q_SWITCH (toning mode).
4. Thin/sensitive skin: Aggressiveness score should be <=5 for rank_1.
   PREFER categories with thin_skin_fit = 'High' or 'Good'.
5. Past injectable dissatisfaction: Downweight injectable-heavy categories.
   Prefer energy-based device categories over injection-primary ones.
6. Elongated/vertical pores (aging type = dermal volume loss):
   Prioritize dermal collagen stimulation (MN_RF, PICO Fractional) over
   surface-only resurfacing.
7. NEGATIVE FIRST: Before selecting rank_1/2/3, explicitly list which
   categories are EXCLUDED for this patient and why.

REASONING PROCESS:
1. First identify the patient's clinical indications from the indication map
2. List excluded categories with reasons (apply HARD RULES)
3. From remaining candidates, select rank_1/2/3 by best clinical fit
4. For each rank, select 1-3 devices from that category's EBD_Device list
   (prefer higher trend_score + clinical_evidence_score for Premium/Standard
   budget; prefer Budget brand_tier for Economy budget)
5. For each rank, select 0-2 boosters matching preferred_booster_roles
6. Generate warm, evidence-based explanations in Korean and English

OUTPUT: Return ONLY valid JSON matching the exact schema. No markdown wrapping block (\`\`\`json). No extra text outside JSON.`;

const CategoryRankSchema = z.object({
    category_id: z.string(),
    why_KO: z.string(),
    why_EN: z.string(),
    recommended_device_ids: z.array(z.string()).max(3),
    recommended_booster_ids: z.array(z.string()).max(2),
    fit_score: z.number().min(0).max(100),
});

const ClinicalRecommendationSchema = z.object({
    excluded_categories: z.array(z.object({
        category_id: z.string(),
        reason: z.string(),
    })),
    rank1: CategoryRankSchema,
    rank2: CategoryRankSchema,
    rank3: CategoryRankSchema,
    what_to_avoid_KO: z.string(),
    what_to_avoid_EN: z.string(),
    skin_analysis_summary_KO: z.string(),
    skin_analysis_summary_EN: z.string(),
    doctor_question_KO: z.string(),
    doctor_question_EN: z.string(),
    overall_direction_KO: z.string(),
});

type ClinicalRecommendation = z.infer<typeof ClinicalRecommendationSchema>;

// Helper to construct response structures
function buildCategoryResult(
    rankData: z.infer<typeof CategoryRankSchema>,
    categories: EBDCategoryRecord[],
    devices: EBDDeviceRecord[],
    boosters: SkinBoosterRecord[]
): CategoryRankResult {
    const category = categories.find(c => c.category_id === rankData.category_id) || categories[0];

    // Map devices
    const top_devices: DeviceSummary[] = rankData.recommended_device_ids
        .map(did => devices.find(d => d.device_id === did || d.id === did))
        .filter(Boolean)
        .map(d => ({
            device_id: d!.device_id,
            device_name: d!.device_name,
            pain_modifier: 0
        }));

    // Map boosters
    const top_boosters: BoosterDeliveryItem[] = rankData.recommended_booster_ids
        .map(bid => boosters.find(b => b.booster_id === bid || b.id === bid))
        .filter(Boolean)
        .map(b => ({
            booster_id: b!.booster_id,
            booster_name: b!.booster_name,
            canonical_role: b!.canonical_role,
            injection_target_layer: b!.target_layer,
            delivery_method_id: null,
            delivery_name: 'Manual Injection',
            delivery_pain_level: 'Medium',
            is_safety_required: false
        }));

    return {
        category_id: category.category_id,
        score: rankData.fit_score,
        why_KO: rankData.why_KO || null,
        why_EN: rankData.why_EN || null,
        radar: { efficacy: 90, downtime: 85, discomfort: 80, cost_efficiency: 75, maintenance: 85 },
        top_devices,
        top_boosters,
        booster_pairing_note_KO: category.booster_pairing_note_KO || null,
        booster_pairing_note_EN: category.booster_pairing_note_EN || null,
        recommended_sessions: category.recommended_sessions,
        session_interval_weeks: 4,
        recommended_supporting_care: []
    };
}

// ─── Main Handler ─────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const surveyData = req.body;

        // --- Step 1: FETCH ALL KNOWLEDGE BASE DATA IN PARALLEL ---
        const [
            indicationRecords,
            categoryRecords,
            deviceRecords,
            boosterRecords,
            ruleRecords
        ] = await Promise.all([
            fetchIndicationMap(),
            fetchEBDCategories(),
            fetchEBDDevices(),
            fetchSkinBoosters(),
            fetchInjectableRules()
        ]);

        // --- Step 2: BUILD THE CLINICAL PROMPT ---
        const indicationText = indicationRecords.map(r => `INDICATION: ${r.indication_name}\nSurvey Signals: ${r.survey_signals}\nRecommended Categories: ${r.recommended_category_ids}\nNotes/Contraindications: ${r.notes}`).join('\n\n');

        const categoryText = categoryRecords.map(r => `CATEGORY: ${r.category_id} | ${r.category_display_name}\nBudget Tier: ${r.budget_tier}\nPain: ${r.avg_pain_level} | Downtime: ${r.avg_downtime} | Sessions: ${r.recommended_sessions}\nThin Skin Fit: ${r.thin_skin_fit}\nContraindicated For: ${r.contraindicated_conditions}\nRisk Flag Trigger: ${r.risk_flag_trigger}\nBest Indication: ${r.best_primary_indication}\nSecondary: ${r.secondary_indications}\nPreferred Boosters: ${r.preferred_booster_roles}`).join('\n\n');

        const deviceText = deviceRecords.map(r => `DEVICE: ${r.device_id} | ${r.device_name}\nCategory Link: ${r.EBD_Category?.join(', ')}\nTrend: ${r.trend_score}/10 | Brand: ${r.brand_tier} | Evidence: ${r.clinical_evidence_score}/5\nTechnology: ${r.signature_technology}\nClinical Characteristics: ${r.clinical_charactor}\nWhy This Device: ${r.reason_why}\nEvidence Basis: ${r.evidence_basis}`).join('\n\n');

        const boosterText = boosterRecords.map(r => `BOOSTER: ${r.booster_id} | ${r.booster_name}\nRole: ${r.canonical_role}\nPrimary Effect: ${r.primary_effect}\nSecondary Effect: ${r.secondary_effect}\nTarget Layer: ${r.target_layer}`).join('\n\n');

        const ruleText = ruleRecords.map(r => `RULE: ${r.rule_id} | Safety Flag: ${r.safety_flag}\nRationale: ${r.rule_rationale}\nCategory: ${r.rule_category} | Priority: ${r.priority}`).join('\n\n');

        const userPrompt = `── PATIENT PROFILE ──
Primary Goal: ${surveyData.primaryGoal || ''}
Secondary Goal: ${surveyData.secondaryGoal || ''}
Risk Flags: ${(surveyData.risks || []).join(', ')}
Acne Type: ${surveyData.acne || 'None'}
Pigmentation: ${surveyData.pigment || 'None'}
Problem Areas: ${surveyData.concernAreas || ''}
Pore Type: ${surveyData.pores || ''}
Priority: ${surveyData.priority || ''}
Skin Profile: ${surveyData.skinType || ''}
Result Style: ${surveyData.resultStyle || ''}
Pain Tolerance: ${surveyData.painTolerance || ''}
Downtime Tolerance: ${surveyData.downtimeTolerance || ''}
Budget: ${surveyData.budget || ''}
Visit Frequency: ${surveyData.visitFrequency || ''}
Past Experience: ${surveyData.history || ''}
Past Satisfaction: ${surveyData.historySatisfaction || ''}
Korea Visit: ${surveyData.koreaVisitPlan || ''} - ${surveyData.koreaStayDays || ''}

── CLINICAL INDICATION MAP (20 indications) ──
${indicationText}

── EBD CATEGORY KNOWLEDGE BASE (19 categories) ──
${categoryText}

── EBD DEVICE KNOWLEDGE BASE (30 devices) ──
${deviceText}

── SKIN BOOSTER KNOWLEDGE BASE ──
${boosterText}

── INJECTABLE RULES ──
${ruleText}

REMINDER: Return ONLY raw JSON matching the required schema. No other conversational text.`;

        // --- Step 3: CALL API ---
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY, // Use configured env
        });

        let recommendation: ClinicalRecommendation;

        try {
            const msg = await anthropic.messages.create({
                model: 'claude-opus-4-5-20251101', // Exact model specified inside prompt instructions
                max_tokens: 4096,
                temperature: 0.1,
                system: CLINICAL_SYSTEM_PROMPT,
                messages: [
                    { role: 'user', content: userPrompt }
                ]
            });

            const textOutput = msg.content.filter(c => c.type === 'text').map(c => (c as any).text).join('\n');

            // Clean markdown blocks if LLM still includes them
            const jsonString = textOutput.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
            const firstBrace = jsonString.indexOf('{');
            const lastBrace = jsonString.lastIndexOf('}');
            const cleanJson = jsonString.substring(firstBrace, lastBrace + 1);

            // --- Step 4: PARSE RESPONSE WITH ZOD ---
            recommendation = ClinicalRecommendationSchema.parse(JSON.parse(cleanJson));

        } catch (llmError) {
            console.error('[Analyze Engine] LLM / Parsing Error:', llmError);
            return res.status(200).json({
                error: '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                status: 'error'
            });
        }

        // --- Step 5: SAVE TO Recommendation_Run ---
        let runId = `fallback_${Date.now()}`;
        try {
            const rrPayload = {
                rank_1_category_id: recommendation.rank1.category_id,
                rank_2_category_id: recommendation.rank2.category_id,
                rank_3_category_id: recommendation.rank3.category_id,
                why_cat1_KO: recommendation.rank1.why_KO,
                why_cat1_EN: recommendation.rank1.why_EN,
                why_cat2_KO: recommendation.rank2.why_KO,
                why_cat2_EN: recommendation.rank2.why_EN,
                why_cat3_KO: recommendation.rank3.why_KO,
                why_cat3_EN: recommendation.rank3.why_EN,
                patient_summary: recommendation.skin_analysis_summary_KO,
                patient_friendly_summary: recommendation.skin_analysis_summary_EN,
                clinical_warning: recommendation.what_to_avoid_KO,
                comprehensive_analysis: recommendation.overall_direction_KO,
                doctor_question_ko: recommendation.doctor_question_KO,
                doctor_question_en: recommendation.doctor_question_EN,
                top10_device_ids: [
                    ...recommendation.rank1.recommended_device_ids,
                    ...recommendation.rank2.recommended_device_ids,
                    ...recommendation.rank3.recommended_device_ids,
                ].join(', '),
                top5_booster_ids: [
                    ...recommendation.rank1.recommended_booster_ids,
                    ...recommendation.rank2.recommended_booster_ids,
                    ...recommendation.rank3.recommended_booster_ids,
                ].slice(0, 5).join(', '),
                survey_meta_json: JSON.stringify(surveyData),
                status: 'completed',
            };

            const rrRec = await base(TBL_RECOMMENDATION_RUN).create([{ fields: rrPayload }]);
            runId = rrRec[0].id;
        } catch (saveError) {
            console.error('[Analyze Engine] Failed to save to Airtable:', saveError);
        }

        // Build Response Payload matching original formats
        const radarScore = { efficacy: 90, downtime: 85, discomfort: 80, cost_efficiency: 75, maintenance: 85 };
        const riskFlag: RiskFlagData = { triggered: recommendation.excluded_categories.length > 0, reason_KO: recommendation.what_to_avoid_KO, reason_EN: recommendation.what_to_avoid_EN };

        const responsePayload: AnalysisResponseV2 = {
            runId,
            reportId: runId, // alias
            rank1: buildCategoryResult(recommendation.rank1, categoryRecords, deviceRecords, boosterRecords),
            rank2: buildCategoryResult(recommendation.rank2, categoryRecords, deviceRecords, boosterRecords),
            rank3: buildCategoryResult(recommendation.rank3, categoryRecords, deviceRecords, boosterRecords),
            riskFlag,
            radarScore,
        };

        // Fire and forget Async Generation Tasks (if still needed)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://${req.headers.host}`;
        fetch(`${baseUrl}/api/recommendation/generate-report-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ runId, patientId: surveyData.patientId || surveyData.userId || '' })
        }).catch(e => console.error('[Analyze Engine] Async trigger failed:', e));

        try {
            savePatientLog({
                sessionId: runId,
                timestamp: new Date().toISOString(),
                userId: surveyData.userId,
                userEmail: surveyData.userEmail,
                tallyData: surveyData,
                analysisInput: { primaryGoal: surveyData.primaryGoal, secondaryGoal: surveyData.secondaryGoal, budget: surveyData.budget },
                reportId: runId
            });
        } catch (e) { console.error('[LOG]', e); }

        return res.status(200).json(responsePayload);

    } catch (error: any) {
        console.error('[ENGINE] Error:', error);
        return res.status(200).json({
            error: '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            status: 'error'
        });
    }
}
