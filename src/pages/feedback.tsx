import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ChevronRight, ArrowLeft, Star, ThumbsUp, ThumbsDown, Loader2, CheckCircle } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

function FeedbackPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        overallRating: 0,
        goalAchieved: '',
        painAccuracy: '',
        downtimeAccuracy: '',
        sideEffects: '',
        recommendIntent: '',
        notes: ''
    });

    const updateForm = (key: string, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => Math.max(1, s - 1));

    const submitFeedback = async () => {
        setSubmitting(true);
        const loadingToast = toast.loading('Submitting your review...');
        try {
            const res = await fetch('/api/patient/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                toast.success('Thank you for your feedback!', { id: loadingToast });
                setSuccess(true);
            } else {
                throw new Error('Failed to submit');
            }
        } catch (e) {
            toast.error('Could not submit feedback.', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const isStepComplete = () => {
        if (step === 1) return form.overallRating > 0;
        if (step === 2) return form.goalAchieved !== '';
        if (step === 3) return form.painAccuracy !== '';
        if (step === 4) return form.downtimeAccuracy !== '';
        if (step === 5) return form.sideEffects !== '';
        if (step === 6) return form.recommendIntent !== '';
        return true;
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
                <CheckCircle className="w-16 h-16 text-[#00FFA0] mb-6" />
                <h1 className="text-3xl font-bold mb-4 text-center">Thank you!</h1>
                <p className="text-gray-400 text-center max-w-md mb-8">
                    Your clinical outcomes help us refine our AI Intelligence Engine for future patients globally.
                </p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 py-3 bg-[#00FFA0] text-black font-bold rounded-full hover:bg-[#00d480] transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono">
            <Head>
                <title>Treatment Feedback | Connecting Docs</title>
            </Head>
            <Toaster position="top-center" />

            <header className="border-b border-white/5 py-4 px-6 flex items-center">
                <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
                <h1 className="ml-4 font-bold tracking-tighter text-[#00FFA0]">Clinical Review</h1>
            </header>

            <main className="max-w-xl mx-auto py-12 px-6">

                {/* Progress Bar */}
                <div className="w-full bg-white/10 h-1 mb-12 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#00FFA0] transition-all duration-500 ease-out"
                        style={{ width: `${(step / 7) * 100}%` }}
                    />
                </div>

                <div className="min-h-[400px]">
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold mb-8">Overall Experience</h2>
                            <p className="text-gray-400 mb-8">How would you rate your treatment outcome and experience?</p>
                            <div className="flex gap-4 justify-center">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => updateForm('overallRating', star)}
                                        className="transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star fill={form.overallRating >= star ? '#00FFA0' : 'transparent'} className={`w-12 h-12 ${form.overallRating >= star ? 'text-[#00FFA0]' : 'text-gray-600'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold mb-8">Goal Achievement</h2>
                            <p className="text-gray-400 mb-8">Did the treatment address your primary clinical indication?</p>
                            <div className="space-y-4">
                                {['Exceeded Expectations', 'Met Expectations', 'Fell short of Expectations'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => updateForm('goalAchieved', opt)}
                                        className={`w-full p-4 rounded-xl border text-left transition-all ${form.goalAchieved === opt ? 'bg-[#00FFA0]/10 border-[#00FFA0] text-[#00FFA0]' : 'bg-white/5 border-white/10 hover:border-white/30 text-white'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold mb-8">Pain Tolerance Analysis</h2>
                            <p className="text-gray-400 mb-8">Was the procedure's discomfort in line with your initial survey profile?</p>
                            <div className="space-y-4">
                                {['More painful than expected', 'Exactly as expected', 'Less painful than expected'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => updateForm('painAccuracy', opt)}
                                        className={`w-full p-4 rounded-xl border text-left transition-all ${form.painAccuracy === opt ? 'bg-[#00FFA0]/10 border-[#00FFA0] text-[#00FFA0]' : 'bg-white/5 border-white/10 hover:border-white/30 text-white'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold mb-8">Downtime Accuracy</h2>
                            <p className="text-gray-400 mb-8">Did your recovery time match the AI report's prediction?</p>
                            <div className="space-y-4">
                                {['Longer downtime', 'Accurate prediction', 'Faster recovery'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => updateForm('downtimeAccuracy', opt)}
                                        className={`w-full p-4 rounded-xl border text-left transition-all ${form.downtimeAccuracy === opt ? 'bg-[#00FFA0]/10 border-[#00FFA0] text-[#00FFA0]' : 'bg-white/5 border-white/10 hover:border-white/30 text-white'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold mb-8">Side Effects</h2>
                            <p className="text-gray-400 mb-8">Did you experience any lingering complications?</p>
                            <div className="space-y-4">
                                {['None', 'Mild redness/swelling', 'Bruising / PIH', 'Severe complications'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => updateForm('sideEffects', opt)}
                                        className={`w-full p-4 rounded-xl border text-left transition-all ${form.sideEffects === opt ? 'bg-[#00FFA0]/10 border-[#00FFA0] text-[#00FFA0]' : 'bg-white/5 border-white/10 hover:border-white/30 text-white'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold mb-8">Doctor Recommendation</h2>
                            <p className="text-gray-400 mb-8">Would you recommend your assigned Master Doctor to others?</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => updateForm('recommendIntent', 'Yes')}
                                    className={`flex-1 p-6 rounded-xl border flex flex-col items-center justify-center gap-4 transition-all ${form.recommendIntent === 'Yes' ? 'bg-[#00FFA0]/10 border-[#00FFA0] text-[#00FFA0]' : 'bg-white/5 border-white/10 hover:border-white/30 text-white'}`}
                                >
                                    <ThumbsUp className="w-8 h-8" />
                                    <span className="font-bold">Absolutely</span>
                                </button>
                                <button
                                    onClick={() => updateForm('recommendIntent', 'No')}
                                    className={`flex-1 p-6 rounded-xl border flex flex-col items-center justify-center gap-4 transition-all ${form.recommendIntent === 'No' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/5 border-white/10 hover:border-white/30 text-white'}`}
                                >
                                    <ThumbsDown className="w-8 h-8" />
                                    <span className="font-bold">No</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 7 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold mb-8">Additional Notes</h2>
                            <p className="text-gray-400 mb-8">Any final thoughts regarding your treatment rhythm or future plans?</p>
                            <textarea
                                value={form.notes}
                                onChange={(e) => updateForm('notes', e.target.value)}
                                className="w-full h-40 bg-[#111111] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00FFA0] transition-colors resize-none"
                                placeholder="Write your clinical memo here..."
                            />
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between mt-8 pt-8 border-t border-white/10">
                    <button
                        onClick={prevStep}
                        disabled={step === 1 || submitting}
                        className={`px-6 py-3 font-bold rounded-xl transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                    >
                        Back
                    </button>

                    {step < 7 ? (
                        <button
                            onClick={nextStep}
                            disabled={!isStepComplete()}
                            className={`px-8 py-3 bg-[#00FFA0] text-black font-bold rounded-xl flex items-center gap-2 transition-all ${!isStepComplete() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00d480]'}`}
                        >
                            Next <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={submitFeedback}
                            disabled={submitting}
                            className="px-8 py-3 bg-[#00FFA0] text-black font-bold rounded-xl flex items-center gap-2 hover:bg-[#00d480] transition-colors"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Review'}
                        </button>
                    )}
                </div>

            </main>
        </div>
    );
}

export default FeedbackPage;
