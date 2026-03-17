// ═══════════════════════════════════════════════════════════════
//  /dashboard/admin — Phase 2 (G-5)
//  관리자 대시보드 메인 페이지
//
//  withRoleGuard('admin') 적용 — admin 전용 접근
//  G-3 의사 대시보드 패턴 기반
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import Head from 'next/head';
import { withRoleGuard } from '@/lib/withRoleGuard';
import { AdminDashboardLayout } from '@/components/dashboard/admin/AdminDashboardLayout';
import { SystemMetrics } from '@/components/dashboard/admin/SystemMetrics';
import { useSystemStats } from '@/hooks/useSystemStats';

// ─── Page Component ──────────────────────────────────────────

function AdminDashboardPage() {
  const { stats, loading, error, refetch } = useSystemStats();

  return (
    <>
      <Head>
        <title>Admin Dashboard — ConnectingDocs</title>
        <meta name="description" content="ConnectingDocs 관리자 대시보드 — 시스템 모니터링 및 사용자 관리" />
      </Head>

      <AdminDashboardLayout title="System Overview">
        <div className="space-y-6">
          <SystemMetrics
            stats={stats}
            loading={loading}
            error={error}
            onRefresh={refetch}
          />
        </div>
      </AdminDashboardLayout>
    </>
  );
}

// ─── Export with Role Guard ──────────────────────────────────
// admin ONLY — doctors and patients cannot access
export default withRoleGuard(AdminDashboardPage, ['admin']);
