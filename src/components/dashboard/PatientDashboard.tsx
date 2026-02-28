import { useRouter } from 'next/router';
import { Loader2, Plus, FileText, MessageSquare, TrendingUp, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Report {
    id: string;
    date: string;
    topRecommendation: string;
    matchScore: number | null;
    primaryGoal: string;
    skinType: string;
    status: string;
}

export default function PatientDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [fetching, setFetching] = useState(true);

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
            return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch { return dateStr; }
    };

    return (
        <main className="max-w-7xl mx-auto px-6 py-24">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{user?.displayName}</span>
                    </h1>
                    <p className="text-gray-400 max-w-xl">
                        Your clinical intelligence dashboard. Access your past blueprints or start a new deep-dive analysis.
                    </p>
                </div>
                <button
                    onClick={() => router.push('/?start_wizard=true')}
                    className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Analysis
                </button>
            </div>

            {/* Main Grid */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* Recent Reports */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-cyan-500" />
                            Your Blueprints
                        </h2>
                        {reports.length > 0 && (
                            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">{reports.length} reports</span>
                        )}
                    </div>

                    {fetching ? (
                        <div className="h-64 flex items-center justify-center border border-white/10 rounded-2xl bg-[#0a0a0f]">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center border border-white/10 rounded-2xl bg-[#0a0a0f] text-gray-500 space-y-4">
                            <FileText className="w-12 h-12 opacity-20" />
                            <p>No reports generated yet.</p>
                            <button onClick={() => router.push('/?start_wizard=true')} className="text-cyan-400 hover:underline text-sm">
                                Start your first diagnosis
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    className="p-5 rounded-2xl border border-white/10 bg-[#0a0a0f] hover:border-cyan-500/30 hover:bg-[#0d0d14] transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(report.date)}
                                                </span>
                                                {report.status === 'completed' && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                                        Complete
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-white text-lg mb-1 group-hover:text-cyan-400 transition-colors">
                                                {report.topRecommendation || 'Skin Analysis Report'}
                                            </h3>
                                            {report.primaryGoal && (
                                                <p className="text-sm text-gray-500">Goal: {report.primaryGoal}</p>
                                            )}
                                        </div>
                                        {report.matchScore !== null && (
                                            <div className="flex flex-col items-center ml-4">
                                                <div className="text-2xl font-black text-cyan-400">{report.matchScore}%</div>
                                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" /> match
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* AI Consultant */}
                <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-cyan-500/10 blur-[100px] rounded-full" />
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                                <MessageSquare className="w-6 h-6 text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">AI Consultant</h3>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                Have questions about your report? Chat with our Clinical Intelligence Engine to get personalized answers.
                            </p>
                        </div>
                        <button className="w-full py-3 rounded-lg border border-white/10 bg-white/5 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                            Coming Soon
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
