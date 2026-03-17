/**
 * @jest-environment jsdom
 */
// ═══════════════════════════════════════════════════════════════
//  local-report-store.test.ts — Phase 1 (C-8)
//  localStorage 기반 리포트 ID 저장 단위 테스트
// ═══════════════════════════════════════════════════════════════

import {
  saveReportId,
  getReportIds,
  getStoredCount,
} from '@/services/local-report-store';

// ─── Tests ──────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('local-report-store', () => {
  // ── Test 9: saveReportId — 10개 초과 시 FIFO 삭제 ──
  it('saveReportId evicts oldest entry when exceeding max of 10', () => {
    // Save 11 reports
    for (let i = 1; i <= 11; i++) {
      saveReportId(`report_${i}`);
    }

    const ids = getReportIds();
    expect(ids.length).toBe(10);

    // The first one (report_1) should have been evicted
    expect(ids).not.toContain('report_1');

    // The most recent one (report_11) should be at front
    expect(ids[0]).toBe('report_11');

    // report_2 (oldest surviving) should be at end
    expect(ids[ids.length - 1]).toBe('report_2');
  });

  // ── Test 10: getReportIds — 빈 localStorage 시 빈 배열 ──
  it('getReportIds returns empty array when localStorage has no data', () => {
    const ids = getReportIds();
    expect(ids).toEqual([]);
    expect(getStoredCount()).toBe(0);
  });
});
