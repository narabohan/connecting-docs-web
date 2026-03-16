// ═══════════════════════════════════════════════════════════════
//  Retry Queue Service — Phase 1 (C-3)
//  localStorage 기반 FIFO 큐: 네트워크 실패 시 요청 보관
//  참조: MASTER_PLAN_V4.md §16.1 (Await-Confirm + Retry Queue)
//
//  설계:
//  - 3회 재시도 실패 → localStorage 큐 저장
//  - 다음 앱 로드 시 queue-processor가 재시도
//  - maxAttempts 초과 시 Sentry 알림 대상
// ═══════════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────────────

export interface RetryableRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT';
  body: string;            // JSON serialized
  attempts: number;
  maxAttempts: number;
  createdAt: string;       // ISO date
  lastError: string | null;
}

export type RetryableRequestInput = Omit<
  RetryableRequest,
  'id' | 'attempts' | 'createdAt'
>;

// ─── Constants ───────────────────────────────────────────────

const STORAGE_KEY = 'cdocs_retry_queue';
const DEFAULT_MAX_ATTEMPTS = 3;

// ─── ID Generator (no external dependency) ───────────────────

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `rq_${ts}_${rand}`;
}

// ─── Storage Helpers ─────────────────────────────────────────

function readQueue(): RetryableRequest[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: RetryableRequest[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error('[retry-queue] Failed to read localStorage queue');
    return [];
  }
}

function writeQueue(queue: RetryableRequest[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('[retry-queue] Failed to write localStorage queue:', err);
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Add a failed request to the retry queue.
 * Assigns a unique ID, sets attempts to 0, and timestamps.
 */
export function enqueue(input: RetryableRequestInput): RetryableRequest {
  const request: RetryableRequest = {
    id: generateId(),
    url: input.url,
    method: input.method,
    body: input.body,
    attempts: 0,
    maxAttempts: input.maxAttempts || DEFAULT_MAX_ATTEMPTS,
    createdAt: new Date().toISOString(),
    lastError: input.lastError,
  };

  const queue = readQueue();
  queue.push(request);
  writeQueue(queue);

  console.log(`[retry-queue] Enqueued request ${request.id} → ${request.url}`);
  return request;
}

/**
 * Dequeue the oldest request (FIFO order).
 * Returns null if queue is empty.
 * Does NOT remove from queue — call remove() after successful processing.
 */
export function dequeue(): RetryableRequest | null {
  const queue = readQueue();
  return queue.length > 0 ? queue[0] : null;
}

/**
 * Get all items in the queue (for batch processing).
 */
export function getAll(): RetryableRequest[] {
  return readQueue();
}

/**
 * Remove a specific request by ID (after successful processing).
 */
export function remove(id: string): void {
  const queue = readQueue();
  const filtered = queue.filter((r) => r.id !== id);
  writeQueue(filtered);
}

/**
 * Update a request's attempt count and error message.
 */
export function updateAttempt(id: string, error: string): void {
  const queue = readQueue();
  const item = queue.find((r) => r.id === id);
  if (item) {
    item.attempts += 1;
    item.lastError = error;
    writeQueue(queue);
  }
}

/**
 * Get the number of items in the queue.
 */
export function getQueueSize(): number {
  return readQueue().length;
}

/**
 * Clear the entire queue (admin/debug use).
 */
export function clearQueue(): void {
  writeQueue([]);
}
