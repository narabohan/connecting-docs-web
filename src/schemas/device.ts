// ═══════════════════════════════════════════════════════════════
//  Device Wiki — Zod Schema
//  §Phase 2 (G-1): DeviceData schema for wiki pages
//
//  - Lenient parsing with .default() for safe rendering
//  - Multilingual name/description via LocalizedText
//  - NEVER throws — parse with safeParse
//  - NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

// ─── Localized Text (4-lang) ─────────────────────────────────

export const LocalizedTextSchema = z.object({
  ko: z.string().default(''),
  en: z.string().default(''),
  ja: z.string().default(''),
  zh: z.string().default(''),
});

export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

// ─── Device Category ─────────────────────────────────────────

export const DeviceCategorySchema = z.enum([
  'laser',
  'ultrasound',
  'radiofrequency',
  'ipl',
  'led',
  'microneedling',
  'cryotherapy',
  'other',
]);

export type DeviceCategory = z.infer<typeof DeviceCategorySchema>;

// ─── Device Specs ────────────────────────────────────────────

export const DeviceSpecsSchema = z.object({
  wavelength: z.string().default(''),
  energy: z.string().default(''),
  spotSize: z.string().default(''),
  pulseWidth: z.string().default(''),
  frequency: z.string().default(''),
  depth: z.string().default(''),
  indications: z.array(z.string()).default([]),
  contraindications: z.array(z.string()).default([]),
  fdaClearance: z.string().default(''),
  ceClearance: z.string().default(''),
});

export type DeviceSpecs = z.infer<typeof DeviceSpecsSchema>;

// ─── Clinical Evidence ───────────────────────────────────────

export const ClinicalEvidenceSchema = z.object({
  title: z.string().default(''),
  authors: z.string().default(''),
  journal: z.string().default(''),
  year: z.number().default(0),
  doi: z.string().default(''),
  summary: z.string().default(''),
  sampleSize: z.number().default(0),
  evidenceLevel: z.string().default(''),
});

export type ClinicalEvidence = z.infer<typeof ClinicalEvidenceSchema>;

// ─── Device Images ───────────────────────────────────────────

export const DeviceImagesSchema = z.object({
  hero: z.string().default(''),
  mechanismDiagram: z.string().default(''),
  thumbnail: z.string().default(''),
});

export type DeviceImages = z.infer<typeof DeviceImagesSchema>;

// ─── Main DeviceData Schema ──────────────────────────────────

export const DeviceDataSchema = z.object({
  // Identity
  deviceSlug: z.string().min(1),
  name: LocalizedTextSchema,
  tagline: LocalizedTextSchema,
  category: DeviceCategorySchema.default('other'),
  manufacturer: z.string().default(''),
  yearLaunched: z.number().default(0),

  // Technical specs
  specs: DeviceSpecsSchema.default(() => ({
    wavelength: '',
    energy: '',
    spotSize: '',
    pulseWidth: '',
    frequency: '',
    depth: '',
    indications: [],
    contraindications: [],
    fdaClearance: '',
    ceClearance: '',
  })),

  // Mechanism of action
  mechanism: LocalizedTextSchema,

  // Clinical evidence
  clinicalEvidence: z.array(ClinicalEvidenceSchema).default([]),

  // Related
  relatedDevices: z.array(z.string()).default([]),
  relatedTreatments: z.array(z.string()).default([]),

  // Images
  images: DeviceImagesSchema.default(() => ({
    hero: '',
    mechanismDiagram: '',
    thumbnail: '',
  })),

  // SEO
  seoDescription: LocalizedTextSchema,
});

export type DeviceData = z.infer<typeof DeviceDataSchema>;

// ─── Validation Helper ───────────────────────────────────────

export interface DeviceValidationResult {
  success: true;
  data: DeviceData;
  warnings: string[];
}

export interface DeviceValidationError {
  success: false;
  error: string;
  warnings: string[];
}

export type DeviceParseResult = DeviceValidationResult | DeviceValidationError;

/**
 * Safely parse a device JSON object.
 * Returns typed result — NEVER throws.
 */
export function parseDeviceData(raw: Record<string, unknown>): DeviceParseResult {
  const warnings: string[] = [];

  const result = DeviceDataSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    return {
      success: false,
      error: `Device validation failed: ${issues.join('; ')}`,
      warnings: issues,
    };
  }

  // Check for empty recommended fields
  if (!result.data.manufacturer) {
    warnings.push('manufacturer is empty');
  }
  if (result.data.clinicalEvidence.length === 0) {
    warnings.push('no clinical evidence provided');
  }
  if (!result.data.images.hero) {
    warnings.push('no hero image provided');
  }

  return {
    success: true,
    data: result.data,
    warnings,
  };
}
