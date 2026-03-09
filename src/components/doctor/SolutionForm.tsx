import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Loader2, Save, Users, Sparkles, Syringe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SolutionForm() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State for Gamification Calculation
    const [formData, setFormData] = useState({
        machines: [] as string[],
        skin_boosters: [] as string[],
        injection_methods: [] as string[],
        treatment_focus: 'Lifting',
        title: '',
        concept: '',
        description: '',
        downtime: 'None',
        pain: 'Low',
        price: ''
    });

    const [inventory, setInventory] = useState<any>({});
    const [inventoryLoading, setInventoryLoading] = useState(true);

    const [patientMatch, setPatientMatch] = useState(500); // Base match

    // Fetch Inventory
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await fetch('/api/data/inventory');
                const data = await res.json();
                setInventory(data.grouped || {});
            } catch (err) {
                console.error("Failed to fetch inventory", err);
            } finally {
                setInventoryLoading(false);
            }
        };
        fetchInventory();
    }, []);

    // Gamification Logic: Calculate Potential Matches
    useEffect(() => {
        let score = 500;
        if (formData.machines.length > 2) score += 300;
        score += formData.skin_boosters.length * 150;
        score += formData.injection_methods.length * 100;

        // Cap at realistic number
        if (score > 2500) score = 2500;

        // Animate count up (simple version)
        setPatientMatch(score);
    }, [formData]);

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'skin_boosters' | 'injection_methods' | 'machines') => {
        const value = e.target.value;
        setFormData(prev => {
            const current = prev[field];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const submitData = new FormData(e.currentTarget);
        const data = Object.fromEntries(submitData.entries());

        // Process Multi-selects manually since they might not be captured correctly by Object.fromEntries if not using native select multiple
        // But since we track them in state, we can use state or just append them.
        // For simplicity, let's merge state data specific fields
        const finalPayload = {
            ...formData,
            machines: formData.machines.join(', '), // Send as string for backward compatibility
            email: user?.email
        };

        try {
            const res = await fetch('/api/doctor/solution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalPayload),
            });

            if (!res.ok) throw new Error("Failed to save solution");

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden">
            {/* Gamification Banner */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-cyan-500 p-2 text-white flex justify-center items-center gap-2 text-sm font-medium shadow-md">
                <Users className="w-4 h-4" />
                <span>Your solution matches <span className="font-bold text-yellow-300 text-lg mx-1">{patientMatch.toLocaleString()}</span> global patients right now!</span>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Register Your Signature Solution</h3>
                <p className="text-sm text-gray-500 mb-6">Define the treatment protocol that represents your clinical philosophy.</p>
            </div>

            {/* Title & Focus */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Solution Name</label>
                    <input required name="title" value={formData.title} type="text" placeholder="e.g., Glass Skin Booster" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Focus</label>
                    <select name="treatment_focus" value={formData.treatment_focus} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg">
                        <option value="Lifting">Lifting & Tightening</option>
                        <option value="Volume">Volume & Contour</option>
                        <option value="Brightening">Brightening & Pigment</option>
                        <option value="Texture">Pore & Texture</option>
                        <option value="Acne">Acne & Scars</option>
                    </select>
                </div>
            </div>

            {/* machines (Dynamic Inventory) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Devices (Lasers/EBD)</label>
                {inventoryLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading inventory...</div>
                ) : (
                    <div className="space-y-4">
                        {['Laser', 'RF', 'HIFU'].map(category => (
                            <div key={category} className="bg-gray-50 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">{category}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {(inventory[category] || []).map((item: any) => (
                                        <label key={item.id} className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${formData.machines.includes(item.name) ? 'border-cyan-500 bg-white shadow-sm' : 'border-transparent hover:bg-white'}`}>
                                            <input
                                                type="checkbox"
                                                value={item.name}
                                                checked={formData.machines.includes(item.name)}
                                                onChange={(e) => handleMultiSelectChange(e, 'machines')}
                                                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{item.name}</span>
                                        </label>
                                    ))}
                                    {(!inventory[category] || inventory[category].length === 0) && <span className="text-xs text-gray-400 italic">No items found</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-2">Selected: {formData.machines.join(', ')}</p>
            </div>

            {/* Skin Boosters (Multi-Select) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Skin Boosters (Select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Combine dynamic boosters with static fallbacks if needed */}
                    {[...(inventory['Booster']?.map((i: any) => i.name) || []), 'Exosomes', 'NCTF (Filorga)', 'Skin Botox', 'Hyaluronic Acid']
                        .filter((v, i, a) => a.indexOf(v) === i) // Unique
                        .map(booster => (
                            <label key={booster} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.skin_boosters.includes(booster) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="checkbox"
                                    value={booster}
                                    checked={formData.skin_boosters.includes(booster)}
                                    onChange={(e) => handleMultiSelectChange(e, 'skin_boosters')}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">{booster}</span>
                            </label>
                        ))}
                </div>
            </div>

            {/* Injection Methods (Multi-Select) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Syringe className="w-4 h-4 text-blue-500" />
                    Injection Methods
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Manual Injection', 'Cannula', 'Mesogun (Injector)', 'MTS (Microneedling)', 'Electroporation'].map(method => (
                        <label key={method} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.injection_methods.includes(method) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input
                                type="checkbox"
                                value={method}
                                checked={formData.injection_methods.includes(method)}
                                onChange={(e) => handleMultiSelectChange(e, 'injection_methods')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{method}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Concept & Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Core Concept</label>
                <input required name="concept" value={formData.concept} type="text" placeholder="e.g., Deep Hydration & Pore Reduction" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" onChange={handleChange} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Description</label>
                <textarea required name="description" value={formData.description} rows={4} placeholder="Describe the mechanism of action and expected results..." className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" onChange={handleChange} />
            </div>

            {/* Parameter Sliders/Selects */}
            <div className="grid md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Downtime</label>
                    <select name="downtime" value={formData.downtime} className="w-full p-3 border border-gray-300 rounded-lg" onChange={handleChange}>
                        <option value="None">None (Immediate Return)</option>
                        <option value="Low">Low (1-3 Days)</option>
                        <option value="Mid">Mid (3-7 Days)</option>
                        <option value="High">High (7+ Days)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pain Level</label>
                    <select name="pain" value={formData.pain} className="w-full p-3 border border-gray-300 rounded-lg" onChange={handleChange}>
                        <option value="Low">Low (Painless/Numbing)</option>
                        <option value="Mid">Moderate (Bearable)</option>
                        <option value="High">High (Sedation Recommended)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Range (USD)</label>
                    <input required name="price" value={formData.price} type="text" placeholder="e.g. $500 - $800" className="w-full p-3 border border-gray-300 rounded-lg" onChange={handleChange} />
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
