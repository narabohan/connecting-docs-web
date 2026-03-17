// ═══════════════════════════════════════════════════════════════
//  /dashboard/admin/reports — Phase 2 (G-5)
//  관리자 리포트 브라우저 페이지
//
//  withRoleGuard('admin') — admin 전용
//  Fetches reports from /api/admin/reports
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withRoleGuard } from '@/lib/withRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { AdminDashboardLayout } from '@/components/dashboard/admin/AdminDashboardLayout';
import { ReportBrowser } from '@/components/dashboard/admin/ReportBrowser';

// ─── Types ───────────────────────────────────────────────────

interface AdminReport {
  id: string;
  date: string;
  status: string;
  title: string;
  primaryGoal: string;
  skinType: string;
  topRecommendation: string;
  matchScore: number | null;
}

interface ReportsApiResponse {
  ok: boolean;
  reports?: AdminReport[];
  error?: string;
}

// ─── Page Component ──────────────────────────────────────────

function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchReports = async () => {
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

        const res = await fetch('/api/admin/reports', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

        const data = (await res.json()) as ReportsApiResponse;
        if (cancelled) return;

        if (data.ok && data.reports) {
          setReports(data.reports);
        } else {
          setError(data.error ?? 'Unknown error');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load reports');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReports();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <>
      <Head>
        <title>Reports — ConnectingDocs Admin</title>
      </Head>

      <AdminDashboardLayout title="Report Browser">
        <ReportBrowser
          reports={reports}
          loading={loading}
          error={error}
        />
      </AdminDashboardLayout>
    </>
  );
}

export default withRoleGuard(AdminReportsPage, ['admin']);
