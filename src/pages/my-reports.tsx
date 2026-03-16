// ═══════════════════════════════════════════════════════════════
//  /my-reports — Phase 1 (C-4)
//  비인증 유저용 리포트 재접근 페이지
//  localStorage에서 report_id 목록을 읽어 카드로 표시
//  참조: MASTER_PLAN_V4.md §16.2 (비인증 유저 3-Layer 안전망)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FileText, ArrowRight, ClipboardList } from 'lucide-react';
import { getReportEntries } from '@/services/local-report-store';

// ─── Types ───────────────────────────────────────────────────

interface ReportCard {
  reportId: string;
  savedAt: string;
  emailCaptured: boolean;
}

// ─── i18n ────────────────────────────────────────────────────

interface PageMessages {
  title: string;
  heading: string;
  description: string;
  emptyTitle: string;
  emptyDesc: string;
  emptyBtn: string;
  cardDate: string;
  cardView: string;
  emailBadge: string;
}

const MESSAGES: Record<string, PageMessages> = {
  KO: {
    title: '내 리포트 | ConnectingDocs',
    heading: '내 리포트',
    description: '이전에 생성한 AI 분석 리포트를 다시 열어볼 수 있습니다.',
    emptyTitle: '저장된 리포트가 없습니다',
    emptyDesc: '설문을 완료하면 여기에서 리포트를 다시 확인할 수 있어요.',
    emptyBtn: '설문 시작하기',
    cardDate: '생성일',
    cardView: '리포트 보기',
    emailBadge: '이메일 연결됨',
  },
  EN: {
    title: 'My Reports | ConnectingDocs',
    heading: 'My Reports',
    description: 'Revisit your previously generated AI analysis reports.',
    emptyTitle: 'No saved reports',
    emptyDesc: 'Complete a survey to see your reports here.',
    emptyBtn: 'Start Survey',
    cardDate: 'Created',
    cardView: 'View Report',
    emailBadge: 'Email linked',
  },
  JP: {
    title: 'マイレポート | ConnectingDocs',
    heading: 'マイレポート',
    description: '以前に作成したAI分析レポートを再確認できます。',
    emptyTitle: '保存されたレポートがありません',
    emptyDesc: 'アンケートを完了すると、ここでレポートを確認できます。',
    emptyBtn: 'アンケートを始める',
    cardDate: '作成日',
    cardView: 'レポートを見る',
    emailBadge: 'メール連携済み',
  },
  'ZH-CN': {
    title: '我的报告 | ConnectingDocs',
    heading: '我的报告',
    description: '重新查看之前生成的AI分析报告。',
    emptyTitle: '没有保存的报告',
    emptyDesc: '完成问卷后即可在这里查看报告。',
    emptyBtn: '开始问卷',
    cardDate: '创建于',
    cardView: '查看报告',
    emailBadge: '邮箱已关联',
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

function formatDate(isoStr: string, lang: string): string {
  try {
    const locale = lang === 'KO' ? 'ko-KR' : lang === 'JP' ? 'ja-JP' : lang === 'ZH-CN' ? 'zh-CN' : 'en-US';
    return new Date(isoStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

// ─── Component ───────────────────────────────────────────────

export default function MyReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const lang = detectLang();
  const messages = MESSAGES[lang] || MESSAGES.EN;

  useEffect(() => {
    const entries = getReportEntries();
    setReports(
      entries.map((e) => ({
        reportId: e.reportId,
        savedAt: e.savedAt,
        emailCaptured: e.emailCaptured,
      }))
    );
    setLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Head>
        <title>{messages.title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="max-w-2xl mx-auto py-16 px-6">
        <h1 className="text-2xl font-bold mb-2">{messages.heading}</h1>
        <p className="text-gray-400 mb-10 text-sm">{messages.description}</p>

        {loaded && reports.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/15 rounded-2xl bg-white/[0.02]">
            <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-300 mb-2">
              {messages.emptyTitle}
            </h3>
            <p className="text-gray-500 text-sm mb-6">{messages.emptyDesc}</p>
            <button
              onClick={() => router.push('/survey-v2')}
              className="px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl transition-all font-medium text-sm"
            >
              {messages.emptyBtn}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((report) => (
              <button
                key={report.reportId}
                onClick={() => router.push(`/report-v2/${report.reportId}`)}
                className="w-full p-5 rounded-2xl border border-white/10 bg-[#0f1219] flex items-center gap-4 hover:border-cyan-500/30 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {report.reportId}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {messages.cardDate}: {formatDate(report.savedAt, lang)}
                  </p>
                </div>
                {report.emailCaptured && (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                    {messages.emailBadge}
                  </span>
                )}
                <div className="flex items-center gap-1 text-cyan-400 text-xs font-medium flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {messages.cardView}
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
