// ═══════════════════════════════════════════════════════════════
//  /unauthorized — Phase 1 (C-2, C-9 i18n refactor)
//  역할 기반 접근 거부 시 표시되는 페이지
// ═══════════════════════════════════════════════════════════════

import { useRouter } from 'next/router';
import Head from 'next/head';
import { ShieldX } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <Head>
        <title>{t('auth.unauthorized_title')}</title>
      </Head>

      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          {t('auth.unauthorized')}
        </h1>

        <p className="text-gray-400 mb-8 leading-relaxed">
          {t('auth.unauthorized_desc')}
        </p>

        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl transition-all font-medium"
        >
          {t('common.back_to_home')}
        </button>
      </div>
    </div>
  );
}
