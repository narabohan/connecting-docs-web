// ═══════════════════════════════════════════════════════════════
//  useAwaitConfirm — Phase 1 (C-3)
//  Await-Confirm 패턴: 요청 → 확인 → 재시도 → 큐 저장
//  참조: MASTER_PLAN_V4.md §16.1
//
//  사용법:
//    const { execute, status, error } = useAwaitConfirm();
//    await execute('/api/survey-v2/save-result', payload);
//
//  동작:
//    1. POST 전송 (status: sending)
//    2. 응답 대기 (status: confirming) — 15초 타임아웃
//    3. 200 + confirm → status: success
//    4. 에러/타임아웃 → 재시도 (최대 3회, 지수 백오프 1s→2s→4s)
//    5. 3회 실패 → retryQueue.enqueue() + status: queued
//    6. 큐 저장 실패 → status: failed
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import { enqueue } from '@/services/retry-queue';

// ─── Types ───────────────────────────────────────────────────

export type AwaitConfirmStatus =
  | 'idle'
  | 'sending'
  | 'confirming'
  | 'success'
  | 'queued'
  | 'failed';

interface ConfirmField {
  saved_at: string;
  record_id: string;
}

interface AwaitConfirmResponse {
  success: boolean;
  confirm?: ConfirmField;
  error?: string;
}

interface UseAwaitConfirmReturn {
  execute: (url: string, data: Record<string, unknown>) => Promise<AwaitConfirmStatus>;
  status: AwaitConfirmStatus;
  error: string | null;
  confirmData: ConfirmField | null;
  reset: () => void;
}

// ─── Constants ───────────────────────────────────────────────

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 15_000;
const BASE_BACKOFF_MS = 1_000;

// ─── Helpers ─────────────────────────────────────────────────

/** Exponential backoff: 1s → 2s → 4s */
function getBackoffMs(attempt: number): number {
  return BASE_BACKOFF_MS * Math.pow(2, attempt);
}

/** Sleep helper */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch with timeout using AbortController */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Hook ────────────────────────────────────────────────────

export function useAwaitConfirm(): UseAwaitConfirmReturn {
  const [status, setStatus] = useState<AwaitConfirmStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<ConfirmField | null>(null);
  const executingRef = useRef(false);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setConfirmData(null);
    executingRef.current = false;
  }, []);

  const execute = useCallback(
    async (url: string, data: Record<string, unknown>): Promise<AwaitConfirmStatus> => {
      // Prevent concurrent executions
      if (executingRef.current) return status;
      executingRef.current = true;

      setError(null);
      setConfirmData(null);

      const bodyStr = JSON.stringify(data);
      let lastErrorMsg = '';

      // ── Retry loop (up to MAX_RETRIES)
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          // Backoff before retry (skip on first attempt)
          if (attempt > 0) {
            const backoffMs = getBackoffMs(attempt - 1);
            console.log(`[useAwaitConfirm] Retry #${attempt + 1} after ${backoffMs}ms backoff`);
            await sleep(backoffMs);
          }

          // ── Send request
          setStatus('sending');

          const response = await fetchWithTimeout(
            url,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: bodyStr,
              keepalive: true,
            },
            REQUEST_TIMEOUT_MS
          );

          // ── Confirm response
          setStatus('confirming');

          if (!response.ok) {
            const errText = await response.text().catch(() => 'Unknown error');
            lastErrorMsg = `HTTP ${response.status}: ${errText.slice(0, 200)}`;
            console.warn(`[useAwaitConfirm] Attempt ${attempt + 1}/${MAX_RETRIES} failed: ${lastErrorMsg}`);
            continue;
          }

          const result: AwaitConfirmResponse = await response.json();

          if (result.success && result.confirm) {
            // ── Success with confirmation
            setConfirmData(result.confirm);
            setStatus('success');
            executingRef.current = false;
            return 'success';
          }

          if (result.success) {
            // ── Success without explicit confirm (backward compat)
            setStatus('success');
            executingRef.current = false;
            return 'success';
          }

          // ── API returned success: false
          lastErrorMsg = result.error || 'API returned success: false';
          console.warn(`[useAwaitConfirm] Attempt ${attempt + 1}/${MAX_RETRIES}: ${lastErrorMsg}`);
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            lastErrorMsg = `Request timeout after ${REQUEST_TIMEOUT_MS}ms`;
          } else if (err instanceof Error) {
            lastErrorMsg = err.message;
          } else {
            lastErrorMsg = 'Unknown network error';
          }
          console.warn(`[useAwaitConfirm] Attempt ${attempt + 1}/${MAX_RETRIES}: ${lastErrorMsg}`);
        }
      }

      // ── All retries exhausted → enqueue for later
      console.error(`[useAwaitConfirm] All ${MAX_RETRIES} attempts failed. Enqueueing for later retry.`);

      try {
        enqueue({
          url,
          method: 'POST',
          body: bodyStr,
          maxAttempts: MAX_RETRIES,
          lastError: lastErrorMsg,
        });
        setError(lastErrorMsg);
        setStatus('queued');
        executingRef.current = false;
        return 'queued';
      } catch (queueErr) {
        // localStorage itself failed
        const queueErrMsg = queueErr instanceof Error ? queueErr.message : 'Queue storage failed';
        console.error('[useAwaitConfirm] Failed to enqueue:', queueErrMsg);
        setError(`${lastErrorMsg} (queue: ${queueErrMsg})`);
        setStatus('failed');
        executingRef.current = false;
        return 'failed';
      }
    },
    [status]
  );

  return { execute, status, error, confirmData, reset };
}
