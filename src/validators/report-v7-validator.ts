// ═══════════════════════════════════════════════════════════════
//  Report v7 — Zod Validator
//  §10.1 MASTER_PLAN_V4: Validates Opus recommendation output
//  and converts to ReportV7Data with safe defaults.
//
//  - Lenient parsing: missing fields → defaults + warnings
//  - JSON truncation recovery: tryParseJSON
//  - NEVER throws — always returns { data, warnings }
//  - NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import type { ReportV7Data } from '@/types/report-v7';

// ═══════════════════════════════════════════════════════════════
//  Sub-schemas
// ═══════════════════════════════════════════════════════════════

const PracticalInfoSchema = z.object({
  sessions: z.string().default(''),
  interval: z.string().default(''),
  duration: z.string().default(''),
  onset: z.string().default(''),
  maintain: z.string().default(''),
}).default({
  sessions: '', interval: '', duration: '', onset: '', maintain: '',
});

const SafetyFlagSchema = z.object({
  code: z.string().default('UNKNOWN'),
  severity: z.enum(['info', 'warning', 'critical']).default('info'),
  message: z.string().default(''),
});

const PatientProfileSchema = z.object({
  name: z.string().default(''),
  age: z.string().default(''),
  gender: z.string().default(''),
  country: z.string().default('KR'),
  aestheticGoal: z.string().default(''),
  top3Concerns: z.array(z.string()).default([]),
  pastTreatments: z.array(z.string()).default([]),
  fitzpatrick: z.string().default(''),
  painSensitivity: z.number().default(3),
  stayDuration: z.string().default(''),
  contraindications: z.array(z.string()).default([]),
}).default({
  name: '', age: '', gender: '', country: 'KR', aestheticGoal: '',
  top3Concerns: [], pastTreatments: [], fitzpatrick: '',
  painSensitivity: 3, stayDuration: '', contraindications: [],
});

const MirrorLayerSchema = z.object({
  headline: z.string().default(''),
  empathyParagraphs: z.string().default(''),
  transition: z.string().default(''),
}).default({ headline: '', empathyParagraphs: '', transition: '' });

const ConfidenceLayerSchema = z.object({
  reasonWhy: z.string().default(''),
  socialProof: z.string().default(''),
  commitment: z.string().default(''),
}).default({ reasonWhy: '', socialProof: '', commitment: '' });

const EBDRecommendationSchema = z.object({
  rank: z.number().default(0),
  deviceName: z.string().default(''),
  deviceId: z.string().default(''),
  moaCategory: z.string().default(''),
  moaCategoryLabel: z.string().default(''),
  evidenceLevel: z.number().default(0),
  confidence: z.number().default(0),
  skinLayer: z.string().default(''),
  painLevel: z.number().default(0),
  downtimeLevel: z.number().default(0),
  safetyLevel: z.number().default(0),
  badge: z.string().nullable().default(null),
  badgeColor: z.string().default(''),
  subtitle: z.string().default(''),
  summaryHtml: z.string().default(''),
  whyFitHtml: z.string().default(''),
  moaSummaryTitle: z.string().default(''),
  moaSummaryShort: z.string().default(''),
  moaDescriptionHtml: z.string().default(''),
  targetTags: z.array(z.string()).default([]),
  practical: PracticalInfoSchema,
  scores: z.record(z.string(), z.number()).default({}),
  aiDescriptionHtml: z.string().default(''),
});

const InjectableRecommendationSchema = z.object({
  rank: z.number().default(0),
  name: z.string().default(''),
  injectableId: z.string().default(''),
  category: z.string().default(''),
  categoryLabel: z.string().default(''),
  evidenceLevel: z.number().default(0),
  confidence: z.number().default(0),
  skinLayer: z.string().default(''),
  subtitle: z.string().default(''),
  summaryHtml: z.string().default(''),
  whyFitHtml: z.string().default(''),
  moaSummaryTitle: z.string().default(''),
  moaSummaryShort: z.string().default(''),
  moaDescriptionHtml: z.string().default(''),
  practical: PracticalInfoSchema,
  scores: z.record(z.string(), z.number()).default({}),
});

const SignatureSolutionSchema = z.object({
  name: z.string().default(''),
  description: z.string().default(''),
  devices: z.array(z.string()).default([]),
  injectables: z.array(z.string()).default([]),
  totalSessions: z.string().default(''),
  synergyScore: z.number().default(0),
});

const TreatmentPhaseSchema = z.object({
  phase: z.number().default(0),
  name: z.string().default(''),
  period: z.string().default(''),
  treatments: z.array(z.string()).default([]),
  goal: z.string().default(''),
});

const TreatmentPlanSchema = z.object({
  phases: z.array(TreatmentPhaseSchema).default([]),
}).default({ phases: [] });

const HomecareGuideSchema = z.object({
  morning: z.array(z.string()).default([]),
  evening: z.array(z.string()).default([]),
  weekly: z.array(z.string()).default([]),
  avoid: z.array(z.string()).default([]),
}).default({ morning: [], evening: [], weekly: [], avoid: [] });

const BudgetSegmentSchema = z.object({
  label: z.string().default(''),
  category: z.enum(['foundation', 'main', 'maintenance']).default('main'),
  percentage: z.number().default(0),
  amount: z.string().default(''),
});

const BudgetEstimateSchema = z.object({
  totalRange: z.string().default(''),
  segments: z.array(BudgetSegmentSchema).default([]),
  roiNote: z.string().default(''),
}).default({ totalRange: '', segments: [], roiNote: '' });

const BudgetTimelineSchema = z.object({
  budgetTier: z.enum(['Economy', 'Standard', 'Premium']).default('Standard'),
  decisionSpeed: z.enum(['Slow', 'Normal', 'Fast']).default('Normal'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  stayDuration: z.string().nullable().default(null),
}).default({
  budgetTier: 'Standard', decisionSpeed: 'Normal', urgency: 'MEDIUM', stayDuration: null,
});

const PatientIntelligenceSchema = z.object({
  expectationTag: z.enum(['REALISTIC', 'AMBITIOUS', 'CAUTION']).default('REALISTIC'),
  expectationNote: z.string().default(''),
  budgetTimeline: BudgetTimelineSchema,
  communicationStyle: z.enum(['LOGICAL', 'EMOTIONAL', 'ANXIOUS']).default('LOGICAL'),
  communicationNote: z.string().default(''),
}).default({
  expectationTag: 'REALISTIC', expectationNote: '',
  budgetTimeline: {
    budgetTier: 'Standard', decisionSpeed: 'Normal', urgency: 'MEDIUM', stayDuration: null,
  },
  communicationStyle: 'LOGICAL', communicationNote: '',
});

const ConsultationStrategySchema = z.object({
  recommendedOrder: z.array(z.string()).default([]),
  expectedComplaints: z.array(z.string()).default([]),
  scenarioSummary: z.string().default(''),
}).default({ recommendedOrder: [], expectedComplaints: [], scenarioSummary: '' });

const DoctorTabSchema = z.object({
  clinicalSummary: z.string().default(''),
  triggeredProtocols: z.array(z.string()).default([]),
  countryNote: z.string().default(''),
  parameterGuidance: z.record(z.string(), z.string()).default({}),
  contraindications: z.array(z.string()).default([]),
  alternativeOptions: z.array(z.string()).default([]),
  patientIntelligence: PatientIntelligenceSchema,
  consultationStrategy: ConsultationStrategySchema,
}).default({
  clinicalSummary: '', triggeredProtocols: [], countryNote: '',
  parameterGuidance: {}, contraindications: [], alternativeOptions: [],
  patientIntelligence: {
    expectationTag: 'REALISTIC', expectationNote: '',
    budgetTimeline: {
      budgetTier: 'Standard', decisionSpeed: 'Normal', urgency: 'MEDIUM', stayDuration: null,
    },
    communicationStyle: 'LOGICAL', communicationNote: '',
  },
  consultationStrategy: { recommendedOrder: [], expectedComplaints: [], scenarioSummary: '' },
});

// ═══════════════════════════════════════════════════════════════
//  Main Schema: RecommendationOutputSchema
// ═══════════════════════════════════════════════════════════════

export const RecommendationOutputSchema = z.object({
  lang: z.string().default('KO'),
  generatedAt: z.string().default(''),
  model: z.string().default(''),
  patient: PatientProfileSchema,
  safetyFlags: z.array(SafetyFlagSchema).default([]),
  mirror: MirrorLayerSchema,
  confidence: ConfidenceLayerSchema,
  ebdRecommendations: z.array(EBDRecommendationSchema).default([]),
  injectableRecommendations: z.array(InjectableRecommendationSchema).default([]),
  signatureSolutions: z.array(SignatureSolutionSchema).default([]),
  treatmentPlan: TreatmentPlanSchema,
  homecare: HomecareGuideSchema,
  budgetEstimate: BudgetEstimateSchema,
  doctorTab: DoctorTabSchema,
});

// ═══════════════════════════════════════════════════════════════
//  JSON Truncation Recovery
//  SSE streams can get cut off, resulting in incomplete JSON.
//  This function attempts to recover parseable portions.
// ═══════════════════════════════════════════════════════════════

function tryParseJSON(raw: string): Record<string, unknown> | null {
  // 1. Direct parse
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    // continue to recovery
  }

  // 2. Try closing open braces/brackets progressively
  let attempt = raw.trimEnd();
  // Remove trailing comma if present
  attempt = attempt.replace(/,\s*$/, '');

  // Try closing up to 10 levels of nesting
  for (let i = 0; i < 10; i++) {
    // Count open vs close braces/brackets
    const openBraces = (attempt.match(/{/g) || []).length;
    const closeBraces = (attempt.match(/}/g) || []).length;
    const openBrackets = (attempt.match(/\[/g) || []).length;
    const closeBrackets = (attempt.match(/]/g) || []).length;

    if (openBrackets > closeBrackets) {
      attempt += ']';
    } else if (openBraces > closeBraces) {
      attempt += '}';
    } else {
      break;
    }
  }

  // Remove trailing incomplete string values (key: "incomplete...)
  attempt = attempt.replace(/,\s*"[^"]*":\s*"[^"]*$/, '');

  try {
    const parsed = JSON.parse(attempt);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // recovery failed
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
//  Validation Result
// ═══════════════════════════════════════════════════════════════

interface ValidationResult {
  data: ReportV7Data;
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════════
//  validateRecommendation
//  Main entry point — NEVER throws.
//  Returns validated data with defaults + warning list.
// ═══════════════════════════════════════════════════════════════

/**
 * Accepts:
 *   - JSON string (possibly truncated from SSE)
 *   - ReportV7Data object (from convertPayloadToReportV7Data or mock)
 *   - Any plain object (from raw API response)
 * NEVER throws — always returns { data, warnings }.
 */
export function validateRecommendation(raw: string | ReportV7Data): ValidationResult {
  const warnings: string[] = [];

  // ─── Step 1: If string, parse JSON (with truncation recovery) ─
  let inputObj: ReportV7Data | Record<string, unknown>;

  if (typeof raw === 'string') {
    const parsed = tryParseJSON(raw);
    if (!parsed) {
      warnings.push('JSON parse failed completely — returning full defaults');
      return {
        data: RecommendationOutputSchema.parse({}) as ReportV7Data,
        warnings,
      };
    }
    inputObj = parsed;

    // Check if recovery was needed
    try {
      JSON.parse(raw);
    } catch {
      warnings.push('JSON was truncated — recovered partial data');
    }
  } else {
    inputObj = raw;
  }

  // ─── Step 2: Track which top-level fields are present ─────────
  const topKeys = [
    'lang', 'generatedAt', 'model', 'patient', 'safetyFlags',
    'mirror', 'confidence', 'ebdRecommendations', 'injectableRecommendations',
    'signatureSolutions', 'treatmentPlan', 'homecare', 'budgetEstimate', 'doctorTab',
  ] as const;

  for (const key of topKeys) {
    if (!(key in inputObj)) {
      warnings.push(`Field "${key}" was missing — default value applied`);
    }
  }

  // ─── Step 3: Validate with Zod (safeParse for no-throw) ─────
  const result = RecommendationOutputSchema.safeParse(inputObj);

  if (result.success) {
    return { data: result.data as ReportV7Data, warnings };
  }

  // ─── Step 4: Zod parse error — field-by-field fallback ────────
  warnings.push('Zod validation failed — applying defaults for invalid fields');

  if (result.error && 'issues' in result.error) {
    for (const issue of result.error.issues) {
      const path = Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path ?? 'root');
      warnings.push(`  - ${path}: ${issue.message}`);
    }
  }

  // Build merged result: defaults + valid individual fields
  try {
    const fallback = RecommendationOutputSchema.parse({});
    const merged: Record<string, unknown> = { ...fallback };

    for (const key of topKeys) {
      if (key in inputObj) {
        const fieldSchema = RecommendationOutputSchema.shape[key];
        if (fieldSchema) {
          const fieldResult = fieldSchema.safeParse((inputObj as Record<string, unknown>)[key]);
          if (fieldResult.success) {
            merged[key] = fieldResult.data;
          } else {
            warnings.push(`Field "${key}" had invalid data — default used`);
          }
        }
      }
    }

    // Re-parse merged object through Zod to guarantee type safety
    const revalidated = RecommendationOutputSchema.parse(merged);
    return { data: revalidated as ReportV7Data, warnings };
  } catch {
    warnings.push('Complete fallback to empty defaults');
    return {
      data: RecommendationOutputSchema.parse({}) as ReportV7Data,
      warnings,
    };
  }
}

// ─── Export types ──────────────────────────────────────────────
export type { ValidationResult };
