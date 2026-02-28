import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export function withDoctorGuard<P extends object>(WrappedComponent: React.ComponentType<P>) {
    return function ProtectedRoute(props: P) {
        const { user, loading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!loading) {
                if (!user) {
                    // Not logged in -> send to login or home
                    router.replace('/login');
                } else if (user.role !== 'doctor') {
                    // Logged in but not a doctor -> send to patient dashboard
                    router.replace('/dashboard');
                }
            }
        }, [user, loading, router]);

        // If loading or not authorized, show loading spinner
        if (loading || !user || user.role !== 'doctor') {
            return (
                <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                </div>
            );
        }

        // Render component if authorized
        return <WrappedComponent {...props} />;
    };
}
