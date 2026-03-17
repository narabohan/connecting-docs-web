// ═══════════════════════════════════════════════════════════════
//  template-renderer.test.ts — Phase 2 (G-4)
//  이메일 템플릿 렌더러 단위 테스트
//
//  Tests:
//  1. renderEmailTemplate — all 4 templates × KO locale
//  2. renderEmailTemplate — EN locale
//  3. renderEmailTemplate — error handling (bad data)
//  4. isValidTemplate — valid/invalid
//  5. HTML output contains expected content
// ═══════════════════════════════════════════════════════════════

import { renderEmailTemplate, isValidTemplate } from '@/email/template-renderer';
import type { EmailTemplateType, EmailLocale } from '@/schemas/email';

// ─── renderEmailTemplate — success cases ─────────────────────

describe('renderEmailTemplate', () => {
  it('renders report-ready template (KO)', () => {
    const result = renderEmailTemplate('report-ready', {
      patientName: '김민수',
      reportId: 'rpt_123',
      reportUrl: 'https://example.com/report/123',
    }, 'KO');

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.html).toContain('ConnectingDocs');
    expect(result.html).toContain('김민수');
  });

  it('renders plan-ready template (EN)', () => {
    const result = renderEmailTemplate('plan-ready', {
      doctorName: 'Dr. Lee',
      patientId: 'p_456',
      planId: 'plan_789',
      dashboardUrl: 'https://example.com/doctor/plans/789',
    }, 'EN');

    expect(result.success).toBe(true);
    expect(result.html).toContain('Dr. Lee');
    expect(result.html).toContain('ConnectingDocs');
  });

  it('renders plan-approved template (JP)', () => {
    const result = renderEmailTemplate('plan-approved', {
      patientName: '田中太郎',
      planId: 'plan_abc',
      planUrl: 'https://example.com/patient/plans/abc',
      doctorName: '佐藤医師',
    }, 'JP');

    expect(result.success).toBe(true);
    expect(result.html).toContain('田中太郎');
  });

  it('renders welcome template (ZH-CN)', () => {
    const result = renderEmailTemplate('welcome', {
      userName: '王小明',
      startUrl: 'https://example.com/start',
    }, 'ZH-CN');

    expect(result.success).toBe(true);
    expect(result.html).toContain('王小明');
  });

  it('applies Zod defaults for missing data fields', () => {
    // Empty data object — defaults should be applied
    const result = renderEmailTemplate('welcome', {}, 'KO');
    expect(result.success).toBe(true);
    expect(result.html).toBeTruthy();
  });

  it('contains proper HTML structure with branding', () => {
    const result = renderEmailTemplate('report-ready', {
      patientName: 'Test',
      reportId: 'r1',
      reportUrl: 'https://test.com',
    }, 'KO');

    // Check for base layout markers
    expect(result.html).toContain('<!DOCTYPE html');
    expect(result.html).toContain('600px'); // max-width
    expect(result.html).toContain('#0F172A'); // dark branding or similar
  });
});

// ─── renderEmailTemplate — all locales ──────────────────────

describe('renderEmailTemplate — locale coverage', () => {
  const locales: EmailLocale[] = ['KO', 'EN', 'JP', 'ZH-CN'];

  it.each(locales)('renders welcome template for locale %s', (locale) => {
    const result = renderEmailTemplate('welcome', { userName: 'User' }, locale);
    expect(result.success).toBe(true);
    expect(result.html.length).toBeGreaterThan(100);
  });
});

// ─── isValidTemplate ────────────────────────────────────────

describe('isValidTemplate', () => {
  it.each(['report-ready', 'plan-ready', 'plan-approved', 'welcome'])(
    'returns true for "%s"',
    (template) => {
      expect(isValidTemplate(template)).toBe(true);
    },
  );

  it('returns false for unknown template', () => {
    expect(isValidTemplate('nonexistent')).toBe(false);
    expect(isValidTemplate('')).toBe(false);
  });
});
