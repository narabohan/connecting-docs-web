import Head from 'next/head';
import { useRouter } from 'next/router';
import SolutionForm from '../../components/doctor/SolutionForm';
import { useAuth } from '@/context/AuthContext';
import { withDoctorGuard } from '@/components/auth/ProtectedRoute';
import { ArrowLeft } from 'lucide-react';

function DoctorOnboarding() {
    const { user } = useAuth();
    const router = useRouter();
    const isEdit = !!router.query.edit;

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Head>
                <title>{isEdit ? '솔루션 수정' : 'Doctor Onboarding'} | Connecting Docs</title>
            </Head>

            {/* Dark-themed header */}
            <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0f1219]/90 backdrop-blur-xl py-4 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <div>
                        <div className="font-bold text-base tracking-tighter">
                            Connecting<span className="text-cyan-400">Docs</span>
                        </div>
                        <div className="text-xs text-gray-500">
                            {isEdit ? '솔루션 수정' : 'Step 2 of 2: Clinical Signature'}
                        </div>
                    </div>
                </div>
                <div className="text-xs text-gray-500">
                    Dr. {user?.displayName}
                </div>
            </header>

            <main className="max-w-2xl mx-auto py-12 px-6">
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-bold mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        {isEdit ? 'EDIT MODE' : 'DOCTOR ONBOARDING'}
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">
                        {isEdit ? '시그니처 솔루션 수정' : `환영합니다, Dr. ${user?.displayName} 👋`}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {isEdit
                            ? '시그니처 솔루션 정보를 업데이트하세요.'
                            : '프로필을 완성하려면 대표 "시그니처 솔루션"을 등록해주세요.'}
                    </p>
                </div>

                {/* Progress indicator */}
                {!isEdit && (
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                <span className="text-xs text-emerald-400 font-bold">✓</span>
                            </div>
                            <div className="text-xs text-emerald-400 font-medium">계정 생성</div>
                        </div>
                        <div className="h-px flex-1 bg-white/10" />
                        <div className="flex-1 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                                <span className="text-xs text-cyan-400 font-bold">2</span>
                            </div>
                            <div className="text-xs text-cyan-400 font-medium">시그니처 등록</div>
                        </div>
                    </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-[#0f1219] p-6">
                    <SolutionForm />
                </div>
            </main>
        </div>
    );
}

export default withDoctorGuard(DoctorOnboarding);
