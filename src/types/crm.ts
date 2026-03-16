// ═══════════════════════════════════════════════════════════════
//  CRM Type Definitions — Phase 1 (C-1)
//  Users 테이블 여정(stage) 관리를 위한 타입
//  참조: MASTER_PLAN_V4.md §6.1 (CRM 여정 DB)
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang } from '@/types/survey-v2';

// ─── User Journey Stage ──────────────────────────────────────
// 순서: survey_started(0) → survey_completed(1) → report_viewed(2)
//       → consultation_requested(3) → treatment_done(4)
// 역행 방지: 현재 stage보다 이전 단계로 변경 불가

export type UserStage =
  | 'survey_started'
  | 'survey_completed'
  | 'report_viewed'
  | 'consultation_requested'
  | 'treatment_done';

/** Stage → numeric order for comparison (역행 방지용) */
export const STAGE_ORDER: Record<UserStage, number> = {
  survey_started: 0,
  survey_completed: 1,
  report_viewed: 2,
  consultation_requested: 3,
  treatment_done: 4,
} as const;

// ─── CRM User Interface ─────────────────────────────────────

export interface CRMUser {
  airtable_id: string;
  firebase_uid: string | null;
  email: string | null;
  stage: UserStage;
  first_survey_at: string;   // ISO date
  last_activity_at: string;  // ISO date
  country: string;
  lang: SurveyLang;
}

// ─── CRM Service Parameter Types ─────────────────────────────

export interface FindOrCreateUserParams {
  email?: string;
  firebase_uid?: string;
  country: string;
  lang: SurveyLang;
}
