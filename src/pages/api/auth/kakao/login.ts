// ═══════════════════════════════════════════════════════════════
//  GET /api/auth/kakao/login — Phase 1 (C-5)
//  Kakao OAuth Step 1: Redirect to Kakao authorization page
//  참조: MASTER_PLAN_V4.md §7 (글로벌 소셜 로그인)
//
//  Flow:
//    Browser → GET /api/auth/kakao/login?returnUrl=/dashboard
//    → 302 redirect → https://kauth.kakao.com/oauth/authorize?...
//    → Kakao login page → user authorizes
//    → 302 redirect → /api/auth/kakao/callback?code=...
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
    console.error('[kakao/login] Missing KAKAO_REST_API_KEY or KAKAO_REDIRECT_URI');
    return res.status(500).json({ error: 'Kakao OAuth not configured' });
  }

  // Preserve returnUrl for post-login redirect
  const returnUrl = typeof req.query.returnUrl === 'string'
    ? req.query.returnUrl
    : '/';

  // Encode returnUrl into state param (Kakao passes it back in callback)
  const state = encodeURIComponent(JSON.stringify({ returnUrl }));

  const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize');
  kakaoAuthUrl.searchParams.set('client_id', KAKAO_REST_API_KEY);
  kakaoAuthUrl.searchParams.set('redirect_uri', KAKAO_REDIRECT_URI);
  kakaoAuthUrl.searchParams.set('response_type', 'code');
  kakaoAuthUrl.searchParams.set('state', state);

  res.redirect(302, kakaoAuthUrl.toString());
}
