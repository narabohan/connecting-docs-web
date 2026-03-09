// ═══════════════════════════════════════════════════════════════
//  Report v7 — Safety Flag Visualization Integration
//  Bridges Survey v2 safety flags → Report v7 rendering
//  Based on FRONTEND_UI_COMPONENT_DESIGN_v2.md §8
// ═══════════════════════════════════════════════════════════════

import type { SafetyFlag, SurveyLang } from '@/types/survey-v2';
import type { I18nDictionary } from './report-v7-i18n';
import { getSafetyFlagTranslation } from './report-v7-i18n';

// ─── Types ────────────────────────────────────────────────────

export interface SafetyFlagDisplay {
  flag: SafetyFlag;
  level: 'danger' | 'warning' | 'info';
  icon: string;
  message: string;
  clinicalNote?: string;
}

export interface SafetyBannerData {
  hasDangerFlags: boolean;
  flags: SafetyFlagDisplay[];
  bannerTitle: string;
}

// ─── Flag Level Classification ────────────────────────────────

const FLAG_LEVEL_MAP: Record<SafetyFlag, 'danger' | 'warning' | 'info'> = {
  SAFETY_ISOTRETINOIN: 'danger',
  SAFETY_ANTICOAGULANT: 'danger',
  SAFETY_PREGNANCY: 'danger',
  SAFETY_KELOID: 'warning',
  SAFETY_ADVERSE_HISTORY: 'warning',
  SAFETY_PHOTOSENSITIVITY: 'warning',
  HORMONAL_MELASMA: 'info',
  RETINOID_PAUSE: 'info',
};

const FLAG_ICON_MAP: Record<string, string> = {
  danger: '🔴',
  warning: '🟡',
  info: '🔵',
};

// ─── Clinical Notes (Doctor Tab — always in KO+EN) ────────────

const CLINICAL_NOTES: Record<SafetyFlag, { ko: string; en: string }> = {
  SAFETY_ISOTRETINOIN: {
    ko: '이소트레티노인 복용 중/최근 복용 → 최소 6개월 대기. 상처 치유 지연 + 켈로이드 위험 증가.',
    en: 'Isotretinoin active/recent → minimum 6-month wait. Delayed wound healing + keloid risk increase.',
  },
  SAFETY_ANTICOAGULANT: {
    ko: '항응고제 복용 → 멍/출혈 위험 ↑. 시술 전 전문의 상담 필수. 와파린: INR 확인.',
    en: 'Anticoagulant use → bruising/bleeding risk ↑. Specialist consult required. Warfarin: check INR.',
  },
  SAFETY_PREGNANCY: {
    ko: '임신/수유 중 → 모든 주입형 약물 절대 금기. EBD 장비도 출산·단유 이후로 연기 강력 권고.',
    en: 'Pregnancy/nursing → All injectables absolutely contraindicated. EBD devices also strongly advised to defer.',
  },
  SAFETY_KELOID: {
    ko: '켈로이드 체질 → 비침습 시술(HIFU, PICO)만 허용. Ablative 레이저/Thread Lift 절대 금기.',
    en: 'Keloid tendency → Non-invasive only (HIFU, PICO). Ablative laser/Thread Lift absolutely contraindicated.',
  },
  SAFETY_ADVERSE_HISTORY: {
    ko: '이전 부작용 이력 → 동일 시술 금기. 시술 전 패치 테스트 + 저출력 시범 조사 필수.',
    en: 'Prior adverse reaction → Same treatment contraindicated. Patch test + low-fluence test shot required.',
  },
  SAFETY_PHOTOSENSITIVITY: {
    ko: '광과민성 약물 → LaseMD: 3-5일 전 중단, IPL/BBL: 금기, 1064nm만 허용.',
    en: 'Photosensitive medication → LaseMD: stop 3-5 days prior, IPL/BBL: contraindicated, 1064nm only.',
  },
  HORMONAL_MELASMA: {
    ko: '호르몬성 기미 → 공격적 치료 자제, 유지 관리 중심, TXA 250mg BID 병행 고려.',
    en: 'Hormonal melasma → Conservative approach, consider oral TXA 250mg BID.',
  },
  RETINOID_PAUSE: {
    ko: '레티노이드 사용 중 → WiQo: 중단 필요, MN-RF: 2주 전 중단, 시술 후 48h 금지.',
    en: 'Active retinoid → WiQo: discontinue, MN-RF: stop 2 weeks prior, 48h post-procedure ban.',
  },
};

// ─── Public API ───────────────────────────────────────────────

/**
 * Build safety flag display data for patient-facing report
 * Uses i18n dictionary for patient language
 */
export function buildPatientSafetyBanner(
  flags: SafetyFlag[],
  dictionary: I18nDictionary,
  lang: SurveyLang
): SafetyBannerData {
  const dict = dictionary[lang] || {};
  const bannerTitle = dict['safetyFlagWarning'] || '⚠️ Safety Alert';

  const displayFlags: SafetyFlagDisplay[] = flags.map(flag => {
    const level = FLAG_LEVEL_MAP[flag] || 'info';
    const { message } = getSafetyFlagTranslation(dictionary, lang, flag);

    return {
      flag,
      level,
      icon: FLAG_ICON_MAP[level],
      message,
    };
  });

  // Sort: danger → warning → info
  const levelOrder = { danger: 0, warning: 1, info: 2 };
  displayFlags.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

  return {
    hasDangerFlags: displayFlags.some(f => f.level === 'danger'),
    flags: displayFlags,
    bannerTitle,
  };
}

/**
 * Build safety flag data for doctor-facing tab
 * Includes clinical notes in KO+EN (bilingual for doctor reference)
 */
export function buildDoctorSafetyFlags(
  flags: SafetyFlag[]
): SafetyFlagDisplay[] {
  return flags.map(flag => {
    const level = FLAG_LEVEL_MAP[flag] || 'info';
    const notes = CLINICAL_NOTES[flag];

    return {
      flag,
      level,
      icon: FLAG_ICON_MAP[level],
      message: `${notes.ko}\n${notes.en}`,
      clinicalNote: notes.ko,
    };
  }).sort((a, b) => {
    const levelOrder = { danger: 0, warning: 1, info: 2 };
    return levelOrder[a.level] - levelOrder[b.level];
  });
}

/**
 * Generate safety banner HTML for injection into report template
 * Used when rendering the report-v7-premium.html on the server
 */
export function renderSafetyBannerHTML(
  bannerData: SafetyBannerData
): string {
  if (bannerData.flags.length === 0) return '';

  const levelColors = {
    danger: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#fca5a5' },
    warning: { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)', text: '#fde68a' },
    info: { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)', text: '#93c5fd' },
  };

  // Top-level banner color = most severe flag
  const topLevel = bannerData.hasDangerFlags ? 'danger' : 'warning';
  const topColor = levelColors[topLevel];

  const flagRows = bannerData.flags.map(f => {
    const color = levelColors[f.level];
    return `<div style="color:${color.text};margin:4px 0;padding:4px 8px;border-left:2px solid ${color.border};background:${color.bg};border-radius:4px;">${f.icon} ${f.message}</div>`;
  }).join('\n');

  return `<div class="safety-alert-banner" role="alert" style="background:${topColor.bg};border:1px solid ${topColor.border};border-radius:12px;padding:16px 20px;margin-bottom:20px;">
  <div style="font-weight:700;color:${topColor.text};margin-bottom:8px;">${bannerData.bannerTitle}</div>
  ${flagRows}
</div>`;
}

/**
 * Generate doctor-tab safety banner HTML (bilingual KO+EN)
 */
export function renderDoctorSafetyHTML(
  flags: SafetyFlag[]
): string {
  if (flags.length === 0) return '';

  const doctorFlags = buildDoctorSafetyFlags(flags);

  const levelColors = {
    danger: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#fca5a5' },
    warning: { bg: 'rgba(251,191,36,0.15)', border: '#f59e0b', text: '#fde68a' },
    info: { bg: 'rgba(96,165,250,0.15)', border: '#60a5fa', text: '#93c5fd' },
  };

  const rows = doctorFlags.map(f => {
    const c = levelColors[f.level];
    return `<div style="color:${c.text};margin:6px 0;padding:6px 10px;border-left:3px solid ${c.border};background:${c.bg};border-radius:4px;font-size:11px;line-height:1.5;">${f.icon} <strong>[${f.flag}]</strong> ${f.message}</div>`;
  }).join('\n');

  return `<div class="safety-alert-banner doctor-safety" role="alert" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:16px 20px;margin-bottom:20px;">
  <div style="font-weight:700;color:#ef4444;margin-bottom:8px;font-size:13px;">⚠️ CRITICAL SAFETY FLAGS — 안전 플래그</div>
  ${rows}
</div>`;
}
