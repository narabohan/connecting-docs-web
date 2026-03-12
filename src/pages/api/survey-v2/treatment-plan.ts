// ═══════════════════════════════════════════════════════════════
//  POST /api/survey-v2/treatment-plan
//  Phase B: Treatment Plan V2 + Budget — runs AFTER Phase A report
//  Takes Phase A recommendation + survey data to generate sequenced plan
// ═══════════════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk';
import type {
  Demographics,
  SurveyLang,
  BudgetSelection,
  ManagementFrequency,
  EventInfo,
} from '@/types/survey-v2';
import type { OpusRecommendationOutput } from './final-recommendation';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Request / Response Types ────────────────────────────────

interface TreatmentPlanRequest {
  demographics: Demographics;
  budget?: BudgetSelection | null;
  stay_duration?: number | null;
  management_frequency?: ManagementFrequency | null;
  event_info?: EventInfo | null;
  // Phase A result summary (key fields only to reduce tokens)
  phase_a_summary: {
    ebd_devices: { rank: number; device_name: string; device_id: string; confidence: number; pain_level: number; downtime_level: number }[];
    injectables: { rank: number; name: string; injectable_id: string; category: string; confidence: number }[];
    signature_solutions: { name: string; devices: string[]; injectables: string[] }[];
    safety_flags: Record<string, unknown>;
    patient: { age: string; gender: string; country: string; aesthetic_goal: string; top3_concerns: string[] };
  };
}

export interface TreatmentPlanV2Response {
  treatment_plan: TreatmentPlanV2;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

export interface TreatmentPlanV2 {
  plan_type: 'regular' | 'visit' | 'event';
  plan_type_label: string;
  duration: string;
  budget_total: string;
  budget_breakdown: {
    foundation_pct: number;
    foundation_label: string;
    main_pct: number;
    main_label: string;
    maintenance_pct: number;
    maintenance_label: string;
    roi_note: string;
  };
  phases: TreatmentPhaseV2[];
  plan_rationale: string;
  seasonal_note: string;
}

export interface TreatmentPhaseV2 {
  phase_number: number;
  timing: string;
  timing_label: string;
  procedures: {
    device_or_injectable: string;
    category: 'ebd' | 'injectable' | 'homecare';
    reason_why: string;
    clinical_basis: string;
    synergy_note: string;
    downtime: string;
    estimated_cost: string;
  }[];
  phase_goal: string;
  total_downtime: string;
  estimated_cost: string;
  lifestyle_note: string;
}

// ─── System Prompt ───────────────────────────────────────────

const TREATMENT_PLAN_SYSTEM_PROMPT = `You are a treatment planning specialist for ConnectingDocs, a Korean medical aesthetics clinic.
Your task: Given a patient's recommended devices/injectables from Phase A analysis and their budget/schedule context,
generate a time-sequenced Treatment Plan V2 with budget optimization.

=== LAYER 4: TREATMENT PLAN SEQUENCING ===

[ROLE]
You are a treatment planning specialist who designs time-sequenced aesthetic treatment plans.
Your goal is to create a realistic, clinically sound plan that considers the patient's lifestyle,
budget, and specific circumstances — not just what procedures to recommend, but WHEN and in WHAT ORDER.

[PLAN TYPE DETERMINATION]
Determine plan_type based on survey data:

IF patient.country == "KR":
  IF patient.event_date exists:
    plan_type = "event"
    duration = calculate D-day from event_date
  ELSE IF patient.management_frequency exists:
    plan_type = "regular"
    duration based on management_frequency:
      "monthly" → "3개월 플랜"
      "quarterly" → "6개월 플랜"
      "once" → "1회 집중 플랜"
  ELSE:
    plan_type = "regular"
    duration = "3개월 플랜" (default)

ELSE (foreign patient):
  IF patient.stay_duration exists:
    plan_type = "visit"
    duration = patient.stay_duration
  ELSE:
    plan_type = "visit"
    duration = "7일" (default assumption)

[SEQUENCING PRINCIPLES — APPLY TO ALL PLAN TYPES]

PRINCIPLE 1: Foundation First (기반 → 메인 → 유지)
- Phase 1 MUST start with structural/foundation procedures
- RF Tightening, HIFU Lifting = foundation layer
- Laser treatments, injectables = build on top of foundation
- Rationale: "탄탄한 기반 위에 쌓아야 오래 갑니다"

PRINCIPLE 2: Downtime Sequencing (다운타임 전략)
- Schedule zero-downtime procedures first when patient needs to function normally
- Place higher-downtime procedures at strategic points:
  * Regular plans: before weekends or vacation
  * Visit plans: at END of stay (recover at home country)
  * Event plans: at EARLIEST phase (maximum recovery time before D-day)

PRINCIPLE 3: Synergy Sequencing (시너지 순서)
- RF/HIFU (collagen remodeling) → wait 2-4 weeks → Laser (pigment/texture)
- Laser → wait 1-2 weeks → Injectable (booster/volume)
- Injectable (biostimulator) → 4-6 weeks → next session

PRINCIPLE 4: Seasonal Awareness (계절 고려)
- Laser treatments: avoid peak UV seasons (May-Sep in Northern hemisphere)

PRINCIPLE 5: Age-Specific Priority
- 20s-30s: Prevention focus
- 30s-40s: Early intervention
- 40s-50s: Active treatment
- 50s+: Intensive focus

[REGULAR PLAN STRUCTURE]
When plan_type = "regular":
- 3개월: 3 phases | 6개월: 4-5 phases
- Phase 1: Foundation → Phase 2: Targeted → Phase 3: Refinement

[VISIT PLAN STRUCTURE]
When plan_type = "visit":
- Day 1: zero-downtime → Middle: moderate → Last day: main treatment

[EVENT PLAN STRUCTURE]
When plan_type = "event":
- D-90~D-60: Heavy → D-60~D-30: Refinement → D-30~D-14: Glow → D-14~D-0: Hands off

[DOWNTIME MATRIX]
| Category | Downtime | Min Interval |
|----------|----------|-------------|
| RF Tightening | 0-1일 | 2주 |
| HIFU Lifting | 0-3일 | 3-4주 |
| Laser Toning | 0-1일 | 1-3주 |
| Fractional | 2-5일 | 3-6주 |
| MN-RF | 1-3일 | 3-4주 |
| Injectable | 0-1일 | 2-6주 |

=== LAYER 5: BUDGET OPTIMIZATION ===

[BUDGET ALLOCATION RULES]
Rule 1: Respect patient's stated budget STRICTLY.
Rule 2: Apply 30/50/20 allocation (Foundation/Main/Maintenance).
Rule 3: ROI Optimization — compare single premium vs combination approach.
Rule 4: Price Reference Ranges:
  Budget: ₩100,000~300,000/session | Mid: ₩300,000~700,000 | Premium: ₩700,000~1,500,000 | Luxury: ₩1,500,000+
  Foreign: ~₩1,300/USD
Rule 5: Budget Language by Country:
  KR: "가성비 높은 조합" | US: "Smart combination approach" | JP: "コスパの良い組み合わせ" | CN: "性价比最高的组合"

[BUDGET BRACKETS]
Korean: "light" = Budget, "standard" = Mid, "premium" = Premium, "vip" = Luxury
Foreign (per visit): "light" = Under $500, "standard" = $500-$1,500, "premium" = $1,500-$3,000, "vip" = $3,000+

=== OUTPUT FORMAT ===
Respond ONLY with valid JSON matching this schema:
{
  "plan_type": "regular|visit|event",
  "plan_type_label": "<descriptive plan label>",
  "duration": "<plan duration>",
  "budget_total": "<formatted total budget>",
  "budget_breakdown": {
    "foundation_pct": 30-40,
    "foundation_label": "<description>",
    "main_pct": 40-50,
    "main_label": "<description>",
    "maintenance_pct": 10-20,
    "maintenance_label": "<description>",
    "roi_note": "<why combination is more effective>"
  },
  "phases": [
    {
      "phase_number": 1,
      "timing": "<Month 1 | Day 1-2 | D-90 ~ D-60>",
      "timing_label": "<phase label>",
      "procedures": [
        {
          "device_or_injectable": "<name>",
          "category": "ebd|injectable|homecare",
          "reason_why": "<patient-language reason>",
          "clinical_basis": "<1 sentence evidence>",
          "synergy_note": "<optional synergy>",
          "downtime": "<estimate>",
          "estimated_cost": "<cost range>"
        }
      ],
      "phase_goal": "<what this phase achieves>",
      "total_downtime": "<combined estimate>",
      "estimated_cost": "<phase total>",
      "lifestyle_note": "<impact on daily life>"
    }
  ],
  "plan_rationale": "<1-2 sentences why this structure>",
  "seasonal_note": "<optional seasonal consideration>"
}

CRITICAL RULES:
1. Use ONLY the devices/injectables provided in Phase A results — do NOT invent new ones.
2. Patient-facing content must be in the patient's language.
3. Respond ONLY with valid JSON, no other text.
4. Keep the plan realistic and clinically sound.
5. The complete JSON MUST fit within 4000 tokens.`;

// ─── Edge Runtime Config ─────────────────────────────────────
export const config = {
  runtime: 'edge',
  maxDuration: 60, // Netlify Pro: max 60s for edge functions (default 25s)
};

// ─── API Handler ─────────────────────────────────────────────

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: TreatmentPlanRequest;
  try {
    body = (await req.json()) as TreatmentPlanRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const langOutputMap: Record<SurveyLang, string> = {
    KO: 'Korean',
    EN: 'English',
    JP: 'Japanese',
    'ZH-CN': 'Simplified Chinese',
  };
  const outputLang = langOutputMap[body.demographics.detected_language] || 'Korean';

  const patientContext = `═══ PATIENT CONTEXT ═══
Patient: ${body.phase_a_summary.patient.age} ${body.phase_a_summary.patient.gender}, Country: ${body.phase_a_summary.patient.country}
Output Language: ${outputLang}
Aesthetic Goal: ${body.phase_a_summary.patient.aesthetic_goal}
Top Concerns: ${body.phase_a_summary.patient.top3_concerns.join(', ')}

═══ PHASE A RECOMMENDED DEVICES ═══
${body.phase_a_summary.ebd_devices.map(d =>
  `#${d.rank} ${d.device_name} (${d.device_id}) — confidence: ${d.confidence}, pain: ${d.pain_level}, downtime: ${d.downtime_level}`
).join('\n')}

═══ PHASE A RECOMMENDED INJECTABLES ═══
${body.phase_a_summary.injectables.map(i =>
  `#${i.rank} ${i.name} (${i.injectable_id}) — ${i.category}, confidence: ${i.confidence}`
).join('\n')}

═══ SIGNATURE SOLUTIONS ═══
${body.phase_a_summary.signature_solutions.map(s =>
  `${s.name}: devices=[${s.devices.join(',')}] injectables=[${s.injectables.join(',')}]`
).join('\n')}

═══ BUDGET & SCHEDULE ═══
Budget: ${body.budget ? `${body.budget.range} (${body.budget.type})` : 'Not specified'}
${body.stay_duration ? `Stay Duration: ${body.stay_duration} days` : ''}
${body.management_frequency ? `Management Frequency: ${body.management_frequency}` : ''}
${body.event_info ? `Event: ${body.event_info.type} on ${body.event_info.date}` : ''}
Current Month: ${new Date().getMonth() + 1}

═══ SAFETY FLAGS ═══
${Object.keys(body.phase_a_summary.safety_flags).length > 0
  ? JSON.stringify(body.phase_a_summary.safety_flags)
  : 'No safety flags.'}`;

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          temperature: 0.3,
          stream: true,
          system: [
            {
              type: 'text' as const,
              text: TREATMENT_PLAN_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' as const },
            },
            {
              type: 'text' as const,
              text: patientContext,
            },
          ],
          messages: [
            {
              role: 'user',
              content: `Generate the Treatment Plan V2 JSON based on the Phase A recommended devices/injectables and the patient's budget/schedule context. Use ONLY devices/injectables from Phase A results. CURRENT_MONTH: ${new Date().getMonth() + 1}. Output ONLY valid JSON.`,
            },
          ],
        });

        let fullText = '';
        let inputTokens = 0;
        let outputTokens = 0;
        let modelUsed = 'claude-haiku-4-5-20251001';
        let stopReason = '';

        for await (const event of response) {
          if (event.type === 'content_block_delta' && 'delta' in event && (event.delta as { type: string }).type === 'text_delta') {
            fullText += (event.delta as { type: string; text: string }).text;
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

        console.log(`[treatment-plan] Stream complete. stop_reason=${stopReason}, output_tokens=${outputTokens}, text_length=${fullText.length}`);

        // Parse JSON
        let treatmentPlan: TreatmentPlanV2;
        try {
          let jsonStr = fullText.trim();
          if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          }
          const firstBrace = jsonStr.indexOf('{');
          if (firstBrace > 0) {
            jsonStr = jsonStr.substring(firstBrace);
          }
          if (!jsonStr.endsWith('}')) {
            const lastCloseBrace = jsonStr.lastIndexOf('}');
            if (lastCloseBrace > 0) {
              let depth = 0;
              for (const ch of jsonStr.substring(0, lastCloseBrace + 1)) {
                if (ch === '{') depth++;
                if (ch === '}') depth--;
              }
              jsonStr = jsonStr.substring(0, lastCloseBrace + 1) + '}'.repeat(depth);
            }
          }
          treatmentPlan = JSON.parse(jsonStr);
        } catch (parseErr) {
          console.error(`[treatment-plan] JSON parse error. stop_reason=${stopReason}, output_tokens=${outputTokens}, text_length=${fullText.length}`);
          console.error('[treatment-plan] First 300 chars:', fullText.substring(0, 300));
          console.error('[treatment-plan] Last 300 chars:', fullText.substring(Math.max(0, fullText.length - 300)));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: `Failed to parse treatment plan JSON (length: ${fullText.length}, stop_reason: ${stopReason || 'unknown'})` })}\n\n`)
          );
          controller.close();
          return;
        }

        const result: TreatmentPlanV2Response = {
          treatment_plan: treatmentPlan,
          model: modelUsed,
          usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done', ...result })}\n\n`)
        );
        controller.close();
      } catch (error) {
        console.error('[treatment-plan] Error:', error);
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
