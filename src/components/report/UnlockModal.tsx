import { useState } from 'react';
import { X, Lock, Send, Check } from 'lucide-react';
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
        button: 'Unlock & Book Consultation',
        verifying: 'VERIFYING...',
        success: 'Access Granted! Redirecting to your full profile...',
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
            }
        } catch (e) {
            console.error("Unlock error:", e);
        } finally {
            setLoading(false);
            if (submitted) {
                setTimeout(() => { onClose(); setSubmitted(false); setEmail(''); }, 2500);
            } else {
                setTimeout(() => { onClose(); setSubmitted(false); setEmail(''); }, 2500); // close anyway for mockup
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,10,0.7)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            <div className="relative w-full max-w-md rounded-2xl overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #0a0a2a 0%, #0d1040 100%)',
                    border: '1px solid rgba(0,255,255,0.2)',
                    boxShadow: '0 0 60px rgba(0,255,255,0.1), 0 40px 80px rgba(0,0,0,0.8)',
                }}>

                {/* Glow top strip */}
                <div className="h-0.5 w-full" style={{ background: 'linear-gradient(to right, transparent, #00FFFF, transparent)' }} />

                {/* Close */}
                <button onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg transition-all"
                    style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}>
                    <X className="w-4 h-4" />
                </button>

                <div className="p-8">
                    {submitted ? (
                        <div className="flex flex-col items-center text-center py-6 gap-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(0,255,255,0.1)', border: '2px solid #00FFFF', boxShadow: '0 0 20px rgba(0,255,255,0.3)' }}>
                                <Check className="w-8 h-8" style={{ color: '#00FFFF' }} />
                            </div>
                            <div className="text-lg font-bold text-white font-mono">{t.success}</div>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.2)' }}>
                                    <Lock className="w-6 h-6" style={{ color: '#00FFFF' }} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white font-mono leading-tight">{t.title}</h2>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{t.subtitle}</p>
                                </div>
                            </div>

                            {/* What you get */}
                            <div className="mb-6 rounded-xl p-4"
                                style={{ background: 'rgba(0,255,255,0.04)', border: '1px solid rgba(0,255,255,0.1)' }}>
                                {(t.benefits ?? [
                                    'Top 3 Matched Master Doctors',
                                    'Full Clinical Risk Breakdown',
                                    'Instant Booking System',
                                    'Personalized Pre-Care Guide',
                                ]).map((item: string) => (
                                    <div key={item} className="flex items-center gap-2 py-1.5">
                                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'rgba(0,255,255,0.15)', border: '1px solid rgba(0,255,255,0.3)' }}>
                                            <Check className="w-2.5 h-2.5" style={{ color: '#00FFFF' }} />
                                        </div>
                                        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>{item}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder={t.emailPlaceholder}
                                    required
                                    className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(0,255,255,0.2)',
                                        color: 'white',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = 'rgba(0,255,255,0.6)'; e.target.style.boxShadow = '0 0 12px rgba(0,255,255,0.1)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(0,255,255,0.2)'; e.target.style.boxShadow = 'none'; }}
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl text-sm font-bold font-mono flex items-center justify-center gap-2 transition-all"
                                    style={{
                                        background: loading ? 'rgba(0,255,255,0.2)' : 'linear-gradient(135deg, #00FFFF, #00b4d8)',
                                        color: '#0a0a2a',
                                        boxShadow: loading ? 'none' : '0 0 20px rgba(0,255,255,0.3)',
                                    }}>
                                    {loading
                                        ? <span className="animate-pulse">{t.verifying ?? 'VERIFYING...'}</span>
                                        : <><Send className="w-4 h-4" /> {t.button}</>
                                    }
                                </button>
                                <p className="text-[10px] text-center font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                    {t.terms}
                                </p>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
