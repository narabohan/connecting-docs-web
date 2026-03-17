// ═══════════════════════════════════════════════════════════════
//  EmailService — Phase 2 (G-4)
//  SendGrid 이메일 발송 서비스 (서버-사이드 전용)
//
//  Features:
//  - SendGrid @sendgrid/mail SDK 연동
//  - Mock 모드: SENDGRID_API_KEY 없으면 console.log 대체
//  - 서버-사이드 재시도: 최대 3회, 지수 백오프
//  - Rate limiting: SendGrid free tier 100/day 체크
//  - Airtable EmailLogs 발송 로그 기록 (best-effort)
//
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type {
  SendEmailRequest,
  EmailSendResult,
  EmailStatus,
  EmailTemplateType,
  EmailLocale,
} from '@/schemas/email';
import { generateEmailId } from '@/schemas/email';

// ─── Environment Config ──────────────────────────────────────

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY ?? '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'noreply@connectingdocs.ai';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME ?? 'ConnectingDocs';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY ?? '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? '';
const EMAIL_LOGS_TABLE = 'EmailLogs';

const IS_MOCK_MODE = !SENDGRID_API_KEY;

// ─── Rate Limiting (in-memory, per-process) ──────────────────

const DAILY_LIMIT = 100; // SendGrid free tier
let dailySendCount = 0;
let dailyResetDate = new Date().toDateString();

function checkAndIncrementDailyLimit(): boolean {
  const today = new Date().toDateString();
  if (today !== dailyResetDate) {
    dailySendCount = 0;
    dailyResetDate = today;
  }
  if (dailySendCount >= DAILY_LIMIT) {
    return false; // rate limited
  }
  dailySendCount += 1;
  return true;
}

/** Exported for testing */
export function getDailySendCount(): number {
  return dailySendCount;
}

/** Exported for testing */
export function resetDailyLimit(): void {
  dailySendCount = 0;
  dailyResetDate = new Date().toDateString();
}

// ─── Airtable Helpers ────────────────────────────────────────

function airtableHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function getEmailLogsUrl(): string {
  return `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(EMAIL_LOGS_TABLE)}`;
}

interface EmailLogFields {
  emailId: string;
  recipient: string;
  template: EmailTemplateType;
  locale: string;
  status: EmailStatus;
  sentAt?: string;
  error?: string;
  retryCount: number;
  createdAt: string;
}

/**
 * Log email send event to Airtable (best-effort, never throws)
 */
async function logToAirtable(fields: EmailLogFields): Promise<void> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.info('[email-service] Airtable not configured, skipping log');
    return;
  }

  try {
    const res = await fetch(getEmailLogsUrl(), {
      method: 'POST',
      headers: airtableHeaders(),
      body: JSON.stringify({
        fields: {
          emailId: fields.emailId,
          recipient: fields.recipient,
          template: fields.template,
          locale: fields.locale,
          status: fields.status,
          sentAt: fields.sentAt ?? '',
          error: fields.error ?? '',
          retryCount: fields.retryCount,
          createdAt: fields.createdAt,
        },
      }),
    });

    if (!res.ok) {
      console.warn(`[email-service] Airtable log failed: ${res.status}`);
    }
  } catch (err) {
    console.warn('[email-service] Airtable log error:', err instanceof Error ? err.message : 'unknown');
  }
}

// ─── SendGrid Send (Raw) ─────────────────────────────────────

interface SendGridPayload {
  personalizations: Array<{
    to: Array<{ email: string; name?: string }>;
  }>;
  from: { email: string; name: string };
  subject: string;
  content: Array<{ type: string; value: string }>;
}

async function sendViaSendGrid(
  to: string,
  toName: string,
  subject: string,
  htmlContent: string,
): Promise<{ success: boolean; error: string | null }> {
  const payload: SendGridPayload = {
    personalizations: [
      {
        to: [{ email: to, ...(toName ? { name: toName } : {}) }],
      },
    ],
    from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
    subject,
    content: [{ type: 'text/html', value: htmlContent }],
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 202 || res.status === 200) {
    return { success: true, error: null };
  }

  const errBody = await res.text().catch(() => 'unknown error');
  return { success: false, error: `SendGrid ${res.status}: ${errBody}` };
}

// ─── Mock Send ───────────────────────────────────────────────

function mockSend(request: SendEmailRequest, subject: string): EmailSendResult {
  const emailId = generateEmailId();
  console.info(
    `[email-service][MOCK] Would send "${request.template}" to ${request.recipient}`,
    `| Subject: "${subject}"`,
    `| Locale: ${request.locale}`,
    `| Data:`, JSON.stringify(request.data),
  );
  return {
    success: true,
    emailId,
    status: 'sent',
    error: null,
  };
}

// ─── Retry with Exponential Backoff ──────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 500,
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// ─── Subject Line Generator ─────────────────────────────────

const SUBJECT_MAP: Record<EmailTemplateType, Record<EmailLocale, string>> = {
  'report-ready': {
    KO: '[ConnectingDocs] 상담 리포트가 준비되었습니다',
    EN: '[ConnectingDocs] Your consultation report is ready',
    JP: '[ConnectingDocs] カウンセリングレポートが準備できました',
    'ZH-CN': '[ConnectingDocs] 您的咨询报告已准备就绪',
  },
  'plan-ready': {
    KO: '[ConnectingDocs] 새 Treatment Plan 검토 요청',
    EN: '[ConnectingDocs] New treatment plan needs your review',
    JP: '[ConnectingDocs] 新しいトリートメントプランのレビューをお願いします',
    'ZH-CN': '[ConnectingDocs] 新的治疗方案需要您审核',
  },
  'plan-approved': {
    KO: '[ConnectingDocs] Treatment Plan이 승인되었습니다',
    EN: '[ConnectingDocs] Your treatment plan has been approved',
    JP: '[ConnectingDocs] トリートメントプランが承認されました',
    'ZH-CN': '[ConnectingDocs] 您的治疗方案已获批准',
  },
  welcome: {
    KO: '[ConnectingDocs] 환영합니다!',
    EN: '[ConnectingDocs] Welcome to ConnectingDocs!',
    JP: '[ConnectingDocs] ようこそ！',
    'ZH-CN': '[ConnectingDocs] 欢迎加入ConnectingDocs！',
  },
};

function getSubject(template: EmailTemplateType, locale: EmailLocale): string {
  return SUBJECT_MAP[template]?.[locale] ?? SUBJECT_MAP[template]?.EN ?? `[ConnectingDocs] ${template}`;
}

// ─── HTML Content Placeholder (Task 2 will replace) ──────────

function getPlaceholderHtml(template: EmailTemplateType, data: Record<string, string>): string {
  const dataHtml = Object.entries(data)
    .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#0F172A;">ConnectingDocs</h2>
      <p>Template: <strong>${template}</strong></p>
      <ul>${dataHtml || '<li>No data</li>'}</ul>
      <p style="color:#666;font-size:12px;">This is a placeholder template. Production templates will be added in Task 2.</p>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
//  Public API
// ═══════════════════════════════════════════════════════════════

/**
 * Send an email using the configured provider (SendGrid or Mock).
 *
 * Features:
 * - Mock mode when SENDGRID_API_KEY is not set
 * - Rate limiting (100/day free tier)
 * - Server-side retry (3 attempts, exponential backoff)
 * - Airtable log recording (best-effort)
 *
 * NEVER throws — always returns EmailSendResult
 */
export async function sendEmail(request: SendEmailRequest): Promise<EmailSendResult> {
  const emailId = generateEmailId();
  const subject = getSubject(request.template, request.locale);
  const now = new Date().toISOString();

  // ── Mock mode
  if (IS_MOCK_MODE) {
    const result = mockSend(request, subject);

    // Still log to Airtable in mock mode (if configured)
    logToAirtable({
      emailId: result.emailId,
      recipient: request.recipient,
      template: request.template,
      locale: request.locale,
      status: 'sent',
      sentAt: now,
      retryCount: 0,
      createdAt: now,
    }).catch(() => {});

    return result;
  }

  // ── Rate limit check
  if (!checkAndIncrementDailyLimit()) {
    console.warn(`[email-service] Daily rate limit reached (${DAILY_LIMIT}/day)`);

    logToAirtable({
      emailId,
      recipient: request.recipient,
      template: request.template,
      locale: request.locale,
      status: 'rate_limited',
      retryCount: 0,
      createdAt: now,
    }).catch(() => {});

    return {
      success: false,
      emailId,
      status: 'rate_limited',
      error: `Daily email limit reached (${DAILY_LIMIT}/day)`,
    };
  }

  // ── Get HTML content (placeholder until Task 2)
  const htmlContent = getPlaceholderHtml(request.template, request.data);

  // ── Send with retry
  try {
    const result = await withRetry(async () => {
      const sendResult = await sendViaSendGrid(
        request.recipient,
        request.recipientName,
        subject,
        htmlContent,
      );
      if (!sendResult.success) {
        throw new Error(sendResult.error ?? 'SendGrid send failed');
      }
      return sendResult;
    }, 3, 500);

    // Log success
    logToAirtable({
      emailId,
      recipient: request.recipient,
      template: request.template,
      locale: request.locale,
      status: 'sent',
      sentAt: new Date().toISOString(),
      retryCount: 0,
      createdAt: now,
    }).catch(() => {});

    return {
      success: true,
      emailId,
      status: 'sent',
      error: null,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown send error';
    console.error(`[email-service] Failed to send ${request.template} to ${request.recipient}:`, errorMsg);

    // Log failure
    logToAirtable({
      emailId,
      recipient: request.recipient,
      template: request.template,
      locale: request.locale,
      status: 'failed',
      error: errorMsg,
      retryCount: 3,
      createdAt: now,
    }).catch(() => {});

    return {
      success: false,
      emailId,
      status: 'failed',
      error: errorMsg,
    };
  }
}

/**
 * Fire-and-forget email send.
 * Logs errors but NEVER blocks the caller.
 * Use this for trigger points where email failure shouldn't affect business logic.
 */
export function sendEmailFireAndForget(request: SendEmailRequest): void {
  sendEmail(request).catch((err) => {
    console.error(
      '[email-service] Fire-and-forget failed:',
      err instanceof Error ? err.message : 'unknown',
    );
  });
}

// ─── Airtable Query Helper (for log API) ─────────────────────

export interface EmailLogQueryParams {
  startDate?: string;
  endDate?: string;
  status?: EmailStatus;
  template?: EmailTemplateType;
  limit?: number;
}

interface AirtableEmailLogRecord {
  id: string;
  fields: {
    emailId?: string;
    recipient?: string;
    template?: string;
    locale?: string;
    status?: string;
    sentAt?: string;
    error?: string;
    retryCount?: number;
    createdAt?: string;
  };
}

export interface EmailLogEntry {
  id: string;
  emailId: string;
  recipient: string;
  template: string;
  locale: string;
  status: string;
  sentAt: string;
  error: string;
  retryCount: number;
  createdAt: string;
}

/**
 * Query email logs from Airtable.
 * Returns empty array if Airtable is not configured.
 */
export async function queryEmailLogs(params: EmailLogQueryParams): Promise<EmailLogEntry[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return [];
  }

  const filters: string[] = [];

  if (params.status) {
    filters.push(`{status} = '${params.status}'`);
  }
  if (params.template) {
    filters.push(`{template} = '${params.template}'`);
  }
  if (params.startDate) {
    filters.push(`IS_AFTER({createdAt}, '${params.startDate}')`);
  }
  if (params.endDate) {
    filters.push(`IS_BEFORE({createdAt}, '${params.endDate}')`);
  }

  let url = getEmailLogsUrl();
  const queryParams: string[] = [];

  if (filters.length > 0) {
    const formula = filters.length === 1
      ? filters[0]
      : `AND(${filters.join(', ')})`;
    queryParams.push(`filterByFormula=${encodeURIComponent(formula)}`);
  }

  queryParams.push(`maxRecords=${params.limit ?? 50}`);
  queryParams.push('sort%5B0%5D%5Bfield%5D=createdAt&sort%5B0%5D%5Bdirection%5D=desc');

  url += `?${queryParams.join('&')}`;

  try {
    const res = await fetch(url, { headers: airtableHeaders() });
    if (!res.ok) {
      console.warn(`[email-service] Failed to query logs: ${res.status}`);
      return [];
    }

    const data = (await res.json()) as { records: AirtableEmailLogRecord[] };
    return data.records.map((r) => ({
      id: r.id,
      emailId: r.fields.emailId ?? '',
      recipient: r.fields.recipient ?? '',
      template: r.fields.template ?? '',
      locale: r.fields.locale ?? 'KO',
      status: r.fields.status ?? 'queued',
      sentAt: r.fields.sentAt ?? '',
      error: r.fields.error ?? '',
      retryCount: r.fields.retryCount ?? 0,
      createdAt: r.fields.createdAt ?? '',
    }));
  } catch (err) {
    console.warn('[email-service] Query logs error:', err instanceof Error ? err.message : 'unknown');
    return [];
  }
}
