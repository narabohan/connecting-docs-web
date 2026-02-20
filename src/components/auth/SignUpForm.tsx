import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface SignupFormProps {
    role: 'patient' | 'doctor';
}

const SKIN_CONCERNS = [
    { id: 'lifting', label: { KO: '리프팅/탄력', EN: 'Lifting & Firmness', JP: 'リフトアップ', CN: '提升紧致' } },
    { id: 'pigment', label: { KO: '기미/색소', EN: 'Melasma/Pigmentation', JP: '肝斑・色素沈着', CN: '黄褐斑/色沉' } },
    { id: 'acne', label: { KO: '여드름/트러블', EN: 'Acne/Breakouts', JP: 'ニキビ', CN: '痤疮' } },
    { id: 'hydration', label: { KO: '수분/광채', EN: 'Hydration & Glow', JP: 'うるおい・ツヤ', CN: '补水光泽' } },
    { id: 'pores', label: { KO: '모공/피부결', EN: 'Pores & Texture', JP: '毛穴・キメ', CN: '毛孔/肤质' } },
    { id: 'contour', label: { KO: '윤곽/V라인', EN: 'Contour/V-Line', JP: '輪郭・Vライン', CN: '轮廓/V脸' } },
];

const PAST_TREATMENTS = [
    { id: 'rf', label: 'RF Tightening (써마지 등)' },
    { id: 'hifu', label: 'HIFU 리프팅 (울쎄라 등)' },
    { id: 'laser', label: '레이저 (피코/토닝 등)' },
    { id: 'injectable', label: '보톡스/필러' },
    { id: 'skinbooster', label: '스킨부스터 (리쥬란 등)' },
    { id: 'none', label: '시술 경험 없음' },
];

const SignupForm: React.FC<SignupFormProps> = ({ role }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
    const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);

    const toggleMulti = (list: string[], setList: (v: string[]) => void, item: string) => {
        if (item === 'none') {
            setList(['none']);
        } else {
            const filtered = list.filter(i => i !== 'none');
            if (filtered.includes(item)) {
                setList(filtered.filter(i => i !== item));
            } else {
                setList([...filtered, item]);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data: Record<string, any> = Object.fromEntries(formData.entries());

        // Multi-select data
        if (role === 'doctor') {
            data.specialties = formData.getAll('specialties');
        }
        if (role === 'patient') {
            data.primary_concerns = selectedConcerns;
            data.past_treatments = selectedTreatments;
        }

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

    const inputClass = "mt-1 block w-full rounded-lg border border-gray-200 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm p-2.5 text-gray-900 outline-none transition-all";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md mx-auto">
            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className={labelClass}>이름 / Name</label>
                    <input required name="name" type="text" placeholder="홍길동 / John Doe" className={inputClass} />
                </div>
                <div className="col-span-2">
                    <label className={labelClass}>이메일 / Email</label>
                    <input required name="email" type="email" placeholder="email@example.com" className={inputClass} />
                </div>
            </div>

            <div>
                <label className={labelClass}>언어 / Language</label>
                <select name="language" className={inputClass}>
                    <option value="KO">한국어</option>
                    <option value="EN">English</option>
                    <option value="JP">日本語</option>
                    <option value="CN">中文</option>
                </select>
            </div>

            {/* Patient Specific Fields */}
            {role === 'patient' && (
                <>
                    <div>
                        <label className={labelClass}>비밀번호 / Password</label>
                        <input required name="password" type="password" className={inputClass} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>성별 / Gender</label>
                            <select name="gender" className={inputClass}>
                                <option value="Female">여성 / Female</option>
                                <option value="Male">남성 / Male</option>
                                <option value="Other">기타 / Other</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>연령대 / Age Group</label>
                            <select name="age_group" className={inputClass}>
                                <option value="20s">20대</option>
                                <option value="30s">30대</option>
                                <option value="40s">40대</option>
                                <option value="50s">50대</option>
                                <option value="60s+">60대 이상</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>국가 / Country</label>
                        <select name="country" className={inputClass}>
                            <option value="Korea">대한민국 (Korea)</option>
                            <option value="Japan">일본 (Japan)</option>
                            <option value="China">중국 (China)</option>
                            <option value="USA">미국 (USA)</option>
                            <option value="Singapore">싱가포르</option>
                            <option value="Other">기타 (Other)</option>
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>주요 피부 고민 (복수 선택)</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {SKIN_CONCERNS.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => toggleMulti(selectedConcerns, setSelectedConcerns, c.id)}
                                    className={`p-2.5 rounded-lg border text-xs text-left transition-all ${selectedConcerns.includes(c.id)
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {c.label.KO}<br />
                                    <span className="text-gray-400 text-[10px]">{c.label.EN}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>시술 경험 (복수 선택)</label>
                        <div className="space-y-2 mt-2">
                            {PAST_TREATMENTS.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => toggleMulti(selectedTreatments, setSelectedTreatments, t.id)}
                                    className={`w-full p-2.5 rounded-lg border text-xs text-left transition-all ${selectedTreatments.includes(t.id)
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Doctor Specific Fields */}
            {role === 'doctor' && (
                <>
                    <div>
                        <label className={labelClass}>병원명 / Hospital Name</label>
                        <input required name="hospital_name" type="text" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>면허번호 / License Number</label>
                        <input required name="license_number" type="text" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>국가 / Country</label>
                        <select name="country" className={inputClass}>
                            <option value="South Korea (KR)">South Korea (KR)</option>
                            <option value="Japan (JP)">Japan (JP)</option>
                            <option value="China (CN)">China (CN)</option>
                            <option value="USA (US)">USA (US)</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>주요 시술 분야 (복수 선택)</label>
                        <div className="space-y-2 mt-2">
                            {["Lifting (Ulthera/Thermage)", "Pigmentation (Pico/Toning)", "Injectables (Botox/Filler)", "Skin Booster (Rejuran/Exosome)", "Anti-Aging", "Acne/Scars"].map((tag) => (
                                <div key={tag} className="flex items-center">
                                    <input name="specialties" type="checkbox" value={tag} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                    <label className="ml-2 block text-sm text-gray-700">{tag}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
            >
                {loading ? '처리 중...' : (role === 'patient' ? '가입 후 설문 시작하기' : '의사 가입 신청')}
            </button>

            <p className="text-center text-xs text-gray-400">
                이미 계정이 있으신가요?{' '}
                <a href="/login" className="text-blue-600 hover:underline">로그인</a>
            </p>
        </form>
    );
};

export default SignupForm;
