import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Loader2, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SolutionForm() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/doctor/solution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    email: user?.email // Link to logged in doctor
                }),
            });

            if (!res.ok) throw new Error("Failed to save solution");

            // Success
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Register Your Signature Solution</h3>
                <p className="text-sm text-gray-500 mb-6">Define the treatment protocol that represents your clinical philosophy.</p>
            </div>

            {/* Title & Concept */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Solution Name</label>
                    <input required name="title" type="text" placeholder="e.g., Glass Skin Booster" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Core Concept</label>
                    <input required name="concept" type="text" placeholder="e.g., Deep Hydration & Pore Reduction" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Description</label>
                <textarea required name="description" rows={4} placeholder="Describe the mechanism of action and expected results..." className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>

            {/* Machines / Products */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Devices & Products</label>
                <input required name="machines" type="text" placeholder="e.g., Potenza, Rejuran, LDM" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                <p className="text-xs text-gray-500 mt-1">Separate machine names with commas.</p>
            </div>

            {/* Parameter Sliders/Selects */}
            <div className="grid md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Downtime</label>
                    <select name="downtime" className="w-full p-3 border border-gray-300 rounded-lg">
                        <option value="None">None (Immediate Return)</option>
                        <option value="Low">Low (1-3 Days)</option>
                        <option value="Mid">Mid (3-7 Days)</option>
                        <option value="High">High (7+ Days)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pain Level</label>
                    <select name="pain" className="w-full p-3 border border-gray-300 rounded-lg">
                        <option value="Low">Low (Painless/Numbing)</option>
                        <option value="Mid">Moderate (Bearable)</option>
                        <option value="High">High (Sedation Recommended)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Range (USD)</label>
                    <input required name="price" type="text" placeholder="e.g. $500 - $800" className="w-full p-3 border border-gray-300 rounded-lg" />
                </div>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Register Signature Solution
            </button>
        </form>
    );
}
