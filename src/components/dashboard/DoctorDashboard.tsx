import { useRouter } from 'next/router';
import { Loader2, Plus, Stethoscope, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function DoctorDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [solutions, setSolutions] = useState<any[]>([]); // Mock for now

    return (
        <main className="max-w-7xl mx-auto px-6 py-24">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                        Medical Partner Network
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                        Dr. <span className="text-white">{user?.name}</span>
                    </h1>
                    <p className="text-gray-400 max-w-xl">
                        Manage your clinical assets and connecting with patients seeking your signature solutions.
                    </p>
                </div>
                <button
                    onClick={() => router.push('/doctor/onboarding')}
                    className="bg-cyan-500 text-black px-6 py-3 rounded-full font-bold hover:bg-cyan-400 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Signature Solution
                </button>
            </div>

            {/* Main Grid */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* Signature Solutions */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-cyan-500" />
                            My Signature Solutions
                        </h2>
                    </div>

                    {solutions.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center border border-white/10 rounded-2xl bg-[#0a0a0f] text-gray-500 space-y-4">
                            <Stethoscope className="w-12 h-12 opacity-20" />
                            <p>You haven't registered a signature solution yet.</p>
                            <button onClick={() => router.push('/doctor/onboarding')} className="text-cyan-400 hover:underline text-sm border px-4 py-2 rounded-lg border-cyan-500/30">
                                Register Now
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {/* Map solutions here */}
                        </div>
                    )}
                </div>

                {/* Patient Leads (Coming Soon) */}
                <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 relative overflow-hidden group">

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                                <Users className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Patient Inquiries</h3>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                Patients matched with your protocol will appear here. Build your reputation to increase visibility.
                            </p>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500 border-t border-white/5 pt-4">
                            <span>Profile Views</span>
                            <span className="text-white font-mono">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
