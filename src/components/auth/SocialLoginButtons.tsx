// ═══════════════════════════════════════════════════════════════
//  SocialLoginButtons — Phase 1 (C-5)
//  소셜 로그인 버튼 컴포넌트 (Kakao + Google)
//  참조: MASTER_PLAN_V4.md §7 (글로벌 소셜 로그인)
//
//  사용법:
//    <SocialLoginButtons
//      onGoogleClick={signInWithGoogle}
//      returnUrl="/dashboard"
//      lang="KO"
//    />
//
//  향후 추가 예정: Naver, Line (Phase 2)
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang } from '@/types/survey-v2';

// ─── Props ───────────────────────────────────────────────────

interface SocialLoginButtonsProps {
  onGoogleClick?: () => void;
  returnUrl?: string;
  lang?: SurveyLang;
  disabled?: boolean;
}

// ─── i18n ────────────────────────────────────────────────────

interface ButtonLabels {
  kakao: string;
  google: string;
}

const LABELS: Record<string, ButtonLabels> = {
  KO: { kakao: '카카오로 로그인', google: 'Google로 로그인' },
  EN: { kakao: 'Sign in with Kakao', google: 'Sign in with Google' },
  JP: { kakao: 'カカオでログイン', google: 'Googleでログイン' },
  'ZH-CN': { kakao: '使用Kakao登录', google: '使用Google登录' },
};

// ─── Component ───────────────────────────────────────────────

export function SocialLoginButtons({
  onGoogleClick,
  returnUrl = '/',
  lang = 'KO',
  disabled = false,
}: SocialLoginButtonsProps) {
  const labels = LABELS[lang] || LABELS.EN;

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
        <span>{labels.kakao}</span>
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
          <span>{labels.google}</span>
        </button>
      )}

      <style jsx>{`
        .slb-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }
        .slb-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .slb-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .slb-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .slb-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .slb-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        .slb-btn--kakao {
          background: #FEE500;
          color: #000000;
        }
        .slb-btn--google {
          background: #ffffff;
          color: #333333;
          border: 1px solid #dadce0;
        }
      `}</style>
    </div>
  );
}
