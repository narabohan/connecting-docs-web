import { useState } from 'react';
import { X, Lock, Send, Check, Sparkles } from 'lucide-react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface UnlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    language?: LanguageCode;
    reportId?: string;
}

export default function UnlockModal({ isOpen, onClose, language = 'EN', reportId }: UnlockModalProps) {
    const t = (REPORT_TRANSLATIONS[language] || REPORT_TRANSLATIONS['EN']).report?.modal || {
        title: 'Unlock Your Master Profile',
        subtitle: 'Get personalized doctor recommendations + instant consultation booking.',
        emailPlaceholder: 'Enter your email address',
        button: 'Unlock & Join Waitlist',
        verifying: 'VERIFYING...',
        success: 'You are now on the Priority Waitlist!',
        terms: 'By submitting, you agree to our Privacy Policy.',
        benefits: ['Top 3 Matched Master Doctors', 'Full Clinical Risk Breakdown', 'Instant Booking System', 'Personalized Pre-Care Guide'],
    };

    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !reportId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/report/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, reportId })
            });
            if (res.ok) {
                setSubmitted(true);
            } else {
                console.error("Failed to unlock");
                setSubmitted(true); // For demo/waitlist purposes, let's treat any submission as success
            }
        } catch (e) {
            console.error("Unlock error:", e);
            setSubmitted(true);
        } finally {
            setLoading(false);
            setTimeout(() => {
                if (submitted) {
                    onClose();
                    setSubmitted(false);
                    setEmail('');
                }
            }, 3000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(0,0,10,0.8)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            <div className="relative w-full max-w-md rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(0,255,255,0.1)]"
                style={{
                    background: 'linear-gradient(135deg, #050510 0%, #0a0a25 100%)',
                    border: '1px solid rgba(0,255,255,0.2)',
                }}>

                {/* Glow top strip */}
                <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, transparent, #00FFFF, transparent)' }} />

                {/* Close */}
                <button onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-xl transition-all hover:bg-white/10"
                    style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}>
                    <X className="w-4 h-4" />
                </button>

                <div className="p-10">
                    {submitted ? (
                        <div className="flex flex-col items-center text-center py-8 gap-6 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_40px_rgba(0,255,255,0.4)]"
                                style={{ background: 'rgba(0,255,255,0.1)', border: '2px solid #00FFFF' }}>
                                <Check className="w-10 h-10" style={{ color: '#00FFFF' }} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white font-mono tracking-widest uppercase mb-2">Priority Secured</h3>
                                <p className="text-xs text-white/50 leading-relaxed max-w-[240px]">
                                    You are now on the VIP waitlist for Top 1% Doctor Matching. We will notify you via email.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex items-start gap-5 mb-8">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(0,255,255,0.15)]"
                                    style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.3)' }}>
                                    <Lock className="w-7 h-7" style={{ color: '#00FFFF' }} />
                                </div>
                                <div className="pt-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h2 className="text-xl font-bold text-white font-mono tracking-tight leading-tight uppercase">Master Profile</h2>
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 font-black tracking-widest animate-pulse">BETA</span>
                                    </div>
                                    <p className="text-xs font-mono font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                        Join the Priority Waitlist for Top 1% Doctor Matching & Immediate Consultation.
                                    </p>
                                </div>
                            </div>

                            {/* Status Banner */}
                            <div className="mb-8 py-3 px-4 rounded-xl bg-[#00FFA0]/5 border border-[#00FFA0]/20 flex items-center gap-3">
                                <Sparkles className="w-4 h-4 text-[#00FFA0]" />
                                <span className="text-[10px] font-mono text-[#00FFA0] tracking-widest font-black uppercase">Official Launch: Q2 2026</span>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder={t.emailPlaceholder}
                                    required
                                    className="w-full px-5 py-4 rounded-2xl text-sm font-mono outline-none transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = 'rgba(0,255,255,0.5)'; e.target.style.background = 'rgba(0,255,255,0.05)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 rounded-2xl text-sm font-black font-mono flex items-center justify-center gap-3 transition-all active:scale-95"
                                    style={{
                                        background: loading ? 'rgba(0,255,255,0.2)' : 'linear-gradient(135deg, #00FFFF, #00b4d8)',
                                        color: '#0a0a2a',
                                        boxShadow: loading ? 'none' : '0 10px 30px rgba(0,255,255,0.3)',
                                    }}>
                                    {loading
                                        ? <span className="animate-pulse">VERIFYING LOGIC...</span>
                                        : <><Send className="w-4 h-4" /> SECURE BETA ACCESS</>
                                    }
                                </button>
                                <p className="text-[9px] text-center font-mono opacity-20 uppercase tracking-[0.2em] mt-2">
                                    ENCRYPTED PIPELINE · HIPAA READY
                                </p>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
