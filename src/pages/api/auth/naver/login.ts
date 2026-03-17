// ═══════════════════════════════════════════════════════════════
//  GET /api/auth/naver/login — Phase 1 (C-6)
//  Naver OAuth Step 1: Redirect to Naver authorization page
//  참조: MASTER_PLAN_V4.md §7 (글로벌 소셜 로그인)
//
//  Flow:
//    Browser → GET /api/auth/naver/login?returnUrl=/dashboard
//    → 302 redirect → https://nid.naver.com/oauth2.0/authorize?...
//    → Naver login page → user authorizes
//    → 302 redirect → /api/auth/naver/callback?code=...&state=...
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_REDIRECT_URI = process.env.NAVER_REDIRECT_URI;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!NAVER_CLIENT_ID || !NAVER_REDIRECT_URI) {
    console.error('[naver/login] Missing NAVER_CLIENT_ID or NAVER_REDIRECT_URI');
    return res.status(500).json({ error: 'Naver OAuth not configured' });
  }

  // Preserve returnUrl for post-login redirect
  const returnUrl = typeof req.query.returnUrl === 'string'
    ? req.query.returnUrl
    : '/';

  // Encode returnUrl into state param (Naver passes it back in callback)
  const state = encodeURIComponent(JSON.stringify({ returnUrl }));

  const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
  naverAuthUrl.searchParams.set('client_id', NAVER_CLIENT_ID);
  naverAuthUrl.searchParams.set('redirect_uri', NAVER_REDIRECT_URI);
  naverAuthUrl.searchParams.set('response_type', 'code');
  naverAuthUrl.searchParams.set('state', state);

  res.redirect(302, naverAuthUrl.toString());
}
