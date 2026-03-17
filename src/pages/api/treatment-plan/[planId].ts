// ═══════════════════════════════════════════════════════════════
//  GET/PATCH /api/treatment-plan/[planId]
//  Phase 2 (G-2): Retrieve and update Treatment Plans
//
//  Auth:
//    GET  — patient (own plan) or doctor (assigned) or admin
//    PATCH — doctor (assigned) or admin only
//
//  PATCH supports:
//    - status change (no regression: draft → doctor_review → approved → sent)
//    - timeline modification
//    - cost modification
//    - doctor notes/modifications log
//
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { NextApiResponse } from 'next';
import { apiRoleGuard, type AuthenticatedRequest } from '@/lib/apiRoleGuard';
import {
  PatchPlanRequestSchema,
  type TreatmentPlanData,
  type DoctorModification,
} from '@/schemas/treatment-plan';
import {
  getPlanById,
  updatePlan,
} from '@/services/treatment-plan-service';
import { sendEmailFireAndForget } from '@/services/email-service';
import { lookupUserByUid } from '@/services/user-email-lookup';

// ─── Types ───────────────────────────────────────────────────

interface PlanSuccessResponse {
  ok: true;
  plan: TreatmentPlanData;
}

interface PlanErrorResponse {
  ok: false;
  error: string;
  code: 'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'UPDATE_FAILED' | 'METHOD_NOT_ALLOWED';
}

type PlanResponse = PlanSuccessResponse | PlanErrorResponse;

// ─── Handler ─────────────────────────────────────────────────

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<PlanResponse>
): Promise<void> {
  const { planId } = req.query;

  if (typeof planId !== 'string' || !planId) {
    res.status(400).json({
      ok: false,
      error: 'Missing planId parameter',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  if (req.method === 'GET') {
    return handleGet(req, res, planId);
  }

  if (req.method === 'PATCH') {
    return handlePatch(req, res, planId);
  }

  res.setHeader('Allow', 'GET, PATCH');
  res.status(405).json({
    ok: false,
    error: `Method ${req.method ?? 'unknown'} not allowed`,
    code: 'METHOD_NOT_ALLOWED',
  });
}

// ─── GET Handler ─────────────────────────────────────────────

async function handleGet(
  req: AuthenticatedRequest,
  res: NextApiResponse<PlanResponse>,
  planId: string
): Promise<void> {
  const plan = await getPlanById(planId);

  if (!plan) {
    res.status(404).json({
      ok: false,
      error: `Treatment plan not found: ${planId}`,
      code: 'NOT_FOUND',
    });
    return;
  }

  // Access control: patient can only see own plans
  if (req.authRole === 'patient' && plan.patientId !== req.authUid) {
    res.status(403).json({
      ok: false,
      error: 'You can only view your own treatment plans',
      code: 'FORBIDDEN',
    });
    return;
  }

  // Doctor can only see assigned plans
  if (req.authRole === 'doctor' && plan.doctorId && plan.doctorId !== req.authUid) {
    res.status(403).json({
      ok: false,
      error: 'You can only view treatment plans assigned to you',
      code: 'FORBIDDEN',
    });
    return;
  }

  res.status(200).json({ ok: true, plan });
}

// ─── Email Trigger (fire-and-forget) ─────────────────────────

/**
 * Send 'plan-approved' notification to the patient.
 * Best-effort: never blocks, never throws, silently skips
 * if patient email cannot be resolved.
 */
function triggerPlanApprovedEmail(
  plan: TreatmentPlanData,
  doctorUid: string,
): void {
  if (!plan.patientId) return;

  void (async () => {
    const [patient, doctor] = await Promise.all([
      lookupUserByUid(plan.patientId),
      lookupUserByUid(doctorUid),
    ]);
    if (!patient) return;

    sendEmailFireAndForget({
      recipient: patient.email,
      recipientName: patient.name,
      template: 'plan-approved',
      locale: 'KO', // Default; patient locale could be resolved from CRM in future
      data: {
        patientName: patient.name,
        planId: plan.planId,
        planUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/patient/plans/${plan.planId}`,
        doctorName: doctor?.name ?? '',
      },
    });
  })().catch(() => {
    // Absolute safety net — never propagate
  });
}

// ─── PATCH Handler ───────────────────────────────────────────

async function handlePatch(
  req: AuthenticatedRequest,
  res: NextApiResponse<PlanResponse>,
  planId: string
): Promise<void> {
  // Only doctors and admins can modify plans
  if (req.authRole === 'patient') {
    res.status(403).json({
      ok: false,
      error: 'Only doctors can modify treatment plans',
      code: 'FORBIDDEN',
    });
    return;
  }

  // Validate request body
  const parseResult = PatchPlanRequestSchema.safeParse(req.body);
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

  const patchData = parseResult.data;

  // Check plan exists and doctor is assigned
  const existing = await getPlanById(planId);
  if (!existing) {
    res.status(404).json({
      ok: false,
      error: `Treatment plan not found: ${planId}`,
      code: 'NOT_FOUND',
    });
    return;
  }

  // Doctor assignment check (admin bypasses)
  if (
    req.authRole === 'doctor' &&
    existing.doctorId &&
    existing.doctorId !== req.authUid
  ) {
    res.status(403).json({
      ok: false,
      error: 'This plan is assigned to another doctor',
      code: 'FORBIDDEN',
    });
    return;
  }

  // Build modification log entries
  const newMods: DoctorModification[] = patchData.modifications ?? [];
  if (patchData.status && patchData.status !== existing.status) {
    newMods.push({
      doctorId: req.authUid,
      modifiedAt: new Date().toISOString(),
      field: 'status',
      previousValue: existing.status,
      newValue: patchData.status,
      reason: patchData.doctorNote ?? '',
    });
  }

  // Apply update
  const updated = await updatePlan(planId, {
    status: patchData.status,
    timeline: patchData.timeline,
    estimatedCost: patchData.estimatedCost,
    doctorId: req.authUid,
    doctorModifications: newMods.length > 0 ? newMods : undefined,
  });

  if (!updated) {
    res.status(500).json({
      ok: false,
      error: 'Failed to update treatment plan (check status progression)',
      code: 'UPDATE_FAILED',
    });
    return;
  }

  // Fire-and-forget: notify patient when plan is approved or sent
  if (patchData.status === 'approved' || patchData.status === 'sent') {
    triggerPlanApprovedEmail(updated, req.authUid);
  }

  res.status(200).json({ ok: true, plan: updated });
}

// ─── Export with role guard ──────────────────────────────────
// All three roles can access, specific permissions checked inside handlers
export default apiRoleGuard(handler, ['patient', 'doctor', 'admin']);
