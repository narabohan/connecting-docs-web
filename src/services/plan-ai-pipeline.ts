// ═══════════════════════════════════════════════════════════════
//  Plan AI Pipeline — Phase 2 (G-2)
//  Converts Phase A AI output → persistent TreatmentPlanData
//
//  Bridges between:
//  - existing survey-v2/treatment-plan.ts (streaming AI generation)
//  - new TreatmentPlanSchema (persistent storage)
//
//  Does NOT modify existing Phase A/B streaming code.
//  Instead, transforms the TreatmentPlanV2 output into our schema.
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type {
  TreatmentPlanV2,
  TreatmentPhaseV2,
} from '@/pages/api/survey-v2/treatment-plan';
import type {
  TreatmentPlanData,
  Timeline,
  PlanPhase,
  PlanProcedure,
  CostRange,
  RecommendationSummary,
  Concern,
} from '@/schemas/treatment-plan';
import { generatePlanId } from '@/schemas/treatment-plan';
import type { GeneratePlanRequest } from '@/schemas/treatment-plan';

// ─── Transform: TreatmentPlanV2 → TreatmentPlanData ─────────

/**
 * Convert the streaming AI output (TreatmentPlanV2) into
 * the persistent TreatmentPlanData format.
 */
export function transformAIPlanToData(
  aiPlan: TreatmentPlanV2,
  request: GeneratePlanRequest
): TreatmentPlanData {
  const now = new Date().toISOString();

  // Transform timeline
  const timeline = transformTimeline(aiPlan);

  // Transform cost
  const estimatedCost = transformCost(aiPlan);

  // Build recommendations summary from request
  const recommendations = transformRecommendations(request);

  // Build concerns from patient context
  const concerns = transformConcerns(request);

  return {
    planId: generatePlanId(),
    reportId: request.reportId,
    patientId: request.patientId,
    status: 'draft',
    concerns,
    recommendations,
    timeline,
    estimatedCost,
    doctorModifications: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Sub-transformers ────────────────────────────────────────

function transformTimeline(aiPlan: TreatmentPlanV2): Timeline {
  return {
    planType: aiPlan.plan_type,
    planTypeLabel: aiPlan.plan_type_label ?? '',
    duration: aiPlan.duration ?? '',
    phases: aiPlan.phases.map(transformPhase),
    planRationale: aiPlan.plan_rationale ?? '',
    seasonalNote: aiPlan.seasonal_note ?? '',
  };
}

function transformPhase(phase: TreatmentPhaseV2): PlanPhase {
  return {
    phaseNumber: phase.phase_number,
    timing: phase.timing ?? '',
    timingLabel: phase.timing_label ?? '',
    procedures: phase.procedures.map(transformProcedure),
    phaseGoal: phase.phase_goal ?? '',
    totalDowntime: phase.total_downtime ?? '',
    estimatedCost: phase.estimated_cost ?? '',
    lifestyleNote: phase.lifestyle_note ?? '',
  };
}

function transformProcedure(proc: TreatmentPhaseV2['procedures'][number]): PlanProcedure {
  return {
    deviceOrInjectable: proc.device_or_injectable ?? '',
    category: proc.category ?? 'ebd',
    reasonWhy: proc.reason_why ?? '',
    clinicalBasis: proc.clinical_basis ?? '',
    synergyNote: proc.synergy_note ?? '',
    downtime: proc.downtime ?? '',
    estimatedCost: proc.estimated_cost ?? '',
  };
}

function transformCost(aiPlan: TreatmentPlanV2): CostRange {
  return {
    budgetTotal: aiPlan.budget_total ?? '',
    breakdown: {
      foundationPct: aiPlan.budget_breakdown?.foundation_pct ?? 30,
      foundationLabel: aiPlan.budget_breakdown?.foundation_label ?? '',
      mainPct: aiPlan.budget_breakdown?.main_pct ?? 50,
      mainLabel: aiPlan.budget_breakdown?.main_label ?? '',
      maintenancePct: aiPlan.budget_breakdown?.maintenance_pct ?? 20,
      maintenanceLabel: aiPlan.budget_breakdown?.maintenance_label ?? '',
      roiNote: aiPlan.budget_breakdown?.roi_note ?? '',
    },
  };
}

function transformRecommendations(request: GeneratePlanRequest): RecommendationSummary {
  return {
    ebdDevices: request.phaseASummary.ebdDevices.map((d) => ({
      rank: d.rank,
      deviceName: d.deviceName,
      deviceId: d.deviceId,
      confidence: d.confidence,
      painLevel: d.painLevel,
      downtimeLevel: d.downtimeLevel,
    })),
    injectables: request.phaseASummary.injectables.map((i) => ({
      rank: i.rank,
      name: i.name,
      injectableId: i.injectableId,
      category: i.category,
      confidence: i.confidence,
    })),
    signatureSolutions: request.phaseASummary.signatureSolutions.map((s) => ({
      name: s.name,
      devices: [...s.devices],
      injectables: [...s.injectables],
    })),
  };
}

function transformConcerns(request: GeneratePlanRequest): Concern[] {
  return request.phaseASummary.patient.top3Concerns.map((concern, idx) => ({
    concern,
    severity: 'moderate' as const,
    area: '',
    patientPriority: idx + 1,
  }));
}

// ─── Build Phase A Summary for AI ────────────────────────────

/**
 * Build the request body for the existing survey-v2/treatment-plan API
 * from a GeneratePlanRequest.
 *
 * This bridges our new schema → existing AI streaming endpoint.
 */
export function buildAIRequestBody(request: GeneratePlanRequest): Record<string, unknown> {
  return {
    demographics: {
      detected_language: request.lang,
    },
    budget: request.budget
      ? { range: request.budget.range, type: request.budget.type }
      : null,
    stay_duration: request.stayDuration ?? null,
    management_frequency: request.managementFrequency ?? null,
    event_info: request.eventInfo
      ? { type: request.eventInfo.type, date: request.eventInfo.date }
      : null,
    phase_a_summary: {
      ebd_devices: request.phaseASummary.ebdDevices.map((d) => ({
        rank: d.rank,
        device_name: d.deviceName,
        device_id: d.deviceId,
        confidence: d.confidence,
        pain_level: d.painLevel,
        downtime_level: d.downtimeLevel,
      })),
      injectables: request.phaseASummary.injectables.map((i) => ({
        rank: i.rank,
        name: i.name,
        injectable_id: i.injectableId,
        category: i.category,
        confidence: i.confidence,
      })),
      signature_solutions: request.phaseASummary.signatureSolutions.map((s) => ({
        name: s.name,
        devices: [...s.devices],
        injectables: [...s.injectables],
      })),
      safety_flags: request.phaseASummary.safetyFlags ?? {},
      patient: {
        age: request.phaseASummary.patient.age,
        gender: request.phaseASummary.patient.gender,
        country: request.phaseASummary.patient.country,
        aesthetic_goal: request.phaseASummary.patient.aestheticGoal,
        top3_concerns: [...request.phaseASummary.patient.top3Concerns],
      },
    },
  };
}
