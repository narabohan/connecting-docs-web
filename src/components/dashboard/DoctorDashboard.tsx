import { useRouter } from 'next/router';
import { Loader2, Plus, Stethoscope, Users, Award, Trophy, Eye, Heart, CheckCircle, Pencil, Trash2, Info, LogOut, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LanguageCode } from '@/utils/translations';

interface Solution {
    id: string;
    name: string;
    tier: string;
    clicks: number;
    saves: number;
    adoptions: number;
    matchCount: number;
    status: string;
    targetConditions: string;
    createdAt: string;
}

interface Stats {
    totalClicks: number;
    totalSaves: number;
    totalAdoptions: number;
    totalMatches: number;
}

interface DoctorDashboardProps {
    language: LanguageCode;
}

const LABELS = {
    EN: {
        trackImpact: 'Track your clinical impact and patient matches.',
        partnerBadge: 'PARTNER',
        memberSince: 'Member since',
        clicks: 'Clicks', saves: 'Saves', adoptions: 'Adoptions',
        signatureSolutions: 'Signature Solutions',
        solutionsActive: (n: number) => `${n} solution${n !== 1 ? 's' : ''} active`,
        newProtocol: 'New Protocol',
        noSolutions: 'No Signature Solutions',
        noSolutionsDesc: 'Define your first treatment protocol to get matched.',
        patientInquiries: 'Patient Inquiries',
        activeMatches: (n: number) => `You have ${n} active match${n !== 1 ? 'es' : ''} waiting for consultation.`,
        viewWaitlist: 'View Waitlist',
        partnerPoints: 'Partner Points',
        ptsToNext: (pts: number, tier: string) => `${pts} pts to ${tier}`,
        howToEarn: 'How to earn points',
        earnTitle: 'How Partner Points Work',
        earnDesc: 'Your solutions earn points every time patients interact with them.',
        earnItems: [
            { label: 'Patient clicks your solution', pts: '+5 pts' },
            { label: 'Patient saves your solution', pts: '+15 pts' },
            { label: 'Patient adopts your protocol', pts: '+50 pts' },
            { label: 'Monthly activity bonus', pts: '+100 pts' },
        ],
        tiers: 'Bronze → Silver → Gold → Platinum → Diamond',
        editSolution: 'Edit',
        deleteSolution: 'Delete',
        confirmDelete: 'Delete this solution?',
        confirmDeleteDesc: 'This action cannot be undone.',
        cancel: 'Cancel',
        confirm: 'Delete',
        signOut: 'Sign out',
    },
    KO: {
        trackImpact: '임상 임팩트와 환자 매칭 현황을 추적하세요.',
        partnerBadge: '파트너',
        memberSince: '가입일',
        clicks: '클릭', saves: '저장', adoptions: '채택',
        signatureSolutions: '시그니처 솔루션',
        solutionsActive: (n: number) => `${n}개 솔루션 활성`,
        newProtocol: '새 프로토콜',
        noSolutions: '시그니처 솔루션 없음',
        noSolutionsDesc: '첫 번째 치료 프로토콜을 등록하고 매칭을 시작하세요.',
        patientInquiries: '환자 문의',
        activeMatches: (n: number) => `상담 대기 중인 매칭이 ${n}건 있습니다.`,
        viewWaitlist: '대기자 목록 보기',
        partnerPoints: '파트너 포인트',
        ptsToNext: (pts: number, tier: string) => `${tier}까지 ${pts}포인트`,
        howToEarn: '포인트 획득 방법',
        earnTitle: '파트너 포인트 시스템',
        earnDesc: '환자가 내 솔루션과 상호작용할 때마다 포인트를 획득합니다.',
        earnItems: [
            { label: '환자가 솔루션 클릭', pts: '+5 pts' },
            { label: '환자가 솔루션 저장', pts: '+15 pts' },
            { label: '환자가 프로토콜 채택', pts: '+50 pts' },
            { label: '월간 활동 보너스', pts: '+100 pts' },
        ],
        tiers: 'Bronze → Silver → Gold → Platinum → Diamond',
        editSolution: '수정',
        deleteSolution: '삭제',
        confirmDelete: '이 솔루션을 삭제할까요?',
        confirmDeleteDesc: '이 작업은 되돌릴 수 없습니다.',
        cancel: '취소',
        confirm: '삭제',
        signOut: '로그아웃',
    },
    JP: {
        trackImpact: '臨床インパクトと患者マッチングを追跡します。',
        partnerBadge: 'パートナー',
        memberSince: '登録日',
        clicks: 'クリック', saves: '保存', adoptions: '採用',
        signatureSolutions: 'シグネチャーソリューション',
        solutionsActive: (n: number) => `${n}件のソリューションが有効`,
        newProtocol: '新規プロトコル',
        noSolutions: 'ソリューションなし',
        noSolutionsDesc: '最初の治療プロトコルを登録しましょう。',
        patientInquiries: '患者からの問い合わせ',
        activeMatches: (n: number) => `相談待ちのマッチが${n}件あります。`,
        viewWaitlist: 'ウェイトリストを見る',
        partnerPoints: 'パートナーポイント',
        ptsToNext: (pts: number, tier: string) => `${tier}まで${pts}ポイント`,
        howToEarn: 'ポイントの獲得方法',
        earnTitle: 'パートナーポイントの仕組み',
        earnDesc: '患者があなたのソリューションを操作するたびにポイントを獲得します。',
        earnItems: [
            { label: '患者がソリューションをクリック', pts: '+5 pts' },
            { label: '患者がソリューションを保存', pts: '+15 pts' },
            { label: '患者がプロトコルを採用', pts: '+50 pts' },
            { label: '月次アクティビティボーナス', pts: '+100 pts' },
        ],
        tiers: 'Bronze → Silver → Gold → Platinum → Diamond',
        editSolution: '編集',
        deleteSolution: '削除',
        confirmDelete: 'このソリューションを削除しますか？',
        confirmDeleteDesc: 'この操作は取り消せません。',
        cancel: 'キャンセル',
        confirm: '削除',
        signOut: 'サインアウト',
    },
    CN: {
        trackImpact: '跟踪您的临床影响力和患者匹配情况。',
        partnerBadge: '合作伙伴',
        memberSince: '加入日期',
        clicks: '点击', saves: '保存', adoptions: '采用',
        signatureSolutions: '签名解决方案',
        solutionsActive: (n: number) => `${n}个解决方案有效`,
        newProtocol: '新建协议',
        noSolutions: '没有签名解决方案',
        noSolutionsDesc: '注册您的第一个治疗协议以开始匹配。',
        patientInquiries: '患者咨询',
        activeMatches: (n: number) => `有${n}个活跃匹配等待咨询。`,
        viewWaitlist: '查看等待列表',
        partnerPoints: '合作伙伴积分',
        ptsToNext: (pts: number, tier: string) => `距${tier}还需${pts}积分`,
        howToEarn: '如何获得积分',
        earnTitle: '合作伙伴积分系统',
        earnDesc: '每次患者与您的解决方案互动时，您都会获得积分。',
        earnItems: [
            { label: '患者点击您的解决方案', pts: '+5 pts' },
            { label: '患者保存您的解决方案', pts: '+15 pts' },
            { label: '患者采用您的协议', pts: '+50 pts' },
            { label: '月度活动奖励', pts: '+100 pts' },
        ],
        tiers: 'Bronze → Silver → Gold → Platinum → Diamond',
        editSolution: '编辑',
        deleteSolution: '删除',
        confirmDelete: '删除此解决方案？',
        confirmDeleteDesc: '此操作无法撤销。',
        cancel: '取消',
        confirm: '删除',
        signOut: '退出登录',
    },
};

export default function DoctorDashboard({ language }: DoctorDashboardProps) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [solutions, setSolutions] = useState<Solution[]>([]);
    const [apiStats, setApiStats] = useState<Stats>({ totalClicks: 0, totalSaves: 0, totalAdoptions: 0, totalMatches: 0 });
    const [loadingSolutions, setLoadingSolutions] = useState(true);
    const [showPointsInfo, setShowPointsInfo] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [stats, setStats] = useState({
        points: 0, tier: 'Bronze', matchCount: 0,
        nextTier: 'Silver', pointsToNext: 1000, progressPercent: 0,
        joinedAt: '',
    });
    const [loadingStats, setLoadingStats] = useState(true);

    const t = LABELS[language] || LABELS.EN;

    useEffect(() => {
        if (user?.email) {
            fetchStats();
            fetchSolutions();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/doctor/stats?email=${user?.email}`);
            const data = await res.json();
            if (data.points !== undefined) {
                setStats(data);
            }
        } catch (e) {
            console.error('Failed to fetch stats', e);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchSolutions = async () => {
        try {
            const res = await fetch(`/api/doctor/solutions?email=${encodeURIComponent(user!.email)}`);
            const data = await res.json();
            if (data.solutions) {
                setSolutions(data.solutions);
                setApiStats(data.stats || { totalClicks: 0, totalSaves: 0, totalAdoptions: 0, totalMatches: 0 });
            }
        } catch (e) {
            console.error('Failed to fetch solutions', e);
        } finally {
            setLoadingSolutions(false);
        }
    };

    const handleDeleteSolution = async (solutionId: string) => {
        setDeleting(true);
        try {
            await fetch(`/api/doctor/solution?id=${solutionId}`, { method: 'DELETE' });
            setSolutions(prev => prev.filter(s => s.id !== solutionId));
        } catch (e) {
            console.error('Delete failed', e);
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'Diamond': return 'from-cyan-400 to-blue-600';
            case 'Platinum': return 'from-slate-300 to-slate-500';
            case 'Gold': return 'from-yellow-300 to-yellow-600';
            case 'Silver': return 'from-gray-300 to-gray-500';
            default: return 'from-orange-700 to-orange-500';
        }
    };

    const getSolutionTierBadge = (tier: string) => {
        switch (tier) {
            case 'VIP': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'Standard': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-white/10 text-gray-400 border-white/10';
        }
    };

    // Format joined date
    const joinedDisplay = (() => {
        const raw = stats.joinedAt || (user as any)?.createdAt || '';
        if (!raw) return '';
        try {
            return new Date(raw).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        } catch { return ''; }
    })();

    return (
        <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">

            {/* ── Gamification Header ─────────────────────────────────── */}
            <div className="mb-12 relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-[#0f1219] to-black border border-white/10 p-8 md:p-12">
                <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${getTierColor(stats.tier)} opacity-10 blur-[100px] rounded-full pointer-events-none`} />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${getTierColor(stats.tier)} text-black text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2`}>
                                <Trophy className="w-3 h-3" />
                                {stats.tier} {t.partnerBadge}
                            </div>
                            {joinedDisplay && (
                                <span className="text-gray-500 text-sm">{t.memberSince} {joinedDisplay}</span>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                            Dr. {user?.displayName}
                        </h1>
                        <p className="text-gray-400 max-w-xl text-lg">{t.trackImpact}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {[
                            { label: t.clicks, value: apiStats.totalClicks, icon: <Eye className="w-3 h-3 text-blue-400" />, color: 'text-blue-400' },
                            { label: t.saves, value: apiStats.totalSaves, icon: <Heart className="w-3 h-3 text-pink-400" />, color: 'text-pink-400' },
                            { label: t.adoptions, value: apiStats.totalAdoptions, icon: <CheckCircle className="w-3 h-3 text-emerald-400" />, color: 'text-emerald-400' },
                        ].map(stat => (
                            <div key={stat.label} className="flex-none w-32 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <div className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-1">
                                    {stat.icon} {stat.label}
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {loadingSolutions ? <Loader2 className="w-4 h-4 animate-spin" /> : stat.value.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Solutions + Sidebar ─────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-cyan-500" />
                        {t.signatureSolutions}
                    </h2>
                    {solutions.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">{t.solutionsActive(solutions.length)}</p>
                    )}
                </div>
                <button
                    onClick={() => router.push('/doctor/onboarding')}
                    className="flex-shrink-0 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg shadow-white/5"
                >
                    <Plus className="w-5 h-5" />
                    {t.newProtocol}
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">

                {/* Solutions List */}
                <div className="md:col-span-2 space-y-4">
                    {loadingSolutions ? (
                        <div className="h-64 flex items-center justify-center border border-white/10 rounded-3xl bg-[#0f1219]">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        </div>
                    ) : solutions.length === 0 ? (
                        <div
                            className="h-64 flex flex-col items-center justify-center border border-dashed border-white/20 rounded-3xl bg-[#0f1219] text-gray-500 space-y-4 hover:border-cyan-500/30 hover:bg-[#151922] transition-all cursor-pointer"
                            onClick={() => router.push('/doctor/onboarding')}
                        >
                            <div className="p-4 bg-white/5 rounded-full">
                                <Stethoscope className="w-8 h-8 opacity-40" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-white">{t.noSolutions}</p>
                                <p className="text-sm">{t.noSolutionsDesc}</p>
                            </div>
                        </div>
                    ) : (
                        solutions.map(solution => (
                            <div key={solution.id} className="p-5 rounded-2xl border border-white/10 bg-[#0f1219] hover:border-white/20 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white truncate">{solution.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${getSolutionTierBadge(solution.tier)}`}>
                                                {solution.tier}
                                            </span>
                                        </div>
                                        {solution.targetConditions && (
                                            <p className="text-xs text-gray-500 truncate">{solution.targetConditions}</p>
                                        )}
                                    </div>
                                    {/* Edit / Delete buttons */}
                                    <div className="flex items-center gap-1 ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => router.push(`/doctor/onboarding?edit=${solution.id}`)}
                                            title={t.editSolution}
                                            className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(solution.id)}
                                            title={t.deleteSolution}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-blue-400">{solution.clicks}</div>
                                        <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                                            <Eye className="w-3 h-3" /> {t.clicks}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-pink-400">{solution.saves}</div>
                                        <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                                            <Heart className="w-3 h-3" /> {t.saves}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-emerald-400">{solution.adoptions}</div>
                                        <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> {t.adoptions}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Patient Inquiries */}
                    <div className="bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 group-hover:border-cyan-500/30 transition-colors">
                                    <Users className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-white">{t.patientInquiries}</h3>
                                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                    {t.activeMatches(apiStats.totalMatches)}
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/doctor/waitlist')}
                                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-white transition-colors"
                            >
                                {t.viewWaitlist}
                            </button>
                        </div>
                    </div>

                    {/* Partner Points */}
                    <div className="bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-yellow-500" />
                                <h3 className="font-bold text-white">{t.partnerPoints}</h3>
                            </div>
                            <button
                                onClick={() => setShowPointsInfo(!showPointsInfo)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                                title={t.howToEarn}
                            >
                                <Info className="w-4 h-4" />
                            </button>
                        </div>

                        {showPointsInfo ? (
                            /* Points explanation panel */
                            <div className="space-y-3">
                                <p className="text-xs text-gray-400 leading-relaxed">{t.earnDesc}</p>
                                <div className="space-y-2">
                                    {t.earnItems.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400">{item.label}</span>
                                            <span className="text-yellow-400 font-bold font-mono">{item.pts}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-600 pt-1 border-t border-white/5 font-mono">{t.tiers}</p>
                            </div>
                        ) : (
                            /* Points display */
                            <>
                                <div className="text-3xl font-black text-white mb-1">
                                    {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.points.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 mb-3">
                                    {t.ptsToNext(stats.pointsToNext, stats.nextTier)}
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all duration-1000"
                                        style={{ width: `${stats.progressPercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-600 mt-1">
                                    <span>{stats.tier}</span>
                                    <span>{stats.nextTier}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sign out */}
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-gray-500 text-sm font-medium transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        {t.signOut}
                    </button>
                </div>
            </div>

            {/* ── Delete Confirmation Modal ─────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                    <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white">{t.confirmDelete}</h3>
                            <button onClick={() => setDeleteTarget(null)} className="text-gray-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mb-6">{t.confirmDeleteDesc}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={() => handleDeleteSolution(deleteTarget)}
                                disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
