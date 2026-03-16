// ═══════════════════════════════════════════════════════════════
//  withRoleGuard — Phase 1 (C-2)
//  범용 클라이언트-사이드 역할 기반 접근 제어 HOC
//
//  사용법:
//    export default withRoleGuard(DoctorDashboard, ['doctor', 'admin'])
//    export default withRoleGuard(AdminPage, ['admin'])
//
//  로직:
//    1. Firebase Auth 로딩 중 → 스피너
//    2. 미로그인 → /login?returnUrl=현재경로
//    3. role 불일치 → /unauthorized
//    4. role 일치 → 원본 컴포넌트 렌더
//
//  참조: MASTER_PLAN_V4.md §1 (3-Actor 모델)
//  금지: 환자 경로(설문, 리포트)에 적용하지 마라
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

/** Props passed through to the wrapped component */
export interface RoleGuardConfig {
  /** Roles allowed to access this page */
  allowedRoles: readonly UserRole[];
}

/**
 * HOC that wraps a page component with role-based access control.
 *
 * @param WrappedComponent - The page component to protect
 * @param allowedRoles - Array of roles that can access this page
 *
 * @example
 *   // Doctor + Admin can access
 *   export default withRoleGuard(WaitlistPage, ['doctor', 'admin']);
 *
 *   // Admin only
 *   export default withRoleGuard(AdminReports, ['admin']);
 */
export function withRoleGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: readonly UserRole[]
) {
  function RoleGuardedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) return;

      if (!user) {
        // Not authenticated → redirect to login with returnUrl
        const returnUrl = encodeURIComponent(router.asPath);
        router.replace(`/login?returnUrl=${returnUrl}`);
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        // Authenticated but wrong role → unauthorized page
        router.replace('/unauthorized');
      }
    }, [user, loading, router]);

    // ── Loading state
    if (loading) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      );
    }

    // ── Not yet authorized (redirect in progress)
    if (!user || !allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      );
    }

    // ── Authorized → render the page
    return <WrappedComponent {...props} />;
  }

  // Preserve display name for React DevTools
  const wrappedName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  RoleGuardedComponent.displayName = `withRoleGuard(${wrappedName})`;

  return RoleGuardedComponent;
}
