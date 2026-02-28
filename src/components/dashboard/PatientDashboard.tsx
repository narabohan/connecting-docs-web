import { useRouter } from 'next/router';
import { Loader2, Plus, FileText, MessageSquare, TrendingUp, Calendar, Copy, Check, LogOut, User, ChevronRight, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LanguageCode } from '@/utils/translations';

interface Report {
    id: string;
    date: string;
    topRecommendation: string;
    matchScore: number | null;
    primaryGoal: string;
    skinType: string;
    status: string;
}

interface PatientDashboardProps {
    language: LanguageCode;
}

const LABELS = {
    EN: {
        welcome: 'Welcome back',
        subtitle: 'Your clinical intelligence dashboard. Access your past blueprints or start a new deep-dive analysis.',
        newAnalysis: 'New Analysis',
        yourBlueprints: 'Your Blueprints',
        reports: 'reports',
        loading: 'Loading...',
        noReports: 'No reports generated yet.',
        startFirst: 'Start your first analysis',
        goal: 'Goal',
        match: 'match',
        aiConsultant: 'AI Consultant',
        aiDesc: 'Have questions about your report? Chat with our Clinical Intelligence Engine to get personalized answers.',
        comingSoon: 'Coming Soon',
        profile: 'Your Profile',
        signOut: 'Sign out',
        copyLink: 'Copy link',
        copied: 'Copied!',
        viewReport: 'View Report',
        complete: 'Complete',
        skinType: 'Skin type',
    },
    KO: {
        welcome: '다시 오셨군요',
        subtitle: '나의 임상 인텔리전스 대시보드. 과거 분석 리포트를 확인하거나 새 분석을 시작하세요.',
        newAnalysis: '새 분석',
        yourBlueprints: '나의 리포트',
        reports: '개 리포트',
        loading: '불러오는 중...',
        noReports: '아직 생성된 리포트가 없습니다.',
        startFirst: '첫 번째 분석 시작하기',
        goal: '목표',
        match: '일치',
        aiConsultant: 'AI 상담',
        aiDesc: '리포트에 궁금한 점이 있으신가요? 맞춤형 답변을 받아보세요.',
        comingSoon: '준비 중',
        profile: '내 프로필',
        signOut: '로그아웃',
        copyLink: '링크 복사',
        copied: '복사됨!',
        viewReport: '리포트 보기',
        complete: '완료',
        skinType: '피부 타입',
    },
    JP: {
        welcome: 'おかえりなさい',
        subtitle: 'クリニカルインテリジェンスダッシュボード。過去のレポートを確認するか、新しい分析を開始してください。',
        newAnalysis: '新規分析',
        yourBlueprints: 'マイレポート',
        reports: '件のレポート',
        loading: '読み込み中...',
        noReports: 'まだレポートがありません。',
        startFirst: '最初の分析を開始',
        goal: '目標',
        match: 'マッチ',
        aiConsultant: 'AIコンサルタント',
        aiDesc: 'レポートについてご質問がありますか？パーソナライズされた回答を受け取りましょう。',
        comingSoon: '近日公開',
        profile: 'プロフィール',
        signOut: 'サインアウト',
        copyLink: 'リンクをコピー',
        copied: 'コピー済み!',
        viewReport: 'レポートを見る',
        complete: '完了',
        skinType: '肌タイプ',
    },
    CN: {
        welcome: '欢迎回来',
        subtitle: '您的临床智能仪表板。查看过去的报告或开始新的分析。',
        newAnalysis: '新建分析',
        yourBlueprints: '我的报告',
        reports: '份报告',
        loading: '加载中...',
        noReports: '尚未生成任何报告。',
        startFirst: '开始第一次分析',
        goal: '目标',
        match: '匹配',
        aiConsultant: 'AI顾问',
        aiDesc: '对您的报告有疑问吗？获取个性化答案。',
        comingSoon: '即将推出',
        profile: '我的资料',
        signOut: '退出登录',
        copyLink: '复制链接',
        copied: '已复制!',
        viewReport: '查看报告',
        complete: '完成',
        skinType: '皮肤类型',
    },
};

const DATE_LOCALES: Record<LanguageCode, string> = {
    EN: 'en-US',
    KO: 'ko-KR',
    JP: 'ja-JP',
    CN: 'zh-CN',
};

export default function PatientDashboard({ language }: PatientDashboardProps) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [fetching, setFetching] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const t = LABELS[language] || LABELS.EN;

    useEffect(() => {
        if (user?.email) {
            fetchReports();
        }
    }, [user]);

    const fetchReports = async () => {
        try {
            const res = await fetch(`/api/reports?email=${encodeURIComponent(user!.email)}`);
            const data = await res.json();
            if (data.reports) {
                setReports(data.reports);
            }
        } catch (e) {
            console.error('Failed to fetch reports', e);
        } finally {
            setFetching(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString(DATE_LOCALES[language] || 'en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
            });
        } catch { return dateStr; }
    };

    const handleCopyLink = async (reportId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/report/${reportId}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(reportId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            // fallback
            const el = document.createElement('textarea');
            el.value = url;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopiedId(reportId);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    // User initials for avatar
    const initials = user?.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.email?.slice(0, 2).toUpperCase() || 'U';

    return (
        <main className="max-w-7xl mx-auto px-6 py-24">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                        {t.welcome},{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            {user?.displayName}
                        </span>
                    </h1>
                    <p className="text-gray-400 max-w-xl">{t.subtitle}</p>
                </div>
                <button
                    onClick={() => router.push('/?start_wizard=true')}
                    className="flex-shrink-0 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    {t.newAnalysis}
                </button>
            </div>

            {/* Main Grid */}
            <div className="grid md:grid-cols-3 gap-8">

                {/* ── Reports Column ─────────────────────────────────── */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-cyan-500" />
                            {t.yourBlueprints}
                        </h2>
                        {reports.length > 0 && (
                            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                                {reports.length} {t.reports}
                            </span>
                        )}
                    </div>

                    {fetching ? (
                        <div className="h-64 flex items-center justify-center border border-white/10 rounded-2xl bg-[#0a0a0f]">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div
                            className="h-64 flex flex-col items-center justify-center border border-dashed border-white/15 rounded-2xl bg-[#0a0a0f] hover:border-cyan-500/30 hover:bg-[#0d0d14] transition-all cursor-pointer space-y-4"
                            onClick={() => router.push('/?start_wizard=true')}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                                <FileText className="w-8 h-8 opacity-20" />
                            </div>
                            <div className="text-center">
                                <p className="text-white font-semibold mb-1">{t.noReports}</p>
                                <p className="text-cyan-400 text-sm hover:underline">{t.startFirst}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    onClick={() => router.push(`/report/${report.id}`)}
                                    className="p-5 rounded-2xl border border-white/10 bg-[#0a0a0f] hover:border-cyan-500/30 hover:bg-[#0d0d14] transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(report.date)}
                                                </span>
                                                {report.status === 'completed' && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                                        {t.complete}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-white text-lg mb-1 group-hover:text-cyan-400 transition-colors truncate">
                                                {report.topRecommendation || 'Skin Analysis Report'}
                                            </h3>
                                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                {report.primaryGoal && <span>{t.goal}: {report.primaryGoal}</span>}
                                                {report.skinType && <span>{t.skinType}: {report.skinType}</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                            {/* Match score */}
                                            {report.matchScore !== null && (
                                                <div className="flex flex-col items-center">
                                                    <div className="text-2xl font-black text-cyan-400">{report.matchScore}%</div>
                                                    <div className="text-xs text-gray-600 flex items-center gap-1">
                                                        <TrendingUp className="w-3 h-3" /> {t.match}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Feedback shortcut */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); router.push(`/feedback?reportId=${report.id}`); }}
                                                title="시술 후기 작성"
                                                className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-amber-400 transition-all"
                                            >
                                                <Star className="w-4 h-4" />
                                            </button>
                                            {/* Copy link */}
                                            <button
                                                onClick={(e) => handleCopyLink(report.id, e)}
                                                title={t.copyLink}
                                                className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                                            >
                                                {copiedId === report.id
                                                    ? <Check className="w-4 h-4 text-cyan-400" />
                                                    : <Copy className="w-4 h-4" />
                                                }
                                            </button>
                                            {/* Arrow */}
                                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Sidebar ─────────────────────────────────────────── */}
                <div className="space-y-6">

                    {/* Profile Card */}
                    <div className="bg-gradient-to-br from-[#0f1219] to-black border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {t.profile}
                        </h3>
                        <div className="flex items-center gap-4 mb-5">
                            {/* Avatar */}
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                    <span className="text-xl font-bold text-cyan-400">{initials}</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-white truncate">{user?.displayName}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                                    {user?.role || 'patient'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={signOut}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-gray-400 text-sm font-medium transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            {t.signOut}
                        </button>
                    </div>

                    {/* AI Consultant */}
                    <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-cyan-500/10 blur-[100px] rounded-full" />
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                                    <MessageSquare className="w-6 h-6 text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{t.aiConsultant}</h3>
                                <p className="text-sm text-gray-400 mb-6 leading-relaxed">{t.aiDesc}</p>
                            </div>
                            <button className="w-full py-3 rounded-lg border border-white/10 bg-white/5 text-gray-500 cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                                {t.comingSoon}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
