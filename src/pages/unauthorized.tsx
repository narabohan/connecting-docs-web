// ═══════════════════════════════════════════════════════════════
//  /unauthorized — Phase 1 (C-2)
//  역할 기반 접근 거부 시 표시되는 페이지
//  4개국어 지원: KO, EN, JP, ZH-CN
// ═══════════════════════════════════════════════════════════════

import { useRouter } from 'next/router';
import Head from 'next/head';
import { ShieldX } from 'lucide-react';

// ─── i18n Messages ───────────────────────────────────────────

interface UnauthorizedMessages {
  title: string;
  heading: string;
  description: string;
  backButton: string;
}

const MESSAGES: Record<string, UnauthorizedMessages> = {
  KO: {
    title: '접근 권한 없음 | ConnectingDocs',
    heading: '접근 권한이 없습니다',
    description: '이 페이지에 접근할 수 있는 권한이 없습니다. 올바른 계정으로 로그인했는지 확인해주세요.',
    backButton: '홈으로 돌아가기',
  },
  EN: {
    title: 'Unauthorized | ConnectingDocs',
    heading: 'Access Denied',
    description: 'You do not have permission to access this page. Please make sure you are logged in with the correct account.',
    backButton: 'Go to Home',
  },
  JP: {
    title: 'アクセス権限なし | ConnectingDocs',
    heading: 'アクセス権限がありません',
    description: 'このページにアクセスする権限がありません。正しいアカウントでログインしているか確認してください。',
    backButton: 'ホームに戻る',
  },
  'ZH-CN': {
    title: '无访问权限 | ConnectingDocs',
    heading: '访问被拒绝',
    description: '您没有访问此页面的权限。请确认您使用了正确的账户登录。',
    backButton: '返回首页',
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

export default function UnauthorizedPage() {
  const router = useRouter();
  const messages = MESSAGES[detectLang()] || MESSAGES.EN;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <Head>
        <title>{messages.title}</title>
      </Head>

      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          {messages.heading}
        </h1>

        <p className="text-gray-400 mb-8 leading-relaxed">
          {messages.description}
        </p>

        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl transition-all font-medium"
        >
          {messages.backButton}
        </button>
      </div>
    </div>
  );
}
