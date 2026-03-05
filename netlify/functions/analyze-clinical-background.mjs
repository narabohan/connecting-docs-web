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
 *   4. Build dynamic seasonal/contextual modifiers
 *   5. Call Claude Opus with CLINICAL_SYSTEM_PROMPT + full context
 *   6. Validate JSON with manual check
 *   7. Update Recommendation_Run record with V3 fields + status='completed'
 *
 * Changelog v2.0:
 *   - Fixed signiture_technology field name bug (Airtable typo preserved)
 *   - Added new enriched device fields: reason_why_EN, evidence_basis, device_best_primary_indication
 *   - Added concern_domain to indication map fetch
 *   - CLINICAL_SYSTEM_PROMPT: 7 → 13 Hard Rules (Korean-specific additions)
 *   - Dynamic seasonal context injection (summer/winter/spring/fall)
 *   - Compound indication priority logic
 *   - Korea single-visit optimization rule
 *   - Evidence-based device selection rule
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

// ─── Seasonal Context Helper ──────────────────────────────────────────────
function getSeasonalContext() {
    const month = new Date().getMonth() + 1; // 1-12

    if (month >= 6 && month <= 8) {
        return {
            season: 'Summer',
            label: '여름 (6-8월)',
            rule: `SUMMER PROTOCOL ACTIVE: UV exposure high in Korea.
- DOWN-WEIGHT: CO2 ablative, aggressive fractional, high-downtime categories as rank_1.
- UP-WEIGHT: PICO toning (no downtime), HIFU (no sun sensitivity), SKIN_BOOSTER (hydration).
- For any heat device recommended: add sun protection counseling to why_KO/why_EN.
- Melasma patients in summer: PIH risk elevated 2x — apply extra caution on Rule #2.`,
        };
    } else if (month >= 11 || month <= 2) {
        return {
            season: 'Winter',
            label: '겨울 (11월-2월)',
            rule: `WINTER PROTOCOL ACTIVE: Optimal season for aggressive resurfacing in Korea.
- UP-WEIGHT: CO2 ablative, aggressive fractional, high-downtime categories (patients stay indoors).
- Collagen-stimulating procedures (MN_RF, FRAC_1550, HIFU deep) especially effective in winter.
- Dry skin common in Korean winter — add moisturizing booster pairing recommendation.`,
        };
    } else if (month >= 3 && month <= 5) {
        return {
            season: 'Spring',
            label: '봄 (3-5월)',
            rule: `SPRING PROTOCOL: Post-winter skin renewal season.
- Good for: brightening, pigmentation correction, gentle texture improvement.
- Caution: UV starting to increase (April+). Avoid CO2 for outdoor-active patients.
- Spring-specific: melasma may flare with UV increase — reassess pigmentation risk.`,
        };
    } else {
        return {
            season: 'Autumn',
            label: '가을 (9-10월)',
            rule: `AUTUMN PROTOCOL: Best recovery season in Korea (outdoor activity drops, UV decreases).
- Excellent for: aggressive collagen stimulation, resurfacing with downtime.
- UP-WEIGHT: MN_RF (Genius, Morpheus8), CO2, FRAC_1550, HIFU full-face.
- Autumn optimal for patients who refused summer downtime — revisit their plan.`,
        };
    }
}

// ─── Data Fetchers ────────────────────────────────────────────────────────

async function fetchIndicationMap() {
    const recs = await base(TBL_INDICATION_MAP).select().all();
    return recs.map(r => ({
        indication_name: r.get('indication_name') || '',
        canonical_signal: r.get('canonical_signal') || '',
        recommended_category_ids: r.get('recommended_category_ids') || '',
        survey_signals: r.get('survey_signals') || '',
        concern_domain: r.get('concern_domain') || '',
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
        // NOTE: Airtable field is intentionally misspelled as 'signiture_technology'
        signiture_technology: r.get('signiture_technology') || '',
        clinical_charactor: r.get('clinical_charactor') || '',
        reason_why: r.get('reason_why') || '',
        reason_why_EN: r.get('reason_why_EN') || '',
        evidence_basis: r.get('evidence_basis') || '',
        device_best_primary_indication: r.get('device_best_primary_indication') || '',
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
        trend_score: Number(r.get('trend_score') || 0),
        brand_tier: r.get('brand_tier') || '',
        clinical_evidence_score: Number(r.get('clinical_evidence_score') || 0),
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

═══════════════════════════════════════════════════════
HARD RULES (never violate — 13 rules total)
═══════════════════════════════════════════════════════

── SAFETY & BUDGET RULES ──

1. Budget Constraint:
   If patient budget is 'Economy' or 'Mid', never assign a category with
   budget_tier='Luxury' as rank_1. Economy patients MUST get Economy/Mid rank_1.

2. Melasma & Pigmentation Risk:
   NEVER recommend as rank_1 any category whose contraindicated_conditions
   contains 'melasma' or 'pigmentation' risk.
   PREFER: PICO, Q_SWITCH (low-fluence toning mode).
   AVOID: IPL at high power, CO2, aggressive ablative, strong IPL.
   CRITICAL: In summer (Jun-Aug), PIH risk from heat devices is 2x elevated —
   apply extra downgrade to any heat-based category for pigmentation patients.

3. Active Inflammatory Acne:
   AVOID ablative resurfacing (CO2, Er:YAG) as rank_1.
   PREFER: MN_RF (bypasses epidermis), LED, Q_SWITCH (toning mode).

4. Thin / Sensitive Skin:
   Aggressiveness score should be <=5 for rank_1.
   PREFER categories with thin_skin_fit = 'High' or 'Good'.

5. Past Injectable Dissatisfaction:
   Downweight injectable-heavy categories.
   Prefer energy-based device categories over injection-primary ones.

6. Elongated / Vertical Pores (aging type = dermal volume loss):
   Prioritize dermal collagen stimulation (MN_RF, PICO Fractional) over
   surface-only resurfacing.

7. Negative First:
   Before selecting rank_1/2/3, explicitly list which categories are
   EXCLUDED for this patient and why.

── KOREAN MARKET SPECIAL RULES ──

8. Asian Skin PIH Protocol:
   Korean clinic context assumes predominantly Fitzpatrick Type III-V.
   For any recommended heat-based device (RF, IPL, Fractional, CO2):
   (a) Always note conservative energy parameters in why_KO.
   (b) If patient mentions any pigmentation concern (기미, 색소, 칙칙함,
       melasma, PIH, brightening) in ANY goal field: explicitly mention
       PIH risk assessment in skin_analysis_summary_KO.
   (c) Post-treatment sun protection is mandatory — include in doctor_question_KO.

9. Keloid / Hypertrophic Scar Caution:
   If risk_flags contains 'keloid', '켈로이드', 'hypertrophic_scar':
   (a) NEVER recommend CO2 laser or aggressive ablative as rank_1/2/3.
   (b) Exclude deep MN_RF (Genius, Morpheus8 high-density) from rank_1.
   (c) Prefer: PICO, Q_SWITCH, IPL (vascular), HIFU (low-energy setting).
   (d) Add explicit keloid caution to clinical_warning.

10. Seasonal Adjustment (see SEASONAL CONTEXT in patient data section):
    Follow the seasonal protocol provided in the patient context block.
    The current season modifier must influence rank_1 selection.

11. Compound Indication Priority:
    When patient has 3+ concurrent skin concerns (e.g., melasma + acne scar +
    laxity), apply this priority hierarchy:
    Priority 1 → Safety-related concerns (active acne, PIH risk, keloid)
    Priority 2 → Patient's explicitly stated primary goal
    Priority 3 → Secondary goal
    DO NOT spread rank_1/2/3 across unrelated categories — focused depth
    beats shallow breadth. Rank_1 must strongly address the primary concern.

12. Korea Single-Visit Optimization:
    If koreaVisitPlan = 'short' OR koreaStayDays <= 7:
    (a) rank_1 MUST be achievable in 1-2 sessions with durable results.
        PREFERRED: HIFU (1-session lifting), Thermage (single-session RF),
        high-power PICO (1-2 sessions), biostimulator injectable (1 session).
    (b) AVOID recommending series-dependent categories as rank_1:
        IPL (typically 3-4 sessions), standard MN_RF courses (3 sessions),
        gradual-result devices.
    (c) Include a visit_plan note in why_KO explaining single-visit rationale.
    If koreaVisitPlan = 'long' OR koreaStayDays >= 14:
    Consider multi-session protocol optimization as a positive factor.

13. Evidence-Based Device Priority:
    When selecting devices within a category:
    - Primary filter: clinical_evidence_score >= 4 (prefer strong evidence)
    - Secondary filter: trend_score >= 7 (current market relevance in Korea)
    - Budget match: Economy patients → accept evidence_score >= 3 with
      brand_tier = 'Budget'
    - Never select a device with clinical_evidence_score <= 2 as the
      PRIMARY device for rank_1.
    - Use reason_why_EN and evidence_basis fields to justify device selection.

═══════════════════════════════════════════════════════
REASONING PROCESS
═══════════════════════════════════════════════════════

Step 1 — Parse Indication Signals:
  Map patient goals and skin concerns to canonical indications using the
  indication map. Note compound indications (3+ signals → apply Rule #11).

Step 2 — Apply Safety Exclusions (Rules 1-9):
  List all excluded categories with specific rule references.

Step 3 — Apply Seasonal + Visit Context (Rules 10, 12):
  Adjust candidate ranking based on current season and Korea visit plan.

Step 4 — Select Rank 1/2/3:
  From remaining candidates, select by best clinical fit.
  Rank_1 = primary goal + highest safety confidence.
  Rank_2 = secondary goal or complementary category.
  Rank_3 = maintenance or synergistic option.

Step 5 — Select Devices per Category (Rule 13):
  For each rank, select 1-3 devices from that category's EBD_Device list.
  Use clinical_evidence_score + trend_score + brand_tier alignment.
  Reference device's clinical_charactor and reason_why_EN for rationale.

Step 6 — Select Boosters:
  For each rank, select 0-2 boosters matching preferred_booster_roles.
  Prefer boosters with trend_score >= 7.

Step 7 — Generate Explanations:
  why_KO: Warm Korean explanation (patient-facing). Include:
    - Why this category fits their specific concern
    - Device rationale (what makes the specific device right for them)
    - Any seasonal / visit-plan note if applicable
    - PIH/safety counseling if triggered by Rule #2 or #8
  why_EN: Clinical English explanation (doctor-facing). Include:
    - Mechanism of action
    - Evidence basis
    - Device selection rationale

OUTPUT: Return ONLY valid JSON matching the exact schema.
No markdown wrapping block. No extra text outside JSON.

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
  "rank2": { "category_id": string, "why_KO": string, "why_EN": string, "recommended_device_ids": string[], "recommended_booster_ids": string[], "fit_score": number },
  "rank3": { "category_id": string, "why_KO": string, "why_EN": string, "recommended_device_ids": string[], "recommended_booster_ids": string[], "fit_score": number },
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
    console.log('[BG] analyze-clinical-background v2.0 started');

    // Declare runId at handler scope so catch block can always access it
    let runId = null;

    try {
        const body = JSON.parse(event.body || '{}');
        runId = body.runId;

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

        // --- Step 2: Get seasonal context (dynamic) ---
        const seasonal = getSeasonalContext();
        console.log('[BG] Seasonal context:', seasonal.season, seasonal.label);

        // --- Step 3: Fetch all knowledge base tables in parallel ---
        console.log('[BG] Fetching Airtable knowledge base...');
        const [indicationRecords, categoryRecords, deviceRecords, boosterRecords, ruleRecords] =
            await Promise.all([
                fetchIndicationMap(),
                fetchEBDCategories(),
                fetchEBDDevices(),
                fetchSkinBoosters(),
                fetchInjectableRules(),
            ]);

        // --- Step 4: Build clinical prompt ---
        const indicationText = indicationRecords.map(r =>
            `INDICATION: ${r.indication_name}${r.concern_domain ? ` [${r.concern_domain}]` : ''}
Canonical Signal: ${r.canonical_signal}
Survey Signals: ${r.survey_signals}
Recommended Categories: ${r.recommended_category_ids}
Notes: ${r.notes}`
        ).join('\n\n');

        const categoryText = categoryRecords.map(r =>
            `CATEGORY: ${r.category_id} | ${r.category_display_name}
Budget Tier: ${r.budget_tier} | Pain: ${r.avg_pain_level} | Downtime: ${r.avg_downtime} | Sessions: ${r.recommended_sessions}
Thin Skin Fit: ${r.thin_skin_fit} | Contraindicated For: ${r.contraindicated_conditions}
Best Indication: ${r.best_primary_indication} | Secondary: ${r.secondary_indications}
Preferred Boosters: ${r.preferred_booster_roles}
Booster Pairing Note (KO): ${r.booster_pairing_note_KO}`
        ).join('\n\n');

        const deviceText = deviceRecords.map(r =>
            `DEVICE: ${r.device_id} | ${r.device_name}
Trend: ${r.trend_score}/10 | Brand: ${r.brand_tier} | Evidence: ${r.clinical_evidence_score}/5 | Evidence Basis: ${r.evidence_basis}
Best Indication: ${r.device_best_primary_indication}
Technology: ${r.signiture_technology}
Clinical Profile: ${r.clinical_charactor}
Why Recommend (KO): ${r.reason_why}
Why Recommend (EN): ${r.reason_why_EN}`
        ).join('\n\n');

        const boosterText = boosterRecords.map(r =>
            `BOOSTER: ${r.booster_id} | ${r.booster_name}
Role: ${r.canonical_role} | Trend: ${r.trend_score}/10 | Evidence: ${r.clinical_evidence_score}/5 | Brand: ${r.brand_tier}
Effect: ${r.primary_effect} | Layer: ${r.target_layer}`
        ).join('\n\n');

        const ruleText = ruleRecords.map(r =>
            `RULE: ${r.rule_id} | Safety: ${r.safety_flag}
Rationale: ${r.rule_rationale} | Category: ${r.rule_category} | Priority: ${r.priority}`
        ).join('\n\n');

        // --- Step 5: Build user prompt with dynamic seasonal context ---
        const userPrompt = `── CURRENT DATE & SEASONAL CONTEXT ──
Season: ${seasonal.label}
${seasonal.rule}

── PATIENT PROFILE ──
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
Korea Visit Plan: ${surveyData.koreaVisitPlan || 'unknown'} | Stay Days: ${surveyData.koreaStayDays || 'unknown'}

── CLINICAL INDICATION MAP ──
${indicationText}

── EBD CATEGORY KNOWLEDGE BASE ──
${categoryText}

── EBD DEVICE KNOWLEDGE BASE (enriched) ──
${deviceText}

── SKIN BOOSTER KNOWLEDGE BASE ──
${boosterText}

── INJECTABLE RULES ──
${ruleText}

REMINDER: Apply all 13 Hard Rules. Return ONLY raw JSON. No markdown fences. No extra text.`;

        // --- Step 6: Call Claude Opus ---
        console.log('[BG] Calling Claude Opus (v2.0 prompt)...');
        const msg = await anthropic.messages.create({
            model: 'claude-opus-4-5-20251101',
            max_tokens: 3500,
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

        console.log('[BG] Claude returned rank1:', recommendation.rank1.category_id,
            '| rank2:', recommendation.rank2.category_id,
            '| rank3:', recommendation.rank3.category_id);

        // --- Step 7: Update Recommendation_Run ---
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
        // runId is in handler scope — always available here, no need to re-parse event.body
        if (runId) {
            try {
                await base(TBL_RECOMMENDATION_RUN).update(runId, { status: 'error' });
                console.log('[BG] status set to error for runId:', runId);
            } catch (_) {
                console.error('[BG] Could not set status:error for runId:', runId);
            }
        }
    }
};
