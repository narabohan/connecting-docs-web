/**
 * Netlify Background Function: analyze-clinical-background
 * ─────────────────────────────────────────────────────────
 * Called fire-and-forget from /api/engine/analyze.ts
 * Runs up to 15 minutes — no serverless timeout problem.
 *
 * Flow:
 *   1. Read runId from request body
 *   2. Fetch survey_meta_json from Recommendation_Run record
 *   3. Fetch all 5 knowledge base tables from Airtable in parallel
 *   4. Call Claude Opus with CLINICAL_SYSTEM_PROMPT + full context
 *   5. Validate JSON with Zod-like manual check
 *   6. Update Recommendation_Run record with V3 fields + status='completed'
 */

import Airtable from 'airtable';
import Anthropic from '@anthropic-ai/sdk';

// ─── Airtable Setup ───────────────────────────────────────────────────────
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID || 'appS8kd8H48DMYXct');

const TBL_INDICATION_MAP    = 'tbl4xrXM1kllfQSMS';
const TBL_EBD_CATEGORY      = 'tblCCnizVeFcNpjbj';
const TBL_EBD_DEVICE        = 'tblZrp328Yu9HETOj';
const TBL_SKIN_BOOSTER      = 'tblta0NVjbNgh8Avs';
const TBL_INJECTABLE_RULES  = 'tblNESYb9m7kKabAX';
const TBL_RECOMMENDATION_RUN = 'tblAv5eoTae4Al5zy';

// ─── Anthropic Setup ──────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Data Fetchers ────────────────────────────────────────────────────────

async function fetchIndicationMap() {
    const recs = await base(TBL_INDICATION_MAP).select().all();
    return recs.map(r => ({
        indication_name: r.get('indication_name') || '',
        canonical_signal: r.get('canonical_signal') || '',
        recommended_category_ids: r.get('recommended_category_ids') || '',
        survey_signals: r.get('survey_signals') || '',
        notes: r.get('notes') || '',
    }));
}

async function fetchEBDCategories() {
    const recs = await base(TBL_EBD_CATEGORY).select().all();
    return recs.map(r => ({
        category_id: r.get('category_id') || '',
        category_display_name: r.get('category_display_name') || '',
        budget_tier: r.get('budget_tier') || '',
        avg_pain_level: r.get('avg_pain_level') || '',
        avg_downtime: r.get('avg_downtime') || '',
        recommended_sessions: Number(r.get('recommended_sessions') || 1),
        contraindicated_conditions: r.get('contraindicated_conditions') || '',
        thin_skin_fit: r.get('thin_skin_fit') || '',
        risk_flag_trigger: r.get('risk_flag_trigger') || '',
        preferred_booster_roles: r.get('preferred_booster_roles') || '',
        best_primary_indication: r.get('best_primary_indication') || '',
        secondary_indications: r.get('secondary_indications') || '',
        booster_pairing_note_KO: r.get('booster_pairing_note_KO') || '',
    }));
}

async function fetchEBDDevices() {
    const recs = await base(TBL_EBD_DEVICE).select().all();
    return recs.map(r => ({
        device_id: r.get('device_id') || '',
        device_name: r.get('device_name') || '',
        trend_score: Number(r.get('trend_score') || 0),
        brand_tier: r.get('brand_tier') || '',
        clinical_evidence_score: Number(r.get('clinical_evidence_score') || 0),
        signature_technology: r.get('signature_technology') || '',
        clinical_charactor: r.get('clinical_charactor') || '',
        reason_why: r.get('reason_why') || '',
        primary_indication: r.get('primary_indication') || '',
    }));
}

async function fetchSkinBoosters() {
    const recs = await base(TBL_SKIN_BOOSTER).select().all();
    return recs.map(r => ({
        booster_id: r.get('booster_id') || '',
        booster_name: r.get('booster_name') || '',
        canonical_role: r.get('canonical_role') || '',
        primary_effect: r.get('primary_effect') || '',
        target_layer: r.get('target_layer') || '',
    }));
}

async function fetchInjectableRules() {
    const recs = await base(TBL_INJECTABLE_RULES).select().all();
    return recs.map(r => ({
        rule_id: r.get('rule_id') || '',
        rule_rationale: r.get('rule_rationale') || '',
        safety_flag: Boolean(r.get('safety_flag')),
        rule_category: r.get('rule_category') || '',
        priority: Number(r.get('priority') || 0),
    }));
}

// ─── Clinical System Prompt ───────────────────────────────────────────────

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

OUTPUT: Return ONLY valid JSON matching the exact schema. No markdown wrapping block. No extra text outside JSON.

Required JSON schema:
{
  "excluded_categories": [{ "category_id": string, "reason": string }],
  "rank1": {
    "category_id": string,
    "why_KO": string,
    "why_EN": string,
    "recommended_device_ids": string[],
    "recommended_booster_ids": string[],
    "fit_score": number
  },
  "rank2": { same as rank1 },
  "rank3": { same as rank1 },
  "what_to_avoid_KO": string,
  "what_to_avoid_EN": string,
  "skin_analysis_summary_KO": string,
  "skin_analysis_summary_EN": string,
  "doctor_question_KO": string,
  "doctor_question_EN": string,
  "overall_direction_KO": string
}`;

// ─── Main Handler ─────────────────────────────────────────────────────────

export const handler = async (event, context) => {
    console.log('[BG] analyze-clinical-background started');

    try {
        const body = JSON.parse(event.body || '{}');
        const { runId } = body;

        if (!runId) {
            console.error('[BG] No runId provided');
            return;
        }

        // --- Step 1: Read survey_meta_json from Recommendation_Run ---
        let surveyData;
        try {
            const rrRec = await base(TBL_RECOMMENDATION_RUN).find(runId);
            const surveyJson = rrRec.get('survey_meta_json');
            surveyData = JSON.parse(surveyJson || '{}');
        } catch (e) {
            console.error('[BG] Failed to read Recommendation_Run:', e);
            await base(TBL_RECOMMENDATION_RUN).update(runId, { status: 'error' });
            return;
        }

        // --- Step 2: Fetch all knowledge base tables in parallel ---
        console.log('[BG] Fetching Airtable knowledge base...');
        const [indicationRecords, categoryRecords, deviceRecords, boosterRecords, ruleRecords] =
            await Promise.all([
                fetchIndicationMap(),
                fetchEBDCategories(),
                fetchEBDDevices(),
                fetchSkinBoosters(),
                fetchInjectableRules(),
            ]);

        // --- Step 3: Build clinical prompt ---
        const indicationText = indicationRecords.map(r =>
            `INDICATION: ${r.indication_name}\nSurvey Signals: ${r.survey_signals}\nRecommended Categories: ${r.recommended_category_ids}\nNotes: ${r.notes}`
        ).join('\n\n');

        const categoryText = categoryRecords.map(r =>
            `CATEGORY: ${r.category_id} | ${r.category_display_name}\nBudget Tier: ${r.budget_tier}\nPain: ${r.avg_pain_level} | Downtime: ${r.avg_downtime} | Sessions: ${r.recommended_sessions}\nThin Skin Fit: ${r.thin_skin_fit}\nContraindicated For: ${r.contraindicated_conditions}\nBest Indication: ${r.best_primary_indication}\nPreferred Boosters: ${r.preferred_booster_roles}`
        ).join('\n\n');

        const deviceText = deviceRecords.map(r =>
            `DEVICE: ${r.device_id} | ${r.device_name}\nTrend: ${r.trend_score}/10 | Brand: ${r.brand_tier} | Evidence: ${r.clinical_evidence_score}/5\nTechnology: ${r.signature_technology}\nClinical Characteristics: ${r.clinical_charactor}\nWhy: ${r.reason_why}`
        ).join('\n\n');

        const boosterText = boosterRecords.map(r =>
            `BOOSTER: ${r.booster_id} | ${r.booster_name}\nRole: ${r.canonical_role}\nEffect: ${r.primary_effect}\nLayer: ${r.target_layer}`
        ).join('\n\n');

        const ruleText = ruleRecords.map(r =>
            `RULE: ${r.rule_id} | Safety: ${r.safety_flag}\nRationale: ${r.rule_rationale} | Category: ${r.rule_category} | Priority: ${r.priority}`
        ).join('\n\n');

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

── CLINICAL INDICATION MAP ──
${indicationText}

── EBD CATEGORY KNOWLEDGE BASE (19 categories) ──
${categoryText}

── EBD DEVICE KNOWLEDGE BASE (30 devices) ──
${deviceText}

── SKIN BOOSTER KNOWLEDGE BASE ──
${boosterText}

── INJECTABLE RULES ──
${ruleText}

REMINDER: Return ONLY raw JSON. No markdown fences. No extra text.`;

        // --- Step 4: Call Claude Opus ---
        console.log('[BG] Calling Claude Opus...');
        const msg = await anthropic.messages.create({
            model: 'claude-opus-4-5-20251101',
            max_tokens: 3000,
            temperature: 0.1,
            system: CLINICAL_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
        });

        const textOutput = msg.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('\n');

        // Clean markdown fences if present
        const stripped = textOutput.replace(/^```json\s*/m, '').replace(/\s*```$/m, '').trim();
        const firstBrace = stripped.indexOf('{');
        const lastBrace = stripped.lastIndexOf('}');
        const cleanJson = stripped.substring(firstBrace, lastBrace + 1);

        const recommendation = JSON.parse(cleanJson);

        // Basic validation
        if (!recommendation.rank1?.category_id || !recommendation.rank2?.category_id || !recommendation.rank3?.category_id) {
            throw new Error('Invalid recommendation structure from Claude');
        }

        console.log('[BG] Claude returned rank1:', recommendation.rank1.category_id);

        // --- Step 5: Update Recommendation_Run ---
        const deviceIds = [
            ...(recommendation.rank1.recommended_device_ids || []),
            ...(recommendation.rank2.recommended_device_ids || []),
            ...(recommendation.rank3.recommended_device_ids || []),
        ];
        const boosterIds = [
            ...(recommendation.rank1.recommended_booster_ids || []),
            ...(recommendation.rank2.recommended_booster_ids || []),
            ...(recommendation.rank3.recommended_booster_ids || []),
        ].slice(0, 5);

        await base(TBL_RECOMMENDATION_RUN).update(runId, {
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
            top10_device_ids: deviceIds.join(', '),
            top5_booster_ids: boosterIds.join(', '),
            status: 'completed',
        });

        console.log('[BG] Recommendation_Run updated. runId:', runId, '→ completed');

    } catch (error) {
        console.error('[BG] Fatal error:', error);
        // Try to mark the record as error so the frontend can show a message
        try {
            const body = JSON.parse(event.body || '{}');
            if (body.runId) {
                await base(TBL_RECOMMENDATION_RUN).update(body.runId, { status: 'error' });
            }
        } catch (_) {}
    }
};
