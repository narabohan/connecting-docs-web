import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Loader2, Download, Lock, Activity, Stethoscope } from 'lucide-react';

import AlignmentHero from '@/components/report/AlignmentHero';
import WhatIfSliders from '@/components/report/WhatIfSliders';
import TrafficLightRisk from '@/components/report/TrafficLightRisk';
import IntelligenceEngine from '@/components/premium/IntelligenceEngine';
import SignatureGallery from '@/components/premium/SignatureGallery';
import SkinBoosterRecommendations from '@/components/curation/SkinBoosterRecommendations';
import UnlockModal from '@/components/report/UnlockModal';
import SkinSimulationContainer from '@/components/simulation/SkinSimulationContainer';
import DoctorClinicalPanel from '@/components/doctor/DoctorClinicalPanel';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';


const DEFAULT_RADAR_DATA = [
    { subject: 'Skin Thickness', A: 72, fullMark: 100 },
    { subject: 'Pain Tolerance', A: 65, fullMark: 100 },
    { subject: 'Downtime', A: 80, fullMark: 100 },
    { subject: 'Pigment Risk', A: 55, fullMark: 100 },
    { subject: 'Aging Stage', A: 60, fullMark: 100 },
];

const DEFAULT_RISKS = [
    { level: 'DANGER' as const, factor: 'High-Energy CO2 Laser', description: 'Excluded due to melasma risk. High thermal damage may trigger hyperpigmentation cascade.' },
    { level: 'CAUTION' as const, factor: 'Aggressive IPL', description: 'Requires 40 min topical anesthesia. Use conservative fluence settings only.' },
    { level: 'SAFE' as const, factor: 'RF Energy (Monopolar/Bipolar)', description: 'Radiofrequency-based protocols are fully cleared for your skin type and goals.' },
    { level: 'SAFE' as const, factor: 'Exosome Boosters', description: 'Ideal complement for barrier regeneration post-energy treatment.' },
];

export default function ReportPage() {
    const router = useRouter();
    const { id } = router.query;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
    const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
    const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);
    const [alignmentScore, setAlignmentScore] = useState(92);
    const [isRecalculating, setIsRecalculating] = useState(false);

    // Check if the current viewer is a doctor
    const isDoctor = router.query.role === 'doctor';

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const langParam = router.query.lang ? `?lang=${router.query.lang}` : '';
                const res = await fetch(`/api/report/${id}${langParam}`);
                if (!res.ok) throw new Error('Report generation failed');
                const json = await res.json();
                setTimeout(() => { setData(json); setLoading(false); }, 1800);
            } catch (err) {
                console.error(err);
                setTimeout(() => { setData(null); setLoading(false); }, 1800);
            }
        };
        fetchData();
    }, [id, router.query.lang]);

    const handleRecalculate = async (pain: string, downtime: string) => {
        setIsRecalculating(true);
        try {
            const langParam = router.query.lang ? `&lang=${router.query.lang}` : '';
            const res = await fetch(`/api/report/${id}?recalculate=true&pain=${encodeURIComponent(pain)}&downtime=${encodeURIComponent(downtime)}${langParam}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
                // Scroll to top to see new recommendations
                window.scrollTo({ top: 300, behavior: 'smooth' });
            }
        } catch (error) {
            console.error("Recalculate failed", error);
        } finally {
            setIsRecalculating(false);
        }
    };

    const language = (data?.language || 'EN') as LanguageCode;
    const t = REPORT_TRANSLATIONS[language] || REPORT_TRANSLATIONS['EN'];
    const rt = t.report;

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center font-mono"
                style={{ background: '#03060A', color: 'white' }}>
                <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#00FFA0' }} />
                <div className="text-sm tracking-widest animate-pulse" style={{ color: 'rgba(0,255,160,0.8)' }}>
                    {t.loading?.title || 'GENERATING CLINICAL REPORT...'}
                </div>
                <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {t.loading?.subtitle || 'Cross-referencing 847 protocols'}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center font-mono text-red-500"
                style={{ background: '#0a0a2a' }}>
                {error}
            </div>
        );
    }

    const patientName = data?.patient?.name || 'Guest';
    const goals = data?.patient?.goals || ['Glass Skin', 'Anti-Aging'];
    const profileData = data?.patient?.profile || DEFAULT_RADAR_DATA;
    const logicText = data?.logic?.terminalText || '';
    const risks = data?.logic?.risks?.length > 0 ? data.logic.risks : DEFAULT_RISKS;
    const recommendations = data?.recommendations || [];

    // PDF Download Handler
    const handleDownloadPDF = () => {
        // Automatically print background colors and UI styling using the browser's high-fidelity print engine.
        window.print();
    };

    const openDeepDive = (selId: string | null) => {
        setSelectedProtocolId(selId);
        if (isDoctor) {
            setIsSimulationModalOpen(true);
        } else {
            setIsUnlockModalOpen(true);
        }
    };

    return (
        <div className="min-h-screen selection:bg-cyan-500/30 font-mono"
            style={{ background: '#0a0a2a', color: 'white' }}>
            <Head>
                <title>Clinical Alignment Report | {patientName}</title>
                <meta name="description" content="ConnectingDocs personalized pre-consulting intelligence report" />
                <style>{`
                    body { background: #0a0a2a; }
                    ::-webkit-scrollbar { width: 4px; }
                    ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
                    ::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.2); border-radius: 2px; }
                    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
                `}</style>
            </Head>

            {/* ── Fixed Header ── */}
            <header className="fixed top-0 w-full z-30"
                style={{
                    background: 'rgba(10,10,42,0.88)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(0,255,255,0.08)',
                }}>
                <div className="container mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(isDoctor ? '/doctor/waitlist' : '/dashboard')}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div className="font-bold tracking-tighter text-sm uppercase hidden sm:block">
                            Connecting<span style={{ color: '#00FFA0' }}>Docs</span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-normal"
                                style={{ background: 'rgba(0,255,160,0.08)', color: 'rgba(0,255,160,0.6)', border: '1px solid rgba(0,255,160,0.15)' }}>
                                INTELLIGENCE REPORT
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-xs font-mono transition-colors flex items-center gap-1 hover:text-white"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                            onClick={handleDownloadPDF}>
                            <Download className="w-3.5 h-3.5" /> Export PDF
                        </button>
                        <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                        <div className="text-[10px] font-bold tracking-widest px-2 py-1 rounded"
                            style={{ color: '#00FFA0', background: 'rgba(0,255,160,0.08)', border: '1px solid rgba(0,255,160,0.15)' }}>
                            {language}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 pt-20 pb-28">

                {isDoctor && (
                    <DoctorClinicalPanel data={data} language={language} />
                )}

                {/* ① Section A: Hero — Score Ring + Radar + AI Terminal */}
                <AlignmentHero
                    score={alignmentScore}
                    radarData={profileData}
                    language={language}
                    terminalText={logicText}
                    patientName={patientName}
                />

                {/* ①-2 Clinical Analysis Summary (Reason Why) */}
                {logicText && (
                    <section className="mb-12 mt-6">
                        <div className="bg-[#111111] border border-[#00FFA0]/20 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#00FFA0]" />
                            <div className="flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5 text-[#00FFA0]" />
                                <h3 className="text-white font-bold text-lg font-mono tracking-tighter uppercase italic">
                                    Clinical Analysis Summary
                                </h3>
                            </div>
                            <div className="text-slate-300 leading-relaxed font-sans text-sm md:text-base whitespace-pre-line">
                                {logicText}
                            </div>
                        </div>
                    </section>
                )}

                {/* ② Section D: What-If Sliders */}
                <WhatIfSliders
                    language={language}
                    baseScore={92}
                    onScoreChange={setAlignmentScore}
                />

                {/* ③ Section B: Traffic Light Risk Filter */}
                <TrafficLightRisk risks={risks} language={language} />

                {/* ④ Premium Intelligence & Curation */}
                <IntelligenceEngine language={language} recommendations={recommendations} />

                <SignatureGallery
                    language={language}
                    recommendations={recommendations}
                    onStartAnalysis={() => setIsUnlockModalOpen(true)}
                    onViewDeepDive={(rank) => {
                        const sel = recommendations[rank - 1]?.id || null;
                        openDeepDive(sel);
                    }}
                />

                <SkinBoosterRecommendations language={language} recommendations={recommendations} />

                {/* <SkinSimulationContainer> intentional omission: User requested that face layers should only appear when expanding specific solutions in the modal */}

                {/* ⑥ How to Use This Report (Patient Only) */}
                {!isDoctor && t.usageGuide && (
                    <section className="mb-12 mt-16 max-w-4xl mx-auto">
                        <div className="bg-[#111111] border border-[#00FFA0]/30 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFA0]/5 rounded-bl-full pointer-events-none" />
                            <h2 className="text-[#00FFA0] text-xl md:text-2xl font-bold font-mono uppercase tracking-tight mb-8">
                                {t.usageGuide.title}
                            </h2>
                            <div className="space-y-6">
                                {[
                                    { icon: <Activity className="w-5 h-5" />, title: t.usageGuide.step1.title, desc: t.usageGuide.step1.desc },
                                    { icon: <Stethoscope className="w-5 h-5" />, title: t.usageGuide.step2.title, desc: t.usageGuide.step2.desc },
                                    { icon: <Lock className="w-5 h-5" />, title: t.usageGuide.step3.title, desc: t.usageGuide.step3.desc }
                                ].map((step, idx) => (
                                    <div key={idx} className="flex gap-4 items-start">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00FFA0]/10 border border-[#00FFA0]/30 flex items-center justify-center text-[#00FFA0]">
                                            {step.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold font-mono text-[15px] mb-1">{step.title}</h4>
                                            <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

            </main>

            {/* ── Sticky Footer CTA (Section E) ── */}
            <div className="fixed bottom-0 left-0 right-0 z-40"
                style={{ backdropFilter: 'blur(20px)', background: 'rgba(10,10,42,0.95)', borderTop: '1px solid rgba(0,255,255,0.12)' }}>
                <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00FFA0', boxShadow: '0 0 8px #00FFA0' }} />
                        <span className="text-xs font-mono hidden sm:block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {isDoctor
                                ? 'Patient profile & contact preferences are ready'
                                : (rt?.footer?.locked || 'Master Doctor profile & clinic details are ready to unlock')}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsUnlockModalOpen(true)}
                        className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all hover:scale-105"
                        style={{
                            background: 'linear-gradient(135deg, #00FFA0, #00d480)',
                            color: '#03060A',
                            boxShadow: '0 0 20px rgba(0,255,160,0.4), 0 0 40px rgba(0,255,160,0.15)',
                            animation: 'pulse-glow 2s ease-in-out infinite',
                        }}>
                        <Lock className="w-3.5 h-3.5" />
                        {isDoctor
                            ? 'Connect with Patient'
                            : (rt?.footer?.cta || '🔒 Unlock Master Profile & Book')}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(0,255,255,0.4), 0 0 40px rgba(0,255,255,0.15); }
                    50% { box-shadow: 0 0 30px rgba(0,255,255,0.7), 0 0 60px rgba(0,255,255,0.3); }
                }
                
                /* Sensible Korean line breaks */
                p, h1, h2, h3, h4, h5, h6, span, div {
                    word-break: keep-all;
                    overflow-wrap: break-word;
                }

                @media print {
                    header, .fixed.bottom-0, .fixed.z-40, button { display: none !important; }
                    body, .min-h-screen, main { background: #fff !important; color: #000 !important; margin: 0 !important; padding: 0 !important; }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    /* Remove dark mode inversion so the PDF exactly mirrors the neo-cybernetic UI */
                    .bg-\[\#0a0a2a\], .bg-\[\#050505\], .bg-\[\#02050A\] { background-color: #050505 !important; }
                    .bg-\[\#111111\] { background-color: #111111 !important; border: 1px solid rgba(0,255,160,0.3) !important; box-shadow: none !important; }

                    .border-\[\#1F1F1F\], .border-\[\#00FFA0\]\\/20, .border-\[\#00FFA0\]\\/30 { border-color: #e5e7eb !important; }
                    
                    /* Text legibility retention */
                    .text-white { color: #ffffff !important; }
                    .text-slate-300 { color: #cbd5e1 !important; }
                    .text-slate-400 { color: #94a3b8 !important; }
                    .text-slate-500 { color: #64748b !important; }
                    
                    /* Block splitting prevention */
                    section, .grid > div { break-inside: avoid; page-break-inside: avoid; }
                    
                    /* Reduce huge margins/paddings */
                    .py-24, .py-32, .pt-20, .pb-28 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
                    .mb-20, .mb-16, .mb-12 { margin-bottom: 2rem !important; }
                }
            `}</style>

            {/* Email Capture & Doctor Connect Modal */}
            <UnlockModal
                isOpen={isUnlockModalOpen}
                onClose={() => { setIsUnlockModalOpen(false); setSelectedProtocolId(null); }}
                language={language}
                reportId={id as string}
                selectedProtocolId={selectedProtocolId}
            />

            {/* Deep Dive / Simulation Modal */}
            {isSimulationModalOpen && selectedProtocolId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl shrink-0"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsSimulationModalOpen(false) }}>
                    <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0a0f] border border-[#00FFA0]/20 shadow-[0_0_60px_rgba(0,255,160,0.1)] custom-scrollbar">
                        <div className="sticky top-0 right-0 left-0 bg-transparent flex justify-end p-4 z-10 pointer-events-none">
                            <button onClick={() => setIsSimulationModalOpen(false)} className="pointer-events-auto p-2 rounded-full bg-black/50 border border-white/10 hover:border-[#00FFA0]/50 text-white transition-all">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="-mt-12">
                            <SkinSimulationContainer
                                language={language}
                                simulationData={data?.patient?.simulationData}
                                recommendations={recommendations}
                                onRecalculate={handleRecalculate}
                                isRecalculating={isRecalculating}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
