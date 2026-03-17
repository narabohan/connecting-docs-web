// ═══════════════════════════════════════════════════════════════
//  useDoctorStats — Phase 2 (G-3)
//  의사 대시보드 통계 데이터 fetch hook
//
//  Fetches from GET /api/treatment-plan/doctor-stats
//  Requires Firebase Auth token (Bearer)
//  Auto-refreshes on mount + manual refetch
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { PlanStatus } from '@/schemas/treatment-plan';

// ─── Types ───────────────────────────────────────────────────

export interface DoctorStats {
  todayCount: number;
  pendingCount: number;
  approvedCount: number;
  sentCount: number;
  totalCount: number;
}

export interface PlanSummary {
  planId: string;
  reportId: string;
  patientId: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  patientAge: string;
  patientCountry: string;
  patientGoal: string;
  concernCount: number;
  phaseCount: number;
}

interface DoctorStatsApiResponse {
  ok: boolean;
  stats?: DoctorStats;
  plans?: PlanSummary[];
  error?: string;
}

export interface UseDoctorStatsReturn {
  stats: DoctorStats;
  plans: PlanSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ─── Default Stats ───────────────────────────────────────────

const DEFAULT_STATS: DoctorStats = {
  todayCount: 0,
  pendingCount: 0,
  approvedCount: 0,
  sentCount: 0,
  totalCount: 0,
};

// ─── Hook ────────────────────────────────────────────────────

export function useDoctorStats(): UseDoctorStatsReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<DoctorStats>(DEFAULT_STATS);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchStats = async () => {
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

        const res = await fetch('/api/treatment-plan/doctor-stats', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json() as DoctorStatsApiResponse;

        if (cancelled) return;

        if (data.ok && data.stats) {
          setStats(data.stats);
          setPlans(data.plans ?? []);
        } else {
          setError(data.error ?? 'Unknown error');
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load stats';
        setError(msg);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, [user, fetchTrigger]);

  return { stats, plans, loading, error, refetch };
}
