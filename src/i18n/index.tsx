// ═══════════════════════════════════════════════════════════════
//  App-wide i18n System — Phase 1 (C-9)
//  Context + useTranslation 훅
//  참조: MASTER_PLAN_V4.md §12 (4개국어 지원)
//
//  주의: Phase 0의 ReportI18nContext는 수정하지 않음 (리포트 전용 유지)
//  Phase 2에서 통합 검토 예정
// ═══════════════════════════════════════════════════════════════

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

import ko from '@/i18n/locales/ko.json';
import en from '@/i18n/locales/en.json';
import ja from '@/i18n/locales/ja.json';
import zhCN from '@/i18n/locales/zh-CN.json';

// ─── Types ──────────────────────────────────────────────────

export type AppLang = 'KO' | 'EN' | 'JP' | 'ZH-CN';

/** Recursive string-only JSON structure */
type TranslationValue = string | { [key: string]: TranslationValue };
type TranslationMap = Record<string, TranslationValue>;

// ─── Locale Registry ────────────────────────────────────────

const LOCALES: Record<AppLang, TranslationMap> = {
  KO: ko as TranslationMap,
  EN: en as TranslationMap,
  JP: ja as TranslationMap,
  'ZH-CN': zhCN as TranslationMap,
};

const STORAGE_KEY = 'cdocs_lang';

// ─── Language Detection ─────────────────────────────────────

function detectBrowserLang(): AppLang {
  if (typeof window === 'undefined') return 'KO';

  // 1. localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in LOCALES) return stored as AppLang;
  } catch {
    // ignore
  }

  // 2. navigator.language
  const navLang = navigator.language.toLowerCase();
  if (navLang.startsWith('ko')) return 'KO';
  if (navLang.startsWith('ja')) return 'JP';
  if (navLang.startsWith('zh')) return 'ZH-CN';
  return 'EN';
}

// ─── Dot-notation Key Resolver ──────────────────────────────

function resolve(map: TranslationMap, key: string): string {
  const parts = key.split('.');
  let current: TranslationValue = map;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return key;
    current = (current as Record<string, TranslationValue>)[part];
    if (current === undefined) return key;
  }

  return typeof current === 'string' ? current : key;
}

// ─── Context ────────────────────────────────────────────────

interface I18nContextType {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────

interface AppI18nProviderProps {
  children: ReactNode;
  defaultLang?: AppLang;
}

export function AppI18nProvider({ children, defaultLang }: AppI18nProviderProps) {
  const [lang, setLangState] = useState<AppLang>(defaultLang || 'KO');

  // Detect browser language on mount
  useEffect(() => {
    if (!defaultLang) {
      setLangState(detectBrowserLang());
    }
  }, [defaultLang]);

  const setLang = useCallback((newLang: AppLang) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch {
        // ignore
      }
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const map = LOCALES[lang] || LOCALES.KO;
      return resolve(map, key);
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within AppI18nProvider');
  }
  return context;
}

// ─── Standalone t() for non-React contexts ──────────────────
// (e.g., API handlers — but typically only needed in UI)

export function getTranslation(lang: AppLang, key: string): string {
  const map = LOCALES[lang] || LOCALES.KO;
  return resolve(map, key);
}
