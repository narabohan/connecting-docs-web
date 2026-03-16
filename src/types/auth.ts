// ═══════════════════════════════════════════════════════════════
//  Auth Type Definitions — Phase 1 (C-2)
//  3-Actor 모델: patient | doctor | admin
//  참조: MASTER_PLAN_V4.md §1 (경로/권한 분리)
// ═══════════════════════════════════════════════════════════════

/** 3-Actor role model for access control */
export type UserRole = 'patient' | 'doctor' | 'admin';

/**
 * Route access matrix:
 *   patient → /survey-v2, /report-v2/*
 *   doctor  → /doctor/*, + patient routes
 *   admin   → /admin/*, + doctor routes, + patient routes
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  patient: 0,
  doctor: 1,
  admin: 2,
} as const;

/** Decoded Firebase token claims relevant to auth */
export interface FirebaseTokenClaims {
  uid: string;
  email: string | undefined;
  role?: UserRole;
}
