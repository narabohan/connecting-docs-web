// ═══════════════════════════════════════════════════════════════
//  user-email-lookup.test.ts — Phase 2 (G-4)
//  firebase_uid → email 조회 유틸리티 단위 테스트
//
//  Tests:
//  1. lookupEmailByUid — success/not-found/error
//  2. lookupNameByUid — success/not-found
//  3. lookupUserByUid — success/not-found/no-email
//  4. Edge cases: empty uid, no config
// ═══════════════════════════════════════════════════════════════

// Module isolation for TypeScript — prevents TS2451 with other test files
export {};

// Mock fetch globally BEFORE import
const mockFetch = jest.fn();
global.fetch = mockFetch;

type LookupEmailByUidFn = typeof import('@/services/user-email-lookup').lookupEmailByUid;
type LookupNameByUidFn = typeof import('@/services/user-email-lookup').lookupNameByUid;
type LookupUserByUidFn = typeof import('@/services/user-email-lookup').lookupUserByUid;

let lookupEmailByUid: LookupEmailByUidFn;
let lookupNameByUid: LookupNameByUidFn;
let lookupUserByUid: LookupUserByUidFn;

beforeAll(() => {
  process.env.AIRTABLE_API_KEY = 'test_key';
  process.env.AIRTABLE_BASE_ID = 'test_base';

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/services/user-email-lookup') as typeof import('@/services/user-email-lookup');
  lookupEmailByUid = mod.lookupEmailByUid;
  lookupNameByUid = mod.lookupNameByUid;
  lookupUserByUid = mod.lookupUserByUid;
});

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── Helpers ────────────────────────────────────────────────

function airtableResponse(records: Array<{ id: string; fields: Record<string, string> }>) {
  return {
    ok: true,
    json: async () => ({ records }),
  };
}

function emptyResponse() {
  return airtableResponse([]);
}

function errorResponse(status: number) {
  return {
    ok: false,
    status,
    json: async () => ({}),
  };
}

// ─── lookupEmailByUid ───────────────────────────────────────

describe('lookupEmailByUid', () => {
  it('returns email when user found', async () => {
    mockFetch.mockResolvedValueOnce(
      airtableResponse([{ id: 'rec1', fields: { email: 'user@test.com', name: 'User' } }]),
    );

    const email = await lookupEmailByUid('uid_123');
    expect(email).toBe('user@test.com');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns null when user not found', async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse());

    const email = await lookupEmailByUid('uid_unknown');
    expect(email).toBeNull();
  });

  it('returns null on API error', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(500));

    const email = await lookupEmailByUid('uid_err');
    expect(email).toBeNull();
  });

  it('returns null for empty uid', async () => {
    const email = await lookupEmailByUid('');
    expect(email).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null on network exception', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const email = await lookupEmailByUid('uid_fail');
    expect(email).toBeNull();
  });
});

// ─── lookupNameByUid ────────────────────────────────────────

describe('lookupNameByUid', () => {
  it('returns name when user found', async () => {
    mockFetch.mockResolvedValueOnce(
      airtableResponse([{ id: 'rec2', fields: { name: 'Dr. Kim' } }]),
    );

    const name = await lookupNameByUid('uid_doc');
    expect(name).toBe('Dr. Kim');
  });

  it('returns empty string when not found', async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse());
    const name = await lookupNameByUid('uid_x');
    expect(name).toBe('');
  });
});

// ─── lookupUserByUid ────────────────────────────────────────

describe('lookupUserByUid', () => {
  it('returns user with email and name', async () => {
    mockFetch.mockResolvedValueOnce(
      airtableResponse([{ id: 'rec3', fields: { email: 'doc@clinic.com', name: 'Dr. Park' } }]),
    );

    const user = await lookupUserByUid('uid_park');
    expect(user).toEqual({ email: 'doc@clinic.com', name: 'Dr. Park' });
  });

  it('returns null when no email in record', async () => {
    mockFetch.mockResolvedValueOnce(
      airtableResponse([{ id: 'rec4', fields: { name: 'NoEmail' } }]),
    );

    const user = await lookupUserByUid('uid_noemail');
    expect(user).toBeNull();
  });

  it('returns null when not found', async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse());
    const user = await lookupUserByUid('uid_gone');
    expect(user).toBeNull();
  });

  it('returns name as empty string when name field missing', async () => {
    mockFetch.mockResolvedValueOnce(
      airtableResponse([{ id: 'rec5', fields: { email: 'solo@test.com' } }]),
    );

    const user = await lookupUserByUid('uid_solo');
    expect(user).toEqual({ email: 'solo@test.com', name: '' });
  });
});
