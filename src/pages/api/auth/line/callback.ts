// ═══════════════════════════════════════════════════════════════
//  GET /api/auth/line/callback — Phase 2 (G-6)
//  Line OAuth Step 2: Exchange code → tokens → Firebase Custom Token
//  참조: MASTER_PLAN_V4.md §7 (글로벌 소셜 로그인, Custom Token 방식)
//
//  Flow:
//    Line → GET /api/auth/line/callback?code=xxx&state=yyy
//    1. code → POST api.line.me/oauth2/v2.1/token → access_token
//    2. access_token → GET api.line.me/v2/profile → user info
//    3. Firebase Admin → createCustomToken(line_{userId})
//    4. CRM → findOrCreateUser({ email })
//    5. redirect → /auth/callback?token={customToken}&provider=line
//
//  Kakao callback.ts 패턴 복사 → Line API 스펙 교체
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import { createCustomToken } from '@/lib/firebaseAdmin';
import { findOrCreateUser } from '@/services/crm-service';
import {
  getConfig,
  parseState,
  exchangeCodeForToken,
  getProfile,
} from '@/lib/auth/line-provider';

// ─── Handler ─────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error: lineError, error_description: lineErrorDesc } = req.query;

  // ── Line returned an error
  if (lineError) {
    console.error('[line/callback] Line auth error:', lineError, lineErrorDesc);
    return res.redirect(302, '/login?error=line_denied');
  }

  if (typeof code !== 'string') {
    return res.redirect(302, '/login?error=line_missing_code');
  }

  const config = getConfig();
  if (!config) {
    console.error('[line/callback] Missing Line env vars');
    return res.redirect(302, '/login?error=line_not_configured');
  }

  // Parse returnUrl from state
  const stateStr = typeof state === 'string' ? state : '';
  const { returnUrl } = parseState(stateStr);

  try {
    // ── Step 1: Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(code);

    // ── Step 2: Get user profile from Line
    const lineProfile = await getProfile(tokenData.access_token);

    const lineUserId = lineProfile.userId;
    const displayName = lineProfile.displayName ?? null;

    // Line email is available in id_token (OpenID Connect)
    // Parse email from id_token if present
    let email: string | null = null;
    if (tokenData.id_token) {
      try {
        // id_token is a JWT — decode payload (base64) without verification
        // (token was just received from Line over HTTPS)
        const payloadB64 = tokenData.id_token.split('.')[1];
        if (payloadB64) {
          const payload = JSON.parse(
            Buffer.from(payloadB64, 'base64').toString('utf-8'),
          ) as { email?: string };
          email = payload.email ?? null;
        }
      } catch {
        // email extraction is best-effort
      }
    }

    // ── Step 3: Create Firebase Custom Token
    const firebaseUid = `line_${lineUserId}`;
    const customToken = await createCustomToken(firebaseUid, { role: 'patient' });

    if (!customToken) {
      console.error('[line/callback] Failed to create custom token');
      return res.redirect(302, '/login?error=firebase_token_failed');
    }

    // ── Step 4: CRM integration (best-effort)
    try {
      await findOrCreateUser({
        email: email ?? undefined,
        firebase_uid: firebaseUid,
        country: 'JP',
        lang: 'JP',
      });
    } catch (crmErr) {
      console.error('[line/callback] CRM sync failed (non-blocking):', crmErr);
    }

    // ── Step 5: Redirect to client callback with token
    const callbackUrl = new URL('/auth/callback', process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`);
    callbackUrl.searchParams.set('token', customToken);
    callbackUrl.searchParams.set('provider', 'line');
    if (displayName) callbackUrl.searchParams.set('name', displayName);
    if (email) callbackUrl.searchParams.set('email', email);
    callbackUrl.searchParams.set('returnUrl', returnUrl);

    return res.redirect(302, callbackUrl.toString());
  } catch (err) {
    console.error('[line/callback] Unexpected error:', err);
    return res.redirect(302, '/login?error=line_unexpected');
  }
}
