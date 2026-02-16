import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { LanguageCode } from '@/utils/translations';

// --- Types ---
export type WizardData = {
    // Intro
    country: string;
    gender: 'Male' | 'Female' | 'Other';
    age: string;

    // Goals
    primaryGoal: string;
    secondaryGoal: string;

    // Risks
    risks: string[];
    acneStatus?: string; // Conditional
    pigmentType?: string[]; // Conditional

    // Areas
    areas: string[];
    poreType?: string; // Conditional
    priorityArea?: string;

    // Skin Profile
    skinType: string;
    treatmentStyle: string;
    volumePreference?: string; // Conditional

    // Preferences
    painTolerance: string;
    downtimeTolerance: string;
    budget: string;
    frequency: string;

    // History
    treatmentHistory: string[];
    historySatisfaction?: string; // Conditional

    // Habits & Contact
    careHabits: string[];
    email: string;
};

interface DiagnosisWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: WizardData) => void;
    language: LanguageCode;
}

// --- Constants (Mapped from Tally) ---
type MultiLingualText = { [key in LanguageCode]: string } & { [key: string]: string };

const STEPS: {
    id: string;
    title?: MultiLingualText;
    desc?: MultiLingualText;
    question?: MultiLingualText;
    multi?: boolean;
    condition?: (data: WizardData) => boolean;
}[] = [
        {
            id: 'intro',
            title: { EN: "Let's diagnose your skin.", KO: "피부 진단을 시작합니다.", JP: "肌診断を始めます。", CN: "开始皮肤诊断。" },
            desc: { EN: "AI will analyze 80+ clinical protocols for you.", KO: "AI가 80개 이상의 임상 프로토콜을 분석합니다.", JP: "AIが80以上の臨床プロトコルを分析します。", CN: "AI将为您分析80多种临床方案。" },
        },
        {
            id: 'basic',
            question: { EN: "Basic Information", KO: "기본 정보", JP: "基本情報", CN: "基本信息" }
        },
        {
            id: 'goals_1',
            question: { EN: "What is your #1 Goal?", KO: "가장 해결하고 싶은 고민은?", JP: "最も改善したい悩みは？", CN: "您最想改善的问题是？" }
        },
        {
            id: 'goals_2',
            question: { EN: "Any secondary concern?", KO: "추가로 해결하고 싶은 고민은?", JP: "他に気になる悩みはありますか？", CN: "还有其他想改善的问题吗？" }
        },
        {
            id: 'risks',
            question: { EN: "Safety Check (Select all that apply)", KO: "안전성 체크 (해당사항 선택)", JP: "安全性チェック（該当するものを選択）", CN: "安全性检查（可多选）" },
            multi: true
        },
        {
            id: 'risk_acne',
            question: { EN: "Acne Condition", KO: "현재 여드름 상태", JP: "現在のニキビの状態", CN: "目前的痤疮状况" },
            condition: (data) => data.risks.includes('acne')
        },
        {
            id: 'risk_pigment',
            question: { EN: "Pigmentation Pattern", KO: "색소 침착 유형", JP: "色素沈着のタイプ", CN: "色沉类型" },
            multi: true,
            condition: (data) => data.risks.includes('pigment')
        },
        {
            id: 'areas',
            question: { EN: "Problem Areas", KO: "고민 부위", JP: "気になる部位", CN: "烦恼部位" },
            multi: true
        },
        {
            id: 'area_pores',
            question: { EN: "Pore Type", KO: "모공 유형", JP: "毛穴のタイプ", CN: "毛孔类型" },
            condition: (data) => data.areas.includes('pores')
        },
        {
            id: 'area_priority',
            question: { EN: "Improvement Priority", KO: "개선 우선순위", JP: "改善の優先順位", CN: "改善优先顺序" }
        },
        {
            id: 'skin_profile',
            question: { EN: "Skin Profile", KO: "피부 타입", JP: "肌タイプ", CN: "皮肤类型" }
        },
        {
            id: 'style_preference',
            question: { EN: "Treatment Style", KO: "선호하는 시술 스타일", JP: "好みの施術スタイル", CN: "偏好的治疗风格" }
        },
        {
            id: 'volume_logic',
            question: { EN: "Volume Preference", KO: "볼륨 개선 방식", JP: "ボリューム改善の好み", CN: "容量改善偏好" },
            condition: (data) => data.primaryGoal === 'volume' || data.secondaryGoal === 'volume'
        },
        {
            id: 'preferences',
            question: { EN: "Treatment Preferences", KO: "시술 선호도", JP: "施術の好み", CN: "治疗偏好" }
        },
        {
            id: 'history',
            question: { EN: "Treatment History", KO: "시술 경험", JP: "施術経験", CN: "医美经历" },
            multi: true
        },
        {
            id: 'history_outcome',
            question: { EN: "Past Satisfaction", KO: "과거 시술 만족도", JP: "過去の施術への満足度", CN: "过去治疗满意度" },
            condition: (data) => data.treatmentHistory.length > 0 && !data.treatmentHistory.includes('none')
        },
        {
            id: 'habits',
            question: { EN: "Care Habits", KO: "관리 습관", JP: "ケアの習慣", CN: "护理习惯" },
            multi: true
        },
        {
            id: 'contact',
            question: { EN: "Final Step", KO: "마지막 단계", JP: "最後のステップ", CN: "最后一步" }
        },
        {
            id: 'analysis',
            title: { EN: "Analyzing...", KO: "분석 중...", JP: "分析中...", CN: "分析中..." }
        }
    ];

const OPTIONS = {
    // 1. Basic
    age: ['Under 20s', '20s', '30s', '40s', '50s', '60s+'],
    countries: ['Korea', 'USA', 'Japan', 'China', 'Singapore', 'Other'],

    // 2. Goals
    goals: [
        { id: 'hydration', label: { EN: 'Hydrated & Dewy', KO: '촉촉하고 윤기나는 피부', JP: 'みずみずしい肌', CN: '水润光泽' } },
        { id: 'texture', label: { EN: 'Smooth Texture', KO: '매끈한 피부결', JP: 'なめらかな肌', CN: '平滑肤质' } },
        { id: 'volume', label: { EN: 'Volume & Bounce', KO: '볼륨과 탄력', JP: 'ハリとボリューム', CN: '饱满弹性' } },
        { id: 'contour', label: { EN: 'Defined Contour', KO: '날렵한 윤곽', JP: '引き締まった輪郭', CN: '清晰轮廓' } },
        { id: 'tone', label: { EN: 'Bright Tone', KO: '환한 피부톤', JP: '明るい肌トーン', CN: '明亮肤色' } },
        { id: 'guidance', label: { EN: 'Not Sure', KO: '잘 모르겠음/상담 필요', JP: 'まだ迷っている', CN: '不确定/求建议' } }
    ],

    // 3. Risks
    risks: [
        { id: 'sensitive', label: { EN: 'Sensitive/Redness', KO: '민감성/홍조', JP: '敏感肌・赤み', CN: '敏感/泛红' } },
        { id: 'pigment', label: { EN: 'Melasma/Pigment', KO: '기미/색소', JP: '肝斑・色素沈着', CN: '黄褐斑/色沉' } },
        { id: 'acne', label: { EN: 'Acne/Inflammation', KO: '여드름/트러블', JP: 'ニキビ・炎症', CN: '痤疮/炎症' } },
        { id: 'thin', label: { EN: 'Thin Skin', KO: '얇은 피부', JP: '薄い肌', CN: '皮肤偏薄' } },
        { id: 'none', label: { EN: 'None', KO: '해당 없음', JP: '該当なし', CN: '无' } }
    ],
    acneStatus: ['Inflammatory', 'Scars/Marks', 'Occasional', 'Not Sure'],
    pigmentPattern: ['Symmetrical', 'Sun-worsened', 'Laser-darkened', 'Not Sure'],

    // 4. Areas
    areas: [
        { id: 'forehead', label: { EN: 'Forehead', KO: '이마/미간', JP: 'おでこ', CN: '额头' } },
        { id: 'eyes', label: { EN: 'Eye Area', KO: '눈가', JP: '目元', CN: '眼周' } },
        { id: 'midface', label: { EN: 'Cheeks/Midface', KO: '앞볼/중안부', JP: '頬', CN: '面中部' } },
        { id: 'pores', label: { EN: 'Pores', KO: '모공', JP: '毛穴', CN: '毛孔' } },
        { id: 'jawline', label: { EN: 'Jawline', KO: '턱선', JP: 'フェイスライン', CN: '下颌线' } },
        { id: 'neck', label: { EN: 'Neck', KO: '목', JP: '首', CN: '颈部' } }
    ],
    poreType: ['Vertical (Aging)', 'Round (Oily)', 'Not Sure'],
    priority: ['Volume (Youth)', 'Lifting (Contour)', 'Both', 'Not Sure'],

    // 5. Skin & Style
    skinType: ['Thin & Sensitive', 'Normal', 'Thick & Resilient', 'Not Sure'],
    style: ['Natural & Gradual', 'Balanced', 'Fast & Dramatic', 'Not Sure'],
    volumeLogic: ['Natural Regeneration', 'Instant Filling', 'Not Sure'],

    // 6. Preferences
    pain: ['Minimal', 'Moderate', 'High Tolerance', 'Not Sure'],
    downtime: ['None', 'Short (3-4 days)', 'Long (1 week+)', 'Not Sure'],
    budget: ['Premium', 'Balanced', 'Economy', 'Not Sure'],
    frequency: ['Occasional (Strong)', 'Regular Maintenance', 'Flexible', 'Not Sure'],

    // 7. History
    history: ['RF Tightening', 'HIFU Lifting', 'Laser', 'Injectables', 'Microneedle RF', 'None'],
    satisfaction: ['Satisfied', 'Partially', 'Dissatisfied', 'Not Sure'],

    // 8. Habits
    habits: ['Skincare', 'Devices', 'Supplements', 'Massage', 'None']
};


export default function DiagnosisWizard({ isOpen, onClose, onComplete, language = 'EN' }: DiagnosisWizardProps) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<WizardData>({
        country: 'Korea', gender: 'Female', age: '',
        primaryGoal: '', secondaryGoal: '',
        risks: [], areas: [], skinType: '', treatmentStyle: '',
        painTolerance: '', downtimeTolerance: '', budget: '', frequency: '',
        treatmentHistory: [], careHabits: [], email: ''
    });

    // Reset step when opened
    useEffect(() => {
        if (isOpen) setStep(0);
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter steps based on conditions
    const activeSteps = STEPS.filter(s => !s.condition || s.condition(data));
    const currentStep = activeSteps[step];
    // Safety check in case step index goes out of bounds due to filtering updates
    if (!currentStep) return null; // Or handle error

    const isLastStep = step === activeSteps.length - 2; // Before 'analysis'

    const handleNext = () => {
        if (isLastStep) {
            setStep(step + 1); // Go to 'analysis'
            setTimeout(() => {
                onComplete(data);
                onClose();
            }, 2500);
        } else {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const updateData = (key: keyof WizardData, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const toggleMulti = (key: keyof WizardData, item: string) => {
        const current = (data[key] as string[]) || [];
        const isNone = item.toLowerCase() === 'none';

        let updated: string[];
        if (isNone) {
            updated = ['none'];
        } else {
            const clean = current.filter(i => i.toLowerCase() !== 'none');
            updated = clean.includes(item)
                ? clean.filter(i => i !== item)
                : [...clean, item];
        }
        updateData(key, updated);
    };

    // --- Component Helper for Options ---
    const OptionButton = ({
        label,
        selected,
        onClick,
        multi = false
    }: { label: string | React.ReactNode, selected: boolean, onClick: () => void, multi?: boolean }) => (
        <button
            onClick={onClick}
            className={cn(
                "p-4 rounded-xl border transition-all text-left flex items-center justify-between group",
                selected
                    ? "bg-blue-500/20 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            )}
        >
            <span className="text-sm md:text-base font-medium">{label}</span>
            {selected && <Check className="w-4 h-4 text-blue-400" />}
        </button>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
                key={currentStep.id}
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-2xl bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Progress Bar */}
                <div className="h-1 bg-white/5 w-full">
                    <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((step + 1) / activeSteps.length) * 100}%` }}
                    />
                </div>

                <div className="p-6 md:p-8 flex-1 flex flex-col relative overflow-y-auto">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10">✕</button>

                    {/* --- INTRO STEP --- */}
                    {currentStep.id === 'intro' && (
                        <div className="flex flex-col items-center justify-center flex-1 text-center space-y-8 py-10">
                            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center relative">
                                <Sparkles className="w-10 h-10 text-blue-400" />
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-4">{currentStep.title?.[language]}</h2>
                                <p className="text-gray-400 text-lg max-w-md mx-auto">{currentStep.desc?.[language]}</p>
                            </div>
                            <button
                                onClick={handleNext}
                                className="px-10 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                Start Diagnosis <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* --- ANALYSIS LOADING STEP --- */}
                    {currentStep.id === 'analysis' && (
                        <div className="flex flex-col items-center justify-center flex-1 text-center space-y-8 py-20">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                            </div>
                            <h2 className="text-2xl font-bold text-white animate-pulse">{currentStep.title?.[language]}</h2>
                            <p className="text-gray-500 text-sm">Consulting 80+ Protocols...</p>
                        </div>
                    )}

                    {/* --- QUESTION STEPS --- */}
                    {step > 0 && currentStep.id !== 'analysis' && (
                        <div className="flex flex-col flex-1 max-w-xl mx-auto w-full">
                            <h3 className="text-2xl font-bold text-white mb-2">{currentStep.question?.[language]}</h3>
                            {currentStep.multi && <p className="text-sm text-gray-500 mb-6">Select all that apply</p>}
                            {!currentStep.multi && <div className="mb-6" />}

                            <div className="flex-1 space-y-3">
                                {/* 1. BASIC INFO */}
                                {currentStep.id === 'basic' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Female', 'Male'].map((g) => (
                                                <OptionButton key={g} label={g} selected={data.gender === g} onClick={() => updateData('gender', g)} />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {OPTIONS.age.map((a) => (
                                                <button key={a} onClick={() => updateData('age', a)}
                                                    className={cn("p-3 rounded-xl border text-sm transition-all", data.age === a ? "bg-blue-500/20 border-blue-500 text-white" : "bg-white/5 border-white/10 text-gray-400")}
                                                >{a}</button>
                                            ))}
                                        </div>
                                        <select
                                            value={data.country} onChange={(e) => updateData('country', e.target.value)}
                                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white"
                                        >
                                            {OPTIONS.countries.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* 2. GOALS */}
                                {currentStep.id === 'goals_1' && OPTIONS.goals.map(o => (
                                    <OptionButton key={o.id} label={o.label[language]} selected={data.primaryGoal === o.id} onClick={() => updateData('primaryGoal', o.id)} />
                                ))}
                                {currentStep.id === 'goals_2' && OPTIONS.goals.map(o => (
                                    <OptionButton key={o.id} label={o.label[language]} selected={data.secondaryGoal === o.id} onClick={() => updateData('secondaryGoal', o.id)} />
                                ))}

                                {/* 3. RISKS */}
                                {currentStep.id === 'risks' && OPTIONS.risks.map(o => (
                                    <OptionButton key={o.id} label={o.label[language]} selected={data.risks.includes(o.id)} onClick={() => toggleMulti('risks', o.id)} multi />
                                ))}
                                {currentStep.id === 'risk_acne' && OPTIONS.acneStatus.map(o => (
                                    <OptionButton key={o} label={o} selected={data.acneStatus === o} onClick={() => updateData('acneStatus', o)} />
                                ))}
                                {currentStep.id === 'risk_pigment' && OPTIONS.pigmentPattern.map(o => (
                                    <OptionButton key={o} label={o} selected={data.pigmentType?.includes(o) || false} onClick={() => toggleMulti('pigmentType', o)} multi />
                                ))}

                                {/* 4. AREAS */}
                                {currentStep.id === 'areas' && OPTIONS.areas.map(o => (
                                    <OptionButton key={o.id} label={o.label[language]} selected={data.areas.includes(o.id)} onClick={() => toggleMulti('areas', o.id)} multi />
                                ))}
                                {currentStep.id === 'area_pores' && OPTIONS.poreType.map(o => (
                                    <OptionButton key={o} label={o} selected={data.poreType === o} onClick={() => updateData('poreType', o)} />
                                ))}
                                {currentStep.id === 'area_priority' && OPTIONS.priority.map(o => (
                                    <OptionButton key={o} label={o} selected={data.priorityArea === o} onClick={() => updateData('priorityArea', o)} />
                                ))}


                                {/* 5. SKIN PROFILE */}
                                {currentStep.id === 'skin_profile' && OPTIONS.skinType.map(o => (
                                    <OptionButton key={o} label={o} selected={data.skinType === o} onClick={() => updateData('skinType', o)} />
                                ))}
                                {currentStep.id === 'style_preference' && OPTIONS.style.map(o => (
                                    <OptionButton key={o} label={o} selected={data.treatmentStyle === o} onClick={() => updateData('treatmentStyle', o)} />
                                ))}
                                {currentStep.id === 'volume_logic' && OPTIONS.volumeLogic.map(o => (
                                    <OptionButton key={o} label={o} selected={data.volumePreference === o} onClick={() => updateData('volumePreference', o)} />
                                ))}

                                {/* 6. PREFERENCES (Grouped slightly differently in Code for flow) */}
                                {currentStep.id === 'preferences' && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-sm text-gray-400 mb-2 block">Pain Tolerance</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {OPTIONS.pain.map(o => (
                                                    <button key={o} onClick={() => updateData('painTolerance', o)} className={cn("p-3 rounded-lg border text-xs", data.painTolerance === o ? "bg-blue-500/20 border-blue-500" : "bg-white/5 border-white/10")}>{o}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-2 block">Downtime</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {OPTIONS.downtime.map(o => (
                                                    <button key={o} onClick={() => updateData('downtimeTolerance', o)} className={cn("p-3 rounded-lg border text-xs", data.downtimeTolerance === o ? "bg-blue-500/20 border-blue-500" : "bg-white/5 border-white/10")}>{o}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-2 block">Budget</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {OPTIONS.budget.map(o => (
                                                    <button key={o} onClick={() => updateData('budget', o)} className={cn("p-2 rounded-lg border text-xs", data.budget === o ? "bg-blue-500/20 border-blue-500" : "bg-white/5 border-white/10")}>{o}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 7. HISTORY */}
                                {currentStep.id === 'history' && OPTIONS.history.map(o => (
                                    <OptionButton key={o} label={o} selected={data.treatmentHistory.includes(o)} onClick={() => toggleMulti('treatmentHistory', o)} multi />
                                ))}
                                {currentStep.id === 'history_outcome' && OPTIONS.satisfaction.map(o => (
                                    <OptionButton key={o} label={o} selected={data.historySatisfaction === o} onClick={() => updateData('historySatisfaction', o)} />
                                ))}

                                {/* 8. HABITS */}
                                {currentStep.id === 'habits' && OPTIONS.habits.map(o => (
                                    <OptionButton key={o} label={o} selected={data.careHabits.includes(o)} onClick={() => toggleMulti('careHabits', o)} multi />
                                ))}

                                {/* 9. CONTACT */}
                                {currentStep.id === 'contact' && (
                                    <div className="space-y-4">
                                        <input
                                            type="email"
                                            placeholder="Enter your email to receive the report"
                                            value={data.email}
                                            onChange={(e) => updateData('email', e.target.value)}
                                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none"
                                        />
                                        <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                            <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0" />
                                            <p className="text-sm text-gray-300">
                                                By continuing, you agree to our processing of your personal health data for the purpose of generating this clinical report.
                                            </p>
                                        </div>
                                    </div>
                                )}

                            </div>

                            <div className="mt-8 flex justify-between pt-4 border-t border-white/5">
                                <button onClick={handleBack} className="text-gray-400 hover:text-white flex items-center gap-2">
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={currentStep.id === 'contact' && !data.email.includes('@')}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-900/20"
                                >
                                    {isLastStep ? 'Analyze Now' : 'Next'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
