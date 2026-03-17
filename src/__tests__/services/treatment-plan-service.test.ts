// ═══════════════════════════════════════════════════════════════
//  treatment-plan-service.test.ts — Phase 2 (G-2)
//  Airtable CRUD 서비스 단위 테스트 (fetch mock)
// ═══════════════════════════════════════════════════════════════

// Module boundary to avoid global scope conflicts
export {};

// ─── Mock fetch globally ────────────────────────────────────
const mockFetchTP = jest.fn();
global.fetch = mockFetchTP;

// ─── Types for imported functions ───────────────────────────
type CreatePlanFn = typeof import('@/services/treatment-plan-service').createPlan;
type GetPlanByIdFn = typeof import('@/services/treatment-plan-service').getPlanById;
type GetPlansByPatientFn = typeof import('@/services/treatment-plan-service').getPlansByPatient;
type UpdatePlanFn = typeof import('@/services/treatment-plan-service').updatePlan;

let createPlan: CreatePlanFn;
let getPlanById: GetPlanByIdFn;
let getPlansByPatient: GetPlansByPatientFn;
let updatePlan: UpdatePlanFn;

// ─── Helpers ────────────────────────────────────────────────

function mockAirtableResponse(data: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

function createMockPlanFields() {
  return {
    plan_id: 'tp_test_abc',
    report_id: 'rpt_123',
    patient_id: 'user_abc',
    doctor_id: '',
    status: 'draft',
    concerns_json: JSON.stringify([{ concern: '기미', severity: 'moderate', area: 'cheek', patientPriority: 1 }]),
    recommendations_json: JSON.stringify({ ebdDevices: [], injectables: [], signatureSolutions: [] }),
    timeline_json: JSON.stringify({ planType: 'regular', planTypeLabel: '', duration: '', phases: [], planRationale: '', seasonalNote: '' }),
    cost_json: '',
    modifications_json: JSON.stringify([]),
    created_at: '2026-03-17T10:00:00.000Z',
    updated_at: '2026-03-17T10:00:00.000Z',
  };
}

// ─── Setup ──────────────────────────────────────────────────

beforeAll(() => {
  process.env.AIRTABLE_API_KEY = 'test_api_key';
  process.env.AIRTABLE_BASE_ID = 'test_base_id';

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/services/treatment-plan-service') as typeof import('@/services/treatment-plan-service');
  createPlan = mod.createPlan;
  getPlanById = mod.getPlanById;
  getPlansByPatient = mod.getPlansByPatient;
  updatePlan = mod.updatePlan;
});

beforeEach(() => {
  mockFetchTP.mockReset();
});

// ─── createPlan Tests ────────────────────────────────────────

describe('createPlan', () => {
  it('creates a plan and returns it', async () => {
    const fields = createMockPlanFields();
    mockFetchTP.mockResolvedValueOnce(
      mockAirtableResponse({ id: 'rec_abc', fields })
    );

    const result = await createPlan({
      reportId: 'rpt_123',
      patientId: 'user_abc',
      status: 'draft',
      concerns: [{ concern: '기미', severity: 'moderate', area: 'cheek', patientPriority: 1 }],
      recommendations: { ebdDevices: [], injectables: [], signatureSolutions: [] },
      timeline: { planType: 'regular', planTypeLabel: '', duration: '', phases: [], planRationale: '', seasonalNote: '' },
      doctorModifications: [],
    });

    expect(result).not.toBeNull();
    expect(result?.reportId).toBe('rpt_123');
    expect(mockFetchTP).toHaveBeenCalledTimes(1);
  });

  it('returns null on Airtable error', async () => {
    mockFetchTP.mockResolvedValueOnce(mockAirtableResponse({}, false));

    const result = await createPlan({
      reportId: 'rpt_123',
      patientId: 'user_abc',
      status: 'draft',
      concerns: [],
      recommendations: { ebdDevices: [], injectables: [], signatureSolutions: [] },
      timeline: { planType: 'regular', planTypeLabel: '', duration: '', phases: [], planRationale: '', seasonalNote: '' },
      doctorModifications: [],
    });

    expect(result).toBeNull();
  });
});

// ─── getPlanById Tests ───────────────────────────────────────

describe('getPlanById', () => {
  it('returns plan when found', async () => {
    const fields = createMockPlanFields();
    mockFetchTP.mockResolvedValueOnce(
      mockAirtableResponse({ records: [{ id: 'rec_abc', fields }] })
    );

    const result = await getPlanById('tp_test_abc');
    expect(result).not.toBeNull();
    expect(result?.planId).toBe('tp_test_abc');
    expect(result?.reportId).toBe('rpt_123');
  });

  it('returns null when not found', async () => {
    mockFetchTP.mockResolvedValueOnce(
      mockAirtableResponse({ records: [] })
    );

    const result = await getPlanById('tp_nonexistent');
    expect(result).toBeNull();
  });

  it('returns null on fetch error', async () => {
    mockFetchTP.mockRejectedValueOnce(new Error('Network error'));

    const result = await getPlanById('tp_test_abc');
    expect(result).toBeNull();
  });
});

// ─── getPlansByPatient Tests ─────────────────────────────────

describe('getPlansByPatient', () => {
  it('returns list of plans', async () => {
    const fields = createMockPlanFields();
    mockFetchTP.mockResolvedValueOnce(
      mockAirtableResponse({
        records: [
          { id: 'rec_1', fields },
          { id: 'rec_2', fields: { ...fields, plan_id: 'tp_test_def' } },
        ],
      })
    );

    const result = await getPlansByPatient('user_abc');
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no plans', async () => {
    mockFetchTP.mockResolvedValueOnce(
      mockAirtableResponse({ records: [] })
    );

    const result = await getPlansByPatient('user_nobody');
    expect(result).toHaveLength(0);
  });
});

// ─── updatePlan Tests ────────────────────────────────────────

describe('updatePlan', () => {
  it('updates status successfully', async () => {
    const fields = createMockPlanFields();

    // 1st call: find by plan_id
    mockFetchTP.mockResolvedValueOnce(
      mockAirtableResponse({ records: [{ id: 'rec_abc', fields }] })
    );
    // 2nd call: PATCH
    mockFetchTP.mockResolvedValueOnce(
      mockAirtableResponse({ id: 'rec_abc', fields: { ...fields, status: 'doctor_review' } })
    );

    const result = await updatePlan('tp_test_abc', { status: 'doctor_review' });
    expect(result).not.toBeNull();
    expect(mockFetchTP).toHaveBeenCalledTimes(2);
  });

  it('blocks status regression', async () => {
    const fields = { ...createMockPlanFields(), status: 'approved' };

    mockFetchTP.mockResolvedValueOnce(
      mockAirtableResponse({ records: [{ id: 'rec_abc', fields }] })
    );

    // Try to regress from approved → draft
    const result = await updatePlan('tp_test_abc', { status: 'draft' });
    expect(result).toBeNull();

    // PATCH should NOT be called
    expect(mockFetchTP).toHaveBeenCalledTimes(1);
  });

  it('returns null when plan not found', async () => {
    mockFetchTP.mockResolvedValueOnce(
      mockAirtableResponse({ records: [] })
    );

    const result = await updatePlan('tp_nonexistent', { status: 'approved' });
    expect(result).toBeNull();
  });
});
