// ═══════════════════════════════════════════════════════════════
//  Treatment Plan — Zod Schema + Types
//  §Phase 2 (G-2): Persistent Treatment Plan with doctor workflow
//
//  Status flow: draft → doctor_review → approved → sent
//  Lenient parsing with .default() — NEVER throws
//  NO any/unknown types
//
//  Note: "Opus" → "Recommendation" rename for new code only.
//  Existing OpusRecommendationOutput is aliased, NOT modified.
//  (Rule #4: 기존 비즈니스 로직 변경 금지)
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

// ─── Re-export alias for gradual rename ──────────────────────
// The legacy "Opus" name remains in existing Phase A code.
// New Phase B code uses "RecommendationOutput" alias.
export type { OpusRecommendationOutput as RecommendationOutput } from '@/pages/api/survey-v2/final-recommendation';

// ─── Plan Status ─────────────────────────────────────────────

export const PlanStatusSchema = z.enum([
  'draft',
  'doctor_review',
  'approved',
  'sent',
]);

export type PlanStatus = z.infer<typeof PlanStatusSchema>;

export const PLAN_STATUS_ORDER: Record<PlanStatus, number> = {
  draft: 0,
  doctor_review: 1,
  approved: 2,
  sent: 3,
} as const;

// ─── Concern ─────────────────────────────────────────────────

export const ConcernSchema = z.object({
  concern: z.string().default(''),
  severity: z.enum(['mild', 'moderate', 'severe']).default('moderate'),
  area: z.string().default(''),
  patientPriority: z.number().min(1).max(5).default(3),
});

export type Concern = z.infer<typeof ConcernSchema>;

// ─── Procedure in a Phase ────────────────────────────────────

export const PlanProcedureSchema = z.object({
  deviceOrInjectable: z.string().default(''),
  category: z.enum(['ebd', 'injectable', 'homecare']).default('ebd'),
  reasonWhy: z.string().default(''),
  clinicalBasis: z.string().default(''),
  synergyNote: z.string().default(''),
  downtime: z.string().default(''),
  estimatedCost: z.string().default(''),
});

export type PlanProcedure = z.infer<typeof PlanProcedureSchema>;

// ─── Treatment Phase ─────────────────────────────────────────

export const PlanPhaseSchema = z.object({
  phaseNumber: z.number().default(1),
  timing: z.string().default(''),
  timingLabel: z.string().default(''),
  procedures: z.array(PlanProcedureSchema).default([]),
  phaseGoal: z.string().default(''),
  totalDowntime: z.string().default(''),
  estimatedCost: z.string().default(''),
  lifestyleNote: z.string().default(''),
});

export type PlanPhase = z.infer<typeof PlanPhaseSchema>;

// ─── Timeline ────────────────────────────────────────────────

export const TimelineSchema = z.object({
  planType: z.enum(['regular', 'visit', 'event']).default('regular'),
  planTypeLabel: z.string().default(''),
  duration: z.string().default(''),
  phases: z.array(PlanPhaseSchema).default([]),
  planRationale: z.string().default(''),
  seasonalNote: z.string().default(''),
});

export type Timeline = z.infer<typeof TimelineSchema>;

// ─── Cost Range ──────────────────────────────────────────────

export const CostBreakdownSchema = z.object({
  foundationPct: z.number().default(30),
  foundationLabel: z.string().default(''),
  mainPct: z.number().default(50),
  mainLabel: z.string().default(''),
  maintenancePct: z.number().default(20),
  maintenanceLabel: z.string().default(''),
  roiNote: z.string().default(''),
});

export type CostBreakdown = z.infer<typeof CostBreakdownSchema>;

export const CostRangeSchema = z.object({
  budgetTotal: z.string().default(''),
  breakdown: CostBreakdownSchema.default(() => ({
    foundationPct: 30,
    foundationLabel: '',
    mainPct: 50,
    mainLabel: '',
    maintenancePct: 20,
    maintenanceLabel: '',
    roiNote: '',
  })),
});

export type CostRange = z.infer<typeof CostRangeSchema>;

// ─── Recommendation Summary (from Phase A) ───────────────────

export const RecommendationSummarySchema = z.object({
  ebdDevices: z.array(z.object({
    rank: z.number().default(0),
    deviceName: z.string().default(''),
    deviceId: z.string().default(''),
    confidence: z.number().default(0),
    painLevel: z.number().default(0),
    downtimeLevel: z.number().default(0),
  })).default([]),
  injectables: z.array(z.object({
    rank: z.number().default(0),
    name: z.string().default(''),
    injectableId: z.string().default(''),
    category: z.string().default(''),
    confidence: z.number().default(0),
  })).default([]),
  signatureSolutions: z.array(z.object({
    name: z.string().default(''),
    devices: z.array(z.string()).default([]),
    injectables: z.array(z.string()).default([]),
  })).default([]),
});

export type RecommendationSummary = z.infer<typeof RecommendationSummarySchema>;

// ─── Doctor Modification ─────────────────────────────────────

export const DoctorModificationSchema = z.object({
  doctorId: z.string().default(''),
  modifiedAt: z.string().datetime().default(() => new Date().toISOString()),
  field: z.string().default(''),
  previousValue: z.string().default(''),
  newValue: z.string().default(''),
  reason: z.string().default(''),
});

export type DoctorModification = z.infer<typeof DoctorModificationSchema>;

// ─── Main TreatmentPlan Schema ───────────────────────────────

export const TreatmentPlanSchema = z.object({
  // Identity
  planId: z.string().min(1),
  reportId: z.string().default(''),
  patientId: z.string().default(''),
  doctorId: z.string().optional(),

  // Status
  status: PlanStatusSchema.default('draft'),

  // Patient context
  concerns: z.array(ConcernSchema).default([]),

  // Recommendations summary (from Phase A)
  recommendations: RecommendationSummarySchema.default(() => ({
    ebdDevices: [],
    injectables: [],
    signatureSolutions: [],
  })),

  // AI-generated plan
  timeline: TimelineSchema.default(() => ({
    planType: 'regular' as const,
    planTypeLabel: '',
    duration: '',
    phases: [],
    planRationale: '',
    seasonalNote: '',
  })),

  // Budget
  estimatedCost: CostRangeSchema.optional(),

  // Doctor modifications log
  doctorModifications: z.array(DoctorModificationSchema).default([]),

  // Timestamps
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type TreatmentPlanData = z.infer<typeof TreatmentPlanSchema>;

// ─── Validation Helper ───────────────────────────────────────

export interface PlanValidationResult {
  success: true;
  data: TreatmentPlanData;
  warnings: string[];
}

export interface PlanValidationError {
  success: false;
  error: string;
  warnings: string[];
}

export type PlanParseResult = PlanValidationResult | PlanValidationError;

/**
 * Safely parse a treatment plan object.
 * NEVER throws — returns typed result.
 */
export function parseTreatmentPlan(raw: Record<string, unknown>): PlanParseResult {
  const warnings: string[] = [];

  const result = TreatmentPlanSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    return {
      success: false,
      error: `Treatment plan validation failed: ${issues.join('; ')}`,
      warnings: issues,
    };
  }

  // Warnings for recommended fields
  if (result.data.concerns.length === 0) {
    warnings.push('no concerns specified');
  }
  if (result.data.timeline.phases.length === 0) {
    warnings.push('no treatment phases in timeline');
  }
  if (!result.data.reportId) {
    warnings.push('no reportId linked');
  }

  return {
    success: true,
    data: result.data,
    warnings,
  };
}

// ─── Generate API Request Schema ─────────────────────────────

export const GeneratePlanRequestSchema = z.object({
  reportId: z.string().min(1),
  patientId: z.string().min(1),
  phaseASummary: z.object({
    ebdDevices: z.array(z.object({
      rank: z.number(),
      deviceName: z.string(),
      deviceId: z.string(),
      confidence: z.number(),
      painLevel: z.number(),
      downtimeLevel: z.number(),
    })),
    injectables: z.array(z.object({
      rank: z.number(),
      name: z.string(),
      injectableId: z.string(),
      category: z.string(),
      confidence: z.number(),
    })),
    signatureSolutions: z.array(z.object({
      name: z.string(),
      devices: z.array(z.string()),
      injectables: z.array(z.string()),
    })),
    safetyFlags: z.record(z.string(), z.unknown()).default({}),
    patient: z.object({
      age: z.string(),
      gender: z.string(),
      country: z.string(),
      aestheticGoal: z.string(),
      top3Concerns: z.array(z.string()),
    }),
  }),
  budget: z.object({
    range: z.string(),
    type: z.string(),
  }).optional(),
  stayDuration: z.number().optional(),
  managementFrequency: z.string().optional(),
  eventInfo: z.object({
    type: z.string(),
    date: z.string(),
  }).optional(),
  lang: z.enum(['KO', 'EN', 'JP', 'ZH-CN']).default('KO'),
});

export type GeneratePlanRequest = z.infer<typeof GeneratePlanRequestSchema>;

// ─── Doctor Patch Request Schema ─────────────────────────────

export const PatchPlanRequestSchema = z.object({
  status: PlanStatusSchema.optional(),
  timeline: TimelineSchema.optional(),
  estimatedCost: CostRangeSchema.optional(),
  doctorNote: z.string().optional(),
  modifications: z.array(DoctorModificationSchema).optional(),
});

export type PatchPlanRequest = z.infer<typeof PatchPlanRequestSchema>;

// ─── ID Generator ────────────────────────────────────────────

/**
 * Generate a plan ID without external UUID dependency.
 * Format: tp_{timestamp}_{random}
 */
export function generatePlanId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `tp_${ts}_${rand}`;
}
