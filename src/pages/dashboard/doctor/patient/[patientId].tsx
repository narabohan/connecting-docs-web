// ═══════════════════════════════════════════════════════════════
//  /dashboard/doctor/patient/[patientId] — Phase 2 (G-3)
//  환자 상세 페이지 (planId 기반 라우팅)
//
//  PatientQueue에서 planId로 링크됨
//  withRoleGuard('doctor') 적용 — doctor + admin 접근 허용
//  태블릿(768px+) 우선 설계
// ═══════════════════════════════════════════════════════════════

import Head from 'next/head';
import { useRouter } from 'next/router';
import { withRoleGuard } from '@/lib/withRoleGuard';
import { DoctorDashboardLayout } from '@/components/dashboard/doctor/DoctorDashboardLayout';
import { PatientDetail } from '@/components/dashboard/doctor/PatientDetail';
import { usePatientDetail } from '@/hooks/usePatientDetail';

// ─── Page Component ──────────────────────────────────────────

function PatientDetailPage() {
  const router = useRouter();
  const { patientId } = router.query;
  const planId = typeof patientId === 'string' ? patientId : undefined;

  const { plan, loading, error, refetch } = usePatientDetail(planId);

  const pageTitle = plan
    ? `${plan.patientId || plan.planId} — Doctor Dashboard`
    : 'Patient Detail — Doctor Dashboard';

  return (
    <>
      <Head>
        <title>{pageTitle} — ConnectingDocs</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="ConnectingDocs 환자 상세 — Treatment Plan 확인 및 관리" />
      </Head>

      <DoctorDashboardLayout title="Patient Detail">
        <PatientDetail
          plan={plan}
          loading={loading}
          error={error}
          onRefresh={refetch}
        />
      </DoctorDashboardLayout>
    </>
  );
}

// ─── Export with Role Guard ──────────────────────────────────
export default withRoleGuard(PatientDetailPage, ['doctor', 'admin']);
