import React, { useState } from 'react';
import Head from 'next/head';
import RoleSwitcher from '../components/auth/RoleSwitcher';
import SignupForm from '../components/auth/SignupForm';
import Navbar from '../components/Navbar';

export default function SignupPage() {
    const [role, setRole] = useState<'patient' | 'doctor'>('patient');

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>Join Connecting Docs | Global Medical Intelligence</title>
            </Head>

            <Navbar />

            <main className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {role === 'patient' ? "Start Your Skin Journey" : "Join the Medical Network"}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {role === 'patient'
                            ? "Access personalized reports and premium protocols."
                            : "Assetize your clinical logic and connect with global patients."
                        }
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <RoleSwitcher role={role} setRole={setRole} />
                        <SignupForm role={role} />
                    </div>
                </div>
            </main>
        </div>
    );
}
