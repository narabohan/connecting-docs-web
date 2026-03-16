// ═══════════════════════════════════════════════════════════════
//  apiRoleGuard — Phase 1 (C-2)
//  API 라우트용 서버-사이드 역할 기반 접근 제어 미들웨어
//
//  사용법:
//    async function handler(req, res) { ... }
//    export default apiRoleGuard(handler, ['doctor', 'admin'])
//
//  인증 흐름:
//    1. Authorization: Bearer <Firebase ID Token> 헤더에서 토큰 추출
//    2. Firebase Admin SDK로 토큰 검증 → UID 추출
//    3. Custom Claims에서 role 읽기 (있으면)
//    4. Claims에 role 없으면 → Airtable Users 테이블에서 role 조회
//    5. role이 allowedRoles에 포함 → handler 실행
//    6. 미인증 → 401, 권한 없음 → 403
//
//  참조: MASTER_PLAN_V4.md §1 (3-Actor 모델)
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyIdToken, isAdminConfigured } from '@/lib/firebaseAdmin';
import type { UserRole } from '@/types/auth';

// ─── Airtable Config (fallback role lookup) ──────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// ─── Types ───────────────────────────────────────────────────

export interface AuthenticatedRequest extends NextApiRequest {
  /** Authenticated user's Firebase UID */
  authUid: string;
  /** Authenticated user's email */
  authEmail: string;
  /** Authenticated user's role from Firebase Claims or Airtable */
  authRole: UserRole;
}

interface ApiErrorResponse {
  error: string;
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'AUTH_CONFIG_ERROR';
}

type ApiHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

// ─── Helpers ─────────────────────────────────────────────────

function sanitizeForFormula(value: string): string {
  return value.replace(/'/g, "\\'");
}

/**
 * Look up user role from Airtable Users table by firebase_uid.
 * Used as fallback when Firebase Custom Claims don't contain role.
 */
async function lookupRoleFromAirtable(firebaseUid: string): Promise<UserRole | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('[apiRoleGuard] Airtable not configured for role lookup');
    return null;
  }

  const formula = `{firebase_uid} = '${sanitizeForFormula(firebaseUid)}'`;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Users')}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&fields[]=role`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!res.ok) {
      console.error('[apiRoleGuard] Airtable lookup failed:', res.status);
      return null;
    }

    interface AirtableRoleRecord {
      id: string;
      fields: { role?: string };
    }

    const data = await res.json() as { records: AirtableRoleRecord[] };
    if (data.records.length === 0) return null;

    const role = data.records[0].fields.role;
    if (role === 'patient' || role === 'doctor' || role === 'admin') {
      return role;
    }

    return 'patient'; // default if role field is missing or invalid
  } catch (err) {
    console.error('[apiRoleGuard] Airtable role lookup error:', err);
    return null;
  }
}

// ─── Main Guard ──────────────────────────────────────────────

/**
 * Wrap an API handler with role-based access control.
 *
 * @param handler - The API handler to protect
 * @param allowedRoles - Roles that can access this endpoint
 *
 * @example
 *   async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
 *     // req.authUid, req.authEmail, req.authRole are available
 *   }
 *   export default apiRoleGuard(handler, ['doctor', 'admin']);
 */
export function apiRoleGuard(
  handler: ApiHandler,
  allowedRoles: readonly UserRole[]
) {
  return async function guardedHandler(
    req: NextApiRequest,
    res: NextApiResponse<ApiErrorResponse | Record<string, unknown>>
  ): Promise<void> {
    // ── 1. Extract Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required. Provide Authorization: Bearer <token>',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const idToken = authHeader.slice(7); // Remove "Bearer "

    // ── 2. Verify token with Firebase Admin
    if (!isAdminConfigured()) {
      console.error('[apiRoleGuard] Firebase Admin SDK not configured');
      res.status(500).json({
        error: 'Server authentication not configured',
        code: 'AUTH_CONFIG_ERROR',
      });
      return;
    }

    const claims = await verifyIdToken(idToken);
    if (!claims) {
      res.status(401).json({
        error: 'Invalid or expired authentication token',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // ── 3. Determine role: Custom Claims → Airtable fallback
    let userRole: UserRole | null = claims.role ?? null;

    if (!userRole) {
      // Firebase Custom Claims don't have role yet → check Airtable
      userRole = await lookupRoleFromAirtable(claims.uid);
    }

    if (!userRole) {
      // No role found anywhere — default to patient (least privilege)
      userRole = 'patient';
    }

    // ── 4. Check authorization
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`,
        code: 'FORBIDDEN',
      });
      return;
    }

    // ── 5. Attach auth info to request and call handler
    const authReq = req as AuthenticatedRequest;
    authReq.authUid = claims.uid;
    authReq.authEmail = claims.email ?? '';
    authReq.authRole = userRole;

    return handler(authReq, res);
  };
}
