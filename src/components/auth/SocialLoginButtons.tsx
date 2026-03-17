// ═══════════════════════════════════════════════════════════════
//  SocialLoginButtons — Phase 1 (C-5/C-6, C-9 i18n refactor) + G-6 Line 추가
//  소셜 로그인 버튼 컴포넌트 (Kakao + Naver + Line + Google)
//  참조: MASTER_PLAN_V4.md §7 (글로벌 소셜 로그인)
// ═══════════════════════════════════════════════════════════════

import { useTranslation } from '@/i18n';

// ─── Props ───────────────────────────────────────────────────

interface SocialLoginButtonsProps {
  onGoogleClick?: () => void;
  returnUrl?: string;
  disabled?: boolean;
}

// ─── Component ───────────────────────────────────────────────

export function SocialLoginButtons({
  onGoogleClick,
  returnUrl = '/',
  disabled = false,
}: SocialLoginButtonsProps) {
  const { t } = useTranslation();

  const handleKakaoClick = () => {
    const url = `/api/auth/kakao/login?returnUrl=${encodeURIComponent(returnUrl)}`;
    window.location.href = url;
  };

  return (
    <div className="slb-container">
      {/* ── Kakao Login Button (Brand guidelines: #FEE500 bg, #000000 text) */}
      <button
        className="slb-btn slb-btn--kakao"
        onClick={handleKakaoClick}
        disabled={disabled}
        type="button"
      >
        <svg className="slb-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.16 4.5 6.54-.18.66-.66 2.4-.72 2.76-.12.48.18.48.36.36.18-.06 2.52-1.68 3.54-2.4.72.12 1.5.18 2.28.18 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"
            fill="#000000"
          />
        </svg>
        <span>{t('auth.login_with_kakao')}</span>
      </button>

      {/* ── Naver Login Button (Brand guidelines: #03C75A bg, #FFFFFF text) */}
      <button
        className="slb-btn slb-btn--naver"
        onClick={() => {
          const url = `/api/auth/naver/login?returnUrl=${encodeURIComponent(returnUrl)}`;
          window.location.href = url;
        }}
        disabled={disabled}
        type="button"
      >
        <svg className="slb-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"
            fill="#FFFFFF"
          />
        </svg>
        <span>{t('auth.login_with_naver')}</span>
      </button>

      {/* ── Line Login Button (Brand guidelines: #06C755 bg, #FFFFFF text) — G-6 */}
      <button
        className="slb-btn slb-btn--line"
        onClick={() => {
          const url = `/api/auth/line/login?returnUrl=${encodeURIComponent(returnUrl)}`;
          window.location.href = url;
        }}
        disabled={disabled}
        type="button"
      >
        <svg className="slb-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2C6.48 2 2 5.64 2 10.13c0 3.99 3.54 7.33 8.33 7.96.32.07.76.22.87.5.1.25.07.65.03.91l-.14.85c-.04.26-.2 1.01.88.55 1.08-.46 5.84-3.44 7.97-5.89C21.88 12.77 22 11.49 22 10.13 22 5.64 17.52 2 12 2z"
            fill="#FFFFFF"
          />
        </svg>
        <span>{t('auth.login_with_line')}</span>
      </button>

      {/* ── Google Login Button */}
      {onGoogleClick && (
        <button
          className="slb-btn slb-btn--google"
          onClick={onGoogleClick}
          disabled={disabled}
          type="button"
        >
          <svg className="slb-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>{t('auth.login_with_google')}</span>
        </button>
      )}

      <style jsx>{`
        .slb-container { display: flex; flex-direction: column; gap: 10px; width: 100%; }
        .slb-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s, transform 0.1s; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .slb-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .slb-btn:active:not(:disabled) { transform: translateY(0); }
        .slb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .slb-icon { width: 18px; height: 18px; flex-shrink: 0; }
        .slb-btn--kakao { background: #FEE500; color: #000000; }
        .slb-btn--naver { background: #03C75A; color: #FFFFFF; }
        .slb-btn--line { background: #06C755; color: #FFFFFF; }
        .slb-btn--google { background: #ffffff; color: #333333; border: 1px solid #dadce0; }
      `}</style>
    </div>
  );
}
