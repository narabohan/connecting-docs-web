// ═══════════════════════════════════════════════════════════════
//  /auth/callback — Phase 1 (C-5)
//  Client-side handler for Firebase Custom Token sign-in
//  Used after Kakao (and future Naver/Line) OAuth flows
//
//  URL: /auth/callback?token=xxx&provider=kakao&name=...&email=...&returnUrl=/
//
//  Flow:
//    1. Extract token + metadata from URL params
//    2. signInWithCustomToken(auth, token)
//    3. onAuthStateChanged picks up the new user → AuthContext updates
//    4. Redirect to returnUrl (or /)
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Loader2, AlertCircle } from 'lucide-react';

// ─── i18n ────────────────────────────────────────────────────

interface CallbackMessages {
  title: string;
  loading: string;
  error: string;
  retryBtn: string;
}

const MESSAGES: Record<string, CallbackMessages> = {
  KO: {
    title: '로그인 처리 중 | ConnectingDocs',
    loading: '로그인 처리 중...',
    error: '로그인에 실패했습니다. 다시 시도해주세요.',
    retryBtn: '다시 로그인',
  },
  EN: {
    title: 'Signing in... | ConnectingDocs',
    loading: 'Signing you in...',
    error: 'Sign-in failed. Please try again.',
    retryBtn: 'Try Again',
  },
  JP: {
    title: 'ログイン中 | ConnectingDocs',
    loading: 'ログイン処理中...',
    error: 'ログインに失敗しました。もう一度お試しください。',
    retryBtn: 'もう一度',
  },
  'ZH-CN': {
    title: '登录中 | ConnectingDocs',
    loading: '正在登录...',
    error: '登录失败，请重试。',
    retryBtn: '重新登录',
  },
};

function detectLang(): string {
  if (typeof window === 'undefined') return 'EN';
  const navLang = navigator.language.toLowerCase();
  if (navLang.startsWith('ko')) return 'KO';
  if (navLang.startsWith('ja')) return 'JP';
  if (navLang.startsWith('zh')) return 'ZH-CN';
  return 'EN';
}

// ─── Component ───────────────────────────────────────────────

type CallbackStatus = 'processing' | 'success' | 'error';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [callbackStatus, setCallbackStatus] = useState<CallbackStatus>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const lang = detectLang();
  const messages = MESSAGES[lang] || MESSAGES.EN;

  useEffect(() => {
    if (!router.isReady) return;

    const { token, returnUrl, name, provider } = router.query;

    if (typeof token !== 'string') {
      setCallbackStatus('error');
      setErrorMsg('Missing authentication token');
      return;
    }

    const targetUrl = typeof returnUrl === 'string' ? returnUrl : '/';
    const oauthName = typeof name === 'string' ? name : undefined;
    const oauthProvider = typeof provider === 'string' ? provider : undefined;

    // Store OAuth metadata so AuthContext can pick it up
    if (oauthProvider) {
      localStorage.setItem('cd_oauth_provider', oauthProvider);
    }
    if (oauthName) {
      localStorage.setItem('cd_oauth_name', oauthName);
    }

    // Dynamic import to avoid SSR issues with Firebase
    import('@/lib/firebase')
      .then(({ auth, signInWithCustomToken, updateProfile }) => {
        return signInWithCustomToken(auth, token).then((cred) => {
          // Set displayName from OAuth provider profile if available
          if (oauthName && cred.user) {
            return updateProfile(cred.user, { displayName: oauthName }).then(() => cred);
          }
          return cred;
        });
      })
      .then(() => {
        // onAuthStateChanged in AuthContext will pick up the user
        setCallbackStatus('success');
        router.replace(targetUrl);
      })
      .catch((err: Error) => {
        console.error('[auth/callback] signInWithCustomToken failed:', err);
        setCallbackStatus('error');
        setErrorMsg(err.message || 'Authentication failed');
      });
  }, [router, router.isReady]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <Head>
        <title>{messages.title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="text-center max-w-sm">
        {callbackStatus === 'processing' && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mx-auto mb-4" />
            <p className="text-gray-300 text-sm">{messages.loading}</p>
          </>
        )}

        {callbackStatus === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-gray-300 text-sm mb-2">{messages.error}</p>
            {errorMsg && (
              <p className="text-gray-500 text-xs mb-6 font-mono">{errorMsg}</p>
            )}
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl transition-all font-medium text-sm"
            >
              {messages.retryBtn}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
