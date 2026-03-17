// ═══════════════════════════════════════════════════════════════
//  GET /api/email/log — Phase 2 (G-4)
//  이메일 발송 기록 조회 API (admin 전용)
//
//  Query params:
//  - startDate: ISO datetime (optional)
//  - endDate: ISO datetime (optional)
//  - status: queued | sent | failed | rate_limited (optional)
//  - template: report-ready | plan-ready | plan-approved | welcome (optional)
//  - limit: number (default 50, max 100)
//
//  G-5 AdminDash에서 소비 예정
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { NextApiResponse } from 'next';
import { apiRoleGuard, type AuthenticatedRequest } from '@/lib/apiRoleGuard';
import {
  queryEmailLogs,
  type EmailLogQueryParams,
  type EmailLogEntry,
} from '@/services/email-service';
import {
  EmailStatusSchema,
  EmailTemplateTypeSchema,
} from '@/schemas/email';

// ─── Types ───────────────────────────────────────────────────

interface SuccessResponse {
  ok: true;
  logs: EmailLogEntry[];
  count: number;
}

interface ErrorResponse {
  ok: false;
  error: string;
  code: 'METHOD_NOT_ALLOWED' | 'VALIDATION_ERROR';
}

type LogResponse = SuccessResponse | ErrorResponse;

// ─── Handler ─────────────────────────────────────────────────

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<LogResponse>,
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({
      ok: false,
      error: `Method ${req.method ?? 'unknown'} not allowed`,
      code: 'METHOD_NOT_ALLOWED',
    });
    return;
  }

  // Parse query params
  const { startDate, endDate, status, template, limit } = req.query;

  const params: EmailLogQueryParams = {};

  if (typeof startDate === 'string' && startDate) {
    params.startDate = startDate;
  }
  if (typeof endDate === 'string' && endDate) {
    params.endDate = endDate;
  }

  // Validate status if provided
  if (typeof status === 'string' && status) {
    const statusResult = EmailStatusSchema.safeParse(status);
    if (!statusResult.success) {
      res.status(400).json({
        ok: false,
        error: `Invalid status: ${status}. Must be one of: queued, sent, failed, rate_limited`,
        code: 'VALIDATION_ERROR',
      });
      return;
    }
    params.status = statusResult.data;
  }

  // Validate template if provided
  if (typeof template === 'string' && template) {
    const templateResult = EmailTemplateTypeSchema.safeParse(template);
    if (!templateResult.success) {
      res.status(400).json({
        ok: false,
        error: `Invalid template: ${template}. Must be one of: report-ready, plan-ready, plan-approved, welcome`,
        code: 'VALIDATION_ERROR',
      });
      return;
    }
    params.template = templateResult.data;
  }

  // Parse limit (default 50, max 100)
  if (typeof limit === 'string' && limit) {
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      params.limit = Math.min(parsedLimit, 100);
    }
  }

  const logs = await queryEmailLogs(params);

  res.status(200).json({
    ok: true,
    logs,
    count: logs.length,
  });
}

// ─── Export with admin-only guard ────────────────────────────
export default apiRoleGuard(handler, ['admin']);
