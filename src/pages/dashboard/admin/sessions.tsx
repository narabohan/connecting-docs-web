// ═══════════════════════════════════════════════════════════════
//  /dashboard/admin/sessions — Phase 2 (G-5)
//  관리자 세션 로그 페이지
//
//  withRoleGuard('admin') — admin 전용
//  Fetches sessions from /api/admin/sessions
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withRoleGuard } from '@/lib/withRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { AdminDashboardLayout } from '@/components/dashboard/admin/AdminDashboardLayout';
import { SessionLog } from '@/components/dashboard/admin/SessionLog';

// ─── Types ───────────────────────────────────────────────────

interface AdminSession {
  id: string;
  runId: string;
  createdAt: string;
  country: string;
  language: string;
  aestheticGoal: string;
  hasDangerFlag: boolean;
  topDevice: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  completed: boolean;
}

interface SessionsApiResponse {
  ok: boolean;
  sessions?: AdminSession[];
  error?: string;
}

// ─── Page Component ──────────────────────────────────────────

function AdminSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSessions = async () => {
      setLoading(true);
      setError(null);

      try {
        let token = '';
        if (typeof window !== 'undefined') {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          const currentUser = auth.currentUser;
          if (currentUser) {
            token = await currentUser.getIdToken();
          }
        }

        const res = await fetch('/api/admin/sessions', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

        const data = (await res.json()) as SessionsApiResponse;
        if (cancelled) return;

        if (data.ok && data.sessions) {
          setSessions(data.sessions);
        } else {
          setError(data.error ?? 'Unknown error');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSessions();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <>
      <Head>
        <title>Sessions — ConnectingDocs Admin</title>
      </Head>

      <AdminDashboardLayout title="Session Log">
        <SessionLog
          sessions={sessions}
          loading={loading}
          error={error}
        />
      </AdminDashboardLayout>
    </>
  );
}

export default withRoleGuard(AdminSessionsPage, ['admin']);
