import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import { LanguageCode } from '@/utils/translations';
import PatientDashboard from '@/components/dashboard/PatientDashboard';
import DoctorDashboard from '@/components/dashboard/DoctorDashboard';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [currentLang, setCurrentLang] = useState<LanguageCode>('EN');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading]);

    // Initialise language from user profile if available
    useEffect(() => {
        const saved = (user as any)?.language as LanguageCode | undefined;
        if (saved && ['EN', 'KO', 'JP', 'CN'].includes(saved)) {
            setCurrentLang(saved);
        }
    }, [user]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    const isDoctor = user.role === 'doctor';

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
            <Header currentLang={currentLang} onLangChange={setCurrentLang} />

            {isDoctor
                ? <DoctorDashboard language={currentLang} />
                : <PatientDashboard language={currentLang} />
            }

            <Footer language={currentLang} />
        </div>
    );
}
