import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function DoctorPendingPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>Application Received | Connecting Docs</title>
            </Head>

            <Navbar />

            <main className="flex flex-col justify-center items-center py-24 px-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Application Received
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Thank you for applying to join the Connecting Docs medical network.
                        Our team will review your credentials and license information.
                        You will receive an email once your account status is updated.
                    </p>

                    <div className="space-y-4">
                        <Link href="/" className="block w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                            Return to Home
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
