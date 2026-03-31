// ═══════════════════════════════════════════════════════════════
//  GET /api/auth/kakao/callback — Phase 1 (C-5)
//  Kakao OAuth Step 2: Exchange code → tokens → Firebase Custom Token
//  참조: MASTER_PLAN_V4.md §7 (글로벌 소셜 로그인, Custom Token 방식)
//
//  Flow:
//    Kakao → GET /api/auth/kakao/callback?code=xxx&state=yyy
//    1. code → POST kauth.kakao.com/oauth/token → access_token
//    2. access_token → GET kapi.kakao.com/v2/user/me → user info
//    3. Firebase Admin → createCustomToken(kakao_{id})
//    4. CRM → findOrCreateUser({ email })
//    5. redirect → /auth/callback?token={customToken}&provider=kakao
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import { createCustomToken } from '@/lib/firebaseAdmin';
import { findOrCreateUser, fetchAirtableRole } from '@/services/crm-service';

// ─── Env Config ──────────────────────────────────────────────

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET; // Optional

// ─── Kakao API Response Types ────────────────────────────────

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
}

interface KakaoAccount {
  email?: string;
  profile?: {
    nickname?: string;
    profile_image_url?: string;
  };
  is_email_valid?: boolean;
  is_email_verified?: boolean;
}

interface KakaoUserResponse {
  id: number;
  connected_at?: string;
  kakao_account?: KakaoAccount;
}

// ─── Handler ─────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error: kakaoError } = req.query;

  // ── Kakao returned an error
  if (kakaoError) {
    console.error('[kakao/callback] Kakao auth error:', kakaoError);
    return res.redirect(302, '/login?error=kakao_denied');
  }

  if (typeof code !== 'string') {
    return res.redirect(302, '/login?error=kakao_missing_code');
  }

  if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
    console.error('[kakao/callback] Missing Kakao env vars');
    return res.redirect(302, '/login?error=kakao_not_configured');
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
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: KAKAO_REDIRECT_URI,
      code,
    });

    if (KAKAO_CLIENT_SECRET) {
      tokenParams.set('client_secret', KAKAO_CLIENT_SECRET);
    }

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('[kakao/callback] Token exchange failed:', tokenRes.status, errBody);
      return res.redirect(302, '/login?error=kakao_token_failed');
    }

    const tokenData: KakaoTokenResponse = await tokenRes.json();

    // ── Step 2: Get user profile from Kakao
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      console.error('[kakao/callback] User info failed:', userRes.status);
      return res.redirect(302, '/login?error=kakao_user_failed');
    }

    const kakaoUser: KakaoUserResponse = await userRes.json();

    const kakaoId = kakaoUser.id;
    const email = kakaoUser.kakao_account?.email ?? null;
    const nickname = kakaoUser.kakao_account?.profile?.nickname ?? null;

    // ── Step 3: Create Firebase Custom Token (role from Airtable if exists)
    const firebaseUid = `kakao_${kakaoId}`;
    const role = await fetchAirtableRole(firebaseUid, 'patient');
    const customToken = await createCustomToken(firebaseUid, { role });

    if (!customToken) {
      console.error('[kakao/callback] Failed to create custom token');
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
      console.error('[kakao/callback] CRM sync failed (non-blocking):', crmErr);
    }

    // ── Step 5: Redirect to client callback with token
    const callbackUrl = new URL('/auth/callback', process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`);
    callbackUrl.searchParams.set('token', customToken);
    callbackUrl.searchParams.set('provider', 'kakao');
    if (nickname) callbackUrl.searchParams.set('name', nickname);
    if (email) callbackUrl.searchParams.set('email', email);
    callbackUrl.searchParams.set('returnUrl', returnUrl);

    return res.redirect(302, callbackUrl.toString());
  } catch (err) {
    console.error('[kakao/callback] Unexpected error:', err);
    return res.redirect(302, '/login?error=kakao_unexpected');
  }
}
