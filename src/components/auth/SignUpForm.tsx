import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface SignupFormProps {
    role: 'patient' | 'doctor';
}

const SignupForm: React.FC<SignupFormProps> = ({ role }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        // Process Modality Tags for Doctors (Multi-select)
        if (role === 'doctor') {
            const specialties = formData.getAll('specialties');
            data.specialties = specialties as any;
        }

        // Include role in payload
        const payload = { ...data, role };

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Registration failed');
            }

            // Success - Redirect or Show Message
            // alert('Registration Successful!'); // Removed alert for smoother flow
            if (role === 'patient') {
                router.push('/?start_wizard=true');
            } else {
                router.push('/doctor/onboarding');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
            {/* Common Fields */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input required name="name" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input required name="email" type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>

            {/* Patient Specific: Password (MVP) */}
            {role === 'patient' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input required name="password" type="password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
                </div>
            )}

            {/* Doctor Specific Fields */}
            {role === 'doctor' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
                        <input required name="hospital_name" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">License Number</label>
                        <input required name="license_number" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Country</label>
                        <select name="country" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border">
                            <option value="South Korea (KR)">South Korea (KR)</option>
                            <option value="Japan (JP)">Japan (JP)</option>
                            <option value="China (CN)">China (CN)</option>
                            <option value="USA (US)">USA (US)</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Key Modalities (Select all that apply)</label>
                        <div className="space-y-2">
                            {["Lifting (Ulthera/Thermage)", "Pigmentation (Pico/Toning)", "Injectables (Botox/Filler)", "Skin Booster (Rejuran/Exosome)", "Anti-Aging", "Acne/Scars"].map((tag) => (
                                <div key={tag} className="flex items-center">
                                    <input name="specialties" type="checkbox" value={tag} className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black" />
                                    <label className="ml-2 block text-sm text-gray-900">{tag}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
            >
                {loading ? 'Processing...' : (role === 'patient' ? 'Sign Up' : 'Apply for Registration')}
            </button>
        </form>
    );
};

export default SignupForm;
