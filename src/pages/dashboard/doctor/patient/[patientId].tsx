// ═══════════════════════════════════════════════════════════════
//  /dashboard/doctor/patient/[patientId] — Phase 2 (G-3)
//  환자 상세 페이지 (planId 기반 라우팅)
//
//  PatientQueue에서 planId로 링크됨
//  withRoleGuard('doctor') 적용 — doctor + admin 접근 허용
//  태블릿(768px+) 우선 설계
//
//  Layout: 2-column on desktop (PatientDetail + PlanEditor sidebar)
//          Stacked on mobile (PatientDetail → PlanEditor)
// ═══════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { withRoleGuard } from '@/lib/withRoleGuard';
import { DoctorDashboardLayout } from '@/components/dashboard/doctor/DoctorDashboardLayout';
import { PatientDetail } from '@/components/dashboard/doctor/PatientDetail';
import { PlanEditor } from '@/components/dashboard/doctor/PlanEditor';
import { usePatientDetail } from '@/hooks/usePatientDetail';
import type { TreatmentPlanData } from '@/schemas/treatment-plan';

// ─── Page Component ──────────────────────────────────────────

function PatientDetailPage() {
  const router = useRouter();
  const { patientId } = router.query;
  const planId = typeof patientId === 'string' ? patientId : undefined;

  const { plan, loading, error, refetch } = usePatientDetail(planId);

  // When PlanEditor updates the plan, refetch to get fresh data
  const handlePlanUpdate = useCallback(
    (_updated: TreatmentPlanData) => {
      refetch();
    },
    [refetch],
  );

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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content: Patient Detail (read-only) */}
          <div className="flex-1 min-w-0">
            <PatientDetail
              plan={plan}
              loading={loading}
              error={error}
              onRefresh={refetch}
            />
          </div>

          {/* Sidebar: PlanEditor (actions) — only show when plan is loaded */}
          {plan && !loading && !error && (
            <div className="lg:w-80 lg:shrink-0">
              <div className="lg:sticky lg:top-6">
                <PlanEditor
                  plan={plan}
                  onPlanUpdate={handlePlanUpdate}
                />
              </div>
            </div>
          )}
        </div>
      </DoctorDashboardLayout>
    </>
  );
}

// ─── Export with Role Guard ──────────────────────────────────
export default withRoleGuard(PatientDetailPage, ['doctor', 'admin']);
