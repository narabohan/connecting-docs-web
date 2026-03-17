/**
 * @jest-environment jsdom
 */
// ═══════════════════════════════════════════════════════════════
//  retry-queue.test.ts — Phase 1 (C-8)
//  localStorage 기반 FIFO 큐 단위 테스트
// ═══════════════════════════════════════════════════════════════

import {
  enqueue,
  dequeue,
  getQueueSize,
  remove,
  getAll,
  clearQueue,
} from '@/services/retry-queue';
import type { RetryableRequestInput } from '@/services/retry-queue';

// ─── Helpers ────────────────────────────────────────────────

function makeInput(url: string): RetryableRequestInput {
  return {
    url,
    method: 'POST',
    body: JSON.stringify({ test: true }),
    maxAttempts: 3,
    lastError: null,
  };
}

// ─── Tests ──────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('retry-queue', () => {
  // ── Test 4: enqueue + dequeue — FIFO 순서 확인 ──
  it('enqueue + dequeue maintains FIFO order', () => {
    const first = enqueue(makeInput('/api/first'));
    const second = enqueue(makeInput('/api/second'));
    const third = enqueue(makeInput('/api/third'));

    const peeked = dequeue();
    expect(peeked).not.toBeNull();
    expect(peeked!.id).toBe(first.id);
    expect(peeked!.url).toBe('/api/first');

    // After removing first, dequeue should return second
    remove(first.id);
    const nextPeek = dequeue();
    expect(nextPeek!.id).toBe(second.id);

    // Verify all IDs are unique
    expect(new Set([first.id, second.id, third.id]).size).toBe(3);
  });

  // ── Test 5: getQueueSize — 0개, 1개, 5개 시나리오 ──
  it('getQueueSize returns correct count for 0, 1, and 5 items', () => {
    expect(getQueueSize()).toBe(0);

    enqueue(makeInput('/api/one'));
    expect(getQueueSize()).toBe(1);

    enqueue(makeInput('/api/two'));
    enqueue(makeInput('/api/three'));
    enqueue(makeInput('/api/four'));
    enqueue(makeInput('/api/five'));
    expect(getQueueSize()).toBe(5);
  });

  // ── Test 6: remove — 특정 아이템 제거 후 나머지 유지 ──
  it('remove deletes specific item while preserving others', () => {
    const a = enqueue(makeInput('/api/a'));
    const b = enqueue(makeInput('/api/b'));
    const c = enqueue(makeInput('/api/c'));

    expect(getQueueSize()).toBe(3);

    // Remove middle item
    remove(b.id);

    expect(getQueueSize()).toBe(2);

    const remaining = getAll();
    const remainingIds = remaining.map((r) => r.id);
    expect(remainingIds).toContain(a.id);
    expect(remainingIds).not.toContain(b.id);
    expect(remainingIds).toContain(c.id);
  });
});
