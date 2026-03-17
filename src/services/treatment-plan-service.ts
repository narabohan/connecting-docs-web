// ═══════════════════════════════════════════════════════════════
//  Treatment Plan Service — Phase 2 (G-2)
//  Airtable CRUD for TreatmentPlans table
//
//  Follows crm-service.ts pattern:
//  - best-effort: failures don't block core features
//  - Direct Airtable REST API
//  - NO any/unknown types
//
//  Airtable Table: TreatmentPlans
//  Fields: plan_id, report_id, patient_id, doctor_id, status,
//          concerns_json, recommendations_json, timeline_json,
//          cost_json, modifications_json, created_at, updated_at
// ═══════════════════════════════════════════════════════════════

import type {
  TreatmentPlanData,
  PlanStatus,
} from '@/schemas/treatment-plan';
import {
  parseTreatmentPlan,
  PLAN_STATUS_ORDER,
  generatePlanId,
} from '@/schemas/treatment-plan';

// ─── Airtable Config ─────────────────────────────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'TreatmentPlans';

function airtableUrl(recordId?: string): string {
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;
  return recordId ? `${base}/${recordId}` : base;
}

function airtableHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function ensureConfig(): void {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('[treatment-plan-service] Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
  }
}

// ─── Airtable Record Types ──────────────────────────────────

interface AirtablePlanFields {
  plan_id: string;
  report_id: string;
  patient_id: string;
  doctor_id?: string;
  status: string;
  concerns_json: string;
  recommendations_json: string;
  timeline_json: string;
  cost_json: string;
  modifications_json: string;
  created_at: string;
  updated_at: string;
}

interface AirtablePlanRecord {
  id: string;
  fields: Partial<AirtablePlanFields>;
  createdTime?: string;
}

interface AirtableListResponse {
  records: AirtablePlanRecord[];
  offset?: string;
}

// ─── Serialization ───────────────────────────────────────────

function planToFields(plan: TreatmentPlanData): AirtablePlanFields {
  return {
    plan_id: plan.planId,
    report_id: plan.reportId,
    patient_id: plan.patientId,
    doctor_id: plan.doctorId ?? '',
    status: plan.status,
    concerns_json: JSON.stringify(plan.concerns),
    recommendations_json: JSON.stringify(plan.recommendations),
    timeline_json: JSON.stringify(plan.timeline),
    cost_json: plan.estimatedCost ? JSON.stringify(plan.estimatedCost) : '',
    modifications_json: JSON.stringify(plan.doctorModifications),
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
}

function fieldsToPlan(fields: Partial<AirtablePlanFields>): TreatmentPlanData | null {
  if (!fields.plan_id) return null;

  const raw: Record<string, unknown> = {
    planId: fields.plan_id,
    reportId: fields.report_id ?? '',
    patientId: fields.patient_id ?? '',
    doctorId: fields.doctor_id || undefined,
    status: fields.status ?? 'draft',
    concerns: safeJsonParse(fields.concerns_json),
    recommendations: safeJsonParse(fields.recommendations_json),
    timeline: safeJsonParse(fields.timeline_json),
    estimatedCost: fields.cost_json ? safeJsonParse(fields.cost_json) : undefined,
    doctorModifications: safeJsonParse(fields.modifications_json),
    createdAt: fields.created_at ?? new Date().toISOString(),
    updatedAt: fields.updated_at ?? new Date().toISOString(),
  };

  const result = parseTreatmentPlan(raw);
  if (!result.success) {
    console.warn('[treatment-plan-service] Parse failed:', result.error);
    return null;
  }

  if (result.warnings.length > 0) {
    console.info('[treatment-plan-service] Parse warnings:', result.warnings);
  }

  return result.data;
}

function safeJsonParse(str: string | undefined): unknown {
  if (!str) return undefined;
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Create a new treatment plan in Airtable.
 * Returns the created plan with generated planId.
 */
export async function createPlan(
  plan: Omit<TreatmentPlanData, 'planId' | 'createdAt' | 'updatedAt'>
): Promise<TreatmentPlanData | null> {
  ensureConfig();

  const now = new Date().toISOString();
  const fullPlan: TreatmentPlanData = {
    ...plan,
    planId: generatePlanId(),
    createdAt: now,
    updatedAt: now,
  };

  const fields = planToFields(fullPlan);

  try {
    const res = await fetch(airtableUrl(), {
      method: 'POST',
      headers: airtableHeaders(),
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[treatment-plan-service] Create failed:', res.status, errBody);
      return null;
    }

    const record = await res.json() as AirtablePlanRecord;
    return fieldsToPlan(record.fields) ?? fullPlan;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[treatment-plan-service] Create error:', msg);
    return null;
  }
}

/**
 * Get a treatment plan by planId.
 */
export async function getPlanById(planId: string): Promise<TreatmentPlanData | null> {
  ensureConfig();

  const formula = `{plan_id} = '${sanitize(planId)}'`;
  const url = `${airtableUrl()}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;

  try {
    const res = await fetch(url, {
      headers: airtableHeaders(),
    });

    if (!res.ok) {
      console.error('[treatment-plan-service] Get failed:', res.status);
      return null;
    }

    const data = await res.json() as AirtableListResponse;
    if (data.records.length === 0) return null;

    return fieldsToPlan(data.records[0].fields);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[treatment-plan-service] Get error:', msg);
    return null;
  }
}

/**
 * Get all treatment plans for a patient.
 */
export async function getPlansByPatient(patientId: string): Promise<TreatmentPlanData[]> {
  ensureConfig();

  const formula = `{patient_id} = '${sanitize(patientId)}'`;
  const url = `${airtableUrl()}?filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=created_at&sort[0][direction]=desc`;

  try {
    const res = await fetch(url, {
      headers: airtableHeaders(),
    });

    if (!res.ok) {
      console.error('[treatment-plan-service] List failed:', res.status);
      return [];
    }

    const data = await res.json() as AirtableListResponse;
    const plans: TreatmentPlanData[] = [];

    for (const record of data.records) {
      const plan = fieldsToPlan(record.fields);
      if (plan) plans.push(plan);
    }

    return plans;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[treatment-plan-service] List error:', msg);
    return [];
  }
}

/**
 * Get treatment plan by reportId (one plan per report).
 */
export async function getPlanByReportId(reportId: string): Promise<TreatmentPlanData | null> {
  ensureConfig();

  const formula = `{report_id} = '${sanitize(reportId)}'`;
  const url = `${airtableUrl()}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&sort[0][field]=created_at&sort[0][direction]=desc`;

  try {
    const res = await fetch(url, {
      headers: airtableHeaders(),
    });

    if (!res.ok) return null;

    const data = await res.json() as AirtableListResponse;
    if (data.records.length === 0) return null;

    return fieldsToPlan(data.records[0].fields);
  } catch {
    return null;
  }
}

/**
 * Update a treatment plan (partial update).
 * Enforces status progression (no regression).
 */
export async function updatePlan(
  planId: string,
  updates: Partial<Pick<TreatmentPlanData, 'status' | 'timeline' | 'estimatedCost' | 'doctorId' | 'doctorModifications'>>
): Promise<TreatmentPlanData | null> {
  ensureConfig();

  // First, find the Airtable record ID
  const formula = `{plan_id} = '${sanitize(planId)}'`;
  const findUrl = `${airtableUrl()}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;

  try {
    const findRes = await fetch(findUrl, {
      headers: airtableHeaders(),
    });

    if (!findRes.ok) {
      console.error('[treatment-plan-service] Find for update failed:', findRes.status);
      return null;
    }

    const findData = await findRes.json() as AirtableListResponse;
    if (findData.records.length === 0) {
      console.warn('[treatment-plan-service] Plan not found for update:', planId);
      return null;
    }

    const record = findData.records[0];
    const existing = fieldsToPlan(record.fields);
    if (!existing) return null;

    // Enforce status progression (no regression)
    if (updates.status) {
      const currentOrder = PLAN_STATUS_ORDER[existing.status];
      const newOrder = PLAN_STATUS_ORDER[updates.status];
      if (newOrder < currentOrder) {
        console.warn(
          `[treatment-plan-service] Status regression blocked: ${existing.status} → ${updates.status}`
        );
        return null;
      }
    }

    // Build partial update fields
    const patchFields: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status) {
      patchFields.status = updates.status;
    }
    if (updates.doctorId) {
      patchFields.doctor_id = updates.doctorId;
    }
    if (updates.timeline) {
      patchFields.timeline_json = JSON.stringify(updates.timeline);
    }
    if (updates.estimatedCost) {
      patchFields.cost_json = JSON.stringify(updates.estimatedCost);
    }
    if (updates.doctorModifications) {
      // Append new modifications to existing
      const allMods = [...existing.doctorModifications, ...updates.doctorModifications];
      patchFields.modifications_json = JSON.stringify(allMods);
    }

    const patchRes = await fetch(airtableUrl(record.id), {
      method: 'PATCH',
      headers: airtableHeaders(),
      body: JSON.stringify({ fields: patchFields }),
    });

    if (!patchRes.ok) {
      const errBody = await patchRes.text();
      console.error('[treatment-plan-service] Update failed:', patchRes.status, errBody);
      return null;
    }

    const updatedRecord = await patchRes.json() as AirtablePlanRecord;
    return fieldsToPlan(updatedRecord.fields);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[treatment-plan-service] Update error:', msg);
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function sanitize(value: string): string {
  return value.replace(/'/g, "\\'");
}
