// ═══════════════════════════════════════════════════════════════
//  POST /api/survey-v2/final-recommendation
//  Sonnet 4.6 Final Recommender — generates the full treatment plan
//  Prompt Caching enabled: static prompt cached, dynamic per-patient
//  Based on HYBRID_SURVEY_LOGIC_v2.md §7 + COUNTRY_RECOMMENDATION_WEIGHTS.md
// ═══════════════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk';
import type { SafetyFlag, SurveyLang } from '@/types/survey-v2';
import { buildClinicalRulesPromptBlock } from '@/lib/clinical-rules';
import { robustJsonParse } from '@/lib/json-repair';

// Re-export all types from the extracted types file for backward compatibility
export type {
  FinalRecommendationRequest, FinalRecommendationResponse,
  OpusRecommendationOutput, OpusMirrorLayer, OpusConfidenceLayer,
  OpusPatientProfile, OpusDeviceRecommendation, OpusInjectableAlternative,
  OpusInjectableRecommendation, OpusSolutionStep, OpusSignatureSolution,
  OpusScheduleTreatment, OpusScheduleDay, OpusTreatmentPlan,
  OpusTreatmentPhase, OpusHomecare, OpusDoctorTab,
} from '@/types/recommendation-types';

import type {
  FinalRecommendationRequest, FinalRecommendationResponse,
  OpusRecommendationOutput, OpusDeviceRecommendation,
  OpusInjectableRecommendation, OpusDoctorTab,
} from '@/types/recommendation-types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Country Context Blocks ──────────────────────────────────

const COUNTRY_CONTEXTS: Record<string, string> = {
  JP: `[COUNTRY: JP] Safety-first. Low-pain preferred (+2). Minimal downtime. Natural results. Conservative framing.`,
  CN: `[COUNTRY: CN] Dramatic B/A results. Premium brands (+2). PIH-safe. Single-session max effect. Fitz III-IV.`,
  SEA: `[COUNTRY: SEA] Non-invasive preferred. Cost-sensitive (+2 ROI). K-Beauty trends. Fitz IV-V parameters.`,
  'SG/US': `[COUNTRY: SG/US] MOA transparency. Evidence-based (+2). FDA/CE required. Scientific framing.`,
  KR: `[COUNTRY: KR] Combo-savvy. Trend-aware (+2 trend). Cost-optimized. Experienced patients.`,
};

function getCountryContext(country: string): string {
  if (COUNTRY_CONTEXTS[country]) return COUNTRY_CONTEXTS[country];
  if (['TH', 'VN', 'MY', 'ID', 'PH'].includes(country)) return COUNTRY_CONTEXTS['SEA'];
  if (['SG', 'US', 'AU', 'GB', 'CA'].includes(country)) return COUNTRY_CONTEXTS['SG/US'];
  return COUNTRY_CONTEXTS['KR']; // fallback
}

// ─── Age Bracket Logic (Issue #6) ────────────────────────────
// Determines age-specific clinical weighting context for the AI prompt.
// Detailed clinical rules per bracket will be added with clinical data.

type AgeBracket = '20s' | '30s' | '40s' | '50+';

function parseAgeBracket(ageStr: string): AgeBracket {
  // d_age format: "20-29", "30-39", "40-49", "50-59", "60+"
  const num = parseInt(ageStr, 10);
  if (isNaN(num) || num < 30) return '20s';
  if (num < 40) return '30s';
  if (num < 50) return '40s';
  return '50+';
}

const AGE_BRACKET_CONTEXTS: Record<AgeBracket, string> = {
  '20s': `[AGE: 20s — Prevention] Focus: prevention + barrier. Devices: low-energy MN-RF, gentle PICO toning. Avoid HIFU, aggressive lasers. Injectables: skinbooster (Juvelook/Rejuran HB), exosome. Avoid biostimulators. Weights: texture+2, roi+2. Framing: prevention, not urgent.`,
  '30s': `[AGE: 30s — Early Intervention] Focus: early aging, collagen remodeling. Zones: periorbital > nasolabial > jawline. Devices: MN-RF (Sylfirm X/Genius) → low-mid HIFU → PICO toning. Injectables: PN/PDRN (Rejuran), exosome, skinbooster. Hold filler unless specific volume loss. Weights: tightening+1, elasticity+2. MN-RF 0.5-1.5mm, HIFU 3.0mm.`,
  '40s': `[AGE: 40s — Active Restoration] Focus: moderate aging, volume loss + mid-face sagging. Combination mandatory. Devices: HIFU mid-high (3.0+4.5mm) → MN-RF deep → thread lift if needed. HIFU+MN-RF combo (3-4wk interval). Injectables: biostimulator (Sculptra), HA filler for structure, PN/PDRN maintenance. Weights: lifting+2, volume+3, synergy+2. Single-device insufficient at 40+.`,
  '50+': `[AGE: 50+ — Multi-Layer] Focus: severe laxity + volume loss. Mid-face ≠ lower face (separate targets). Devices: high-energy HIFU → RF+MN-RF combo → thread lift. Layered: HIFU(SMAS) → thread(mechanical) → MN-RF(dermal) → skinbooster(hydration). Injectables: HA filler volume (2-4cc), biostimulator (Sculptra 3-4 vials), PN/PDRN. Avoid superficial-only. Weights: lifting+3, volume+3, safety+2. Conservative energy start. Multi-session mandatory (3-6 months). Pain tolerance may be lower.`,
};

function getAgeBracketContext(ageStr: string): string {
  const bracket = parseAgeBracket(ageStr);
  return AGE_BRACKET_CONTEXTS[bracket];
}

// ─── Enhanced Country Clinical Rules (Issue #6) ──────────────
// More granular country-specific clinical rules beyond general preferences.
// Skeleton with placeholders for clinical data.

const COUNTRY_CLINICAL_RULES: Record<string, string> = {
  KR: `[CLINICAL:KR] Fitz III-IV. PIH moderate. Combo: MN-RF+HIFU(3-4wk), skinbooster(2-4wk). ROI+2. 3-device OK. HIFU:Ultraformer MPT, MN-RF:Sylfirm X PW, Booster:Juvelook>Rejuran>ASCE+. Standard-aggressive energy OK. 2-4wk interval.`,
  JP: `[CLINICAL:JP] Fitz II-III. PIH concern HIGH. Conservative energy, escalate gradually. Max 2-device combo. HIFU:Ulthera(FDA trust), RF:Thermage FLX, MN-RF:Potenza, Booster:Rejuran. Evidence+2. Pain mitigation mandatory. 4-6wk interval. No superlatives.`,
  CN: `[CLINICAL:CN] Fitz III-IV. PIH moderate-high. Premium brands+3(Ulthera,Thermage,Cynosure). High-energy single session preferred. HIFU:Ulthera, MN-RF:Morpheus8/Genius, Inj:Sculptra+HA combo, Booster:ASCE+ trending. Confidence>85 only. 1064nm only for Fitz IV pigment. 1-2mo interval.`,
  SEA: `[CLINICAL:SEA] Fitz IV-V. PIH HIGH CRITICAL. 1064nm ONLY(NEVER 532/755nm). PW-mode MN-RF mandatory. IPL/BBL CONTRAINDICATED Fitz IV-V. HIFU:Ultraformer MPT, MN-RF:Sylfirm X PW, PICO:1064nm only. ROI+2. Energy 20-30% below KR standard. Monthly interval. Simple protocols.`,
  'SG/US': `[CLINICAL:SG/US] Fitz mixed II-V(estimate from demographics). Evidence+3. FDA/CE/TGA mandatory in descriptions. HIFU:Ulthera/Sofwave, MN-RF:Morpheus8/Genius/Sylfirm X, RF:Thermage, Inj:Sculptra/Juvederm/Restylane, Booster:Profhilo/Rejuran. MOA detail expected. 4-6wk interval.`,
};

function getCountryClinicalRules(country: string): string {
  if (COUNTRY_CLINICAL_RULES[country]) return COUNTRY_CLINICAL_RULES[country];
  if (['TH', 'VN', 'MY', 'ID', 'PH'].includes(country)) return COUNTRY_CLINICAL_RULES['SEA'];
  if (['SG', 'US', 'AU', 'GB', 'CA'].includes(country)) return COUNTRY_CLINICAL_RULES['SG/US'];
  return COUNTRY_CLINICAL_RULES['KR'];
}

// ─── Safety Flag → Device Filter ─────────────────────────────

const SAFETY_DEVICE_FILTERS: Record<SafetyFlag, string> = {
  SAFETY_ISOTRETINOIN: 'ALL injectable/laser procedures contraindicated for 6 months. EBD device: consult only.',
  SAFETY_ANTICOAGULANT: 'MN-RF: pause medication 1 week prior. LaseMD: 2 weeks prior. Injection: high bruising risk.',
  SAFETY_PREGNANCY: 'ALL injectables absolutely contraindicated. EBD devices strongly advised to defer until post-delivery/weaning.',
  SAFETY_KELOID: 'Non-invasive ONLY (HIFU, PICO). Ablative laser/Thread Lift absolutely contraindicated.',
  SAFETY_ADVERSE_HISTORY: 'Same treatment contraindicated. Patch test + low-fluence test shot required before any new procedure.',
  SAFETY_PHOTOSENSITIVITY: 'LaseMD: stop 3-5 days prior. IPL/BBL: contraindicated. 1064nm only.',
  HORMONAL_MELASMA: 'Conservative approach for melasma. Avoid aggressive energy. Consider oral TXA 250mg BID. PW MN-RF preferred over CW.',
  RETINOID_PAUSE: 'WiQo: discontinue retinoid. MN-RF: stop 2 weeks prior. 48h post-procedure ban on retinoid.',
  // ─── Phase 3-B P1: 5 new safety conditions ───────────────
  SAFETY_DIABETES: 'Wound healing delay. Conservative energy settings for ablative/MN-RF. Infection risk elevated. Close post-care monitoring.',
  SAFETY_METALLIC_IMPLANT: 'Monopolar RF (Thermage, Volnewmer, Oligio) ABSOLUTELY CONTRAINDICATED. Emface contraindicated. HIFU/laser/LED safe.',
  SAFETY_IMMUNOSUPPRESSANT: 'Normal regeneration impaired. Infection risk high. Most invasive + energy procedures restricted. Doctor consultation mandatory.',
  SAFETY_HERPES_SIMPLEX: 'Thermal energy can reactivate HSV. Antiviral prophylaxis (Valacyclovir) mandatory before laser/RF. Active lesion = absolute contraindication.',
};

// ─── Protocol Selection Logic ────────────────────────────────

function inferTriggeredProtocols(
  primaryGoal: string | null,
  secondaryGoal: string | null,
  riskFlags: string[],
  pigmentPattern: string | null
): string[] {
  const protocols: string[] = [];

  // PROTO_01: Tightening & Lifting
  if (primaryGoal === 'Contouring/lifting' || secondaryGoal === 'Contouring/lifting') {
    protocols.push('PROTO_01');
  }

  // PROTO_02: Pigmentation (기미/색소)
  if (primaryGoal === 'Brightening/radiance' || secondaryGoal === 'Brightening/radiance') {
    protocols.push('PROTO_02');
  }

  // PROTO_03: Volume & Elasticity
  if (primaryGoal === 'Volume/elasticity' || secondaryGoal === 'Volume/elasticity') {
    protocols.push('PROTO_03');
  }

  // PROTO_04: Texture & Pores
  if (primaryGoal === 'Skin texture/pores' || secondaryGoal === 'Skin texture/pores') {
    protocols.push('PROTO_04');
  }

  // PROTO_05: Anti-aging
  if (primaryGoal === 'Anti-aging/prevention' || secondaryGoal === 'Anti-aging/prevention') {
    protocols.push('PROTO_05');
  }

  // PROTO_06: Acne/Scarring
  if (primaryGoal === 'Acne/scarring' || secondaryGoal === 'Acne/scarring') {
    protocols.push('PROTO_06');
  }

  // Risk-based overrides
  const flags = riskFlags || [];
  if (flags.includes('rosacea') || flags.includes('vascular')) {
    if (!protocols.includes('PROTO_03')) protocols.push('PROTO_03');
  }
  if (pigmentPattern === 'hormonal_melasma') {
    if (!protocols.includes('PROTO_02')) protocols.push('PROTO_02');
  }

  return protocols;
}

// ─── System Prompt (Split: Static for caching + Dynamic per-patient) ──────

/** Static system prompt — identical for every call, cached via Prompt Caching */
const STATIC_SYSTEM_PROMPT = `You are an expert AI aesthetic medicine recommender for ConnectingDocs, a Korean medical aesthetics clinic.

Your task: Given a patient's complete profile and clinical context, generate a comprehensive treatment recommendation in structured JSON format.

═══ PROTOCOL CONFLICT RULES ═══
- PROTO_01 + PROTO_02 simultaneous → Exclude Genius RF/Thermage (melasma risk) → Use HIFU + Sylfirm X PW
- PROTO_03 + PROTO_06 simultaneous → Vascular first (4 weeks) → then Pigmentation
- Safety flags → ALWAYS override protocol preferences

═══ CATEGORY-FIRST RECOMMENDATION (3 protocols) ═══
P1(Premium): priority1 category, best match. P2(Trending): priority1-2, trend device. P3(Value): priority2-3, cost-effective.
Each: 1) Select EBD category from CONCERN_TO_CATEGORY_MAP (dynamic section) → 2) Filter by patient conditions(budget,pain,downtime,fitz) → 3) Add injectable combo.
Device selection: premium budget→premium device, budget→value device, low pain tolerance→low-pain first, fitz IV+→IPL/BBL caution.

═══ TREND & POPULARITY (0-10 each) ═══
Trend: 2024-25=8-10, 2022-23=5-7, pre-2022=2-4. Key: Sylfirm X=9, ASCE+=9, Juvelook Vol=9, LaseMD Ultra=8, Potenza=7, Morpheus8=5
Popularity by market: KR(Ultraformer 10,Sylfirm 9,Rejuran 9), JP(Thermage 10,Ulthera 9), CN(Thermage 10,Ulthera 9,Sculptra 8), SEA(Ulthera 9,Rejuran 8), SG/US(Ulthera 9,Morpheus8 8)
Tiebreaker: if confidence within 5pts, higher (trend+popularity)/2 wins.

═══ SKINBOOSTER MATCHING ═══
HA(Juvelook/Rejuran HB)→dry/dehydrated, PN/PDRN(Rejuran Healer)→damaged/aged, Biostim(Sculptra/Lanluma)→volume loss, Exosome(ASCE+)→all types

═══ INJECTABLE CATALOG (REAL NAMES ONLY — NO generic names) ═══
BOOSTER: Rejuran Healer(PN/PDRN,p2,$$), Rejuran HB(PN+HA,p2,$$), Juvelook Skin(PDLLA+HA,p2,$$), NCTF 135HA(vitamin,p2,$), Profhilo(HA remodel,p2,$$$$)
BIOSTIM: Sculptra(PLLA,p3,$$$$$), Ellanse(PCL+CMC,p3,$$$$$), Juvelook Volume(PDLLA,p2,$$$$), Lanluma(PLLA body,p2,$$$$)
TOXIN: Botox(onabotA,p1,$$$), Dysport(abobotA,p1,$$$), Xeomin(incobotA,p1,$$$), Nabota(prabotA KR,p1,$$)
FILLER: Restylane(NASHA HA,p2,$$$$), Juvederm(Vycross HA,p2,$$$$), Belotero(CPM HA,p2,$$$)
EXOSOME: ASCE+(exosome,p1,$$$$$), ExoSCRT(serum,p1,$$$$)

═══ 3-LAYER REPORT: MIRROR → CONFIDENCE → SOLUTION ═══
LAYER 1 MIRROR: Empathetic counselor tone (trusted friend, NOT doctor/salesperson). Generate in patient's native language.
- headline: ≤15 words, "이게 나야" moment
- empathy_paragraphs: 1 short paragraph reflecting patient's emotional state
- transition: 1 sentence bridging to confidence
Country tone: KR=존댓말 empathetic, US=warm conversational, JP=丁寧語 "自然な変化", CN=简体 avoid 夸大承诺
FORBIDDEN: celebrity names, prices, hospital names, guarantees

LAYER 2 CONFIDENCE: Skin science in patient language. Generate in native language.
- reason_why: 1 short paragraph on WHY concern is addressable (mechanism-based)
- social_proof: 1 sentence validating decision
- commitment: 1 sentence "방법이 있습니다"
Mechanisms: TIGHTENING=RF collagen contraction+neocollagenesis, LIFTING=HIFU thermal coagulation anchors(50+:volume-preserving), BRIGHTENING=Toning(Pico photoacoustic)/Melasma(Sylfirm PW BMZ)/Lentigo(Reepot VSLS), VOLUME=biostimulator neocollagenesis 2-6mo, TEXTURE=MN-RF+biostim combo, REDNESS=vascular laser+barrier

LAYER 3 SOLUTION: Frame as "옵션 A/B/C". Patient-friendly language in summary_html.

═══ SIGNATURE SOLUTIONS — EXACTLY 3 (HARD FAILURE if fewer) ═══
[0]=highest synergy, [1]=different category mix, [2]=most accessible. MUST use DIFFERENT primary categories.
Synergy scoring: layer_separation+20, temporal_synergy+15, safety+10, evidence_match+15, injectable_pairing+10
Each: { name, description, devices[], injectables[], total_sessions, total_duration, synergy_score:0-100, synergy_explanation, steps:[{order,type:"ebd"|"injectable",device_or_product,category,action,interval_after}] }
- synergy_explanation: why this combination works (1-2 sentences)
- devices: string[] (device IDs used)
- injectables: string[] (injectable IDs used)

═══ WITHIN EACH CATEGORY — 3-TIER DEVICE SELECTION RULES ═══
Use DEVICE_SPECS data to assign tiers. DO NOT guess.
★ PREMIUM PICK = device with HIGHEST price_tier in that category. If tied, pick higher pain_level (more aggressive = more premium).
  Example: MN_RF → Genius (price=5, pain=5) is Premium, NOT Sylfirm X.
☆ STANDARD = mid-range price_tier, balanced pain/downtime.
  Example: MN_RF → Morpheus8 (price=4, pain=4) or Potenza (price=3, pain=3)
☆ VALUE = lowest price_tier in category, most accessible.
  Example: MN_RF → Secret RF (price=3, pain=3)
Single-device categories (SAR=NeoSculpt, VSLS=Reepot, HIFES=Emface, VDH=Alltite): show device without tier label.
CRITICAL: Tier is based on DEVICE_SPECS price_tier, NOT match_score. A VALUE device can have HIGH match_score.

═══ DOCTOR INTELLIGENCE ═══
doctor_tab.patient_intelligence: expectation_tag(REALISTIC/AMBITIOUS/CAUTION from text tone), budget_timeline(Economy<1M/Standard 1-3M/Premium 3M+, decision_speed, stay_duration), communication_style(LOGICAL=mechanism-focused/EMOTIONAL=image-focused/ANXIOUS=risk-focused)
consultation_strategy: recommended_order(3-4 steps), expected_complaints(2-3), scenario_summary(2-3 sentences)

═══ OUTPUT JSON SCHEMA (abbreviated — all fields required) ═══
{
  "lang": "string", "generated_at": "ISO", "model": "claude-haiku-4-5-20251001",
  "patient": { "age":"", "gender":"", "country":"", "aesthetic_goal":"", "top3_concerns":[], "past_treatments":[], "fitzpatrick":"", "pain_sensitivity":1-5 },
  "safety_flags": {},
  "mirror": { "headline":"≤15 words", "empathy_paragraphs":"1-2 paragraphs", "transition":"1 sentence" },
  "confidence": { "reason_why":"1-2 paragraphs", "social_proof":"1 paragraph", "commitment":"1 sentence" },
  "ebd_recommendations": [3 items, each: { "rank":1-3, "device_name":"", "device_id":"", "moa_category":"", "moa_category_label":"", "evidence_level":1-5, "confidence":0-100, "skin_layer":"epi|upd|deep|smas", "pain_level":1-5, "downtime_level":1-5, "safety_level":1-5, "badge":""|null, "badge_color":"amber|green|blue"|null, "subtitle":"", "summary_html":"<strong class='ebd-hl'>", "why_fit_html":"<span class='hl-cyan'>", "moa_summary_title":"", "moa_summary_short":"", "moa_description_html":"", "target_tags":[], "practical":{"sessions":"","interval":"","duration":"","onset":"","maintain":""}, "scores":{"tightening":0-10,"lifting":0-10,"volume":0-10,"brightening":0-10,"texture":0-10,"evidence":0-10,"synergy":0-10,"longevity":0-10,"roi":0-10,"trend":0-10,"popularity":0-10}, "ai_description_html":"", "slot":"premium|trending|value", "category_id":"", "category_name_ko":"", "category_name_en":"", "category_reason":"", "match_score":0-100, "downtime_display":"", "price_tier":1-5, "alternative_devices":[{"name":"","one_liner":"","match_score":0-100,"downtime_display":"","pain_level":1-5,"price_tier":1-5}], "doctor_note":{"suggested_parameters":"","fitzpatrick_adjustment":"","safety_flags":[],"min_interval_days":28} }],
  "injectable_recommendations": [3 items, each: { "rank":1-3, "name":"", "injectable_id":"", "category":"HA|PN_PDRN|BIOSTIM|EXOSOME", "category_label":"", "evidence_level":1-5, "confidence":0-100, "skin_layer":"", "subtitle":"", "summary_html":"", "why_fit_html":"", "moa_summary_title":"", "moa_summary_short":"", "moa_description_html":"", "practical":{"sessions":"","interval":"","onset":"","maintain":""}, "scores":{"hydration":0-10,"repair":0-10,"collagen":0-10,"brightening":0-10,"elasticity":0-10,"evidence":0-10,"synergy":0-10,"longevity":0-10}, "category_name_ko":"", "category_name_en":"", "category_reason":"", "match_score":0-100, "downtime_display":"", "pain_level":1-5, "price_tier":1-5, "alternative_products":[{"name":"","one_liner":"","match_score":0-100,"downtime_display":"","pain_level":1-5,"price_tier":1-5}] }],
  "signature_solutions": [3 items, each: { "name":"creative protocol name", "description":"", "devices":[], "injectables":[], "total_sessions":"", "total_duration":"", "synergy_score":0-100, "synergy_explanation":"", "steps":[{"order":1,"type":"ebd|injectable","device_or_product":"","category":"","action":"","interval_after":""|null}] }],
  "treatment_plan": { "title":"", "total_visits":0, "total_duration":"", "phases":[{"phase":"","duration":"","treatments":[]}], "schedule":[{"day":"Day 1","treatments":[{"type":"","device_or_product":"","category":"","duration_minutes":0,"note":""}],"post_care":""}], "precautions":[] },
  "homecare": { "morning":[], "evening":[], "weekly":[], "avoid":[] },
  "doctor_tab": { "clinical_summary":"bilingual KO+EN", "triggered_protocols":[], "country_note":"", "parameter_guidance":{}, "contraindications":[], "alternative_options":[], "patient_intelligence":{"expectation_tag":"REALISTIC|AMBITIOUS|CAUTION","expectation_note":"","budget_timeline":{"budget_tier":"Economy|Standard|Premium","decision_speed":"","urgency":"","stay_duration":""},"communication_style":"LOGICAL|EMOTIONAL|ANXIOUS","communication_note":""}, "consultation_strategy":{"recommended_order":[],"expected_complaints":[],"scenario_summary":""} }
}

CRITICAL RULES:
1. EXACTLY 3 EBD + 3 injectables + 3 signature_solutions. No exceptions.
2. STRICT SEPARATION: EBD = energy devices only. Injectables = injectable products only. Never mix.
3. Injectable names MUST be real products from INJECTABLE PRODUCT CATALOG.
4. Safety flags override device selection. Never recommend contraindicated devices.
5. Patient-facing content in patient's language. Doctor tab in bilingual KO+EN.
6. Output ONLY valid JSON. No other text.
7. CONCISENESS: summary_html <40 words, why_fit_html <60 words, moa_description_html <50 words. mirror.empathy_paragraphs: 1 short paragraph. confidence.reason_why: 1 short paragraph. Total output MUST fit within 8000 tokens.
8. Scores: integers 0-10. Include trend + popularity for all devices/injectables.
9. Mirror + Confidence + Doctor Intelligence: all mandatory.
10. Treatment plan: if stay data exists → day-by-day schedule (high-downtime on last day). If no stay data → phase-based plan.
11. CATEGORY-FIRST: Follow CATEGORY-BASED CLINICAL MAPPING from dynamic section. EBD#1=priority1 category, EBD#2=priority1-2, EBD#3=priority2-3. If concern is null, infer from: jawline_lifting|skin_tightening|volume_restoration|melasma|dark_spots|freckles|dull_skin|large_pores|acne_scars|dryness|redness|mole_removal|post_weight_loss_laxity|lower_face_heavy_fat|body_contouring_laxity
12. ALTERNATIVES: Each EBD must have 2-3 alternative_devices from same category. Each injectable must have 1-2 alternative_products. Single-device categories (SAR/VSLS/HIFES/VDH) = empty array.
    Category-Device Reference: HIFU(Ultherapy,Ultraformer MPT,Shrink,Doublo), MN_RF(Genius,Potenza,Sylfirm X,Secret RF,Morpheus8), MONO_RF(Thermage FLX,Volnewmer,Oligio), PICO(PicoSure Pro,PicoPlus), SAR(NeoSculpt), VSLS(Reepot), HIFES(Emface), VDH(Alltite)`;

// JSON repair imported from ./json-repair

/** Build dynamic system prompt — changes per patient */
function buildDynamicSystemPrompt(
  req: FinalRecommendationRequest
): string {
  const protocols = inferTriggeredProtocols(
    req.q1_primary_goal,
    req.q1_goal_secondary,
    req.q2_risk_flags,
    req.q2_pigment_pattern
  );

  const countryContext = getCountryContext(req.demographics.detected_country);
  const ageBracketContext = getAgeBracketContext(req.demographics.d_age);
  const countryClinicalRules = getCountryClinicalRules(req.demographics.detected_country);

  const safetySection = req.safety_flags.length > 0
    ? req.safety_flags.map(f => `- ${f}: ${SAFETY_DEVICE_FILTERS[f]}`).join('\n')
    : 'No safety flags. All devices and injectables available.';

  const langOutputMap: Record<SurveyLang, string> = {
    KO: 'Korean',
    EN: 'English',
    JP: 'Japanese',
    'ZH-CN': 'Simplified Chinese',
  };
  const outputLang = langOutputMap[req.demographics.detected_language] || 'Korean';

  return `PROTOCOLS: [${protocols.join(',')}]
${countryContext}
${ageBracketContext}
${countryClinicalRules}

PATIENT: ${req.demographics.d_age} ${req.demographics.d_gender}, ${req.demographics.detected_country}, lang=${req.demographics.detected_language}, output=${outputLang}
Goal: ${req.q1_primary_goal || 'N/A'} / Secondary: ${req.q1_goal_secondary || 'None'}
Concern: ${req.q3_concern_area || 'INFER from open_question+chips: jawline_lifting|skin_tightening|volume_restoration|melasma|dark_spots|freckles|dull_skin|large_pores|acne_scars|dryness|redness|mole_removal|post_weight_loss_laxity|lower_face_heavy_fat|body_contouring_laxity'}
Zone: ${req.chip_responses?.['concern_area'] || 'General face'}, Skin: ${req.q4_skin_profile || 'N/A'}, Style: ${req.q5_style || 'N/A'}
Pain: ${req.q6_pain_tolerance || 'N/A'}, Downtime: ${req.q6_downtime_tolerance || 'N/A'}, Past: ${req.q7_past_experience || 'None'}
Risk: ${(req.q2_risk_flags || []).join(',') || 'None'}, Pigment: ${req.q2_pigment_pattern || 'N/A'}, Volume: ${req.q3_volume_logic || 'N/A'}
Chips: ${Object.entries(req.chip_responses || {}).filter(([k]) => ['tightening_zone','scar_type','pigment_detail','aging_priority','texture_concern','laxity_severity','treatment_budget'].includes(k)).map(([k,v]) => `${k}=${v}`).join(', ') || 'none'}
Haiku: expect=${req.haiku_analysis?.expectation_tag || '?'}, comm=${req.haiku_analysis?.communication_style || '?'}, lifestyle=${req.haiku_analysis?.lifestyle_context || '?'}, tone=${req.haiku_analysis?.emotion_tone || '?'}
Open: "${req.open_question_raw}"

CATEGORY MAP:
${buildClinicalRulesPromptBlock(req.q3_concern_area || req.q1_primary_goal || null)}

Prior: [${req.prior_applied.join(',')}] ${JSON.stringify(req.prior_values)}
Chips: ${JSON.stringify(req.chip_responses)}
Safety Followups: ${JSON.stringify(req.safety_followup_answers)}
Budget: ${req.budget ? `${req.budget.range}(${req.budget.type})` : 'N/A'}${req.stay_duration ? ` Stay:${req.stay_duration}d` : ''}${req.management_frequency ? ` Freq:${req.management_frequency}` : ''}${req.event_info ? ` Event:${req.event_info.type}@${req.event_info.date}` : ''}
${req.branch_responses ? `Branch: ${JSON.stringify(req.branch_responses)}` : ''}
Segment: ${(req as unknown as Record<string, unknown>).patient_segment ?? 'N/A'}, PrefPain: ${(req as unknown as Record<string, unknown>).preferences_pain ?? 'N/A'}, PrefDown: ${(req as unknown as Record<string, unknown>).preferences_downtime ?? 'N/A'}, PrefBudget: ${(req as unknown as Record<string, unknown>).preferences_budget ?? 'N/A'}
Month: ${new Date().getMonth() + 1}

SAFETY: ${safetySection}`;
}

// ─── Edge Runtime Config ─────────────────────────────────────
// Edge Runtime avoids Netlify's 26-second serverless function timeout.
// The Anthropic API call (I/O wait) doesn't count against Edge's CPU limit,
// allowing the full streaming generation to complete (30-60s+).
export const config = {
  runtime: 'edge',
  // Note: Netlify Edge Functions have no wall-clock timeout for I/O waits.
  // CPU time limit applies, but streaming from Anthropic is pure I/O.
};

// ─── API Handler (Edge Runtime + SSE Streaming) ──────────────

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse and validate body before entering the stream
  let body: FinalRecommendationRequest;
  let dynamicPrompt: string;

  try {
    body = (await req.json()) as FinalRecommendationRequest;

    // Defensive defaults for array/object fields that may be undefined
    body.q2_risk_flags = body.q2_risk_flags || [];
    body.safety_flags = body.safety_flags || [];
    body.chip_responses = body.chip_responses || {};
    body.prior_applied = body.prior_applied || [];
    body.prior_values = body.prior_values || {};
    body.safety_followup_answers = body.safety_followup_answers || {};

    // Validate required fields
    if (!body.demographics || !body.q1_primary_goal) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: demographics, q1_primary_goal' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    dynamicPrompt = buildDynamicSystemPrompt(body);
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // Use streaming API (async iterable) for Edge compatibility
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 8000,
          temperature: 0.3,
          stream: true,
          system: [
            {
              type: 'text' as const,
              text: STATIC_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' as const },
            },
            {
              type: 'text' as const,
              text: dynamicPrompt,
            },
          ],
          messages: [
            {
              role: 'user',
              content: `Generate the treatment recommendation JSON (3-Layer: Mirror + Confidence + Solution) based on the patient data provided in the system prompt. Generate treatment_plan with schedule if stay_duration is provided. CURRENT_MONTH: ${new Date().getMonth() + 1}.

TOKEN BUDGET RULES (CRITICAL — you MUST stay under 8000 tokens):
- EXACTLY 3 EBD devices, EXACTLY 3 injectables, EXACTLY 3 signature solutions. NO EXCEPTIONS.
- Output fields in THIS EXACT ORDER: lang, generated_at, model, patient, safety_flags, mirror, confidence, ebd_recommendations, injectable_recommendations, signature_solutions, treatment_plan, homecare, doctor_tab.
- summary_html: 1 sentence max. why_fit_html: 2 short numbered reasons only. moa_description_html: 1 sentence.
- ai_description_html: 1-2 sentences max.
- Set homecare to { morning:[], evening:[], weekly:[], avoid:[] }.
- Set doctor_tab fields to minimal strings. Set consultation_strategy arrays to empty [].
- mirror.empathy_paragraphs: 1 short paragraph. confidence.reason_why: 1 short paragraph. confidence.social_proof: 1 sentence.
- Do NOT include lengthy HTML. Keep all HTML values under 200 characters each.

MANDATORY FIELDS (never omit):
- Every EBD device MUST have: scores (all 11 keys: tightening, lifting, volume, brightening, texture, evidence, synergy, longevity, roi, trend, popularity), practical (all 5 keys), why_fit_html, summary_html, subtitle, ai_description_html.
- Every injectable MUST have: scores (all 8 keys: hydration, repair, collagen, brightening, elasticity, evidence, synergy, longevity), practical (all 4 keys), why_fit_html, summary_html, subtitle.
- patient object MUST be complete.

Output ONLY valid JSON.`,
            },
          ],
        });

        let fullText = '';
        let inputTokens = 0;
        let outputTokens = 0;
        let modelUsed = 'claude-haiku-4-5-20251001';
        let stopReason = '';
        let lastProgressAt = 0;

        for await (const event of response) {
          if (event.type === 'content_block_delta' && 'delta' in event && (event.delta as { type: string }).type === 'text_delta') {
            fullText += (event.delta as { type: string; text: string }).text;
            // Send heartbeat every ~500 chars to keep client alive
            if (fullText.length - lastProgressAt >= 500) {
              lastProgressAt = fullText.length;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'progress', chars: fullText.length })}\n\n`)
              );
            }
          } else if (event.type === 'message_start' && 'message' in event) {
            const msg = event.message as { usage?: { input_tokens?: number }; model?: string };
            inputTokens = msg.usage?.input_tokens || 0;
            modelUsed = msg.model || modelUsed;
          } else if (event.type === 'message_delta') {
            const delta = event as { usage?: { output_tokens?: number }; delta?: { stop_reason?: string } };
            outputTokens = delta.usage?.output_tokens || outputTokens;
            if (delta.delta?.stop_reason) {
              stopReason = delta.delta.stop_reason;
            }
          }
        }

        console.log(`[final-recommendation] Stream complete. stop_reason=${stopReason}, output_tokens=${outputTokens}, text_length=${fullText.length}`);

        // Send a heartbeat so client knows stream is alive during JSON parsing
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'progress', chars: fullText.length, phase: 'parsing' })}\n\n`)
        );

        // Warn if output was truncated due to max_tokens
        if (stopReason === 'max_tokens') {
          console.warn(`[final-recommendation] ⚠️ Output truncated (max_tokens). output_tokens=${outputTokens}, text_length=${fullText.length}. Will attempt JSON repair.`);
        }

        // ─── Robust JSON parsing with aggressive repair ───────────
        let recommendation: OpusRecommendationOutput;
        const parseResult = robustJsonParse<OpusRecommendationOutput>(fullText);
        if (parseResult.ok) {
          recommendation = parseResult.value;

          // ─── Fill defaults for fields that may be missing due to truncation ───
          if (!recommendation.lang) recommendation.lang = 'ko';
          if (!recommendation.generated_at) recommendation.generated_at = new Date().toISOString();
          if (!recommendation.model) recommendation.model = modelUsed;
          if (!recommendation.patient) {
            recommendation.patient = {
              age: '', gender: '', country: '', aesthetic_goal: '',
              top3_concerns: [], past_treatments: [], fitzpatrick: '', pain_sensitivity: 3,
            };
          }
          // Backfill patient fields from actual survey data (more reliable than AI echo)
          const pat = recommendation.patient;
          const PATIENT_FALLBACK: Record<string, string> = { ko: '고객', en: 'Patient', ja: '患者様', 'zh-cn': '患者' };
          if (!pat.name) pat.name = (body.demographics as any)?.d_name || PATIENT_FALLBACK[(recommendation.lang || 'ko').toLowerCase()] || 'Patient';
          if (!pat.age && body.demographics?.d_age) pat.age = body.demographics.d_age;
          if (!pat.gender && body.demographics?.d_gender) pat.gender = body.demographics.d_gender;
          if (!pat.country && body.demographics?.detected_country) pat.country = body.demographics.detected_country;
          if (!pat.aesthetic_goal && body.q1_primary_goal) pat.aesthetic_goal = body.q1_primary_goal;
          if ((!pat.top3_concerns || pat.top3_concerns.length === 0) && body.q3_concern_area) {
            pat.top3_concerns = [body.q3_concern_area];
          }
          if ((!pat.past_treatments || pat.past_treatments.length === 0) && body.q7_past_experience) {
            pat.past_treatments = [body.q7_past_experience];
          }
          if (!pat.pain_sensitivity && body.q6_pain_tolerance) pat.pain_sensitivity = parseInt(body.q6_pain_tolerance) || 3;
          if (!pat.stay_duration && body.stay_duration) pat.stay_duration = `${body.stay_duration}일`;
          console.log('[final-recommendation] Patient data backfilled from survey:', JSON.stringify(pat));
          if (!recommendation.safety_flags) recommendation.safety_flags = {};
          // mirror & confidence fallbacks are handled below (H-1 section)
          if (!recommendation.ebd_recommendations) recommendation.ebd_recommendations = [];
          if (!recommendation.injectable_recommendations) recommendation.injectable_recommendations = [];
          if (!recommendation.signature_solutions) recommendation.signature_solutions = [];
          if (!recommendation.treatment_plan) recommendation.treatment_plan = { phases: [], schedule: [], precautions: [] };
          if (!recommendation.homecare) {
            recommendation.homecare = { morning: [], evening: [], weekly: [], avoid: [] };
          }
          if (!recommendation.doctor_tab) {
            recommendation.doctor_tab = {
              clinical_summary: '',
              triggered_protocols: [],
              country_note: '',
              parameter_guidance: {},
              contraindications: [],
              alternative_options: [],
              patient_intelligence: {
                expectation_tag: 'REALISTIC',
                expectation_note: '',
                budget_timeline: { budget_tier: 'Standard', decision_speed: 'Normal', urgency: 'MEDIUM', stay_duration: null },
                communication_style: 'LOGICAL',
                communication_note: '',
              },
              consultation_strategy: {
                recommended_order: [],
                expected_complaints: [],
                scenario_summary: '',
              },
            } as OpusDoctorTab;
          }

          // ─── Fill defaults for individual EBD device entries ───
          const DEFAULT_EBD_SCORES: Record<string, number> = {
            tightening: 5, lifting: 5, volume: 5, brightening: 5, texture: 5,
            evidence: 5, synergy: 5, longevity: 5, roi: 5, trend: 5, popularity: 5,
          };
          const DEFAULT_EBD_PRACTICAL = { sessions: 'N/A', interval: 'N/A', duration: 'N/A', onset: 'N/A', maintain: 'N/A' };
          for (let ei = 0; ei < recommendation.ebd_recommendations.length; ei++) {
            const ebd = recommendation.ebd_recommendations[ei];
            if (!ebd.device_name) ebd.device_name = ebd.subtitle || `EBD Device ${ei + 1}`;
            if (!ebd.scores || Object.keys(ebd.scores).length === 0) {
              console.warn(`[final-recommendation] ⚠️ EBD "${ebd.device_name}" missing scores — applying defaults`);
              ebd.scores = { ...DEFAULT_EBD_SCORES };
            } else {
              // Fill any missing individual score keys
              for (const [k, v] of Object.entries(DEFAULT_EBD_SCORES)) {
                if (ebd.scores[k] == null) ebd.scores[k] = v;
              }
            }
            if (!ebd.practical) ebd.practical = { ...DEFAULT_EBD_PRACTICAL };
            if (!ebd.why_fit_html) ebd.why_fit_html = '<p>(상세 분석 준비 중)</p>';
            if (!ebd.summary_html) ebd.summary_html = '<p>(요약 준비 중)</p>';
            if (!ebd.subtitle) ebd.subtitle = ebd.device_name || 'EBD Device';
            if (!ebd.ai_description_html) ebd.ai_description_html = '<p>(설명 준비 중)</p>';
            if (ebd.confidence == null) ebd.confidence = 70;
            if (ebd.pain_level == null) ebd.pain_level = 3;
            if (ebd.downtime_level == null) ebd.downtime_level = 2;
          }

          // ─── Fill defaults for individual injectable entries ───
          const DEFAULT_INJ_SCORES: Record<string, number> = {
            hydration: 5, repair: 5, collagen: 5, brightening: 5,
            elasticity: 5, evidence: 5, synergy: 5, longevity: 5,
          };
          const DEFAULT_INJ_PRACTICAL = { sessions: 'N/A', interval: 'N/A', onset: 'N/A', maintain: 'N/A' };
          for (let ii = 0; ii < recommendation.injectable_recommendations.length; ii++) {
            const inj = recommendation.injectable_recommendations[ii];
            if (!inj.name) inj.name = (inj as any).product_name || inj.subtitle || `Injectable ${ii + 1}`;
            if (!inj.scores || Object.keys(inj.scores).length === 0) {
              console.warn(`[final-recommendation] ⚠️ Injectable "${inj.name}" missing scores — applying defaults`);
              inj.scores = { ...DEFAULT_INJ_SCORES };
            } else {
              for (const [k, v] of Object.entries(DEFAULT_INJ_SCORES)) {
                if (inj.scores[k] == null) inj.scores[k] = v;
              }
            }
            if (!inj.practical) inj.practical = { ...DEFAULT_INJ_PRACTICAL };
            if (!inj.why_fit_html) inj.why_fit_html = '<p>(상세 분석 준비 중)</p>';
            if (!inj.summary_html) inj.summary_html = '<p>(요약 준비 중)</p>';
            if (!inj.subtitle) inj.subtitle = inj.name || 'Injectable';
            if (inj.confidence == null) inj.confidence = 70;
          }

          // ─── Enforce EXACTLY 3 recommendations per category ───
          const MIN_RECS = 3;
          while (recommendation.ebd_recommendations.length < MIN_RECS) {
            const idx = recommendation.ebd_recommendations.length + 1;
            console.warn(`[final-recommendation] ⚠️ EBD count < ${MIN_RECS} — adding placeholder #${idx}`);
            recommendation.ebd_recommendations.push({
              rank: idx,
              device_name: `Recommended Device ${idx}`,
              device_id: `placeholder_ebd_${idx}`,
              moa_category: 'energy_based',
              moa_category_label: 'Energy-Based Device',
              evidence_level: 3,
              confidence: 60,
              skin_layer: 'dermis',
              pain_level: 3,
              downtime_level: 2,
              safety_level: 9,
              badge: null,
              badge_color: '',
              subtitle: '(AI가 추가 추천을 생성하지 못했습니다)',
              summary_html: '<p>추가 디바이스 추천이 필요합니다. 담당 의사와 상담해 주세요.</p>',
              why_fit_html: '<p>—</p>',
              moa_summary_title: 'MOA',
              moa_summary_short: '',
              moa_description_html: '',
              target_tags: [],
              practical: { sessions: 'N/A', interval: 'N/A', duration: 'N/A', onset: 'N/A', maintain: 'N/A' },
              scores: { tightening: 5, lifting: 5, volume: 5, brightening: 5, texture: 5, evidence: 3, synergy: 5, longevity: 5, roi: 5, trend: 5, popularity: 5 },
              ai_description_html: '',
            } as OpusDeviceRecommendation);
          }
          while (recommendation.injectable_recommendations.length < MIN_RECS) {
            const idx = recommendation.injectable_recommendations.length + 1;
            console.warn(`[final-recommendation] ⚠️ Injectable count < ${MIN_RECS} — adding placeholder #${idx}`);
            recommendation.injectable_recommendations.push({
              rank: idx,
              name: `Recommended Injectable ${idx}`,
              injectable_id: `placeholder_inj_${idx}`,
              category: 'skin_booster',
              category_label: 'Skin Booster',
              evidence_level: 3,
              confidence: 60,
              skin_layer: 'dermis',
              subtitle: '(AI가 추가 추천을 생성하지 못했습니다)',
              summary_html: '<p>추가 주사 추천이 필요합니다. 담당 의사와 상담해 주세요.</p>',
              why_fit_html: '<p>—</p>',
              moa_summary_title: 'MOA',
              moa_summary_short: '',
              moa_description_html: '',
              practical: { sessions: 'N/A', interval: 'N/A', onset: 'N/A', maintain: 'N/A' },
              scores: { hydration: 5, firming: 5, brightening: 5, longevity: 5, evidence: 3, trend: 5, popularity: 5 },
            } as OpusInjectableRecommendation);
          }

          console.log(`[final-recommendation] ✅ Parsed OK. EBD=${recommendation.ebd_recommendations.length}, INJ=${recommendation.injectable_recommendations.length}, SIG=${recommendation.signature_solutions.length}, stop_reason=${stopReason}, output_tokens=${outputTokens}`);

          if (stopReason === 'max_tokens') {
            console.warn(`[final-recommendation] ⚠️ Output was truncated but JSON repair succeeded. Some fields may use defaults.`);
          }
        } else {
          console.error(`[final-recommendation] All JSON parse attempts failed. stop_reason=${stopReason}, output_tokens=${outputTokens}, text_length=${fullText.length}`);
          console.error('[final-recommendation] First 500 chars:', fullText.substring(0, 500));
          console.error('[final-recommendation] Last 500 chars:', fullText.substring(Math.max(0, fullText.length - 500)));
          console.error('[final-recommendation] Errors:', parseResult.errors.join(' | '));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: `Failed to parse AI response (${fullText.length} chars, stop_reason: ${stopReason || 'unknown'}). ${parseResult.errors[parseResult.errors.length - 1]}`,
              debug: { stop_reason: stopReason, output_tokens: outputTokens, text_length: fullText.length },
            })}\n\n`)
          );
          controller.close();
          return;
        }

        // ─── H-1: Validate & fallback for Mirror + Confidence layers ───
        if (!recommendation.mirror || !recommendation.mirror.headline) {
          console.warn('[final-recommendation] Mirror layer missing — injecting fallback');
          recommendation.mirror = {
            headline: recommendation.mirror?.headline || '\uB2F9\uC2E0\uC758 \uD53C\uBD80 \uACE0\uBBFC, \uCDA9\uBD84\uD788 \uC774\uD574\uD569\uB2C8\uB2E4',
            empathy_paragraphs: recommendation.mirror?.empathy_paragraphs || '\uB9CE\uC740 \uBD84\uB4E4\uC774 \uBE44\uC2B7\uD55C \uACE0\uBBFC\uC744 \uC548\uACE0 \uACC4\uC2ED\uB2C8\uB2E4. \uAC70\uC6B8\uC744 \uBCFC \uB54C\uB9C8\uB2E4, \uC0AC\uC9C4\uC744 \uCC0D\uC744 \uB54C\uB9C8\uB2E4 \uC2E0\uACBD\uC774 \uC4F0\uC774\uB294 \uADF8 \uB9C8\uC74C\uC744 \uC798 \uC54C\uACE0 \uC788\uC2B5\uB2C8\uB2E4.',
            transition: recommendation.mirror?.transition || '\uADF8\uB9AC\uACE0 \uBC29\uBC95\uC774 \uC788\uC2B5\uB2C8\uB2E4.',
          };
        }
        if (!recommendation.confidence || !recommendation.confidence.reason_why) {
          console.warn('[final-recommendation] Confidence layer missing — injecting fallback');
          recommendation.confidence = {
            reason_why: recommendation.confidence?.reason_why || '\uD53C\uBD80\uACFC\uD559\uC801\uC73C\uB85C \uAC80\uC99D\uB41C \uBA54\uCEE4\uB2C8\uC998\uC744 \uAE30\uBC18\uC73C\uB85C, \uB2F9\uC2E0\uC758 \uD53C\uBD80 \uC0C1\uD0DC\uC5D0 \uC801\uD569\uD55C \uC811\uADFC\uBC95\uC774 \uC874\uC7AC\uD569\uB2C8\uB2E4.',
            social_proof: recommendation.confidence?.social_proof || '\uC720\uC0AC\uD55C \uD53C\uBD80 \uC870\uAC74\uC758 \uD658\uC790\uAD70\uC5D0\uC11C \uB192\uC740 \uB9CC\uC871\uB3C4\uAC00 \uBCF4\uACE0\uB418\uACE0 \uC788\uC2B5\uB2C8\uB2E4.',
            commitment: recommendation.confidence?.commitment || '\uB2F9\uC2E0\uC5D0\uAC8C \uB9DE\uB294 \uC194\uB8E8\uC158\uC774 \uC788\uC2B5\uB2C8\uB2E4.',
          };
        }

        // Send final result
        const result: FinalRecommendationResponse = {
          recommendation_json: recommendation,
          model: modelUsed,
          usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        };
        try {
          const donePayload = JSON.stringify({ type: 'done', ...result, stop_reason: stopReason });
          console.log(`[final-recommendation] Sending done event (${donePayload.length} chars)`);
          controller.enqueue(encoder.encode(`data: ${donePayload}\n\n`));
        } catch (serializeErr) {
          console.error('[final-recommendation] Failed to serialize done event:', serializeErr);
          // Fallback: send minimal result
          const minimal = {
            type: 'done',
            recommendation_json: recommendation,
            model: modelUsed,
            usage: { input_tokens: inputTokens, output_tokens: outputTokens },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(minimal)}\n\n`));
        }
        controller.close();
      } catch (error) {
        console.error('[final-recommendation] Error:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`)
          );
          controller.close();
        } catch {
          // Controller might already be closed
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
