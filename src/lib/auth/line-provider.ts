// ═══════════════════════════════════════════════════════════════
//  Line Login v2.1 Provider — Phase 2 (G-6)
//  Line OAuth 유틸리티 (Kakao 패턴 복사 → Line API 스펙 교체)
//
//  - getAuthorizationUrl(): access.line.me/oauth2/v2.1/authorize
//  - exchangeCodeForToken(): api.line.me/oauth2/v2.1/token
//  - getProfile(): api.line.me/v2/profile
//  - CSRF state 생성/검증
//
//  참조: https://developers.line.biz/en/docs/line-login/
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';

// ─── Env Config ──────────────────────────────────────────────

const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID ?? '';
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET ?? '';
const LINE_CALLBACK_URL = process.env.LINE_CALLBACK_URL ?? '';

// ─── Line API Endpoints ──────────────────────────────────────

const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';

// ─── Types ───────────────────────────────────────────────────

export interface LineTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LineProviderConfig {
  channelId: string;
  channelSecret: string;
  callbackUrl: string;
}

// ─── State (CSRF) Helpers ────────────────────────────────────

/**
 * Generate a cryptographically secure random state string.
 * Encodes the returnUrl inside it for post-login redirect.
 */
export function generateState(returnUrl: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  return encodeURIComponent(JSON.stringify({ returnUrl, nonce }));
}

/**
 * Parse state parameter and extract returnUrl.
 * Returns '/' if parsing fails.
 */
export function parseState(state: string): { returnUrl: string; nonce: string } {
  try {
    const parsed: { returnUrl?: string; nonce?: string } = JSON.parse(decodeURIComponent(state));
    return {
      returnUrl: parsed.returnUrl ?? '/',
      nonce: parsed.nonce ?? '',
    };
  } catch {
    return { returnUrl: '/', nonce: '' };
  }
}

// ─── Provider Functions ──────────────────────────────────────

/**
 * Get provider configuration from env vars.
 * Returns null if any required env var is missing.
 */
export function getConfig(): LineProviderConfig | null {
  if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET || !LINE_CALLBACK_URL) {
    return null;
  }
  return {
    channelId: LINE_CHANNEL_ID,
    channelSecret: LINE_CHANNEL_SECRET,
    callbackUrl: LINE_CALLBACK_URL,
  };
}

/**
 * Build Line OAuth authorization URL.
 * Scope: profile openid email
 */
export function getAuthorizationUrl(state: string): string {
  const url = new URL(LINE_AUTH_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', LINE_CHANNEL_ID);
  url.searchParams.set('redirect_uri', LINE_CALLBACK_URL);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'profile openid email');
  return url.toString();
}

/**
 * Exchange authorization code for Line access token.
 */
export async function exchangeCodeForToken(code: string): Promise<LineTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: LINE_CALLBACK_URL,
    client_id: LINE_CHANNEL_ID,
    client_secret: LINE_CHANNEL_SECRET,
  });

  const res = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Line token exchange failed: ${res.status} ${errText}`);
  }

  return (await res.json()) as LineTokenResponse;
}

/**
 * Get Line user profile with access token.
 */
export async function getProfile(accessToken: string): Promise<LineProfile> {
  const res = await fetch(LINE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Line profile fetch failed: ${res.status}`);
  }

  return (await res.json()) as LineProfile;
}
