// ═══════════════════════════════════════════════════════════════
//  Template Renderer — Phase 2 (G-4)
//  템플릿 선택 + locale별 렌더링
//
//  4개국어 지원: 환자/의사의 locale 설정 기반
//  ConnectingDocs 브랜딩: #0F172A / #3B82F6
//  반응형: 모바일 이메일 클라이언트 호환
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type {
  EmailTemplateType,
  EmailLocale,
  ReportReadyData,
  PlanReadyData,
  PlanApprovedData,
  WelcomeData,
} from '@/schemas/email';
import {
  ReportReadyDataSchema,
  PlanReadyDataSchema,
  PlanApprovedDataSchema,
  WelcomeDataSchema,
} from '@/schemas/email';
import { renderReportReady } from './templates/report-ready';
import { renderPlanReady } from './templates/plan-ready';
import { renderPlanApproved } from './templates/plan-approved';
import { renderWelcome } from './templates/welcome';

// ─── Render Result ───────────────────────────────────────────

export interface RenderResult {
  html: string;
  success: boolean;
  error: string | null;
}

// ─── Template Renderer ───────────────────────────────────────

/**
 * Render an email template with the given data and locale.
 *
 * @param template - Template type to render
 * @param data - Raw data (Record<string, string>) from SendEmailRequest
 * @param locale - Target locale for the email content
 * @returns RenderResult with HTML string or error
 */
export function renderEmailTemplate(
  template: EmailTemplateType,
  data: Record<string, string>,
  locale: EmailLocale,
): RenderResult {
  try {
    switch (template) {
      case 'report-ready': {
        const parsed = ReportReadyDataSchema.parse(data);
        return {
          html: renderReportReady(parsed, locale),
          success: true,
          error: null,
        };
      }

      case 'plan-ready': {
        const parsed = PlanReadyDataSchema.parse(data);
        return {
          html: renderPlanReady(parsed, locale),
          success: true,
          error: null,
        };
      }

      case 'plan-approved': {
        const parsed = PlanApprovedDataSchema.parse(data);
        return {
          html: renderPlanApproved(parsed, locale),
          success: true,
          error: null,
        };
      }

      case 'welcome': {
        const parsed = WelcomeDataSchema.parse(data);
        return {
          html: renderWelcome(parsed, locale),
          success: true,
          error: null,
        };
      }

      default: {
        // Exhaustive check — TypeScript will catch unhandled cases
        const exhaustive: never = template;
        return {
          html: '',
          success: false,
          error: `Unknown template type: ${exhaustive}`,
        };
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Template rendering failed';
    console.error(`[template-renderer] Failed to render "${template}":`, message);
    return {
      html: '',
      success: false,
      error: message,
    };
  }
}

/**
 * Check if a template type is valid.
 */
export function isValidTemplate(template: string): template is EmailTemplateType {
  return ['report-ready', 'plan-ready', 'plan-approved', 'welcome'].includes(template);
}
