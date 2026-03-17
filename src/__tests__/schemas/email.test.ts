// ═══════════════════════════════════════════════════════════════
//  email.test.ts — Phase 2 (G-4)
//  이메일 Zod 스키마 단위 테스트
//
//  Tests:
//  1. SendEmailRequestSchema — valid/invalid parsing
//  2. EmailTemplateType — enum validation
//  3. EmailLocale — enum validation
//  4. Template data schemas — default values
//  5. validateSendEmailRequest — helper
//  6. generateEmailId — format check
// ═══════════════════════════════════════════════════════════════

import {
  SendEmailRequestSchema,
  EmailTemplateTypeSchema,
  EmailLocaleSchema,
  EmailStatusSchema,
  ReportReadyDataSchema,
  PlanReadyDataSchema,
  PlanApprovedDataSchema,
  WelcomeDataSchema,
  EmailLogSchema,
  validateSendEmailRequest,
  generateEmailId,
} from '@/schemas/email';

// ─── SendEmailRequestSchema ─────────────────────────────────

describe('SendEmailRequestSchema', () => {
  it('parses a valid full request', () => {
    const result = SendEmailRequestSchema.safeParse({
      recipient: 'test@example.com',
      recipientName: 'Test User',
      template: 'report-ready',
      locale: 'KO',
      data: { patientName: 'Kim', reportId: 'r123' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recipient).toBe('test@example.com');
      expect(result.data.template).toBe('report-ready');
      expect(result.data.locale).toBe('KO');
    }
  });

  it('applies defaults for optional fields', () => {
    const result = SendEmailRequestSchema.safeParse({
      recipient: 'user@mail.com',
      template: 'welcome',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recipientName).toBe('');
      expect(result.data.locale).toBe('KO');
      expect(result.data.data).toEqual({});
    }
  });

  it('rejects invalid email', () => {
    const result = SendEmailRequestSchema.safeParse({
      recipient: 'not-an-email',
      template: 'welcome',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid template type', () => {
    const result = SendEmailRequestSchema.safeParse({
      recipient: 'a@b.com',
      template: 'invalid-template',
    });
    expect(result.success).toBe(false);
  });
});

// ─── EmailTemplateTypeSchema ────────────────────────────────

describe('EmailTemplateTypeSchema', () => {
  const validTemplates = ['report-ready', 'plan-ready', 'plan-approved', 'welcome'];

  it.each(validTemplates)('accepts "%s"', (template) => {
    expect(EmailTemplateTypeSchema.safeParse(template).success).toBe(true);
  });

  it('rejects unknown template', () => {
    expect(EmailTemplateTypeSchema.safeParse('unknown').success).toBe(false);
  });
});

// ─── EmailLocaleSchema ──────────────────────────────────────

describe('EmailLocaleSchema', () => {
  const validLocales = ['KO', 'EN', 'JP', 'ZH-CN'];

  it.each(validLocales)('accepts "%s"', (locale) => {
    expect(EmailLocaleSchema.safeParse(locale).success).toBe(true);
  });

  it('rejects invalid locale', () => {
    expect(EmailLocaleSchema.safeParse('FR').success).toBe(false);
  });
});

// ─── EmailStatusSchema ──────────────────────────────────────

describe('EmailStatusSchema', () => {
  it.each(['queued', 'sent', 'failed', 'rate_limited'])('accepts "%s"', (status) => {
    expect(EmailStatusSchema.safeParse(status).success).toBe(true);
  });
});

// ─── Template Data Schemas (defaults) ───────────────────────

describe('Template data schemas', () => {
  it('ReportReadyDataSchema applies defaults', () => {
    const result = ReportReadyDataSchema.parse({});
    expect(result.patientName).toBe('');
    expect(result.reportId).toBe('');
    expect(result.reportUrl).toBe('');
  });

  it('PlanReadyDataSchema applies defaults', () => {
    const result = PlanReadyDataSchema.parse({});
    expect(result.doctorName).toBe('');
    expect(result.planId).toBe('');
  });

  it('PlanApprovedDataSchema applies defaults', () => {
    const result = PlanApprovedDataSchema.parse({});
    expect(result.patientName).toBe('');
    expect(result.doctorName).toBe('');
  });

  it('WelcomeDataSchema applies defaults', () => {
    const result = WelcomeDataSchema.parse({});
    expect(result.userName).toBe('');
    expect(result.startUrl).toBe('');
  });
});

// ─── EmailLogSchema ─────────────────────────────────────────

describe('EmailLogSchema', () => {
  it('parses a valid log entry', () => {
    const result = EmailLogSchema.safeParse({
      emailId: 'em_test_123',
      recipient: 'user@example.com',
      template: 'welcome',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('queued');
      expect(result.data.retryCount).toBe(0);
      expect(result.data.createdAt).toBeDefined();
    }
  });
});

// ─── validateSendEmailRequest ───────────────────────────────

describe('validateSendEmailRequest', () => {
  it('returns success for valid request', () => {
    const result = validateSendEmailRequest({
      recipient: 'a@b.com',
      template: 'welcome',
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('returns error for invalid request', () => {
    const result = validateSendEmailRequest({
      recipient: 'not-email',
      template: 'bad',
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ─── generateEmailId ────────────────────────────────────────

describe('generateEmailId', () => {
  it('returns a string starting with "em_"', () => {
    const id = generateEmailId();
    expect(id).toMatch(/^em_[a-z0-9]+_[a-z0-9]+$/);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateEmailId()));
    expect(ids.size).toBe(20);
  });
});
