import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';

export default function LoginPage() {
    const [isModalOpen, setIsModalOpen] = useState(true);

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <Head>
                <title>Sign In | Connecting Docs</title>
            </Head>

            {/* Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-900/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/8 rounded-full blur-[150px]" />

            <div className="z-10 w-full max-w-md">
                <Link href="/" className="inline-flex items-center text-gray-500 hover:text-white mb-8 transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>
            </div>

            {/* Render auth modal inline (full-page style) */}
            <AuthModal isOpen={isModalOpen} onClose={() => {
                setIsModalOpen(false);
                // If user closes, redirect home
                window.location.href = '/';
            }} />
        </div>
    );
}
