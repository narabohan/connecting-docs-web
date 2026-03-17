/**
 * @jest-environment jsdom
 */
// ═══════════════════════════════════════════════════════════════
//  consent-utils.test.ts — Phase 1 (C-8)
//  동의 유틸 단위 테스트: 국가별 필수 항목, localStorage 읽기
// ═══════════════════════════════════════════════════════════════

import {
  isConsentRequired,
  hasConsent,
  saveConsentToLocal,
  getConsentVersion,
} from '@/lib/consent-utils';

// ─── Tests ──────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('consent-utils', () => {
  // ── Test 11: isConsentRequired('KR') — 필수 3개 반환 ──
  it('isConsentRequired returns 3 required categories for KR (PIPA)', () => {
    const required = isConsentRequired('KR');

    expect(required).toHaveLength(3);
    expect(required).toContain('essential');
    expect(required).toContain('ai_processing');
    expect(required).toContain('analytics');
    expect(required).not.toContain('marketing');
  });

  // ── Test 12: isConsentRequired('JP') — 필수 2개 반환 ──
  it('isConsentRequired returns 2 required categories for JP (APPI)', () => {
    const required = isConsentRequired('JP');

    expect(required).toHaveLength(2);
    expect(required).toContain('essential');
    expect(required).toContain('ai_processing');
    expect(required).not.toContain('analytics');
    expect(required).not.toContain('marketing');
  });

  // ── Test 13: hasConsent — localStorage에서 올바르게 읽기 ──
  it('hasConsent reads consent correctly from localStorage', () => {
    // Initially should return false (no data)
    expect(hasConsent('essential')).toBe(false);
    expect(hasConsent('marketing')).toBe(false);

    // Save consent with essential=true, marketing=false
    saveConsentToLocal(
      {
        essential: true,
        analytics: true,
        ai_processing: true,
        marketing: false,
      },
      'KR'
    );

    // Now should reflect saved values
    expect(hasConsent('essential')).toBe(true);
    expect(hasConsent('analytics')).toBe(true);
    expect(hasConsent('ai_processing')).toBe(true);
    expect(hasConsent('marketing')).toBe(false);

    // Version should match
    expect(getConsentVersion()).toBe('V1.0.0');
  });
});
