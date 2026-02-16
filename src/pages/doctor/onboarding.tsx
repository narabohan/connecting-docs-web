import Head from 'next/head';
import Navbar from '../../components/Navbar'; // Adjust path if needed
import SolutionForm from '../../components/doctor/SolutionForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function DoctorOnboarding() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>Doctor Onboarding | Connecting Docs</title>
            </Head>

            {/* Simple Header for Onboarding */}
            <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
                <div className="font-bold text-xl tracking-tighter">Connecting Docs</div>
                <div className="text-sm text-gray-500">Step 2 of 2: Clinical Signature</div>
            </header>

            <main className="max-w-3xl mx-auto py-12 px-6">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Network, Dr. {user?.name}</h1>
                    <p className="text-gray-600">To complete your profile, please register your primary "Signature Solution".</p>
                </div>

                <SolutionForm />
            </main>
        </div>
    );
}
