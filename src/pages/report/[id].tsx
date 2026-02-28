import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Loader2, Download, Lock, ArrowLeft, Stethoscope } from 'lucide-react';

import AlignmentHero from '@/components/report/AlignmentHero';
import WhatIfSliders from '@/components/report/WhatIfSliders';
import TrafficLightRisk from '@/components/report/TrafficLightRisk';
import Top3Solutions from '@/components/report/Top3Solutions';
import UnlockModal from '@/components/report/UnlockModal';
import SkinSimulationContainer from '@/components/simulation/SkinSimulationContainer';
import DoctorClinicalPanel, { WizardData } from '@/components/report/DoctorClinicalPanel';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { useAuth } from '@/context/AuthContext';

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
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [alignmentScore, setAlignmentScore] = useState(92);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [doctorPanelOpen, setDoctorPanelOpen] = useState(true);

    const isDoctor = user?.role === 'doctor';

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
                window.scrollTo({ top: 300, behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Recalculate failed', error);
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
                style={{ background: '#0a0a2a', color: 'white' }}>
                <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#00FFFF' }} />
                <div className="text-sm tracking-widest animate-pulse" style={{ color: 'rgba(0,255,255,0.8)' }}>
                    {isDoctor ? 'LOADING CLINICAL DATA...' : (t.loading?.title || 'GENERATING CLINICAL REPORT...')}
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

    // Try to parse WizardData from report data
    const wizardData: WizardData | null = data?.wizardData || data?.patient?.wizardData || null;
    const patientEmail = data?.patient?.email || '';
    const matchScore = data?.alignmentScore || alignmentScore;

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
                    borderBottom: isDoctor ? '1px solid rgba(0,255,180,0.15)' : '1px solid rgba(0,255,255,0.08)',
                }}>
                <div className="container mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Back navigation */}
                        {isDoctor && (
                            <button
                                onClick={() => router.push('/doctor/waitlist')}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                title="Back to Waitlist"
                            >
                                <ArrowLeft className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                        {!isDoctor && (
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                        <div className="font-bold tracking-tighter text-sm">
                            Connecting<span style={{ color: '#00FFFF' }}>Docs</span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-normal"
                                style={{ background: 'rgba(0,255,255,0.08)', color: 'rgba(0,255,255,0.6)', border: '1px solid rgba(0,255,255,0.15)' }}>
                                {isDoctor ? 'DOCTOR VIEW' : 'INTELLIGENCE REPORT'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isDoctor && (
                            <button
                                className="text-xs font-mono transition-colors flex items-center gap-1 px-3 py-1 rounded-lg border"
                                style={{ color: '#00FFB4', borderColor: 'rgba(0,255,180,0.2)', background: 'rgba(0,255,180,0.05)' }}
                                onClick={() => setDoctorPanelOpen(!doctorPanelOpen)}
                            >
                                <Stethoscope className="w-3.5 h-3.5" />
                                {doctorPanelOpen ? 'Hide' : 'Show'} Clinical Panel
                            </button>
                        )}
                        <button className="text-xs font-mono transition-colors flex items-center gap-1"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                            onClick={() => window.print()}>
                            <Download className="w-3.5 h-3.5" /> Export PDF
                        </button>
                        <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                        <div className="text-[10px] font-bold tracking-widest px-2 py-1 rounded"
                            style={{ color: '#00FFFF', background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.15)' }}>
                            {language}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 pt-20 pb-28">

                {/* ── Doctor Clinical Panel (shown above standard report) ── */}
                {isDoctor && doctorPanelOpen && (
                    <section className="mb-8 mt-4">
                        <div className="p-6 rounded-2xl border"
                            style={{ background: 'rgba(0,15,30,0.8)', borderColor: 'rgba(0,255,180,0.15)' }}>
                            <DoctorClinicalPanel
                                wizardData={wizardData}
                                patientEmail={patientEmail}
                                score={matchScore}
                            />
                        </div>
                    </section>
                )}

                {/* ① Section A: Hero — Score Ring + Radar + AI Terminal */}
                <AlignmentHero
                    score={alignmentScore}
                    radarData={profileData}
                    language={language}
                    terminalText={logicText}
                    patientName={patientName}
                />

                {/* ② Section D: What-If Sliders */}
                <WhatIfSliders
                    language={language}
                    baseScore={92}
                    onScoreChange={setAlignmentScore}
                />

                {/* ③ Section B: Traffic Light Risk Filter */}
                <TrafficLightRisk risks={risks} language={language} />

                {/* ④ Section C: Top 3 Signature Solutions */}
                <Top3Solutions
                    recommendations={recommendations}
                    language={language}
                    goals={goals}
                    onUnlock={() => !isDoctor && setIsModalOpen(true)}
                />

                {/* ⑤ Skin Simulation */}
                <section className="mb-8">
                    <SkinSimulationContainer
                        language={language}
                        simulationData={data?.patient?.simulationData}
                        recommendations={recommendations}
                        onRecalculate={handleRecalculate}
                        isRecalculating={isRecalculating}
                    />
                </section>

            </main>

            {/* ── Sticky Footer CTA — hidden for doctors ── */}
            {!isDoctor && (
                <div className="fixed bottom-0 left-0 right-0 z-40"
                    style={{ backdropFilter: 'blur(20px)', background: 'rgba(10,10,42,0.95)', borderTop: '1px solid rgba(0,255,255,0.12)' }}>
                    <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00FFFF', boxShadow: '0 0 8px #00FFFF' }} />
                            <span className="text-xs font-mono hidden sm:block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {rt?.footer?.locked || 'Master Doctor profile & clinic details are ready to unlock'}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all hover:scale-105"
                            style={{
                                background: 'linear-gradient(135deg, #00FFFF, #00b4d8)',
                                color: '#0a0a2a',
                                boxShadow: '0 0 20px rgba(0,255,255,0.4), 0 0 40px rgba(0,255,255,0.15)',
                                animation: 'pulse-glow 2s ease-in-out infinite',
                            }}>
                            <Lock className="w-3.5 h-3.5" />
                            {rt?.footer?.cta || '🔒 Unlock Master Profile & Book'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Doctor Footer Bar ── */}
            {isDoctor && (
                <div className="fixed bottom-0 left-0 right-0 z-40"
                    style={{ backdropFilter: 'blur(20px)', background: 'rgba(0,10,20,0.95)', borderTop: '1px solid rgba(0,255,180,0.12)' }}>
                    <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Stethoscope className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-mono text-emerald-400 font-bold">Doctor Mode Active</span>
                            <span className="text-xs text-gray-500">Patient: {patientEmail || patientName}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.push('/doctor/waitlist')}
                                className="px-4 py-1.5 rounded-lg border border-white/15 bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition-colors"
                            >
                                ← Waitlist
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(0,255,255,0.4), 0 0 40px rgba(0,255,255,0.15); }
                    50% { box-shadow: 0 0 30px rgba(0,255,255,0.7), 0 0 60px rgba(0,255,255,0.3); }
                }
            `}</style>

            {/* Email Capture Modal — patient only */}
            {!isDoctor && (
                <UnlockModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    language={language}
                    reportId={id as string}
                />
            )}
        </div>
    );
}
