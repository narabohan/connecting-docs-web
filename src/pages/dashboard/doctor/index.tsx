// ═══════════════════════════════════════════════════════════════
//  /dashboard/doctor — Phase 2 (G-3)
//  의사 대시보드 메인 페이지
//
//  withRoleGuard('doctor') 적용 — doctor + admin 접근 허용
//  태블릿(768px+) 우선 설계
// ═══════════════════════════════════════════════════════════════

import Head from 'next/head';
import { withRoleGuard } from '@/lib/withRoleGuard';
import { DoctorDashboardLayout } from '@/components/dashboard/doctor/DoctorDashboardLayout';
import { DoctorOverview } from '@/components/dashboard/doctor/DoctorOverview';
import { PatientQueue } from '@/components/dashboard/doctor/PatientQueue';
import { useDoctorStats } from '@/hooks/useDoctorStats';

// ─── Page Component ──────────────────────────────────────────

function DoctorDashboardPage() {
  const { stats, plans, loading, error, refetch } = useDoctorStats();

  return (
    <>
      <Head>
        <title>Doctor Dashboard — ConnectingDocs</title>
        <meta name="description" content="ConnectingDocs 의사 대시보드 — 환자 관리 및 Treatment Plan 승인" />
      </Head>

      <DoctorDashboardLayout title="Dashboard Overview">
        <div className="space-y-6">
          {/* Overview Stats (Task 2) */}
          <DoctorOverview
            stats={stats}
            loading={loading}
            error={error}
            onRefresh={refetch}
          />

          {/* Patient Queue (Task 3) */}
          <PatientQueue plans={plans} loading={loading} />
        </div>
      </DoctorDashboardLayout>
    </>
  );
}

// ─── Export with Role Guard ──────────────────────────────────
export default withRoleGuard(DoctorDashboardPage, ['doctor', 'admin']);
