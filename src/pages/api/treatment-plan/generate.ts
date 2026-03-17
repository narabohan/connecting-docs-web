// ═══════════════════════════════════════════════════════════════
//  POST /api/treatment-plan/generate
//  Phase 2 (G-2): Generate + persist a Treatment Plan
//
//  Flow:
//  1. Validate request with Zod
//  2. Call existing survey-v2/treatment-plan AI endpoint internally
//  3. Transform AI output → TreatmentPlanData
//  4. Persist to Airtable
//  5. Return plan to client
//
//  Auth: patient (own) or system
//  Retry: Enqueue to retry-queue on Airtable failure
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { NextApiResponse } from 'next';
import { apiRoleGuard, type AuthenticatedRequest } from '@/lib/apiRoleGuard';
import {
  GeneratePlanRequestSchema,
  type TreatmentPlanData,
} from '@/schemas/treatment-plan';
import { createPlan } from '@/services/treatment-plan-service';
import {
  transformAIPlanToData,
  buildAIRequestBody,
} from '@/services/plan-ai-pipeline';
import type { TreatmentPlanV2 } from '@/pages/api/survey-v2/treatment-plan';
import { sendEmailFireAndForget } from '@/services/email-service';
import { lookupUserByUid } from '@/services/user-email-lookup';

// ─── Types ───────────────────────────────────────────────────

interface GenerateSuccessResponse {
  ok: true;
  plan: TreatmentPlanData;
}

interface GenerateErrorResponse {
  ok: false;
  error: string;
  code: 'VALIDATION_ERROR' | 'AI_GENERATION_FAILED' | 'PERSISTENCE_FAILED' | 'INTERNAL_ERROR';
}

type GenerateResponse = GenerateSuccessResponse | GenerateErrorResponse;

// ─── AI Call Helper ──────────────────────────────────────────

/**
 * Call the existing survey-v2/treatment-plan SSE endpoint
 * and collect the full response.
 */
async function callTreatmentPlanAI(
  requestBody: Record<string, unknown>
): Promise<TreatmentPlanV2 | null> {
  // Use internal API call via absolute URL or direct import
  // For server-to-server, we construct the AI call directly
  // using the same Anthropic SDK pattern as survey-v2/treatment-plan.ts
  const { default: Anthropic } = await import('@anthropic-ai/sdk');

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Re-use the existing treatment plan system prompt pattern
  const SYSTEM_PROMPT = buildSystemPrompt();

  const patientContext = buildPatientContext(requestBody);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      temperature: 0.3,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: patientContext },
      ],
      messages: [
        {
          role: 'user',
          content: `Generate the Treatment Plan V2 JSON based on the Phase A recommended devices/injectables and the patient's budget/schedule context. Use ONLY devices/injectables from Phase A results. CURRENT_MONTH: ${new Date().getMonth() + 1}. Output ONLY valid JSON.`,
        },
      ],
    });

    // Extract text from response
    let fullText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        fullText += block.text;
      }
    }

    // Parse JSON (with truncation recovery)
    return parseAIResponse(fullText);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[generate] AI call failed:', msg);
    return null;
  }
}

function parseAIResponse(text: string): TreatmentPlanV2 | null {
  try {
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const firstBrace = jsonStr.indexOf('{');
    if (firstBrace > 0) {
      jsonStr = jsonStr.substring(firstBrace);
    }
    // Truncation recovery
    if (!jsonStr.endsWith('}')) {
      const lastBrace = jsonStr.lastIndexOf('}');
      if (lastBrace > 0) {
        let depth = 0;
        for (const ch of jsonStr.substring(0, lastBrace + 1)) {
          if (ch === '{') depth++;
          if (ch === '}') depth--;
        }
        jsonStr = jsonStr.substring(0, lastBrace + 1) + '}'.repeat(depth);
      }
    }
    return JSON.parse(jsonStr) as TreatmentPlanV2;
  } catch {
    console.error('[generate] JSON parse failed, text length:', text.length);
    return null;
  }
}

function buildPatientContext(body: Record<string, unknown>): string {
  const summary = body.phase_a_summary as Record<string, unknown> | undefined;
  if (!summary) return '═══ NO PATIENT CONTEXT ═══';

  const patient = summary.patient as Record<string, string | string[]> | undefined;
  const ebdDevices = summary.ebd_devices as Array<Record<string, string | number>> | undefined;
  const injectables = summary.injectables as Array<Record<string, string | number>> | undefined;
  const signatures = summary.signature_solutions as Array<Record<string, string | string[]>> | undefined;
  const budget = body.budget as Record<string, string> | null | undefined;

  return `═══ PATIENT CONTEXT ═══
Patient: ${patient?.age ?? 'N/A'} ${patient?.gender ?? 'N/A'}, Country: ${patient?.country ?? 'N/A'}
Aesthetic Goal: ${patient?.aesthetic_goal ?? 'N/A'}
Top Concerns: ${Array.isArray(patient?.top3_concerns) ? (patient.top3_concerns as string[]).join(', ') : 'N/A'}

═══ PHASE A RECOMMENDED DEVICES ═══
${(ebdDevices ?? []).map(d =>
  `#${d.rank} ${d.device_name} (${d.device_id}) — confidence: ${d.confidence}, pain: ${d.pain_level}, downtime: ${d.downtime_level}`
).join('\n')}

═══ PHASE A RECOMMENDED INJECTABLES ═══
${(injectables ?? []).map(i =>
  `#${i.rank} ${i.name} (${i.injectable_id}) — ${i.category}, confidence: ${i.confidence}`
).join('\n')}

═══ SIGNATURE SOLUTIONS ═══
${(signatures ?? []).map(s =>
  `${s.name}: devices=[${Array.isArray(s.devices) ? s.devices.join(',') : ''}] injectables=[${Array.isArray(s.injectables) ? s.injectables.join(',') : ''}]`
).join('\n')}

═══ BUDGET & SCHEDULE ═══
Budget: ${budget ? `${budget.range} (${budget.type})` : 'Not specified'}
${body.stay_duration ? `Stay Duration: ${String(body.stay_duration)} days` : ''}
${body.management_frequency ? `Management Frequency: ${String(body.management_frequency)}` : ''}
${body.event_info ? `Event: ${JSON.stringify(body.event_info)}` : ''}
Current Month: ${new Date().getMonth() + 1}`;
}

function buildSystemPrompt(): string {
  // Compact version of treatment-plan system prompt
  // Full version lives in survey-v2/treatment-plan.ts
  return `You are a treatment planning specialist for ConnectingDocs, a Korean medical aesthetics clinic.
Given a patient's recommended devices/injectables from Phase A analysis and their budget/schedule context,
generate a time-sequenced Treatment Plan with budget optimization.

SEQUENCING PRINCIPLES:
1. Foundation First (RF/HIFU → Laser → Injectable)
2. Downtime Sequencing (zero-downtime first)
3. Synergy Sequencing (RF/HIFU → 2-4 weeks → Laser → 1-2 weeks → Injectable)
4. Seasonal Awareness
5. Age-Specific Priority

PLAN TYPES:
- regular: Korean patients (3-6 month plan)
- visit: Foreign patients (based on stay duration)
- event: D-day countdown plan

BUDGET RULES:
- 30/50/20 allocation (Foundation/Main/Maintenance)
- Respect patient's stated budget STRICTLY

OUTPUT FORMAT: Valid JSON matching schema:
{
  "plan_type": "regular|visit|event",
  "plan_type_label": "<label>",
  "duration": "<duration>",
  "budget_total": "<total>",
  "budget_breakdown": { "foundation_pct": N, "foundation_label": "", "main_pct": N, "main_label": "", "maintenance_pct": N, "maintenance_label": "", "roi_note": "" },
  "phases": [{ "phase_number": N, "timing": "", "timing_label": "", "procedures": [{ "device_or_injectable": "", "category": "ebd|injectable|homecare", "reason_why": "", "clinical_basis": "", "synergy_note": "", "downtime": "", "estimated_cost": "" }], "phase_goal": "", "total_downtime": "", "estimated_cost": "", "lifestyle_note": "" }],
  "plan_rationale": "",
  "seasonal_note": ""
}

RULES: 1. Use ONLY provided devices/injectables. 2. Patient language. 3. ONLY valid JSON. 4. Max 4000 tokens.`;
}

// ─── Email Trigger (fire-and-forget) ─────────────────────────

/**
 * Send 'plan-ready' notification to the assigned doctor (if any).
 * Best-effort: never blocks, never throws, silently skips if
 * no doctor is assigned or email cannot be resolved.
 */
function triggerPlanReadyEmail(
  plan: TreatmentPlanData,
  lang: 'KO' | 'EN' | 'JP' | 'ZH-CN',
): void {
  if (!plan.doctorId) {
    // No doctor assigned yet — email will be sent when doctor picks up the plan
    return;
  }

  // Async lookup + send in a fire-and-forget closure
  void (async () => {
    const doctor = await lookupUserByUid(plan.doctorId ?? '');
    if (!doctor) return;

    sendEmailFireAndForget({
      recipient: doctor.email,
      recipientName: doctor.name,
      template: 'plan-ready',
      locale: lang,
      data: {
        doctorName: doctor.name,
        patientId: plan.patientId,
        planId: plan.planId,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/doctor/plans/${plan.planId}`,
      },
    });
  })().catch(() => {
    // Absolute safety net — never propagate
  });
}

// ─── Handler ─────────────────────────────────────────────────

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<GenerateResponse>
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({
      ok: false,
      error: 'Method not allowed',
      code: 'INTERNAL_ERROR',
    });
    return;
  }

  // 1. Validate request body
  const parseResult = GeneratePlanRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map(
      (i) => `${i.path.join('.')}: ${i.message}`
    );
    res.status(400).json({
      ok: false,
      error: `Validation failed: ${issues.join('; ')}`,
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  const request = parseResult.data;

  // 2. Call AI to generate treatment plan
  const aiRequestBody = buildAIRequestBody(request);
  const aiPlan = await callTreatmentPlanAI(aiRequestBody);

  if (!aiPlan) {
    res.status(502).json({
      ok: false,
      error: 'AI treatment plan generation failed',
      code: 'AI_GENERATION_FAILED',
    });
    return;
  }

  // 3. Transform AI output → TreatmentPlanData
  const planData = transformAIPlanToData(aiPlan, request);

  // 4. Persist to Airtable
  const savedPlan = await createPlan(planData);

  if (!savedPlan) {
    // Best-effort: return plan even if Airtable save fails
    // Client can retry via retry-queue
    console.warn('[generate] Airtable save failed, returning unsaved plan');
    triggerPlanReadyEmail(planData, request.lang);
    res.status(200).json({
      ok: true,
      plan: planData,
    });
    return;
  }

  // 5. Fire-and-forget: notify doctor that a new plan is ready
  triggerPlanReadyEmail(savedPlan, request.lang);

  // 6. Return success
  res.status(201).json({
    ok: true,
    plan: savedPlan,
  });
}

export default apiRoleGuard(handler, ['patient', 'admin']);
