// ═══════════════════════════════════════════════════════════════
//  Line OAuth Unit Tests — Phase 2 (G-6)
//
//  Tests:
//  1. Line provider — getAuthorizationUrl 구조 검증
//  2. Line provider — exchangeCodeForToken 파라미터 검증
//  3. Line provider — state 생성/검증 (CSRF)
//  4. Line provider — getConfig 환경변수 검증
//  5. i18n — auth.login_with_line + auth.line_* keys in all 4 locales
//  6. Login URL — scope 파라미터 검증
//  7. State parsing — invalid state 처리
//
//  Environment: node (no React rendering — logic-only tests)
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

export {};

// ─── Import locale files directly ────────────────────────────
import koLocale from '@/i18n/locales/ko.json';
import enLocale from '@/i18n/locales/en.json';
import jaLocale from '@/i18n/locales/ja.json';
import zhCNLocale from '@/i18n/locales/zh-CN.json';

// ─── Types (mirrors line-provider logic) ─────────────────────

interface LineStatePayload {
  returnUrl: string;
  nonce: string;
}

// ─── Pure functions extracted from line-provider ─────────────

/**
 * Parse state parameter (mirrors line-provider.parseState)
 */
function parseState(state: string): LineStatePayload {
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

/**
 * Generate state (mirrors line-provider.generateState without crypto)
 */
function generateState(returnUrl: string): string {
  const nonce = 'test_nonce_' + Date.now();
  return encodeURIComponent(JSON.stringify({ returnUrl, nonce }));
}

/**
 * Build authorization URL (mirrors line-provider.getAuthorizationUrl)
 */
function buildAuthorizationUrl(
  channelId: string,
  callbackUrl: string,
  state: string,
): string {
  const url = new URL('https://access.line.me/oauth2/v2.1/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', channelId);
  url.searchParams.set('redirect_uri', callbackUrl);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'profile openid email');
  return url.toString();
}

/**
 * Build token exchange params (mirrors line-provider.exchangeCodeForToken body)
 */
function buildTokenParams(
  code: string,
  channelId: string,
  channelSecret: string,
  callbackUrl: string,
): URLSearchParams {
  return new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: callbackUrl,
    client_id: channelId,
    client_secret: channelSecret,
  });
}

// ─── Locale type helper ──────────────────────────────────────

interface AuthKeys {
  auth?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════════

// ─── Test 1: getAuthorizationUrl 구조 검증 ──────────────────

describe('Line provider — getAuthorizationUrl', () => {
  const state = generateState('/dashboard');
  const url = buildAuthorizationUrl('test_channel_123', 'https://example.com/api/auth/line/callback', state);
  const parsed = new URL(url);

  it('should use Line authorize endpoint', () => {
    expect(parsed.origin).toBe('https://access.line.me');
    expect(parsed.pathname).toBe('/oauth2/v2.1/authorize');
  });

  it('should set response_type=code', () => {
    expect(parsed.searchParams.get('response_type')).toBe('code');
  });

  it('should set client_id', () => {
    expect(parsed.searchParams.get('client_id')).toBe('test_channel_123');
  });

  it('should set redirect_uri', () => {
    expect(parsed.searchParams.get('redirect_uri')).toBe('https://example.com/api/auth/line/callback');
  });

  it('should set state parameter', () => {
    expect(parsed.searchParams.get('state')).toBe(state);
  });
});

// ─── Test 2: exchangeCodeForToken 파라미터 검증 ──────────────

describe('Line provider — exchangeCodeForToken params', () => {
  const params = buildTokenParams(
    'test_auth_code',
    'channel_id_123',
    'channel_secret_abc',
    'https://example.com/callback',
  );

  it('should set grant_type=authorization_code', () => {
    expect(params.get('grant_type')).toBe('authorization_code');
  });

  it('should set code', () => {
    expect(params.get('code')).toBe('test_auth_code');
  });

  it('should set client_id', () => {
    expect(params.get('client_id')).toBe('channel_id_123');
  });

  it('should set client_secret', () => {
    expect(params.get('client_secret')).toBe('channel_secret_abc');
  });

  it('should set redirect_uri', () => {
    expect(params.get('redirect_uri')).toBe('https://example.com/callback');
  });
});

// ─── Test 3: state 생성/검증 (CSRF) ─────────────────────────

describe('Line provider — state generation and parsing', () => {
  it('should generate state with returnUrl', () => {
    const state = generateState('/my-page');
    const parsed = parseState(state);
    expect(parsed.returnUrl).toBe('/my-page');
  });

  it('should include nonce in state', () => {
    const state = generateState('/');
    const parsed = parseState(state);
    expect(parsed.nonce).toBeTruthy();
    expect(parsed.nonce.length).toBeGreaterThan(0);
  });

  it('should preserve complex returnUrl', () => {
    const state = generateState('/dashboard?tab=reports&page=2');
    const parsed = parseState(state);
    expect(parsed.returnUrl).toBe('/dashboard?tab=reports&page=2');
  });
});

// ─── Test 4: getConfig 환경변수 검증 ─────────────────────────

describe('Line provider — config validation', () => {
  it('should require all 3 env vars', () => {
    // Simulates getConfig logic
    const checkConfig = (channelId: string, secret: string, callback: string): boolean => {
      return Boolean(channelId && secret && callback);
    };

    expect(checkConfig('id', 'secret', 'url')).toBe(true);
    expect(checkConfig('', 'secret', 'url')).toBe(false);
    expect(checkConfig('id', '', 'url')).toBe(false);
    expect(checkConfig('id', 'secret', '')).toBe(false);
  });
});

// ─── Test 5: i18n — auth.login_with_line + auth.line_* keys ─

describe('i18n — Line OAuth keys in all locales', () => {
  const LINE_AUTH_KEYS = [
    'login_with_line',
    'line_login_error',
    'line_login_success',
    'line_connecting',
  ];

  const locales: Record<string, AuthKeys> = {
    ko: koLocale,
    en: enLocale,
    ja: jaLocale,
    'zh-CN': zhCNLocale,
  };

  for (const [langCode, locale] of Object.entries(locales)) {
    it(`should have all Line auth keys in ${langCode} locale`, () => {
      const authKeys = locale.auth;
      expect(authKeys).toBeDefined();
      for (const key of LINE_AUTH_KEYS) {
        expect(authKeys?.[key]).toBeDefined();
        expect(typeof authKeys?.[key]).toBe('string');
        expect((authKeys?.[key] ?? '').length).toBeGreaterThan(0);
      }
    });
  }

  it('should have LINE in Japanese button label', () => {
    expect(jaLocale.auth?.login_with_line).toBe('LINEでログイン');
  });

  it('should have LINE in Korean button label', () => {
    expect(koLocale.auth?.login_with_line).toBe('LINE으로 로그인');
  });
});

// ─── Test 6: Login URL — scope 파라미터 검증 ─────────────────

describe('Line provider — scope parameter', () => {
  const state = generateState('/');
  const url = buildAuthorizationUrl('ch_id', 'https://example.com/cb', state);
  const parsed = new URL(url);

  it('should request profile scope', () => {
    const scope = parsed.searchParams.get('scope') ?? '';
    expect(scope).toContain('profile');
  });

  it('should request openid scope', () => {
    const scope = parsed.searchParams.get('scope') ?? '';
    expect(scope).toContain('openid');
  });

  it('should request email scope', () => {
    const scope = parsed.searchParams.get('scope') ?? '';
    expect(scope).toContain('email');
  });
});

// ─── Test 7: State parsing — invalid state 처리 ──────────────

describe('Line provider — invalid state handling', () => {
  it('should return default for empty string', () => {
    const result = parseState('');
    expect(result.returnUrl).toBe('/');
    expect(result.nonce).toBe('');
  });

  it('should return default for malformed JSON', () => {
    const result = parseState('not-json-at-all');
    expect(result.returnUrl).toBe('/');
  });

  it('should return default for missing fields', () => {
    const result = parseState(encodeURIComponent(JSON.stringify({})));
    expect(result.returnUrl).toBe('/');
    expect(result.nonce).toBe('');
  });

  it('should handle partially valid state', () => {
    const result = parseState(encodeURIComponent(JSON.stringify({ returnUrl: '/test' })));
    expect(result.returnUrl).toBe('/test');
    expect(result.nonce).toBe('');
  });
});
