// ═══════════════════════════════════════════════════════════════
//  Queue Processor — Phase 1 (C-3)
//  앱 초기화 시 localStorage 큐의 실패한 요청을 재시도
//  참조: MASTER_PLAN_V4.md §16.1
//
//  흐름:
//    1. retryQueue.getAll() → 각 요청 순차 처리
//    2. 성공 → retryQueue.remove()
//    3. 실패 → attempts++ (maxAttempts 초과 시 console.error + 제거)
// ═══════════════════════════════════════════════════════════════

import { getAll, remove, updateAttempt } from '@/services/retry-queue';
import type { RetryableRequest } from '@/services/retry-queue';

// ─── Types ───────────────────────────────────────────────────

export interface QueueProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  permanentlyFailed: number;
}

// ─── Constants ───────────────────────────────────────────────

const PROCESS_TIMEOUT_MS = 15_000;

// ─── Helpers ─────────────────────────────────────────────────

async function attemptRequest(request: RetryableRequest): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROCESS_TIMEOUT_MS);

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: { 'Content-Type': 'application/json' },
      body: request.body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return false;
    }

    interface ProcessResponse {
      success: boolean;
    }

    const result: ProcessResponse = await response.json();
    return result.success === true;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

// ─── Main Processor ──────────────────────────────────────────

/**
 * Process all queued requests.
 * Called on app initialization (_app.tsx) and optionally on network restore.
 *
 * @returns Summary of processing results
 */
export async function processQueue(): Promise<QueueProcessResult> {
  const queue = getAll();

  if (queue.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, permanentlyFailed: 0 };
  }

  console.log(`[queue-processor] Processing ${queue.length} queued request(s)...`);

  const result: QueueProcessResult = {
    processed: queue.length,
    succeeded: 0,
    failed: 0,
    permanentlyFailed: 0,
  };

  for (const request of queue) {
    const success = await attemptRequest(request);

    if (success) {
      remove(request.id);
      result.succeeded += 1;
      console.log(`[queue-processor] ✅ Request ${request.id} succeeded`);
    } else {
      // Check if max attempts reached
      const newAttempts = request.attempts + 1;

      if (newAttempts >= request.maxAttempts) {
        // Permanently failed — remove from queue and report
        remove(request.id);
        result.permanentlyFailed += 1;

        console.error(
          `[queue-processor] ❌ Request ${request.id} permanently failed after ${newAttempts} attempts. ` +
          `URL: ${request.url}, Created: ${request.createdAt}, Last error: ${request.lastError}`
        );

        // TODO Phase 2: Sentry.captureMessage() here
      } else {
        // Still has retries left — update attempt count
        updateAttempt(request.id, 'Queue processor retry failed');
        result.failed += 1;
        console.warn(
          `[queue-processor] ⚠️ Request ${request.id} failed (attempt ${newAttempts}/${request.maxAttempts})`
        );
      }
    }
  }

  console.log(
    `[queue-processor] Done: ${result.succeeded} succeeded, ${result.failed} retryable, ${result.permanentlyFailed} permanently failed`
  );

  return result;
}
