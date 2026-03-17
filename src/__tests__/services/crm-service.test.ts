// ═══════════════════════════════════════════════════════════════
//  crm-service.test.ts — Phase 1 (C-8)
//  CRM 서비스 단위 테스트: findOrCreateUser, updateStage
//  Airtable API는 전부 mock 처리
// ═══════════════════════════════════════════════════════════════

// ─── Mock fetch globally ────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Types for imported functions ───────────────────────────
type FindOrCreateUserFn = typeof import('@/services/crm-service').findOrCreateUser;
type UpdateStageFn = typeof import('@/services/crm-service').updateStage;

let findOrCreateUser: FindOrCreateUserFn;
let updateStage: UpdateStageFn;

// ─── Helpers ────────────────────────────────────────────────

function airtableRecordResponse(id: string, fields: Record<string, string>) {
  return {
    ok: true,
    json: async () => ({ id, fields }),
    text: async () => JSON.stringify({ id, fields }),
  };
}

function airtableSearchResponse(records: Array<{ id: string; fields: Record<string, string> }>) {
  return {
    ok: true,
    json: async () => ({ records }),
    text: async () => JSON.stringify({ records }),
  };
}

// ─── Setup: set env BEFORE requiring module ─────────────────

beforeAll(() => {
  process.env.AIRTABLE_API_KEY = 'test_api_key';
  process.env.AIRTABLE_BASE_ID = 'test_base_id';

  // Use require to control load order (import is hoisted)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/services/crm-service') as typeof import('@/services/crm-service');
  findOrCreateUser = mod.findOrCreateUser;
  updateStage = mod.updateStage;
});

// ─── Tests ──────────────────────────────────────────────────

beforeEach(() => {
  mockFetch.mockReset();
});

describe('crm-service', () => {
  // ── Test 1: findOrCreateUser — 신규 유저 생성 (email 없는 경우) ──
  it('findOrCreateUser creates a new user when no email/uid match found', async () => {
    // 1st call: search by firebase_uid → no results
    mockFetch.mockResolvedValueOnce(airtableSearchResponse([]));
    // 2nd call: create new record
    mockFetch.mockResolvedValueOnce(
      airtableRecordResponse('rec_new_1', {
        stage: 'survey_started',
        country: 'KR',
        language: 'KO',
        first_survey_at: '2026-03-17T00:00:00.000Z',
        last_activity_at: '2026-03-17T00:00:00.000Z',
      })
    );

    const result = await findOrCreateUser({
      firebase_uid: 'uid_test_1',
      country: 'KR',
      lang: 'KO',
    });

    expect(result.airtable_id).toBe('rec_new_1');
    expect(result.stage).toBe('survey_started');
    expect(result.country).toBe('KR');
    expect(result.lang).toBe('KO');

    // Should have made 2 fetch calls (search + create)
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verify the create call was POST
    const createCall = mockFetch.mock.calls[1];
    expect(createCall[1]?.method).toBe('POST');
  });

  // ── Test 2: updateStage — 정상 업데이트 (survey_completed → report_viewed) ──
  it('updateStage advances stage from survey_completed to report_viewed', async () => {
    // 1st call: GET current record
    mockFetch.mockResolvedValueOnce(
      airtableRecordResponse('rec_user_1', {
        stage: 'survey_completed',
        last_activity_at: '2026-03-16T00:00:00.000Z',
      })
    );
    // 2nd call: PATCH update
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'rec_user_1', fields: { stage: 'report_viewed' } }),
      text: async () => '{}',
    });

    await updateStage('rec_user_1', 'report_viewed');

    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verify PATCH body includes new stage
    const patchCall = mockFetch.mock.calls[1];
    expect(patchCall[1]?.method).toBe('PATCH');

    const patchBody = JSON.parse(patchCall[1]?.body as string) as { fields: Record<string, string> };
    expect(patchBody.fields.stage).toBe('report_viewed');
  });

  // ── Test 3: updateStage — 역행 방지 (report_viewed → survey_completed 시 무시) ──
  it('updateStage ignores backward stage transition', async () => {
    // 1st call: GET current record (already at report_viewed)
    mockFetch.mockResolvedValueOnce(
      airtableRecordResponse('rec_user_2', {
        stage: 'report_viewed',
        last_activity_at: '2026-03-16T00:00:00.000Z',
      })
    );
    // 2nd call: PATCH (should only update last_activity_at, NOT stage)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'rec_user_2', fields: {} }),
      text: async () => '{}',
    });

    await updateStage('rec_user_2', 'survey_completed');

    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verify PATCH body does NOT include stage (regression prevention)
    const patchCall = mockFetch.mock.calls[1];
    const patchBody = JSON.parse(patchCall[1]?.body as string) as { fields: Record<string, string> };
    expect(patchBody.fields.stage).toBeUndefined();
    // But last_activity_at should be updated
    expect(patchBody.fields.last_activity_at).toBeDefined();
  });
});
