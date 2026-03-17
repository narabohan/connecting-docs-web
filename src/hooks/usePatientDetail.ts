// ═══════════════════════════════════════════════════════════════
//  usePatientDetail — Phase 2 (G-3)
//  환자 상세 페이지 데이터 fetch hook
//
//  Fetches from GET /api/treatment-plan/[planId]
//  Requires Firebase Auth token (Bearer)
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { TreatmentPlanData } from '@/schemas/treatment-plan';

// ─── Types ───────────────────────────────────────────────────

interface PlanApiResponse {
  ok: boolean;
  plan?: TreatmentPlanData;
  error?: string;
  code?: string;
}

export interface UsePatientDetailReturn {
  plan: TreatmentPlanData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ─── Hook ────────────────────────────────────────────────────

export function usePatientDetail(planId: string | undefined): UsePatientDetailReturn {
  const { user } = useAuth();
  const [plan, setPlan] = useState<TreatmentPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!user || !planId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchPlan = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get Firebase ID token for auth
        let token = '';
        if (typeof window !== 'undefined') {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          const currentUser = auth.currentUser;
          if (currentUser) {
            token = await currentUser.getIdToken();
          }
        }

        const res = await fetch(`/api/treatment-plan/${encodeURIComponent(planId)}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Treatment plan not found');
          }
          if (res.status === 403) {
            throw new Error('Access denied');
          }
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = (await res.json()) as PlanApiResponse;

        if (cancelled) return;

        if (data.ok && data.plan) {
          setPlan(data.plan);
        } else {
          setError(data.error ?? 'Unknown error');
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load patient detail';
        setError(msg);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPlan();

    return () => {
      cancelled = true;
    };
  }, [user, planId, fetchTrigger]);

  return { plan, loading, error, refetch };
}
