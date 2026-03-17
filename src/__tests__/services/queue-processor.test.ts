// ═══════════════════════════════════════════════════════════════
//  queue-processor.test.ts — Phase 1 (C-8)
//  큐 프로세서 단위 테스트: 성공 시 제거, 실패 시 attempts 증가
// ═══════════════════════════════════════════════════════════════

import type { RetryableRequest } from '@/services/retry-queue';

// ─── Mock retry-queue module ────────────────────────────────

const mockQueue: RetryableRequest[] = [];

jest.mock('@/services/retry-queue', () => ({
  getAll: jest.fn(() => [...mockQueue]),
  remove: jest.fn((id: string) => {
    const idx = mockQueue.findIndex((r) => r.id === id);
    if (idx >= 0) mockQueue.splice(idx, 1);
  }),
  updateAttempt: jest.fn((id: string, error: string) => {
    const item = mockQueue.find((r) => r.id === id);
    if (item) {
      item.attempts += 1;
      item.lastError = error;
    }
  }),
}));

// ─── Mock fetch ─────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Import after mocks ────────────────────────────────────

import { processQueue } from '@/services/queue-processor';

// ─── Helpers ────────────────────────────────────────────────

function makeRequest(id: string, url: string, attempts: number = 0, maxAttempts: number = 3): RetryableRequest {
  return {
    id,
    url,
    method: 'POST',
    body: JSON.stringify({ test: true }),
    attempts,
    maxAttempts,
    createdAt: '2026-03-17T00:00:00.000Z',
    lastError: null,
  };
}

// ─── Tests ──────────────────────────────────────────────────

beforeEach(() => {
  mockQueue.length = 0;
  mockFetch.mockReset();
  jest.clearAllMocks();
});

describe('queue-processor', () => {
  // ── Test 7: processQueue — 성공 시 큐에서 제거 ──
  it('removes request from queue on successful processing', async () => {
    const req = makeRequest('rq_success', '/api/save');
    mockQueue.push(req);

    // Mock successful fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const result = await processQueue();

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);

    // remove should have been called
    const { remove } = jest.requireMock('@/services/retry-queue') as { remove: jest.Mock };
    expect(remove).toHaveBeenCalledWith('rq_success');
  });

  // ── Test 8: processQueue — 실패 시 attempts 증가 + 큐 잔류 ──
  it('increments attempts and keeps request in queue on failure', async () => {
    const req = makeRequest('rq_fail', '/api/save', 0, 3);
    mockQueue.push(req);

    // Mock failed fetch response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ success: false }),
    });

    const result = await processQueue();

    expect(result.processed).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.succeeded).toBe(0);

    // updateAttempt should have been called
    const { updateAttempt } = jest.requireMock('@/services/retry-queue') as { updateAttempt: jest.Mock };
    expect(updateAttempt).toHaveBeenCalledWith('rq_fail', 'Queue processor retry failed');

    // Item should still be in queue (attempts < maxAttempts)
    expect(mockQueue.length).toBe(1);
    expect(mockQueue[0].attempts).toBe(1);
  });
});
