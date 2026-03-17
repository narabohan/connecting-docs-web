// ═══════════════════════════════════════════════════════════════
//  Consent Type Definitions — Phase 1 (C-7)
//  PIPA/APPI/GDPR 동의 수집을 위한 타입
//  참조: MASTER_PLAN_V4.md §13 (글로벌 컴플라이언스)
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang } from '@/types/survey-v2';

// ─── Consent Categories ─────────────────────────────────────
// essential:       필수 데이터 수집 (설문 저장, 리포트 생성)
// analytics:       서비스 개선용 분석 데이터
// ai_processing:   AI 프로파일링 (Haiku/Claude 분석)
// marketing:       마케팅 커뮤니케이션 (이메일, 알림)

export type ConsentCategory =
  | 'essential'
  | 'analytics'
  | 'ai_processing'
  | 'marketing';

export const ALL_CONSENT_CATEGORIES: readonly ConsentCategory[] = [
  'essential',
  'analytics',
  'ai_processing',
  'marketing',
] as const;

// ─── Consent Record (Airtable 저장용) ───────────────────────

export interface ConsentRecord {
  user_id: string | null;       // 비인증 시 null
  session_id: string;
  consents: Record<ConsentCategory, boolean>;
  ip_country: string;
  consented_at: string;         // ISO datetime
  version: string;              // 동의 문구 버전 (e.g., "V1.0.0")
}

// ─── Per-Category i18n Text ─────────────────────────────────

export interface ConsentCategoryText {
  label: string;
  description: string;
}

export type ConsentTexts = Record<ConsentCategory, ConsentCategoryText>;

// ─── Country Consent Config ─────────────────────────────────

export interface CountryConsentConfig {
  required: readonly ConsentCategory[];   // 사용자가 반드시 동의해야 하는 항목
  optional: readonly ConsentCategory[];   // 선택 동의 항목
  summaryKey: string;                      // i18n summary 텍스트 키
}

// ─── Consent Version ────────────────────────────────────────

export const CONSENT_VERSION = 'V1.0.0';

// ─── i18n Texts per Language ────────────────────────────────

export const CONSENT_TEXTS: Record<SurveyLang, ConsentTexts> = {
  KO: {
    essential: {
      label: '필수 정보 수집·이용',
      description: '설문 응답 저장 및 AI 리포트 생성을 위해 필수적으로 수집합니다.',
    },
    analytics: {
      label: '서비스 개선 분석',
      description: '서비스 품질 향상을 위한 익명 사용 데이터 분석에 동의합니다.',
    },
    ai_processing: {
      label: 'AI 프로파일링 동의',
      description: '피부 상태 AI 분석 및 시술 추천을 위한 프로파일링에 동의합니다.',
    },
    marketing: {
      label: '마케팅 정보 수신 (선택)',
      description: '프로모션, 신규 서비스 안내 등의 마케팅 정보를 수신합니다.',
    },
  },
  EN: {
    essential: {
      label: 'Essential Data Collection',
      description: 'Required for saving your survey and generating your AI report.',
    },
    analytics: {
      label: 'Analytics',
      description: 'Anonymous usage data to improve our service quality.',
    },
    ai_processing: {
      label: 'AI Processing',
      description: 'AI analysis of your skin condition and treatment recommendations.',
    },
    marketing: {
      label: 'Marketing (Optional)',
      description: 'Receive promotions, new service announcements, and updates.',
    },
  },
  JP: {
    essential: {
      label: '必須データ収集',
      description: 'アンケートの保存とAIレポート生成に必要です。',
    },
    analytics: {
      label: 'サービス改善分析',
      description: 'サービス品質向上のための匿名利用データ分析に同意します。',
    },
    ai_processing: {
      label: 'AI処理への同意',
      description: '肌状態のAI分析と施術推薦のためのプロファイリングに同意します。',
    },
    marketing: {
      label: 'マーケティング（任意）',
      description: 'プロモーションや新サービスのお知らせを受け取ります。',
    },
  },
  'ZH-CN': {
    essential: {
      label: '必要数据收集',
      description: '保存问卷和生成AI报告所必需的数据。',
    },
    analytics: {
      label: '分析数据',
      description: '同意收集匿名使用数据以改善服务质量。',
    },
    ai_processing: {
      label: 'AI处理同意',
      description: '同意对皮肤状态进行AI分析和治疗推荐。',
    },
    marketing: {
      label: '营销信息（可选）',
      description: '接收促销活动、新服务公告等信息。',
    },
  },
};
