import { useRouter } from 'next/router';
import { Loader2, Plus, Stethoscope, Users, TrendingUp, Award, Trophy, Star, Eye, Heart, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

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

export default function DoctorDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [solutions, setSolutions] = useState<Solution[]>([]);
    const [apiStats, setApiStats] = useState<Stats>({ totalClicks: 0, totalSaves: 0, totalAdoptions: 0, totalMatches: 0 });
    const [loadingSolutions, setLoadingSolutions] = useState(true);

    // Gamification Stats
    const [stats, setStats] = useState({
        points: 0,
        tier: 'Bronze',
        matchCount: 0,
        nextTier: 'Silver',
        pointsToNext: 1000,
        progressPercent: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

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

    return (
        <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
            {/* Gamification Header */}
            <div className="mb-12 relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-[#0f1219] to-black border border-white/10 p-8 md:p-12">
                <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${getTierColor(stats.tier)} opacity-10 blur-[100px] rounded-full pointer-events-none`} />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${getTierColor(stats.tier)} text-black text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2`}>
                                <Trophy className="w-3 h-3" />
                                {stats.tier} PARTNER
                            </div>
                            <span className="text-gray-500 text-sm">Member since 2024</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                            Dr. {user?.name}
                        </h1>
                        <p className="text-gray-400 max-w-xl text-lg">
                            Track your clinical impact and patient matches.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="flex gap-4 md:gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {[
                            { label: 'Clicks', value: apiStats.totalClicks, icon: <Eye className="w-3 h-3 text-blue-400" />, color: 'text-blue-400' },
                            { label: 'Saves', value: apiStats.totalSaves, icon: <Heart className="w-3 h-3 text-pink-400" />, color: 'text-pink-400' },
                            { label: 'Adoptions', value: apiStats.totalAdoptions, icon: <CheckCircle className="w-3 h-3 text-emerald-400" />, color: 'text-emerald-400' },
                        ].map(stat => (
                            <div key={stat.label} className="flex-none w-32 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <div className={`text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-1`}>
                                    {stat.icon} {stat.label}
                                </div>
                                <div className={`text-2xl font-bold text-white`}>
                                    {loadingSolutions ? <Loader2 className="w-4 h-4 animate-spin" /> : stat.value.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-cyan-500" />
                        Signature Solutions
                    </h2>
                    {solutions.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">{solutions.length} solution{solutions.length > 1 ? 's' : ''} active</p>
                    )}
                </div>
                <button
                    onClick={() => router.push('/doctor/onboarding')}
                    className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg shadow-white/5"
                >
                    <Plus className="w-5 h-5" />
                    New Protocol
                </button>
            </div>

            {/* Main Grid */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* Signature Solutions */}
                <div className="md:col-span-2 space-y-4">
                    {loadingSolutions ? (
                        <div className="h-64 flex items-center justify-center border border-white/10 rounded-3xl bg-[#0f1219]">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        </div>
                    ) : solutions.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/20 rounded-3xl bg-[#0f1219] text-gray-500 space-y-4 hover:border-cyan-500/30 hover:bg-[#151922] transition-all cursor-pointer" onClick={() => router.push('/doctor/onboarding')}>
                            <div className="p-4 bg-white/5 rounded-full">
                                <Stethoscope className="w-8 h-8 opacity-40" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-white">No Signature Solutions</p>
                                <p className="text-sm">Define your first treatment protocol to get matched.</p>
                            </div>
                        </div>
                    ) : (
                        solutions.map(solution => (
                            <div key={solution.id} className="p-5 rounded-2xl border border-white/10 bg-[#0f1219] hover:border-cyan-500/30 hover:bg-[#151922] transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white">{solution.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getSolutionTierBadge(solution.tier)}`}>
                                                {solution.tier}
                                            </span>
                                        </div>
                                        {solution.targetConditions && (
                                            <p className="text-xs text-gray-500">{solution.targetConditions}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-blue-400">{solution.clicks}</div>
                                        <div className="text-xs text-gray-600 flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> Clicks</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-pink-400">{solution.saves}</div>
                                        <div className="text-xs text-gray-600 flex items-center justify-center gap-1"><Heart className="w-3 h-3" /> Saves</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-emerald-400">{solution.adoptions}</div>
                                        <div className="text-xs text-gray-600 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Adopted</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Patient Inquiries */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 group-hover:border-cyan-500/30 transition-colors">
                                    <Users className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-white">Patient Inquiries</h3>
                                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                    You have <span className="text-white font-bold">{apiStats.totalMatches}</span> active matches waiting for consultation.
                                </p>
                            </div>
                            <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-white transition-colors">
                                View Waitlist
                            </button>
                        </div>
                    </div>

                    {/* Points Card */}
                    <div className="bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="w-5 h-5 text-yellow-500" />
                            <h3 className="font-bold text-white">Partner Points</h3>
                        </div>
                        <div className="text-3xl font-black text-white mb-1">{stats.points.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mb-3">{stats.pointsToNext} pts to {stats.nextTier}</div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000" style={{ width: `${stats.progressPercent}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
