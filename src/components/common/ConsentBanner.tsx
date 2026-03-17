// ═══════════════════════════════════════════════════════════════
//  ConsentBanner — Phase 1 (C-7, C-9 i18n refactor)
//  PIPA/APPI/GDPR 동의 수집 배너 (페이지 하단 고정)
//  참조: MASTER_PLAN_V4.md §13 (글로벌 컴플라이언스)
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';
import type { ConsentCategory } from '@/types/consent';
import { ALL_CONSENT_CATEGORIES } from '@/types/consent';
import {
  hasAnyConsent,
  getConsentConfig,
  saveConsentToLocal,
  generateSessionId,
} from '@/lib/consent-utils';
import { useTranslation } from '@/i18n';

// ─── Props ──────────────────────────────────────────────────

interface ConsentBannerProps {
  country: string;
  userId?: string | null;
  onConsent?: (consents: Record<ConsentCategory, boolean>) => void;
}

// ─── Category key mapping ───────────────────────────────────

const CATEGORY_LABEL_KEYS: Record<ConsentCategory, string> = {
  essential: 'consent.essential_label',
  analytics: 'consent.analytics_label',
  ai_processing: 'consent.ai_processing_label',
  marketing: 'consent.marketing_label',
};

const CATEGORY_DESC_KEYS: Record<ConsentCategory, string> = {
  essential: 'consent.essential_desc',
  analytics: 'consent.analytics_desc',
  ai_processing: 'consent.ai_processing_desc',
  marketing: 'consent.marketing_desc',
};

// ─── Component ──────────────────────────────────────────────

export function ConsentBanner({
  country,
  userId = null,
  onConsent,
}: ConsentBannerProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [checks, setChecks] = useState<Record<ConsentCategory, boolean>>({
    essential: true,
    analytics: false,
    ai_processing: false,
    marketing: false,
  });

  const config = getConsentConfig(country);

  useEffect(() => {
    if (!hasAnyConsent()) {
      setVisible(true);
    }
  }, []);

  const toggleCategory = useCallback(
    (cat: ConsentCategory) => {
      if (cat === 'essential') return;
      if ((config.required as readonly string[]).includes(cat)) return;
      setChecks((prev) => ({ ...prev, [cat]: !prev[cat] }));
    },
    [config.required]
  );

  const submitConsent = useCallback(
    (consents: Record<ConsentCategory, boolean>) => {
      saveConsentToLocal(consents, country);
      setVisible(false);

      const sessionId = generateSessionId();
      fetch('/api/consent/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          consents,
          ip_country: country,
          consented_at: new Date().toISOString(),
          version: 'V1.0.0',
        }),
        keepalive: true,
      }).catch((err) => {
        console.warn('[ConsentBanner] API save failed (non-blocking):', err);
      });

      onConsent?.(consents);
    },
    [country, userId, onConsent]
  );

  const handleAcceptAll = useCallback(() => {
    submitConsent({ essential: true, analytics: true, ai_processing: true, marketing: true });
  }, [submitConsent]);

  const handleAcceptRequired = useCallback(() => {
    const requiredOnly: Record<ConsentCategory, boolean> = {
      essential: false, analytics: false, ai_processing: false, marketing: false,
    };
    for (const cat of config.required) {
      requiredOnly[cat] = true;
    }
    submitConsent(requiredOnly);
  }, [config.required, submitConsent]);

  const handleDecline = useCallback(() => {
    handleAcceptRequired();
  }, [handleAcceptRequired]);

  if (!visible) return null;

  const isRequired = (cat: ConsentCategory): boolean =>
    (config.required as readonly string[]).includes(cat);

  return (
    <>
      <div className="cb-overlay" />
      <div className="cb-banner" role="dialog" aria-label="Consent banner">
        <div className="cb-inner">
          <div className="cb-summary">
            <Shield className="cb-shield-icon" />
            <p className="cb-text">{t('consent.banner_summary')}</p>
          </div>

          <button
            className="cb-toggle"
            onClick={() => setExpanded((p) => !p)}
            type="button"
          >
            <span>{t('consent.details')}</span>
            {expanded ? <ChevronUp className="cb-chevron" /> : <ChevronDown className="cb-chevron" />}
          </button>

          {expanded && (
            <div className="cb-categories">
              {ALL_CONSENT_CATEGORIES.map((cat) => {
                const required = isRequired(cat);
                const checked = required ? true : checks[cat];

                return (
                  <label key={cat} className="cb-category">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(cat)}
                      disabled={required}
                      className="cb-checkbox"
                    />
                    <div className="cb-cat-content">
                      <span className="cb-cat-label">
                        {t(CATEGORY_LABEL_KEYS[cat])}
                        <span className={`cb-badge ${required ? 'cb-badge--req' : 'cb-badge--opt'}`}>
                          {required ? t('common.required') : t('common.optional')}
                        </span>
                      </span>
                      <span className="cb-cat-desc">{t(CATEGORY_DESC_KEYS[cat])}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className="cb-actions">
            <button className="cb-btn cb-btn--primary" onClick={handleAcceptAll} type="button">
              {t('consent.accept_all')}
            </button>
            <button className="cb-btn cb-btn--secondary" onClick={handleAcceptRequired} type="button">
              {t('consent.accept_required')}
            </button>
            <button className="cb-btn-link" onClick={handleDecline} type="button">
              {t('consent.decline')}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cb-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 998; animation: cbFadeIn 0.3s ease; }
        .cb-banner { position: fixed; bottom: 0; left: 0; right: 0; z-index: 999; background: #1a1a2e; border-top: 1px solid rgba(255,255,255,0.1); box-shadow: 0 -4px 20px rgba(0,0,0,0.4); animation: cbSlideUp 0.3s ease; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .cb-inner { max-width: 720px; margin: 0 auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
        .cb-summary { display: flex; align-items: center; gap: 10px; }
        .cb-shield-icon { width: 20px; height: 20px; color: #22d3ee; flex-shrink: 0; }
        .cb-text { color: #e4e4e7; font-size: 14px; line-height: 1.5; margin: 0; }
        .cb-toggle { background: none; border: none; color: #22d3ee; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 0; font-family: inherit; transition: opacity 0.2s; }
        .cb-toggle:hover { opacity: 0.8; }
        .cb-chevron { width: 16px; height: 16px; }
        .cb-categories { display: flex; flex-direction: column; gap: 10px; padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); animation: cbFadeIn 0.2s ease; }
        .cb-category { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; }
        .cb-checkbox { margin-top: 3px; accent-color: #22d3ee; width: 16px; height: 16px; flex-shrink: 0; }
        .cb-checkbox:disabled { opacity: 0.7; cursor: not-allowed; }
        .cb-cat-content { display: flex; flex-direction: column; gap: 2px; }
        .cb-cat-label { color: #e4e4e7; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .cb-badge { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px; }
        .cb-badge--req { background: rgba(34,211,238,0.15); color: #22d3ee; }
        .cb-badge--opt { background: rgba(161,161,170,0.15); color: #a1a1aa; }
        .cb-cat-desc { color: #71717a; font-size: 12px; line-height: 1.4; }
        .cb-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .cb-btn { padding: 10px 20px; border: none; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .cb-btn--primary { background: #22d3ee; color: #09090b; }
        .cb-btn--primary:hover { background: #06b6d4; }
        .cb-btn--secondary { background: rgba(255,255,255,0.08); color: #e4e4e7; border: 1px solid rgba(255,255,255,0.12); }
        .cb-btn--secondary:hover { background: rgba(255,255,255,0.12); }
        .cb-btn-link { background: none; border: none; color: #71717a; font-size: 12px; cursor: pointer; padding: 4px 8px; transition: color 0.2s; font-family: inherit; }
        .cb-btn-link:hover { color: #a1a1aa; }
        @keyframes cbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cbSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (max-width: 640px) { .cb-inner { padding: 16px; } .cb-actions { flex-direction: column; } .cb-btn { width: 100%; text-align: center; } }
      `}</style>
    </>
  );
}
