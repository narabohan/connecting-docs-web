// ═══════════════════════════════════════════════════════════════
//  useSystemStats — Phase 2 (G-5)
//  관리자 대시보드 시스템 통계 fetch hook
//  G-3 useDoctorStats 패턴 복사 → admin system-stats API용
//
//  Fetches from GET /api/admin/system-stats
//  Requires Firebase Auth token (Bearer) + admin role
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

// ─── Types ───────────────────────────────────────────────────

export interface SystemStats {
  totalUsers: number;
  todaySignups: number;
  totalReports: number;
  todayReports: number;
  totalPlans: number;
  approvalRate: number;
  emailSuccessRate: number;
  activeSessionCount: number;
}

interface SystemStatsApiResponse {
  ok: boolean;
  stats?: SystemStats;
  error?: string;
}

export interface UseSystemStatsReturn {
  stats: SystemStats;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ─── Default Stats ───────────────────────────────────────────

const DEFAULT_STATS: SystemStats = {
  totalUsers: 0,
  todaySignups: 0,
  totalReports: 0,
  todayReports: 0,
  totalPlans: 0,
  approvalRate: 0,
  emailSuccessRate: 0,
  activeSessionCount: 0,
};

// ─── Hook ────────────────────────────────────────────────────

export function useSystemStats(): UseSystemStatsReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats>(DEFAULT_STATS);
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

        const res = await fetch('/api/admin/system-stats', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = (await res.json()) as SystemStatsApiResponse;

        if (cancelled) return;

        if (data.ok && data.stats) {
          setStats(data.stats);
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

  return { stats, loading, error, refetch };
}
