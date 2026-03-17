// ═══════════════════════════════════════════════════════════════
//  usePlanEditor — Phase 2 (G-3)
//  Treatment Plan PATCH hook for doctor approval flow
//
//  Calls PATCH /api/treatment-plan/[planId]
//  Handles: status change, doctor notes, modification logging
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { PlanStatus, TreatmentPlanData } from '@/schemas/treatment-plan';
import { PLAN_STATUS_ORDER } from '@/schemas/treatment-plan';

// ─── Types ───────────────────────────────────────────────────

interface PatchPayload {
  status?: PlanStatus;
  doctorNote?: string;
}

interface PlanApiResponse {
  ok: boolean;
  plan?: TreatmentPlanData;
  error?: string;
  code?: string;
}

export interface UsePlanEditorReturn {
  updating: boolean;
  updateError: string | null;
  updateSuccess: boolean;
  updateStatus: (planId: string, newStatus: PlanStatus, doctorNote?: string) => Promise<TreatmentPlanData | null>;
  clearUpdateState: () => void;
  canTransition: (currentStatus: PlanStatus, targetStatus: PlanStatus) => boolean;
  getNextStatus: (currentStatus: PlanStatus) => PlanStatus | null;
}

// ─── Get Firebase Token ──────────────────────────────────────

async function getFirebaseToken(): Promise<string> {
  if (typeof window === 'undefined') return '';
  const { getAuth } = await import('firebase/auth');
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) return '';
  return currentUser.getIdToken();
}

// ─── Hook ────────────────────────────────────────────────────

export function usePlanEditor(): UsePlanEditorReturn {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const clearUpdateState = useCallback(() => {
    setUpdateError(null);
    setUpdateSuccess(false);
  }, []);

  /**
   * Check if a status transition is valid (no regression)
   */
  const canTransition = useCallback(
    (currentStatus: PlanStatus, targetStatus: PlanStatus): boolean => {
      return PLAN_STATUS_ORDER[targetStatus] > PLAN_STATUS_ORDER[currentStatus];
    },
    [],
  );

  /**
   * Get the next logical status in the flow
   */
  const getNextStatus = useCallback(
    (currentStatus: PlanStatus): PlanStatus | null => {
      switch (currentStatus) {
        case 'draft':
          return 'doctor_review';
        case 'doctor_review':
          return 'approved';
        case 'approved':
          return 'sent';
        case 'sent':
          return null; // Terminal state
        default:
          return null;
      }
    },
    [],
  );

  /**
   * Call PATCH /api/treatment-plan/[planId] to update status
   */
  const updateStatus = useCallback(
    async (
      planId: string,
      newStatus: PlanStatus,
      doctorNote?: string,
    ): Promise<TreatmentPlanData | null> => {
      if (!user) {
        setUpdateError('Not authenticated');
        return null;
      }

      setUpdating(true);
      setUpdateError(null);
      setUpdateSuccess(false);

      try {
        const token = await getFirebaseToken();

        const payload: PatchPayload = {
          status: newStatus,
        };
        if (doctorNote) {
          payload.doctorNote = doctorNote;
        }

        const res = await fetch(`/api/treatment-plan/${encodeURIComponent(planId)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const data = (await res.json()) as PlanApiResponse;

        if (!res.ok || !data.ok) {
          const errMsg = data.error ?? `Status update failed (${res.status})`;
          setUpdateError(errMsg);
          return null;
        }

        setUpdateSuccess(true);
        return data.plan ?? null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update plan';
        setUpdateError(msg);
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [user],
  );

  return {
    updating,
    updateError,
    updateSuccess,
    updateStatus,
    clearUpdateState,
    canTransition,
    getNextStatus,
  };
}
