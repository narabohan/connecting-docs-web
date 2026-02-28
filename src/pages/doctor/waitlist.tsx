import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { Loader2, ArrowLeft, Mail, Calendar, CheckCircle } from 'lucide-react';
import { withDoctorGuard } from '@/components/auth/ProtectedRoute';

interface WaitlistItem {
    id: string;
    patientEmail: string;
    status: string;
    score: string;
    solutionId: string;
    createdAt: string;
    reportId?: string;
}

function DoctorWaitlist() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (user?.email) {
            fetchWaitlist();
        }
    }, [user]);

    const fetchWaitlist = async () => {
        try {
            const res = await fetch(`/api/doctor/waitlist?email=${encodeURIComponent(user!.email)}`);
            const data = await res.json();
            if (data.waitlist) {
                setWaitlist(data.waitlist);
            }
        } catch (e) {
            console.error('Failed to fetch waitlist:', e);
        } finally {
            setFetching(false);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Head>
                <title>Patient Waitlist | Connecting Docs</title>
            </Head>

            <header className="border-b border-white/10 bg-[#0f1219] py-4 px-6 flex items-center gap-4">
                <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <h1 className="text-xl font-bold">Patient Waitlist (Inquiries)</h1>
            </header>

            <main className="max-w-5xl mx-auto py-12 px-6">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">Active Matches</h2>
                    <p className="text-gray-400">Patients who unlocked your master profile and requested a consultation.</p>
                </div>

                {fetching ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    </div>
                ) : waitlist.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/20 rounded-3xl bg-white/5">
                        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Inquiries Yet</h3>
                        <p className="text-gray-500">When patients match with your signature solutions, they will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {waitlist.map((item) => (
                            <div key={item.id} className="p-6 rounded-2xl border border-white/10 bg-[#0f1219] flex flex-col md:flex-row gap-6 md:items-center justify-between hover:border-cyan-500/30 transition-all">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${item.status === 'New' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-gray-500/30 bg-gray-500/10 text-gray-400'}`}>
                                            {item.status}
                                        </span>
                                        <span className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {item.patientEmail}
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">Matched Protocol Score: <span className="text-white font-bold">{item.score}%</span></p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-all"
                                        onClick={() => {
                                            if (item.reportId) {
                                                window.open(`/report/${item.reportId}`, '_blank');
                                            } else {
                                                alert('Report link not available.');
                                            }
                                        }}>
                                        View Clinical Report
                                    </button>
                                    <button className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold transition-all flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Mark Contacted
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

export default withDoctorGuard(DoctorWaitlist);
