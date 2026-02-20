import { useState } from 'react';
import { Check, X, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { useAuth } from '@/context/AuthContext';

interface PricingTableProps {
    language?: LanguageCode;
}

export default function PricingTable({ language = 'EN' }: PricingTableProps) {
    const { user } = useAuth();
    const defaultView = user?.role === 'doctor' ? 'DOCTOR' : 'PATIENT';
    const [view, setView] = useState<'PATIENT' | 'DOCTOR'>(defaultView);

    const t = (REPORT_TRANSLATIONS[language]?.landing || REPORT_TRANSLATIONS['EN'].landing).pricing;

    const patientTiers = [
        t.tiers.patient.free,
        t.tiers.patient.standard,
        t.tiers.patient.premium,
    ];

    const doctorTiers = [
        t.tiers.doctor.basic,
        t.tiers.doctor.standard,
        t.tiers.doctor.premium,
        t.tiers.doctor.platinum,
    ];

    const activeTiers = view === 'PATIENT' ? patientTiers : doctorTiers;

    // Mark "most popular" tier index (standard for patient, premium for doctor)
    const popularIndex = view === 'PATIENT' ? 1 : 2;

    return (
        <section className="py-24 bg-[#050505] relative overflow-hidden">
            {/* Background accent */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{t.title}</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">{t.subtitle}</p>
                </div>

                {/* Role Toggle */}
                <div className="flex justify-center mb-12">
                    <div className="flex bg-white/5 border border-white/10 rounded-full p-1">
                        <button
                            onClick={() => setView('PATIENT')}
                            className={cn(
                                'px-6 py-2.5 rounded-full text-sm font-bold transition-all',
                                view === 'PATIENT'
                                    ? 'bg-white text-black shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                            )}
                        >
                            {t.toggles.patient}
                        </button>
                        <button
                            onClick={() => setView('DOCTOR')}
                            className={cn(
                                'px-6 py-2.5 rounded-full text-sm font-bold transition-all',
                                view === 'DOCTOR'
                                    ? 'bg-white text-black shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                            )}
                        >
                            {t.toggles.doctor}
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className={cn(
                    'grid gap-6',
                    view === 'PATIENT'
                        ? 'md:grid-cols-3 max-w-4xl'
                        : 'md:grid-cols-2 lg:grid-cols-4 max-w-7xl',
                    'mx-auto'
                )}>
                    {activeTiers.map((tier, i) => {
                        const isPopular = i === popularIndex;
                        return (
                            <div
                                key={tier.name}
                                className={cn(
                                    'relative rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1',
                                    isPopular
                                        ? 'border-2 border-blue-500 bg-gradient-to-b from-blue-950/40 to-[#0f0f17] shadow-2xl shadow-blue-900/20'
                                        : 'border border-white/10 bg-gradient-to-b from-[#0f0f17] to-[#0a0a0f]'
                                )}
                            >
                                {isPopular && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center gap-1 whitespace-nowrap">
                                        <Zap className="w-3 h-3" /> {t.mostPopular}
                                    </div>
                                )}

                                {/* Tier info */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                                    <div className="flex items-end gap-1 mt-3">
                                        <span className="text-3xl font-black text-white">{tier.price}</span>
                                        {tier.period && (
                                            <span className="text-gray-400 text-sm mb-0.5">{tier.period}</span>
                                        )}
                                    </div>
                                </div>

                                {/* CTA */}
                                <button className={cn(
                                    'w-full py-3 rounded-xl font-bold text-sm mb-6 transition-all',
                                    isPopular
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30'
                                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                )}>
                                    {tier.cta}
                                </button>

                                {/* Features */}
                                <div className="flex-1 space-y-3">
                                    {tier.features.map((f, fi) => (
                                        <div key={fi} className="flex items-start gap-2.5">
                                            <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5 shrink-0">
                                                <Check className="w-2.5 h-2.5 text-blue-400" />
                                            </div>
                                            <span className="text-sm text-gray-300 leading-snug">{f}</span>
                                        </div>
                                    ))}
                                    {tier.missing?.map((f, fi) => (
                                        <div key={fi} className="flex items-start gap-2.5">
                                            <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center mt-0.5 shrink-0">
                                                <X className="w-2.5 h-2.5 text-gray-600" />
                                            </div>
                                            <span className="text-sm text-gray-600 leading-snug line-through">{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Doctor-specific note */}
                {view === 'DOCTOR' && (
                    <p className="text-center text-xs text-gray-600 mt-8">
                        {language === 'KO' ? '✓ 베이직은 영구 무료  ✓ 언제든지 업그레이드  ✓ 계약 없음' :
                            language === 'JP' ? '✓ ベーシックは永久無料  ✓ いつでもアップグレード  ✓ 契約なし' :
                                language === 'CN' ? '✓ 基础版永久免费  ✓ 随时升级  ✓ 无合同' :
                                    '✓ Basic is free forever  ✓ Upgrade anytime  ✓ No contracts'}
                    </p>
                )}
            </div>
        </section>
    );
}
