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
 *
 * Changelog v2.1:
 *   - Rule #13 softened: hard evidence block → -10 scoring penalty (DermaV / Quadessy fix)
 *   - Rule #14 added: CLINICAL_PROTOCOL blocks as highest-priority reasoning override
 *   - New CLINICAL_PROTOCOLS Airtable table fetch (graceful no-op if table not yet created)
 *   - triggered_protocols signal from Haiku conversation conductor injected into context
 *   - Protocol-endorsed devices exempt from Rule #13 low-evidence penalty
 *
 * Changelog v2.2:
 *   - Per-rank device IDs now stored separately: rank_1_device_ids, rank_2_device_ids, rank_3_device_ids
 *   - Enables accurate Device Intelligence Cards in DeepDiveModal (no category→device link ambiguity)
 *   - top10_device_ids preserved for backward compat
 *
 * Changelog v2.3:
 *   - Step 8: device_alternatives per rank — same-mechanism alternative devices with cost/tradeoff notes
 *   - Step 9: clinical_narrative_KO/EN — deep 3-4 paragraph clinical narrative (skin state portrait,
 *     treatment sequencing rationale, protocol depth insights, Korea visit optimization)
 *   - max_tokens: 3500 → 6000 (narrative requires more tokens)
 *   - temperature: 0.1 → 0.2 (slightly more natural narrative voice)
 *   - New Airtable fields: clinical_narrative_KO, clinical_narrative_EN, device_alternatives_json
 */

import Airtable from 'airtable';
import Anthropic from '@anthropic-ai/sdk';

// ─── Airtable Setup ───────────────────────────────────────────────────────
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID || 'appS8kd8H48DMYXct');

const TBL_INDICATION_MAP = 'tbl4xrXM1kllfQSMS';
const TBL_EBD_CATEGORY = 'tblCCnizVeFcNpjbj';
const TBL_EBD_DEVICE = 'tblZrp328Yu9HETOj';
const TBL_SKIN_BOOSTER = 'tblta0NVjbNgh8Avs';
const TBL_INJECTABLE_RULES = 'tblNESYb9m7kKabAX';
const TBL_RECOMMENDATION_RUN = 'tblAv5eoTae4Al5zy';
// CLINICAL_PROTOCOLS table created: tblHcQPrHdlxA692o (6 protocols loaded)
// Also set AIRTABLE_TBL_CLINICAL_PROTOCOLS=tblHcQPrHdlxA692o in Netlify env vars
const TBL_CLINICAL_PROTOCOLS = process.env.AIRTABLE_TBL_CLINICAL_PROTOCOLS || 'tblHcQPrHdlxA692o';
// CLINICAL_INSIGHTS_KB table created: tblcHlnAhWE5eeSaT (v2.4)
// Set AIRTABLE_TBL_CLINICAL_INSIGHTS_KB=tblcHlnAhWE5eeSaT in Netlify env vars
const TBL_CLINICAL_INSIGHTS_KB = process.env.AIRTABLE_TBL_CLINICAL_INSIGHTS_KB || 'tblcHlnAhWE5eeSaT';

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

/**
 * Fetch clinical protocol blocks that were triggered by the Haiku conversation.
 * Returns empty array if:
 *   - TBL_CLINICAL_PROTOCOLS is not yet configured (table not created)
 *   - No protocol IDs were passed
 *   - Airtable fetch fails for any reason (graceful degradation)
 */
async function fetchClinicalProtocols(protocolIds = []) {
    if (!TBL_CLINICAL_PROTOCOLS || protocolIds.length === 0) return [];
    try {
        const filterFormula = protocolIds.length === 1
            ? `{protocol_id} = "${protocolIds[0]}"`
            : `OR(${protocolIds.map(id => `{protocol_id} = "${id}"`).join(', ')})`;

        const recs = await base(TBL_CLINICAL_PROTOCOLS).select({
            filterByFormula: filterFormula,
            fields: [
                'protocol_id',
                'protocol_name',
                'clinical_reasoning',
                'related_category_ids',
                'endorsed_device_ids',
                'active',
            ],
        }).all();

        return recs
            .filter(r => r.get('active') !== false) // only active protocols
            .map(r => ({
                protocol_id: r.get('protocol_id') || '',
                protocol_name: r.get('protocol_name') || '',
                clinical_reasoning: r.get('clinical_reasoning') || '',
                related_category_ids: String(r.get('related_category_ids') || ''),
                endorsed_device_ids: String(r.get('endorsed_device_ids') || ''),
            }));
    } catch (e) {
        // Non-fatal: protocols enrich context but aren't required for a valid result
        console.warn('[BG] CLINICAL_PROTOCOLS fetch skipped (table may not be configured yet):', e.message);
        return [];
    }
}

/**
 * Fetch curated clinical insights from CLINICAL_INSIGHTS_KB that match this patient's signals.
 * patientSignals: array of lowercase strings derived from survey data
 *   (primary/secondary goal, skin concerns, device names in history, etc.)
 * Returns empty array if:
 *   - TBL_CLINICAL_INSIGHTS_KB is not configured
 *   - No matching rows found (indication_tags overlap with patientSignals)
 *   - Table fetch fails (graceful degradation)
 */
async function fetchClinicalInsightsKB(patientSignals = []) {
    if (!TBL_CLINICAL_INSIGHTS_KB || patientSignals.length === 0) return [];
    try {
        const allRecs = await base(TBL_CLINICAL_INSIGHTS_KB).select({
            fields: ['insight_id', 'indication_tags', 'device_id', 'insight_type',
                     'session_trigger', 'insight_KO', 'insight_EN', 'source', 'active'],
        }).all();

        const signalLower = patientSignals.map(s => s.toLowerCase());

        return allRecs
            .filter(r => r.get('active') === true)
            .filter(r => {
                const tags = String(r.get('indication_tags') || '')
                    .split(',')
                    .map(t => t.trim().toLowerCase())
                    .filter(Boolean);
                // Match if any KB tag appears in any patient signal (or vice versa)
                return tags.some(tag =>
                    signalLower.some(sig => sig.includes(tag) || tag.includes(sig))
                );
            })
            .map(r => ({
                insight_id: r.get('insight_id') || '',
                indication_tags: r.get('indication_tags') || '',
                device_id: r.get('device_id') || '',
                insight_type: r.get('insight_type') || '',
                session_trigger: r.get('session_trigger') || '',
                insight_KO: r.get('insight_KO') || '',
                insight_EN: r.get('insight_EN') || '',
                source: r.get('source') || '',
            }));
    } catch (e) {
        console.warn('[BG] CLINICAL_INSIGHTS_KB fetch skipped (table may not be populated yet):', e.message);
        return [];
    }
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
HARD RULES (never violate — 14 rules total)
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

13. Evidence-Based Device Scoring (Penalty, not Hard Block):
    When scoring devices within a category:
    - PREFERRED: clinical_evidence_score >= 4 (strong evidence base)
    - SECONDARY: trend_score >= 7 (current Korean market relevance)
    - Economy patients: accept evidence_score >= 3 with brand_tier = 'Budget'
    - LOW EVIDENCE PENALTY: devices with clinical_evidence_score <= 2 receive
      a -10 fit-score penalty. DO NOT hard-exclude them — just rank lower.
      Reason: clinically newer devices (e.g., DermaV LP_532_1064, Quadessy HTC)
      may have strong mechanism rationale even if RCT evidence is limited.
    - PROTOCOL OVERRIDE: if Rule #14 protocol block explicitly endorses a device
      (endorsed_device_ids), that device is EXEMPT from the -10 penalty.
    - Use reason_why_EN and evidence_basis fields to justify device selection.
    - Always state the evidence basis and any penalty/override applied in why_EN.

14. Clinical Protocol Priority:
    When CLINICAL_PROTOCOL blocks are present in the patient context (section
    "── CLINICAL PROTOCOL REASONING ──"), treat their clinical_reasoning as the
    HIGHEST-PRIORITY clinical context for category selection and device choice.
    - Protocol reasoning OVERRIDES indication_map hints for category matching.
    - related_category_ids in a protocol block are strongly favored candidates.
    - endorsed_device_ids are EXEMPT from Rule #13 low-evidence penalty.
    - If protocol clinical_reasoning conflicts with a Hard Rule (1–12), the
      Hard Rule still takes precedence (patient safety is never overridden).
    - When a protocol is applied: include a brief protocol rationale note in
      why_KO (e.g., "이 시술은 [프로토콜명] 기반 임상 프로토콜에 따른 추천입니다").
    - If no protocol blocks are present, proceed with indication_map as normal.

═══════════════════════════════════════════════════════
REASONING PROCESS
═══════════════════════════════════════════════════════

Step 1 — Parse Indication Signals:
  Map patient goals and skin concerns to canonical indications using the
  indication map. If CLINICAL_PROTOCOL blocks are present, let protocol
  related_category_ids take priority (Rule #14).
  Note compound indications (3+ signals → apply Rule #11).

Step 2 — Apply Safety Exclusions (Rules 1-9):
  List all excluded categories with specific rule references.

Step 3 — Apply Seasonal + Visit Context (Rules 10, 12):
  Adjust candidate ranking based on current season and Korea visit plan.

Step 4 — Select Rank 1/2/3:
  From remaining candidates, select by best clinical fit.
  Rank_1 = primary goal + highest safety confidence.
  Rank_2 = secondary goal or complementary category.
  Rank_3 = maintenance or synergistic option.
  If protocol blocks present, bias toward protocol-endorsed categories.

Step 5 — Select Devices per Category (Rules 13 + 14):
  For each rank, select 1-3 devices from that category's EBD_Device list.
  Score each device: base score from clinical_evidence_score + trend_score.
  Apply -10 penalty for evidence_score <= 2 (Rule #13).
  Remove penalty if device appears in any active protocol's endorsed_device_ids (Rule #14).
  Reference device's clinical_charactor and reason_why_EN for rationale.

Step 6 — Select Boosters:
  For each rank, select 0-2 boosters matching preferred_booster_roles.
  Prefer boosters with trend_score >= 7.

Step 7 — Generate Explanations:
  why_KO: Warm Korean explanation (patient-facing, 2-3 sentences). Include:
    - Why this category fits their specific concern
    - Device rationale (what makes the specific device right for them)
    - Any seasonal / visit-plan note if applicable
    - PIH/safety counseling if triggered by Rule #2 or #8
  why_EN: Clinical English explanation (doctor-facing, 2-3 sentences). Include:
    - Mechanism of action
    - Evidence basis
    - Device selection rationale

Step 8 — Generate Device Alternatives per Rank:
  For each rank's PRIMARY recommended device (first in recommended_device_ids),
  identify 1-3 alternative devices that use the SAME core energy/mechanism principle
  but differ in brand tier, price point, or clinical tradeoff.
  Examples:
    - Thermage (MonopolarRF) → Volnewmer, XERF, 10Therma (same RF principle, different brands)
    - Ulthera HIFU → Doublo, Shurink, Ultraformer III (same HIFU, different depth/cost)
    - Genius MN_RF → Morpheus8, Scarlet (same microneedle RF, different needle config)
  device_alternatives per rank:
    - device_id: exact device_id string from the EBD_DEVICE knowledge base (or the common Korean clinic name if not in DB)
    - alt_note_KO: 1 sentence explaining the tradeoff vs the primary device (cost, sessions, effect)
    - alt_note_EN: same in English
  If no meaningful alternative exists for a device, return an empty array [].

Step 9 — Generate Clinical Narrative:
  NARRATIVE SOURCES (use in priority order — highest first):
  1. COMPOUND PROTOCOL RULES section in patient context — scan ALL compound rules whose
     Survey Signals overlap with this patient's signals. Use matching rules' Protocol Notes
     as the PRIMARY structure for Paragraph 2 (Treatment Sequencing) and Paragraph 3 (Protocol Depth).
     These notes represent curated, evidence-based sequencing logic — do NOT paraphrase away
     their clinical specificity. Translate into patient-friendly Korean for clinical_narrative_KO.
  2. CLINICAL INSIGHTS KB section (if present in patient context) — each KB entry contains
     a curated protocol insight tied to specific indication tags. Use ALL matching KB insights
     as the core content for Paragraph 3. Do NOT generalize — preserve the specific session-count
     thresholds, mechanism names, and clinical behavior details.
  3. EBD Device Knowledge Base fields: clinical_charactor, reason_why_EN, evidence_basis —
     use for mechanism accuracy in Paragraphs 1 and 2.
  4. General aesthetic medicine knowledge — only for narrative flow and connective tissue.
     NEVER invent session counts, mechanism claims, or combination synergies not supported
     by sources 1-3 above.

  clinical_narrative_KO: A 3-4 paragraph DEEP clinical narrative written like
  an experienced Korean aesthetic doctor advising a well-informed patient.
  This is the most valuable section — information patients CANNOT find with a
  simple web search. Structure:

  [Paragraph 1 — Skin State Portrait]
  Synthesize ALL survey signals into a coherent, honest skin condition assessment.
  Do not just list problems — connect them. Explain what the underlying mechanisms
  are (e.g., "하안부 처짐은 진피층 콜라겐 감소와 골격 지지력 약화가 복합적으로 작용하며...").

  [Paragraph 2 — Treatment Sequencing Rationale]
  REQUIRED SOURCE: Check COMPOUND PROTOCOL RULES for matching sequencing logic FIRST.
  Explain WHY the ORDER of treatments matters for this SPECIFIC patient.
  If competing conditions exist (e.g., melasma + laxity, active acne + scarring):
  explicitly state the sequencing priority and what happens if wrong order is followed.
  Use the Protocol Notes from COMPOUND PROTOCOL RULES verbatim as the basis.

  [Paragraph 3 — Protocol Depth / What Patients Don't Know]
  REQUIRED SOURCE: Use CLINICAL INSIGHTS KB entries (if present) as primary content.
  If KB is empty, fall back to COMPOUND PROTOCOL RULES notes for session/protocol specifics.
  Provide specific protocol insights that are NOT common knowledge:
  - Session counts that produce qualitatively different results
  - Combination synergies at specific session milestones
  - Device-specific clinical behavior differences patients assume are the same
  - Realistic expectations with honest timelines (e.g., "2-3개월 후 효과가 피크에 달하며...")
  If neither KB nor compound rule notes provide specific data for this patient's devices,
  use mechanism-level reasoning from the device knowledge base only.

  [Paragraph 4 — Korea Visit Optimization] (only if koreaVisitPlan != 'none'/'unknown')
  How to maximize results given their specific visit constraints.
  For short visits: prioritize which single/dual-session procedures give best ROI.
  For longer visits: optimal session spacing and what to complete before returning home.

  clinical_narrative_EN: Clinical English version covering the same depth but
  written for a medical professional reading context. Include mechanism details,
  evidence references where applicable, and clinical decision rationale.

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
    "fit_score": number,
    "device_alternatives": [{ "device_id": string, "alt_note_KO": string, "alt_note_EN": string }]
  },
  "rank2": {
    "category_id": string, "why_KO": string, "why_EN": string,
    "recommended_device_ids": string[], "recommended_booster_ids": string[], "fit_score": number,
    "device_alternatives": [{ "device_id": string, "alt_note_KO": string, "alt_note_EN": string }]
  },
  "rank3": {
    "category_id": string, "why_KO": string, "why_EN": string,
    "recommended_device_ids": string[], "recommended_booster_ids": string[], "fit_score": number,
    "device_alternatives": [{ "device_id": string, "alt_note_KO": string, "alt_note_EN": string }]
  },
  "what_to_avoid_KO": string,
  "what_to_avoid_EN": string,
  "skin_analysis_summary_KO": string,
  "skin_analysis_summary_EN": string,
  "doctor_question_KO": string,
  "doctor_question_EN": string,
  "overall_direction_KO": string,
  "clinical_narrative_KO": string,
  "clinical_narrative_EN": string
}`;

// ─── Main Handler ─────────────────────────────────────────────────────────

export const handler = async (event, context) => {
    console.log('[BG] analyze-clinical-background v2.4 started');

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
        // Extract triggered_protocols from conversational survey (Haiku conductor)
        // Falls back to [] for backward compatibility with old fixed-survey flow
        const triggeredProtocolIds = Array.isArray(surveyData.triggered_protocols)
            ? surveyData.triggered_protocols
            : [];

        // Build patient signal array for CLINICAL_INSIGHTS_KB matching (v2.4)
        // Combines all survey fields that carry clinical signal — lower-cased for tag matching
        const patientSignals = [
            surveyData.primaryGoal,
            surveyData.secondaryGoal,
            surveyData.acne,
            surveyData.pigment,
            surveyData.pores,
            surveyData.concernAreas,
            surveyData.priority,
            surveyData.skinType,
            ...(surveyData.risks || []),
        ].filter(Boolean).map(s => String(s).toLowerCase());

        console.log('[BG] Fetching Airtable knowledge base...',
            triggeredProtocolIds.length > 0
                ? `| triggered protocols: [${triggeredProtocolIds.join(', ')}]`
                : '| no triggered protocols (indication_map mode)',
            `| patient signals: [${patientSignals.slice(0, 4).join(', ')}...]`);

        const [indicationRecords, categoryRecords, deviceRecords, boosterRecords, ruleRecords, protocolRecords, insightRecords] =
            await Promise.all([
                fetchIndicationMap(),
                fetchEBDCategories(),
                fetchEBDDevices(),
                fetchSkinBoosters(),
                fetchInjectableRules(),
                fetchClinicalProtocols(triggeredProtocolIds),
                fetchClinicalInsightsKB(patientSignals),
            ]);

        // --- Step 4: Build clinical prompt ---

        // Separate simple indications (no notes) from compound protocol rules (have notes)
        // Compound rules contain multi-indication sequencing logic and phase-by-phase protocols
        const simpleIndications = indicationRecords.filter(r => !r.notes);
        const compoundRules = indicationRecords.filter(r => r.notes);

        const indicationText = simpleIndications.map(r =>
            `INDICATION: ${r.indication_name}${r.concern_domain ? ` [${r.concern_domain}]` : ''}
Canonical Signal: ${r.canonical_signal}
Survey Signals: ${r.survey_signals}
Recommended Categories: ${r.recommended_category_ids}`
        ).join('\n\n');

        // Compound rules get their own dedicated section for Step 9 narrative generation
        const compoundRuleText = compoundRules.length > 0
            ? compoundRules.map(r =>
                `COMPOUND RULE: ${r.indication_name}${r.concern_domain ? ` [${r.concern_domain}]` : ''}
Canonical Signal: ${r.canonical_signal}
Survey Signals: ${r.survey_signals}
Recommended Categories: ${r.recommended_category_ids}
Protocol Notes: ${r.notes}`
            ).join('\n\n')
            : '(No compound rules defined yet)';

        // Build CLINICAL_INSIGHTS_KB section for Step 9 Paragraph 3
        const insightsText = insightRecords.length > 0
            ? insightRecords.map(r =>
                `[${r.insight_id}] Type: ${r.insight_type}${r.device_id ? ` | Device: ${r.device_id}` : ''}${r.session_trigger ? ` | Trigger: ${r.session_trigger}` : ''}
Tags: ${r.indication_tags}
KO: ${r.insight_KO}
EN: ${r.insight_EN}`
            ).join('\n\n')
            : '(No matching insights in KB yet — use compound rule notes and device KB for Paragraph 3)';

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

── CLINICAL INDICATION MAP (simple indications) ──
${indicationText}

── COMPOUND PROTOCOL RULES (Step 9 PRIMARY SOURCE for Paragraphs 2 & 3) ──
These rules encode curated multi-indication sequencing logic. When a compound rule's
Survey Signals match this patient, its Protocol Notes MUST structure the narrative.
${compoundRuleText}

── EBD CATEGORY KNOWLEDGE BASE ──
${categoryText}

── EBD DEVICE KNOWLEDGE BASE (enriched) ──
${deviceText}

── SKIN BOOSTER KNOWLEDGE BASE ──
${boosterText}

── INJECTABLE RULES ──
${ruleText}

── CLINICAL PROTOCOL REASONING (Rule #14) ──
${protocolRecords.length > 0
    ? protocolRecords.map(p => `
PROTOCOL: ${p.protocol_id} | ${p.protocol_name}
  Related Categories: ${p.related_category_ids}
  Endorsed Devices (exempt from Rule #13 penalty): ${p.endorsed_device_ids || 'none specified'}
  Clinical Reasoning:
${p.clinical_reasoning}
`).join('\n---\n')
    : '(No clinical protocols triggered — use indication_map as primary signal source)'
}

── CLINICAL INSIGHTS KB (Step 9 Paragraph 3 SOURCE — use verbatim) ──
These are curated, evidence-verified protocol insights. When present, they are the
HIGHEST-PRIORITY source for Paragraph 3 (Protocol Depth / What Patients Don't Know).
Do NOT paraphrase away session counts, mechanism names, or milestone thresholds.
Matched insights for this patient (${insightRecords.length} found):
${insightsText}

REMINDER: Apply all 14 Hard Rules. Rule #13 is a PENALTY (-10), not a hard block.
Rule #14 gives protocol blocks highest reasoning priority for category selection.
Step 9 narrative: use COMPOUND PROTOCOL RULES → CLINICAL INSIGHTS KB → device KB (priority order).
Return ONLY raw JSON. No markdown fences. No extra text.`;

        // --- Step 6: Call Claude Opus ---
        console.log('[BG] Calling Claude (v2.4 prompt, 14 rules, protocol blocks:', protocolRecords.length,
            '| KB insights:', insightRecords.length, '| compound rules:', compoundRules.length, ')...');
        const msg = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 6000,
            temperature: 0.2,
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
        const rank1DeviceIds = (recommendation.rank1.recommended_device_ids || []);
        const rank2DeviceIds = (recommendation.rank2.recommended_device_ids || []);
        const rank3DeviceIds = (recommendation.rank3.recommended_device_ids || []);
        const deviceIds = [...rank1DeviceIds, ...rank2DeviceIds, ...rank3DeviceIds];
        const boosterIds = [
            ...(recommendation.rank1.recommended_booster_ids || []),
            ...(recommendation.rank2.recommended_booster_ids || []),
            ...(recommendation.rank3.recommended_booster_ids || []),
        ].slice(0, 5);

        // Build device_alternatives payload
        const deviceAlternativesPayload = {
            rank1: recommendation.rank1.device_alternatives || [],
            rank2: recommendation.rank2.device_alternatives || [],
            rank3: recommendation.rank3.device_alternatives || [],
        };

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
            // v2.2: Per-rank device IDs for accurate device intelligence display
            rank_1_device_ids: rank1DeviceIds.join(', '),
            rank_2_device_ids: rank2DeviceIds.join(', '),
            rank_3_device_ids: rank3DeviceIds.join(', '),
            // v2.3: Deep clinical narrative + device alternatives
            clinical_narrative_KO: recommendation.clinical_narrative_KO || '',
            clinical_narrative_EN: recommendation.clinical_narrative_EN || '',
            device_alternatives_json: JSON.stringify(deviceAlternativesPayload),
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
