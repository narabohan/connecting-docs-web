// ═══════════════════════════════════════════════════════════════
//  /dashboard/admin/emails — Phase 2 (G-5)
//  관리자 이메일 로그 페이지
//
//  withRoleGuard('admin') — admin 전용
//  G-4 /api/email/log API 소비
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { withRoleGuard } from '@/lib/withRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { AdminDashboardLayout } from '@/components/dashboard/admin/AdminDashboardLayout';
import { EmailLog } from '@/components/dashboard/admin/EmailLog';

// ─── Types ───────────────────────────────────────────────────

interface EmailLogEntry {
  id: string;
  emailId: string;
  recipient: string;
  template: string;
  locale: string;
  status: string;
  sentAt: string;
  error: string;
  retryCount: number;
  createdAt: string;
}

interface EmailLogApiResponse {
  ok: boolean;
  logs?: EmailLogEntry[];
  error?: string;
}

// ─── Page Component ──────────────────────────────────────────

function AdminEmailsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

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

      const res = await fetch('/api/email/log?limit=100', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const data = (await res.json()) as EmailLogApiResponse;

      if (data.ok && data.logs) {
        setLogs(data.logs);
      } else {
        setError(data.error ?? 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email logs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await fetchLogs();
    };

    if (!cancelled) run();
    return () => { cancelled = true; };
  }, [fetchLogs, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <>
      <Head>
        <title>Email Log — ConnectingDocs Admin</title>
      </Head>

      <AdminDashboardLayout title="Email Log">
        <EmailLog
          logs={logs}
          loading={loading}
          error={error}
          onRefresh={handleRefresh}
        />
      </AdminDashboardLayout>
    </>
  );
}

export default withRoleGuard(AdminEmailsPage, ['admin']);
