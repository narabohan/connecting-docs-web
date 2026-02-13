import { useState } from 'react';
import { Loader2, CheckCircle, User, Stethoscope } from 'lucide-react';
import { useRouter } from 'next/router';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface SignUpFormProps {
    defaultType?: 'PATIENT' | 'DOCTOR';
    language?: LanguageCode;
}

export default function SignUpForm({ defaultType = 'PATIENT', language = 'EN' }: SignUpFormProps) {
    const [userType, setUserType] = useState<'PATIENT' | 'DOCTOR'>(defaultType);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const router = useRouter();
    const t = (REPORT_TRANSLATIONS[language]?.landing || REPORT_TRANSLATIONS['EN'].landing).auth;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulation of API Call
        setTimeout(() => {
            console.log(`Signed up as ${userType}:`, { name, email });
            setLoading(false);
            if (userType === 'PATIENT') {
                router.push(`/report/rec19n3q79xI4YLQD?lang=${language}`);
            } else {
                alert("Doctor Application Received. We will contact you.");
            }
        }, 1500);
    };

    return (
        <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 relative overflow-hidden">
            {/* Toggle Switch */}
            <div className="flex bg-white/5 p-1 rounded-lg mb-8 relative">
                <div
                    className={`absolute inset-y-1 w-[calc(50%-4px)] bg-blue-600 rounded-md transition-all duration-300 ${userType === 'DOCTOR' ? 'left-[calc(50%+4px)]' : 'left-1'}`}
                />
                <button
                    onClick={() => setUserType('PATIENT')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md relative z-10 transition-colors ${userType === 'PATIENT' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <User className="w-4 h-4" />
                    {t.toggles.patient}
                </button>
                <button
                    onClick={() => setUserType('DOCTOR')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md relative z-10 transition-colors ${userType === 'DOCTOR' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <Stethoscope className="w-4 h-4" />
                    {t.toggles.doctor}
                </button>
            </div>

            <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold text-white mb-2">
                    {userType === 'PATIENT' ? t.title.patient : t.title.doctor}
                </h3>
                <p className="text-sm text-gray-400">
                    {userType === 'PATIENT' ? t.subtitle.patient : t.subtitle.doctor}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">{t.fields.name}</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder={userType === 'PATIENT' ? "Jane Doe" : "Dr. John Smith"}
                    />
                </div>
                <div>
                    <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">
                        {userType === 'PATIENT' ? t.fields.email.patient : t.fields.email.doctor}
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="you@example.com"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    {userType === 'PATIENT' ? t.button.patient : t.button.doctor}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                    {t.footer}
                </p>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 blur-[50px] pointer-events-none" />
        </div>
    );
}
