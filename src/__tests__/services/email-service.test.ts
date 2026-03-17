// ═══════════════════════════════════════════════════════════════
//  email-service.test.ts — Phase 2 (G-4)
//  이메일 서비스 단위 테스트 (mock fetch)
//
//  Tests:
//  1. sendEmail — mock mode (no SENDGRID_API_KEY)
//  2. sendEmail — rate limiting
//  3. sendEmailFireAndForget — does not throw
//  4. getDailySendCount / resetDailyLimit
//  5. queryEmailLogs — no config returns empty
// ═══════════════════════════════════════════════════════════════

// Module isolation for TypeScript — prevents TS2451 with other test files
export {};

// Mock fetch globally BEFORE import
const mockFetch = jest.fn();
global.fetch = mockFetch;

type SendEmailFn = typeof import('@/services/email-service').sendEmail;
type SendFireAndForgetFn = typeof import('@/services/email-service').sendEmailFireAndForget;
type GetDailySendCountFn = typeof import('@/services/email-service').getDailySendCount;
type ResetDailyLimitFn = typeof import('@/services/email-service').resetDailyLimit;
type QueryEmailLogsFn = typeof import('@/services/email-service').queryEmailLogs;

let sendEmail: SendEmailFn;
let sendEmailFireAndForget: SendFireAndForgetFn;
let getDailySendCount: GetDailySendCountFn;
let resetDailyLimit: ResetDailyLimitFn;
let queryEmailLogs: QueryEmailLogsFn;

beforeAll(() => {
  // No SENDGRID_API_KEY → mock mode
  delete process.env.SENDGRID_API_KEY;
  process.env.AIRTABLE_API_KEY = '';
  process.env.AIRTABLE_BASE_ID = '';

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/services/email-service') as typeof import('@/services/email-service');
  sendEmail = mod.sendEmail;
  sendEmailFireAndForget = mod.sendEmailFireAndForget;
  getDailySendCount = mod.getDailySendCount;
  resetDailyLimit = mod.resetDailyLimit;
  queryEmailLogs = mod.queryEmailLogs;
});

beforeEach(() => {
  mockFetch.mockReset();
  resetDailyLimit();
});

// ─── Mock Mode ──────────────────────────────────────────────

describe('sendEmail — mock mode', () => {
  it('returns success in mock mode (no SendGrid key)', async () => {
    const result = await sendEmail({
      recipient: 'test@example.com',
      recipientName: 'Test',
      template: 'welcome',
      locale: 'KO',
      data: { userName: 'Test' },
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('sent');
    expect(result.emailId).toMatch(/^em_/);
    expect(result.error).toBeNull();
  });

  it('returns unique emailId for each call', async () => {
    const r1 = await sendEmail({
      recipient: 'a@b.com',
      recipientName: '',
      template: 'welcome',
      locale: 'EN',
      data: {},
    });
    const r2 = await sendEmail({
      recipient: 'a@b.com',
      recipientName: '',
      template: 'welcome',
      locale: 'EN',
      data: {},
    });
    expect(r1.emailId).not.toBe(r2.emailId);
  });
});

// ─── Rate Limiting ──────────────────────────────────────────

describe('getDailySendCount / resetDailyLimit', () => {
  it('starts at 0 after reset', () => {
    resetDailyLimit();
    expect(getDailySendCount()).toBe(0);
  });
});

// ─── Fire-and-Forget ────────────────────────────────────────

describe('sendEmailFireAndForget', () => {
  it('does not throw and does not block', () => {
    // Should not throw even if something goes wrong internally
    expect(() => {
      sendEmailFireAndForget({
        recipient: 'test@example.com',
        recipientName: 'Test',
        template: 'report-ready',
        locale: 'KO',
        data: { patientName: 'Kim', reportId: 'r1', reportUrl: 'https://test.com' },
      });
    }).not.toThrow();
  });
});

// ─── queryEmailLogs — no config ─────────────────────────────

describe('queryEmailLogs — no Airtable config', () => {
  it('returns empty array when Airtable is not configured', async () => {
    const logs = await queryEmailLogs({});
    expect(logs).toEqual([]);
  });

  it('returns empty array with filter params', async () => {
    const logs = await queryEmailLogs({
      status: 'sent',
      template: 'welcome',
      limit: 10,
    });
    expect(logs).toEqual([]);
  });
});
