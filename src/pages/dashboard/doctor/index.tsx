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
import { useDoctorStats } from '@/hooks/useDoctorStats';

// ─── Page Component ──────────────────────────────────────────

function DoctorDashboardPage() {
  const { stats, loading, error, refetch } = useDoctorStats();

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

          {/* Placeholder: PatientQueue (Task 3) */}
          <section className="bg-[#12121f] border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Patient Queue</h2>
            <div className="text-center py-12 text-gray-500 text-sm">
              Patient queue will appear here.
            </div>
          </section>
        </div>
      </DoctorDashboardLayout>
    </>
  );
}

// ─── Export with Role Guard ──────────────────────────────────
export default withRoleGuard(DoctorDashboardPage, ['doctor', 'admin']);
