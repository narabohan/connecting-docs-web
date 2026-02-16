import { useRouter } from 'next/router';
import { Loader2, Plus, Stethoscope, Users, TrendingUp, Award, Trophy, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function DoctorDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [solutions, setSolutions] = useState<any[]>([]); // Mock for now

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
            console.error("Failed to fetch stats", e);
        } finally {
            setLoadingStats(false);
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'Diamond': return 'from-cyan-400 to-blue-600';
            case 'Platinum': return 'from-slate-300 to-slate-500'; // shiny silver
            case 'Gold': return 'from-yellow-300 to-yellow-600';
            case 'Silver': return 'from-gray-300 to-gray-500';
            default: return 'from-orange-700 to-orange-500'; // Bronze
        }
    };

    return (
        <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
            {/* Gamification Header */}
            <div className="mb-12 relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-[#0f1219] to-black border border-white/10 p-8 md:p-12">
                {/* Background Glow */}
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
                    <div className="flex gap-4 md:gap-8 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {/* Points Card */}
                        <div className="flex-none w-40 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <div className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-1">
                                <Award className="w-3 h-3 text-yellow-500" /> Total Points
                            </div>
                            <div className="text-2xl font-bold text-white">{stats.points.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-500 mt-1">
                                {stats.pointsToNext} pts to {stats.nextTier}
                            </div>
                            {/* Progress Bar */}
                            <div className="mt-3 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000" style={{ width: `${stats.progressPercent}%` }} />
                            </div>
                        </div>

                        {/* Matches Card */}
                        <div className="flex-none w-40 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative group overflow-hidden">
                            <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-1">
                                <Users className="w-3 h-3 text-cyan-400" /> Active Matches
                            </div>
                            <div className="text-2xl font-bold text-white">{stats.matchCount}</div>
                            <div className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> +2 this week
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-cyan-500" />
                        Clinical Management
                    </h2>
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
                <div className="md:col-span-2 space-y-6">
                    {solutions.length === 0 ? (
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
                        <div className="grid gap-4">
                            {/* Map solutions here */}
                        </div>
                    )}
                </div>

                {/* Patient Leads (Coming Soon) */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 group-hover:border-cyan-500/30 transition-colors">
                                    <Users className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-white">Patient Inquiries</h3>
                                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                    You have {stats.matchCount} active matches waiting for consultation availability.
                                </p>
                            </div>

                            <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-white transition-colors">
                                View Waitlist
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
