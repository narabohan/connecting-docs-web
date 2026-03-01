import Head from 'next/head';
import Navbar from '../../components/Navbar'; // Adjust path if needed
import SolutionForm from '../../components/doctor/SolutionForm';
import { useAuth } from '@/context/AuthContext';
import { withDoctorGuard } from '@/components/auth/ProtectedRoute';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';

function DoctorOnboarding() {
    const { user } = useAuth();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Head>
                <title>Doctor Onboarding | Connecting Docs</title>
            </Head>

            {/* Simple Header for Onboarding */}
            <header className="bg-[#0f1219] border-b border-white/10 py-4 px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="font-bold text-xl tracking-tighter">Connecting Docs</div>
                </div>
                <div className="text-sm text-gray-400 font-mono">Step 2 of 2: Clinical Signature</div>
            </header>

            <main className="max-w-3xl mx-auto py-12 px-6">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Welcome to the Network, Dr. {user?.displayName}</h1>
                    <p className="text-gray-400">To complete your matching profile, please register your primary "Signature Solution".</p>
                </div>

                <SolutionForm />
            </main>
        </div>
    );
}

export default withDoctorGuard(DoctorOnboarding);
