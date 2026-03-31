// ═══════════════════════════════════════════════════════════════
//  GET /api/auth/naver/callback — Phase 1 (C-6)
//  Naver OAuth Step 2: Exchange code → tokens → Firebase Custom Token
//  참조: MASTER_PLAN_V4.md §7 (글로벌 소셜 로그인, Custom Token 방식)
//
//  Flow:
//    Naver → GET /api/auth/naver/callback?code=xxx&state=yyy
//    1. code → POST nid.naver.com/oauth2.0/token → access_token
//    2. access_token → GET openapi.naver.com/v1/nid/me → user info
//    3. Firebase Admin → createCustomToken(naver_{id})
//    4. CRM → findOrCreateUser({ email })
//    5. redirect → /auth/callback?token={customToken}&provider=naver
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import { createCustomToken } from '@/lib/firebaseAdmin';
import { findOrCreateUser, fetchAirtableRole } from '@/services/crm-service';

// ─── Env Config ──────────────────────────────────────────────

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_REDIRECT_URI = process.env.NAVER_REDIRECT_URI;

// ─── Naver API Response Types ────────────────────────────────

interface NaverTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

interface NaverProfile {
  id: string;
  email?: string;
  nickname?: string;
  profile_image?: string;
  name?: string;
}

interface NaverUserResponse {
  resultcode: string;
  message: string;
  response: NaverProfile;
}

// ─── Handler ─────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error: naverError } = req.query;

  // ── Naver returned an error
  if (naverError) {
    console.error('[naver/callback] Naver auth error:', naverError);
    return res.redirect(302, '/login?error=naver_denied');
  }

  if (typeof code !== 'string') {
    return res.redirect(302, '/login?error=naver_missing_code');
  }

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET || !NAVER_REDIRECT_URI) {
    console.error('[naver/callback] Missing Naver env vars');
    return res.redirect(302, '/login?error=naver_not_configured');
  }

  // Parse returnUrl from state
  let returnUrl = '/';
  if (typeof state === 'string') {
    try {
      const parsed: { returnUrl?: string } = JSON.parse(decodeURIComponent(state));
      if (parsed.returnUrl) returnUrl = parsed.returnUrl;
    } catch {
      // ignore invalid state
    }
  }

  try {
    // ── Step 1: Exchange authorization code for access token
    const tokenUrl = new URL('https://nid.naver.com/oauth2.0/token');
    tokenUrl.searchParams.set('grant_type', 'authorization_code');
    tokenUrl.searchParams.set('client_id', NAVER_CLIENT_ID);
    tokenUrl.searchParams.set('client_secret', NAVER_CLIENT_SECRET);
    tokenUrl.searchParams.set('redirect_uri', NAVER_REDIRECT_URI);
    tokenUrl.searchParams.set('code', code);
    if (typeof state === 'string') {
      tokenUrl.searchParams.set('state', state);
    }

    const tokenRes = await fetch(tokenUrl.toString(), { method: 'GET' });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('[naver/callback] Token exchange failed:', tokenRes.status, errBody);
      return res.redirect(302, '/login?error=naver_token_failed');
    }

    const tokenData: NaverTokenResponse = await tokenRes.json();

    if (tokenData.error) {
      console.error('[naver/callback] Token error:', tokenData.error, tokenData.error_description);
      return res.redirect(302, '/login?error=naver_token_failed');
    }

    // ── Step 2: Get user profile from Naver
    const userRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      console.error('[naver/callback] User info failed:', userRes.status);
      return res.redirect(302, '/login?error=naver_user_failed');
    }

    const naverData: NaverUserResponse = await userRes.json();

    // Naver wraps profile in response.response
    const profile = naverData.response;
    const naverId = profile.id;
    const email = profile.email ?? null;
    const nickname = profile.nickname ?? profile.name ?? null;

    // ── Step 3: Create Firebase Custom Token (role from Airtable if exists)
    const firebaseUid = `naver_${naverId}`;
    const role = await fetchAirtableRole(firebaseUid, 'patient');
    const customToken = await createCustomToken(firebaseUid, { role });

    if (!customToken) {
      console.error('[naver/callback] Failed to create custom token');
      return res.redirect(302, '/login?error=firebase_token_failed');
    }

    // ── Step 4: CRM integration (best-effort)
    try {
      await findOrCreateUser({
        email: email ?? undefined,
        firebase_uid: firebaseUid,
        country: 'KR',
        lang: 'KO',
      });
    } catch (crmErr) {
      console.error('[naver/callback] CRM sync failed (non-blocking):', crmErr);
    }

    // ── Step 5: Redirect to client callback with token
    const callbackUrl = new URL('/auth/callback', process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`);
    callbackUrl.searchParams.set('token', customToken);
    callbackUrl.searchParams.set('provider', 'naver');
    if (nickname) callbackUrl.searchParams.set('name', nickname);
    if (email) callbackUrl.searchParams.set('email', email);
    callbackUrl.searchParams.set('returnUrl', returnUrl);

    return res.redirect(302, callbackUrl.toString());
  } catch (err) {
    console.error('[naver/callback] Unexpected error:', err);
    return res.redirect(302, '/login?error=naver_unexpected');
  }
}
