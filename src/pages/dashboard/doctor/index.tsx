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

// ─── Page Component ──────────────────────────────────────────

function DoctorDashboardPage() {
  return (
    <>
      <Head>
        <title>Doctor Dashboard — ConnectingDocs</title>
        <meta name="description" content="ConnectingDocs 의사 대시보드 — 환자 관리 및 Treatment Plan 승인" />
      </Head>

      <DoctorDashboardLayout title="Dashboard Overview">
        {/* Overview stats and patient queue will be added in Tasks 2-3 */}
        <div className="space-y-6">
          {/* Placeholder: DoctorOverview (Task 2) */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {['Today\'s Patients', 'Pending Plans', 'Approved', 'Total Patients'].map((label) => (
              <div
                key={label}
                className="bg-[#12121f] border border-white/10 rounded-xl p-5 flex flex-col gap-2"
              >
                <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
                <span className="text-2xl font-bold text-white">—</span>
              </div>
            ))}
          </section>

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
