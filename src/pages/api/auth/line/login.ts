// ═══════════════════════════════════════════════════════════════
//  GET /api/auth/line/login — Phase 2 (G-6)
//  Line OAuth Step 1: Redirect to Line authorization page
//  참조: MASTER_PLAN_V4.md §7 (글로벌 소셜 로그인)
//
//  Flow:
//    Browser → GET /api/auth/line/login?returnUrl=/dashboard
//    → 302 redirect → https://access.line.me/oauth2/v2.1/authorize?...
//    → Line login page → user authorizes
//    → 302 redirect → /api/auth/line/callback?code=...&state=...
//
//  Kakao login.ts 패턴 복사 → Line API 스펙 교체
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import { getConfig, generateState, getAuthorizationUrl } from '@/lib/auth/line-provider';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = getConfig();
  if (!config) {
    console.error('[line/login] Missing LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, or LINE_CALLBACK_URL');
    return res.status(500).json({ error: 'Line OAuth not configured' });
  }

  // Preserve returnUrl for post-login redirect
  const returnUrl = typeof req.query.returnUrl === 'string'
    ? req.query.returnUrl
    : '/';

  // Generate state with CSRF nonce + returnUrl (Line passes it back in callback)
  const state = generateState(returnUrl);

  // Build Line authorization URL and redirect
  const lineAuthUrl = getAuthorizationUrl(state);

  res.redirect(302, lineAuthUrl);
}
