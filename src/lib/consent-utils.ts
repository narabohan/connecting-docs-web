// ═══════════════════════════════════════════════════════════════
//  Consent Utilities — Phase 1 (C-7)
//  localStorage 기반 동의 확인 + 국가별 필수 동의 항목 매핑
//  참조: MASTER_PLAN_V4.md §13 (글로벌 컴플라이언스)
// ═══════════════════════════════════════════════════════════════

import type { ConsentCategory, CountryConsentConfig } from '@/types/consent';
import { CONSENT_VERSION } from '@/types/consent';

// ─── localStorage Key ───────────────────────────────────────

const CONSENT_STORAGE_KEY = 'cdocs_consent';

// ─── Stored Consent Shape ───────────────────────────────────

interface StoredConsent {
  consents: Record<ConsentCategory, boolean>;
  version: string;
  consented_at: string;
  country: string;
}

// ─── Country → Required/Optional Consent Mapping ────────────
//
// KR (PIPA): essential + ai_processing + analytics 필수, marketing 선택
// JP (APPI): essential + ai_processing 필수, analytics + marketing 선택
// 기타 (GDPR/글로벌): essential 필수, 나머지 선택 (opt-in)

const COUNTRY_CONSENT_MAP: Record<string, CountryConsentConfig> = {
  KR: {
    required: ['essential', 'ai_processing', 'analytics'],
    optional: ['marketing'],
    summaryKey: 'summary_kr',
  },
  JP: {
    required: ['essential', 'ai_processing'],
    optional: ['analytics', 'marketing'],
    summaryKey: 'summary_jp',
  },
};

const DEFAULT_CONSENT_CONFIG: CountryConsentConfig = {
  required: ['essential'],
  optional: ['analytics', 'ai_processing', 'marketing'],
  summaryKey: 'summary_default',
};

// ─── Public Functions ───────────────────────────────────────

/**
 * Check if user has consented to a specific category.
 * Returns false if no consent record exists or version mismatch.
 */
export function hasConsent(category: ConsentCategory): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;

    const stored: StoredConsent = JSON.parse(raw);

    // Version mismatch → treat as not consented (re-consent required)
    if (stored.version !== CONSENT_VERSION) return false;

    return stored.consents[category] === true;
  } catch {
    return false;
  }
}

/**
 * Check if user has any consent record (regardless of categories).
 */
export function hasAnyConsent(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;

    const stored: StoredConsent = JSON.parse(raw);
    return stored.version === CONSENT_VERSION;
  } catch {
    return false;
  }
}

/**
 * Get required consent categories for a given country.
 */
export function isConsentRequired(country: string): ConsentCategory[] {
  const config = COUNTRY_CONSENT_MAP[country] || DEFAULT_CONSENT_CONFIG;
  return [...config.required];
}

/**
 * Get full consent config for a given country.
 */
export function getConsentConfig(country: string): CountryConsentConfig {
  return COUNTRY_CONSENT_MAP[country] || DEFAULT_CONSENT_CONFIG;
}

/**
 * Get the current consent version string.
 */
export function getConsentVersion(): string {
  return CONSENT_VERSION;
}

/**
 * Save consent record to localStorage.
 */
export function saveConsentToLocal(
  consents: Record<ConsentCategory, boolean>,
  country: string
): void {
  if (typeof window === 'undefined') return;

  const stored: StoredConsent = {
    consents,
    version: CONSENT_VERSION,
    consented_at: new Date().toISOString(),
    country,
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    console.warn('[consent-utils] Failed to save consent to localStorage');
  }
}

/**
 * Get stored consents (or null if none).
 */
export function getStoredConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const stored: StoredConsent = JSON.parse(raw);
    if (stored.version !== CONSENT_VERSION) return null;

    return stored;
  } catch {
    return null;
  }
}

/**
 * Generate a session ID for anonymous consent tracking.
 */
export function generateSessionId(): string {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
