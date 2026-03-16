import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { Loader2, ArrowLeft, Mail, Calendar, CheckCircle } from 'lucide-react';
import { withDoctorGuard } from '@/components/auth/ProtectedRoute';
import { Toaster, toast } from 'react-hot-toast';

interface WaitlistItem {
    id: string;
    patientEmail: string;
    status: string;
    score: string;
    solutionId: string;
    createdAt: string;
    reportId?: string;
    primaryObject?: string;
    riskFactors?: string[];
}

function DoctorWaitlist() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
    const [fetching, setFetching] = useState(true);
    const [activeTab, setActiveTab] = useState<'New' | 'Contacted'>('New');

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
            <Toaster position="bottom-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />

            <header className="border-b border-white/10 bg-[#0f1219] py-4 px-6 flex items-center gap-4">
                <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <h1 className="text-xl font-bold">Patient Waitlist (Inquiries)</h1>
            </header>

            <main className="max-w-5xl mx-auto py-12 px-6">

                {/* Stats Bar */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#111111] p-6 rounded-2xl border border-white/10">
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Pending Inquiries</p>
                        <p className="text-4xl font-mono text-[#00FFA0] font-bold">{waitlist.filter(item => item.status === 'New').length}</p>
                    </div>
                    <div className="bg-[#111111] p-6 rounded-2xl border border-white/10">
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Total Contacts</p>
                        <p className="text-4xl font-mono text-cyan-500 font-bold">{waitlist.filter(item => item.status === 'Contacted').length}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 mb-8">
                    <button
                        onClick={() => setActiveTab('New')}
                        className={`pb-4 px-6 font-bold font-mono transition-colors ${activeTab === 'New' ? 'text-[#00FFA0] border-b-2 border-[#00FFA0]' : 'text-gray-500 hover:text-white'}`}>
                        New Requests
                    </button>
                    <button
                        onClick={() => setActiveTab('Contacted')}
                        className={`pb-4 px-6 font-bold font-mono transition-colors ${activeTab === 'Contacted' ? 'text-cyan-500 border-b-2 border-cyan-500' : 'text-gray-500 hover:text-white'}`}>
                        Contacted
                    </button>
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
                        {waitlist.filter(w => w.status === activeTab).map((item) => (
                            <div key={item.id} className="p-6 rounded-2xl border border-white/10 bg-[#0f1219] flex flex-col md:flex-row gap-6 md:items-center justify-between hover:border-cyan-500/30 transition-all">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${item.status === 'New' ? 'border-[#00FFA0]/30 bg-[#00FFA0]/10 text-[#00FFA0]' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'}`}>
                                            {item.status}
                                        </span>
                                        <span className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        {item.patientEmail}
                                    </h3>

                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <div className="bg-white/5 px-3 py-1.5 rounded text-xs font-mono text-gray-300">
                                            Match Score: <span className="text-white font-bold">{item.score}%</span>
                                        </div>
                                        {item.primaryObject && (
                                            <div className="bg-white/5 px-3 py-1.5 rounded text-xs font-mono text-gray-300">
                                                Primary Goal: <span className="text-[#00FFA0] font-bold">{item.primaryObject}</span>
                                            </div>
                                        )}
                                        {item.riskFactors && item.riskFactors.map(risk => (
                                            <div key={risk} className="bg-[#FFA000]/10 border border-[#FFA000]/20 px-3 py-1.5 rounded text-xs font-mono text-[#FFA000]">
                                                Risk: {risk}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 transition-all text-sm"
                                        onClick={() => {
                                            if (item.reportId) {
                                                router.push(`/doctor/patient/${item.reportId}`);
                                            }
                                        }}
                                        disabled={!item.reportId}
                                    >
                                        View Patient Details
                                    </button>
                                    {item.status === 'New' && (
                                        <button
                                            onClick={async () => {
                                                const loadingToast = toast.loading('Marking as contacted...');
                                                try {
                                                    const res = await fetch('/api/doctor/mark-contacted', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ matchId: item.id })
                                                    });
                                                    if (res.ok) {
                                                        toast.success('Patient marked as contacted!', { id: loadingToast });
                                                        fetchWaitlist(); // Refresh
                                                    } else {
                                                        throw new Error('Failed');
                                                    }
                                                } catch (e) {
                                                    toast.error('Could not update status.', { id: loadingToast });
                                                }
                                            }}
                                            className="px-6 py-2.5 rounded-xl bg-[#00FFA0] hover:bg-[#00d480] text-black font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(0,255,160,0.3)]"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Mark Contacted
                                        </button>
                                    )}
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
