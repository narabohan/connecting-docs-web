// ═══════════════════════════════════════════════════════════════
//  ConsentBanner — Phase 1 (C-7)
//  PIPA/APPI/GDPR 동의 수집 배너 (페이지 하단 고정)
//  참조: MASTER_PLAN_V4.md §13 (글로벌 컴플라이언스)
//
//  국가별 동작:
//    KR: 필수 3개 (essential, ai_processing, analytics) + 선택 1개 (marketing)
//    JP: 필수 2개 (essential, ai_processing) + 선택 2개 (analytics, marketing)
//    기타: 필수 1개 (essential) + 선택 3개
//
//  이미 동의했으면 (localStorage) 표시 안 함
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';
import type { SurveyLang } from '@/types/survey-v2';
import type { ConsentCategory } from '@/types/consent';
import { ALL_CONSENT_CATEGORIES, CONSENT_TEXTS } from '@/types/consent';
import {
  hasAnyConsent,
  getConsentConfig,
  saveConsentToLocal,
  generateSessionId,
} from '@/lib/consent-utils';

// ─── Props ──────────────────────────────────────────────────

interface ConsentBannerProps {
  lang: SurveyLang;
  country: string;
  userId?: string | null;
  onConsent?: (consents: Record<ConsentCategory, boolean>) => void;
}

// ─── i18n ───────────────────────────────────────────────────

interface BannerMessages {
  summary: string;
  details: string;
  acceptAll: string;
  acceptRequired: string;
  decline: string;
  required: string;
  optional: string;
}

const BANNER_MESSAGES: Record<string, BannerMessages> = {
  KO: {
    summary: '본 서비스는 개인정보 보호법(PIPA)에 따라 동의를 수집합니다.',
    details: '자세히 보기',
    acceptAll: '모두 동의',
    acceptRequired: '필수만 동의',
    decline: '선택 항목 거부',
    required: '필수',
    optional: '선택',
  },
  EN: {
    summary: 'We collect your consent in accordance with data protection regulations.',
    details: 'Show details',
    acceptAll: 'Accept all',
    acceptRequired: 'Required only',
    decline: 'Decline optional',
    required: 'Required',
    optional: 'Optional',
  },
  JP: {
    summary: '個人情報保護法に基づき、同意を取得いたします。',
    details: '詳細を見る',
    acceptAll: 'すべて同意',
    acceptRequired: '必須のみ同意',
    decline: '任意項目を拒否',
    required: '必須',
    optional: '任意',
  },
  'ZH-CN': {
    summary: '我们根据数据保护法规收集您的同意。',
    details: '查看详情',
    acceptAll: '全部同意',
    acceptRequired: '仅必要项',
    decline: '拒绝可选项',
    required: '必需',
    optional: '可选',
  },
};

// ─── Component ──────────────────────────────────────────────

export function ConsentBanner({
  lang,
  country,
  userId = null,
  onConsent,
}: ConsentBannerProps) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [checks, setChecks] = useState<Record<ConsentCategory, boolean>>({
    essential: true,       // essential은 항상 체크 (해제 불가)
    analytics: false,
    ai_processing: false,
    marketing: false,
  });

  const messages = BANNER_MESSAGES[lang] || BANNER_MESSAGES.EN;
  const texts = CONSENT_TEXTS[lang] || CONSENT_TEXTS.EN;
  const config = getConsentConfig(country);

  // ── Show only if not already consented ──────────────────
  useEffect(() => {
    if (!hasAnyConsent()) {
      setVisible(true);
    }
  }, []);

  // ── Toggle a single category ────────────────────────────
  const toggleCategory = useCallback(
    (cat: ConsentCategory) => {
      // essential은 해제 불가
      if (cat === 'essential') return;
      // required 카테고리도 해제 불가
      if ((config.required as readonly string[]).includes(cat)) return;

      setChecks((prev) => ({ ...prev, [cat]: !prev[cat] }));
    },
    [config.required]
  );

  // ── Submit helper ───────────────────────────────────────
  const submitConsent = useCallback(
    (consents: Record<ConsentCategory, boolean>) => {
      saveConsentToLocal(consents, country);
      setVisible(false);

      // Fire-and-forget API save
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

  // ── Accept All ──────────────────────────────────────────
  const handleAcceptAll = useCallback(() => {
    const allTrue: Record<ConsentCategory, boolean> = {
      essential: true,
      analytics: true,
      ai_processing: true,
      marketing: true,
    };
    submitConsent(allTrue);
  }, [submitConsent]);

  // ── Accept Required Only ────────────────────────────────
  const handleAcceptRequired = useCallback(() => {
    const requiredOnly: Record<ConsentCategory, boolean> = {
      essential: false,
      analytics: false,
      ai_processing: false,
      marketing: false,
    };
    for (const cat of config.required) {
      requiredOnly[cat] = true;
    }
    submitConsent(requiredOnly);
  }, [config.required, submitConsent]);

  // ── Decline (optional items only) ──────────────────────
  const handleDecline = useCallback(() => {
    // 필수 항목은 동의, 선택 항목은 거부
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
          {/* ── Summary row ────────────────────────── */}
          <div className="cb-summary">
            <Shield className="cb-shield-icon" />
            <p className="cb-text">{messages.summary}</p>
          </div>

          {/* ── Details toggle ─────────────────────── */}
          <button
            className="cb-toggle"
            onClick={() => setExpanded((p) => !p)}
            type="button"
          >
            <span>{messages.details}</span>
            {expanded ? (
              <ChevronUp className="cb-chevron" />
            ) : (
              <ChevronDown className="cb-chevron" />
            )}
          </button>

          {/* ── Category checkboxes ────────────────── */}
          {expanded && (
            <div className="cb-categories">
              {ALL_CONSENT_CATEGORIES.map((cat) => {
                const catText = texts[cat];
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
                        {catText.label}
                        <span className={`cb-badge ${required ? 'cb-badge--req' : 'cb-badge--opt'}`}>
                          {required ? messages.required : messages.optional}
                        </span>
                      </span>
                      <span className="cb-cat-desc">{catText.description}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* ── Action buttons ─────────────────────── */}
          <div className="cb-actions">
            <button
              className="cb-btn cb-btn--primary"
              onClick={handleAcceptAll}
              type="button"
            >
              {messages.acceptAll}
            </button>
            <button
              className="cb-btn cb-btn--secondary"
              onClick={handleAcceptRequired}
              type="button"
            >
              {messages.acceptRequired}
            </button>
            <button
              className="cb-btn-link"
              onClick={handleDecline}
              type="button"
            >
              {messages.decline}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cb-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 998;
          animation: cbFadeIn 0.3s ease;
        }
        .cb-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 999;
          background: #1a1a2e;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
          animation: cbSlideUp 0.3s ease;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .cb-inner {
          max-width: 720px;
          margin: 0 auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Summary */
        .cb-summary {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cb-shield-icon {
          width: 20px;
          height: 20px;
          color: #22d3ee;
          flex-shrink: 0;
        }
        .cb-text {
          color: #e4e4e7;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        /* Toggle */
        .cb-toggle {
          background: none;
          border: none;
          color: #22d3ee;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0;
          font-family: inherit;
          transition: opacity 0.2s;
        }
        .cb-toggle:hover {
          opacity: 0.8;
        }
        .cb-chevron {
          width: 16px;
          height: 16px;
        }

        /* Categories */
        .cb-categories {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          animation: cbFadeIn 0.2s ease;
        }
        .cb-category {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
        }
        .cb-checkbox {
          margin-top: 3px;
          accent-color: #22d3ee;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        .cb-checkbox:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .cb-cat-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .cb-cat-label {
          color: #e4e4e7;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cb-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .cb-badge--req {
          background: rgba(34, 211, 238, 0.15);
          color: #22d3ee;
        }
        .cb-badge--opt {
          background: rgba(161, 161, 170, 0.15);
          color: #a1a1aa;
        }
        .cb-cat-desc {
          color: #71717a;
          font-size: 12px;
          line-height: 1.4;
        }

        /* Actions */
        .cb-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .cb-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .cb-btn--primary {
          background: #22d3ee;
          color: #09090b;
        }
        .cb-btn--primary:hover {
          background: #06b6d4;
        }
        .cb-btn--secondary {
          background: rgba(255, 255, 255, 0.08);
          color: #e4e4e7;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .cb-btn--secondary:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .cb-btn-link {
          background: none;
          border: none;
          color: #71717a;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.2s;
          font-family: inherit;
        }
        .cb-btn-link:hover {
          color: #a1a1aa;
        }

        @keyframes cbFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cbSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .cb-inner {
            padding: 16px;
          }
          .cb-actions {
            flex-direction: column;
          }
          .cb-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
