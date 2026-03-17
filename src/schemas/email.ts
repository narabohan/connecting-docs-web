// ═══════════════════════════════════════════════════════════════
//  Email — Zod Schemas + Types
//  §Phase 2 (G-4): SendGrid 이메일 파이프라인
//
//  Template types: report-ready, plan-ready, plan-approved, welcome
//  Lenient parsing with .default() — NEVER throws
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

// ─── Email Template Types ────────────────────────────────────

export const EmailTemplateTypeSchema = z.enum([
  'report-ready',
  'plan-ready',
  'plan-approved',
  'welcome',
]);

export type EmailTemplateType = z.infer<typeof EmailTemplateTypeSchema>;

// ─── Email Locale ────────────────────────────────────────────

export const EmailLocaleSchema = z.enum(['KO', 'EN', 'JP', 'ZH-CN']);
export type EmailLocale = z.infer<typeof EmailLocaleSchema>;

// ─── Email Status ────────────────────────────────────────────

export const EmailStatusSchema = z.enum([
  'queued',
  'sent',
  'failed',
  'rate_limited',
]);

export type EmailStatus = z.infer<typeof EmailStatusSchema>;

// ─── Template Data (polymorphic per template) ────────────────

export const ReportReadyDataSchema = z.object({
  patientName: z.string().default(''),
  reportId: z.string().default(''),
  reportUrl: z.string().default(''),
});

export const PlanReadyDataSchema = z.object({
  doctorName: z.string().default(''),
  patientId: z.string().default(''),
  planId: z.string().default(''),
  dashboardUrl: z.string().default(''),
});

export const PlanApprovedDataSchema = z.object({
  patientName: z.string().default(''),
  planId: z.string().default(''),
  planUrl: z.string().default(''),
  doctorName: z.string().default(''),
});

export const WelcomeDataSchema = z.object({
  userName: z.string().default(''),
  startUrl: z.string().default(''),
});

export type ReportReadyData = z.infer<typeof ReportReadyDataSchema>;
export type PlanReadyData = z.infer<typeof PlanReadyDataSchema>;
export type PlanApprovedData = z.infer<typeof PlanApprovedDataSchema>;
export type WelcomeData = z.infer<typeof WelcomeDataSchema>;

// ─── Generic template data union ─────────────────────────────

export type EmailTemplateData =
  | ReportReadyData
  | PlanReadyData
  | PlanApprovedData
  | WelcomeData;

// ─── Send Email Request ──────────────────────────────────────

export const SendEmailRequestSchema = z.object({
  recipient: z.string().email(),
  recipientName: z.string().default(''),
  template: EmailTemplateTypeSchema,
  locale: EmailLocaleSchema.default('KO'),
  data: z.record(z.string(), z.string()).default({}),
});

export type SendEmailRequest = z.infer<typeof SendEmailRequestSchema>;

// ─── Email Send Result ───────────────────────────────────────

export interface EmailSendResult {
  success: boolean;
  emailId: string;
  status: EmailStatus;
  error: string | null;
}

// ─── Email Log (Airtable record) ─────────────────────────────

export const EmailLogSchema = z.object({
  emailId: z.string().min(1),
  recipient: z.string().email(),
  template: EmailTemplateTypeSchema,
  locale: EmailLocaleSchema.default('KO'),
  status: EmailStatusSchema.default('queued'),
  sentAt: z.string().datetime().optional(),
  error: z.string().optional(),
  retryCount: z.number().default(0),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type EmailLog = z.infer<typeof EmailLogSchema>;

// ─── Validation Helper ───────────────────────────────────────

export function validateSendEmailRequest(raw: Record<string, unknown>): {
  success: boolean;
  data?: SendEmailRequest;
  error?: string;
} {
  const result = SendEmailRequestSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    return { success: false, error: issues.join('; ') };
  }
  return { success: true, data: result.data };
}

// ─── ID Generator ────────────────────────────────────────────

export function generateEmailId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `em_${ts}_${rand}`;
}
