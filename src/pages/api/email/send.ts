// ═══════════════════════════════════════════════════════════════
//  POST /api/email/send — Phase 2 (G-4)
//  내부 전용 이메일 발송 API (SendGrid 기반)
//
//  Auth: 내부 API 키 검증 (INTERNAL_API_KEY) 또는 서버-사이드 호출
//  - 서버-사이드 트리거에서 호출 (generate.ts, [planId].ts 등)
//  - 외부 직접 호출 차단
//
//  Replaces legacy Resend-based implementation.
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/services/email-service';
import { validateSendEmailRequest, type EmailSendResult } from '@/schemas/email';

// ─── Internal API Key ────────────────────────────────────────

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? '';

// ─── Types ───────────────────────────────────────────────────

interface SuccessResponse {
  ok: true;
  result: EmailSendResult;
}

interface ErrorResponse {
  ok: false;
  error: string;
  code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'METHOD_NOT_ALLOWED';
}

type SendResponse = SuccessResponse | ErrorResponse;

// ─── Auth Check ──────────────────────────────────────────────

function isAuthorized(req: NextApiRequest): boolean {
  // Option 1: Internal API key via x-api-key header
  const apiKey = req.headers['x-api-key'];
  if (typeof apiKey === 'string' && INTERNAL_API_KEY && apiKey === INTERNAL_API_KEY) {
    return true;
  }

  // Option 2: Internal API key via x-internal-key header (server-to-server)
  const internalKey = req.headers['x-internal-key'];
  if (typeof internalKey === 'string' && INTERNAL_API_KEY && internalKey === INTERNAL_API_KEY) {
    return true;
  }

  // Option 3: If no INTERNAL_API_KEY is configured, allow server-side calls
  // (dev/test environments where internal key isn't set up yet)
  if (!INTERNAL_API_KEY) {
    const caller = req.headers['x-internal-caller'];
    if (caller === 'connectingdocs-server') {
      return true;
    }
  }

  return false;
}

// ─── Handler ─────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SendResponse>,
): Promise<void> {
  // Only POST allowed
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({
      ok: false,
      error: `Method ${req.method ?? 'unknown'} not allowed`,
      code: 'METHOD_NOT_ALLOWED',
    });
    return;
  }

  // Auth check
  if (!isAuthorized(req)) {
    res.status(401).json({
      ok: false,
      error: 'Unauthorized: internal API key required',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  // Validate request body
  const validation = validateSendEmailRequest(req.body as Record<string, unknown>);
  if (!validation.success || !validation.data) {
    res.status(400).json({
      ok: false,
      error: `Validation failed: ${validation.error ?? 'unknown'}`,
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  // Send email (never throws)
  const result = await sendEmail(validation.data);

  // Always return 200 — caller checks result.success/status
  res.status(200).json({ ok: true, result });
}
