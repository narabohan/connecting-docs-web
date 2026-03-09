// ═══════════════════════════════════════════════════════════════
//  Report v7 — i18n Translation Engine
//  Applies translations to report-v7-premium.html template
//  Handles data-i18n (textContent) and data-i18n-html (innerHTML)
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang } from '@/types/survey-v2';

// ─── Types ────────────────────────────────────────────────────

/** Dictionary structure: { KO: { key: value }, EN: {...}, ... } */
export type I18nDictionary = {
  _meta?: Record<string, unknown>;
  _html_meta?: Record<string, unknown>;
} & {
  [lang in SurveyLang]?: Record<string, string>;
};

/** Dynamic placeholder values for {{...}} interpolation */
export interface I18nPlaceholders {
  name?: string;
  age?: string | number;
  program?: string;
  score?: string | number;
  level?: string;
  treatment?: string;
  when?: string;
  contraindication?: string;
  confidence?: string | number;
  fitzpatrick?: string;
  [key: string]: string | number | undefined;
}

// ─── Core Functions ───────────────────────────────────────────

/**
 * Interpolates {{placeholder}} in a string with given values
 */
function interpolate(template: string, values: I18nPlaceholders): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const val = values[key];
    return val !== undefined ? String(val) : match;
  });
}

/**
 * Applies translations to all elements with data-i18n attribute
 * Sets element.textContent (safe, no HTML)
 */
function applyTextTranslations(
  container: HTMLElement | Document,
  dict: Record<string, string>,
  placeholders: I18nPlaceholders
): number {
  const elements = container.querySelectorAll<HTMLElement>('[data-i18n]');
  let applied = 0;

  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!key || !dict[key]) return;

    const translated = interpolate(dict[key], placeholders);
    el.textContent = translated;
    applied++;

    // Also update aria-label if data-i18n-attr="aria-label" is set
    if (el.getAttribute('data-i18n-attr') === 'aria-label') {
      el.setAttribute('aria-label', translated);
    }
  });

  return applied;
}

/**
 * Applies HTML translations to all elements with data-i18n-html attribute
 * Sets element.innerHTML (allows HTML formatting)
 * Skips AI-generated placeholders ({{ai_generated_*}})
 */
function applyHtmlTranslations(
  container: HTMLElement | Document,
  dict: Record<string, string>,
  placeholders: I18nPlaceholders
): number {
  const elements = container.querySelectorAll<HTMLElement>('[data-i18n-html]');
  let applied = 0;

  elements.forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (!key) return;

    // Look up with _html_ prefix (dictionary storage format)
    const dictKey = `_html_${key}`;
    const value = dict[dictKey];
    if (!value) return;

    // Skip AI-generated placeholders — these are filled by Opus at runtime
    if (value.includes('{{ai_generated_')) return;

    const translated = interpolate(value, placeholders);
    el.innerHTML = translated;
    applied++;
  });

  return applied;
}

/**
 * Main entry point: apply all i18n translations to a report container
 *
 * @param container - The report DOM element or document
 * @param dictionary - The full i18n dictionary (all languages)
 * @param lang - Target language code
 * @param placeholders - Dynamic values for {{...}} interpolation
 * @returns Statistics about applied translations
 */
export function applyReportI18n(
  container: HTMLElement | Document,
  dictionary: I18nDictionary,
  lang: SurveyLang,
  placeholders: I18nPlaceholders = {}
): { textApplied: number; htmlApplied: number; lang: SurveyLang } {
  const dict = dictionary[lang];
  if (!dict) {
    console.warn(`[report-v7-i18n] No translations found for language: ${lang}`);
    return { textApplied: 0, htmlApplied: 0, lang };
  }

  const textApplied = applyTextTranslations(container, dict, placeholders);
  const htmlApplied = applyHtmlTranslations(container, dict, placeholders);

  // Update html lang attribute if container is document
  if (container instanceof Document) {
    const htmlEl = container.documentElement;
    const langMap: Record<SurveyLang, string> = {
      KO: 'ko',
      EN: 'en',
      JP: 'ja',
      'ZH-CN': 'zh-CN',
    };
    htmlEl.setAttribute('lang', langMap[lang] || 'ko');
  }

  return { textApplied, htmlApplied, lang };
}

/**
 * Detects browser language and maps to SurveyLang
 * Falls back to KO for Korean clinic context
 */
export function detectReportLang(): SurveyLang {
  if (typeof navigator === 'undefined') return 'KO';

  const browserLang = navigator.language.toLowerCase();

  if (browserLang.startsWith('ja')) return 'JP';
  if (browserLang.startsWith('zh')) return 'ZH-CN';
  if (browserLang.startsWith('en')) return 'EN';
  return 'KO'; // Default for Korean clinic
}

/**
 * Loads the i18n dictionary from JSON file
 * For use in both server-side (Next.js API) and client-side contexts
 */
export async function loadReportDictionary(
  basePath = '/report-v7-i18n-dictionary.json'
): Promise<I18nDictionary> {
  const res = await fetch(basePath);
  if (!res.ok) {
    throw new Error(`Failed to load i18n dictionary: ${res.status}`);
  }
  return res.json();
}

/**
 * Sets the lang attribute on a safety flag element based on flag type
 * Used by Safety Flag visualization integration
 */
export function getSafetyFlagTranslation(
  dictionary: I18nDictionary,
  lang: SurveyLang,
  flagType: string
): { warning: string; message: string } {
  const dict = dictionary[lang];
  if (!dict) {
    return { warning: '⚠️', message: flagType };
  }

  const flagKeyMap: Record<string, string> = {
    SAFETY_ISOTRETINOIN: 'safetyFlagIsotretinoin',
    SAFETY_ANTICOAGULANT: 'safetyFlagAnticoagulant',
    SAFETY_PREGNANCY: 'safetyFlagPregnancy',
    SAFETY_KELOID: 'safetyFlagKeloid',
    SAFETY_ADVERSE_HISTORY: 'safetyFlagAdverse',
  };

  const messageKey = flagKeyMap[flagType];
  return {
    warning: dict['safetyFlagWarning'] || '⚠️ Safety Alert',
    message: messageKey ? (dict[messageKey] || flagType) : flagType,
  };
}
