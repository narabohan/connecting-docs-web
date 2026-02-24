import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { Loader2, Plus, FileText, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import PatientDashboard from '@/components/dashboard/PatientDashboard';
import DoctorDashboard from '@/components/dashboard/DoctorDashboard';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (user) {
            fetchReports();
        }
    }, [user, loading]);

    const fetchReports = async () => {
        // TODO: Implement fetch logic from /api/reports?userId=...
        // For now, simulate empty or mock
        setTimeout(() => setFetching(false), 1000);
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    const isDoctor = user.role === 'doctor'; // use strict role

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
            <Header currentLang={((user as any).language as any) || 'EN'} onLangChange={() => { }} />

            {isDoctor ? <DoctorDashboard /> : <PatientDashboard />}

            <Footer language={((user as any).language as any) || 'EN'} />
        </div>
    );
}
