import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Loader2, ArrowLeft, FileText, Calendar, Eye, Activity } from 'lucide-react';
import { withRoleGuard } from '@/lib/withRoleGuard';

interface AdminReport {
    id: string;
    date: string;
    topRecommendation: string;
    matchScore: number | null;
    primaryGoal: string;
    skinType: string;
    title: string;
    status: string;
}

function AdminReports() {
    const router = useRouter();
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/admin/reports');
            const data = await res.json();
            if (data.reports) {
                setReports(data.reports);
            }
        } catch (e) {
            console.error('Failed to fetch admin reports', e);
        } finally {
            setFetching(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch { return dateStr; }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Head>
                <title>Admin - All Reports | Connecting Docs</title>
            </Head>

            <header className="border-b border-white/10 bg-[#0f1219] py-4 px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <h1 className="text-xl font-bold font-mono text-[#00FFA0]">Admin Report Dashboard</h1>
                </div>
                <div className="text-sm text-gray-400 font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00FFA0] animate-pulse" /> Live Monitoring
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-12 px-6">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">All Generated Reports</h2>
                    <p className="text-gray-400">View and inspect reports from both Patient and Doctor perspectives.</p>
                </div>

                {fetching ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#00FFA0]" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/20 rounded-3xl bg-white/5">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Reports Found</h3>
                        <p className="text-gray-500">Wait for users to submit the AI Analysis.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {reports.map((report) => (
                            <div key={report.id} className="p-5 rounded-2xl border border-white/10 bg-[#0f1219] flex flex-col md:flex-row gap-6 md:items-center justify-between hover:border-[#00FFA0]/30 transition-all">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm text-gray-500 flex items-center gap-1 font-mono">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(report.date)}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                            {report.id}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">
                                        {report.title}
                                    </h3>
                                    <div className="text-sm text-gray-400 flex flex-wrap gap-4 mt-2 font-mono">
                                        {report.topRecommendation && (
                                            <span><strong className="text-white">Top:</strong> {report.topRecommendation}</span>
                                        )}
                                        {report.matchScore && (
                                            <span><strong className="text-[#00FFA0]">Score:</strong> {report.matchScore}%</span>
                                        )}
                                        {report.primaryGoal && (
                                            <span><strong className="text-white">Goal:</strong> {report.primaryGoal}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-3 shrink-0">
                                    <button
                                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all flex items-center justify-center gap-2 text-sm"
                                        onClick={() => window.open(`/report/${report.id}?role=patient`, '_blank')}>
                                        <Eye className="w-4 h-4" />
                                        Patient View
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg bg-[#00FFA0]/10 hover:bg-[#00FFA0]/20 text-[#00FFA0] border border-[#00FFA0]/30 transition-all flex items-center justify-center gap-2 text-sm"
                                        onClick={() => window.open(`/report/${report.id}?role=doctor`, '_blank')}>
                                        <Eye className="w-4 h-4" />
                                        Doctor View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default withRoleGuard(AdminReports, ['admin']);
