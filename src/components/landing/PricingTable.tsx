import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface PricingTableProps {
    language?: LanguageCode;
}

export default function PricingTable({ language = 'EN' }: PricingTableProps) {
    const [view, setView] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
    const t = (REPORT_TRANSLATIONS[language]?.landing || REPORT_TRANSLATIONS['EN'].landing).pricing;

    // We map the structure to the same array format as before for rendering
    const TIERS = {
        PATIENT: [
            {
                ...t.tiers.patient.free,
                popular: false
            },
            {
                ...t.tiers.patient.standard,
                popular: true
            },
            {
                ...t.tiers.patient.premium,
                popular: false
            }
        ],
        DOCTOR: [
            {
                ...t.tiers.doctor.basic,
                popular: false
            },
            {
                ...t.tiers.doctor.partner,
                popular: true
            },
            {
                ...t.tiers.doctor.enterprise,
                popular: false
            }
        ]
    };

    const handleUpgrade = async (tier: any) => {
        // Skip for free tiers
        if (tier.price === '$0' || tier.price === 'Free' || tier.price === '₩0' || tier.price === '무료' || tier.price === '¥0' || tier.price === '免费') {
            window.location.href = '#signup';
            return;
        }

        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: 'price_mock_id', // Would be real Stripe Price ID
                    tierName: tier.name,
                }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('Billing Error:', data.message);
                alert('Billing System Offline (Sandbox Mode)');
            }
        } catch (error) {
            console.error('Network Error:', error);
            alert('Connection Error');
        }
    };

    return (
        <section className="py-24 bg-[#050505]">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{t.title}</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto mb-8">
                        {t.subtitle}
                    </p>

                    {/* Toggle */}
                    <div className="inline-flex bg-white/5 p-1 rounded-full border border-white/10">
                        <button
                            onClick={() => setView('PATIENT')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${view === 'PATIENT' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            {t.toggles.patient}
                        </button>
                        <button
                            onClick={() => setView('DOCTOR')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${view === 'DOCTOR' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            {t.toggles.doctor}
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {TIERS[view].map((tier, i) => (
                        <div
                            key={i}
                            className={`relative bg-[#0A0A0A] border rounded-2xl p-8 flex flex-col transition-all hover:-translate-y-2 ${tier.popular ? 'border-blue-500 shadow-blue-500/20 shadow-xl' : 'border-white/10 hover:border-gray-600'}`}
                        >
                            {tier.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                                    {t.mostPopular}
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                                    <span className="text-sm text-gray-500">{tier.period}</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {tier.features.map((feature, j) => (
                                    <div key={j} className="flex items-start gap-3 text-sm text-gray-300">
                                        <Check className="w-5 h-5 text-blue-500 shrink-0" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                                {tier.missing.map((feature, k) => (
                                    <div key={k} className="flex items-start gap-3 text-sm text-gray-600">
                                        <X className="w-5 h-5 text-gray-700 shrink-0" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleUpgrade(tier)}
                                className={`w-full py-4 rounded-xl font-bold transition-colors ${tier.popular ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                            >
                                {tier.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
