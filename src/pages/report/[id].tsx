import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Loader2, Download, Lock } from 'lucide-react';

import AlignmentHero from '@/components/report/AlignmentHero';
import WhatIfSliders from '@/components/report/WhatIfSliders';
import TrafficLightRisk from '@/components/report/TrafficLightRisk';
import SolutionCard from '@/components/report/SolutionCard';
import LogicTerminal from '@/components/report/LogicTerminal';
import UnlockModal from '@/components/report/UnlockModal';
import SkinSimulationContainer from '@/components/simulation/SkinSimulationContainer';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

// Default 5-axis radar data for the AlignmentHero
const DEFAULT_RADAR_DATA = [
    { subject: 'Skin Thickness', A: 72, fullMark: 100 },
    { subject: 'Pain Tolerance', A: 65, fullMark: 100 },
    { subject: 'Downtime', A: 80, fullMark: 100 },
    { subject: 'Pigment Risk', A: 55, fullMark: 100 },
    { subject: 'Aging Stage', A: 60, fullMark: 100 },
];

export default function ReportPage() {
    const router = useRouter();
    const { id } = router.query;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [alignmentScore, setAlignmentScore] = useState(92);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const langParam = router.query.lang ? `?lang=${router.query.lang}` : '';
                const res = await fetch(`/api/report/${id}${langParam}`);
                if (!res.ok) throw new Error('Report generation failed');
                const json = await res.json();
                setTimeout(() => { setData(json); setLoading(false); }, 2000);
            } catch (err) {
                console.error(err);
                setError('Failed to load clinical report. Please try again or contact support.');
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const language = (data?.language || 'EN') as LanguageCode;
    const t = REPORT_TRANSLATIONS[language] || REPORT_TRANSLATIONS['EN'];
    const rt = t.report;

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center font-mono"
                style={{ background: '#0a0a2a', color: 'white' }}>
                <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#00FFFF' }} />
                <div className="text-sm tracking-widest animate-pulse" style={{ color: 'rgba(0,255,255,0.8)' }}>
                    {t.loading.title}
                </div>
                <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {t.loading.subtitle}
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
    const goals = data?.patient?.goals || [];
    const profileData = data?.patient?.profile || DEFAULT_RADAR_DATA;
    const logicText = data?.logic?.terminalText || 'ANALYSIS COMPLETED.';
    const risks = data?.logic?.risks || [];
    const recommendations = data?.recommendations || [];

    return (
        <div className="min-h-screen selection:bg-cyan-500/30 font-mono"
            style={{ background: '#0a0a2a', color: 'white' }}>
            <Head>
                <title>{t.header.title} | {patientName}</title>
                <style>{`
                    body { background: #0a0a2a; }
                    ::-webkit-scrollbar { width: 4px; }
                    ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
                    ::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.2); border-radius: 2px; }
                `}</style>
            </Head>

            {/* Fixed Header */}
            <header className="fixed top-0 w-full z-30"
                style={{
                    background: 'rgba(10,10,42,0.85)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(0,255,255,0.08)',
                }}>
                <div className="container mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="font-bold tracking-tighter text-sm">
                        Connecting<span style={{ color: '#00FFFF' }}>Docs</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-normal"
                            style={{ background: 'rgba(0,255,255,0.08)', color: 'rgba(0,255,255,0.6)', border: '1px solid rgba(0,255,255,0.15)' }}>
                            {t.header.title}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-xs font-mono transition-colors flex items-center gap-1"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                            onClick={() => window.print()}>
                            <Download className="w-3.5 h-3.5" /> {t.header.export}
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

                {/* ① Hero: Alignment Score + 5-Axis Radar */}
                <AlignmentHero
                    score={alignmentScore}
                    radarData={profileData}
                    language={language}
                />

                {/* ② What-If Sliders */}
                <WhatIfSliders
                    language={language}
                    baseScore={92}
                    onScoreChange={setAlignmentScore}
                />

                {/* ③ Traffic Light Risk Filter */}
                <TrafficLightRisk risks={risks} language={language} />

                {/* ④ Logic Terminal (collapsible data feed) */}
                <section className="mb-6 rounded-2xl overflow-hidden"
                    style={{ border: '1px solid rgba(0,255,255,0.08)' }}>
                    <LogicTerminal text={logicText} language={language} />
                </section>

                {/* ⑤ Signature Solution Cards */}
                <section className="mb-8">
                    <div className="flex items-end justify-between mb-5">
                        <div>
                            <div className="text-[10px] font-mono tracking-[0.3em] mb-1" style={{ color: 'rgba(0,255,255,0.6)' }}>
                                ◈ {t.solutions.title.toUpperCase()}
                            </div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                {t.solutions.subtitle}
                            </div>
                        </div>
                        {goals.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 justify-end">
                                {goals.map((goal: string, i: number) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 rounded"
                                        style={{ background: 'rgba(0,255,255,0.06)', color: 'rgba(0,255,255,0.7)', border: '1px solid rgba(0,255,255,0.15)' }}>
                                        {goal}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-5 overflow-x-auto pb-4" style={{ scrollSnapType: 'x mandatory' }}>
                        {recommendations.map((rec: any) => (
                            <div key={rec.id} style={{ scrollSnapAlign: 'center' }}>
                                <SolutionCard {...rec} language={language} />
                            </div>
                        ))}

                        {/* Locked Premium upsell card */}
                        <div className="min-w-[300px] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0,255,255,0.04) 0%, rgba(0,0,0,0.3) 100%)',
                                border: '1px solid rgba(0,255,255,0.15)',
                                scrollSnapAlign: 'center',
                            }}
                            onClick={() => setIsModalOpen(true)}>
                            <Lock className="w-8 h-8 mb-4" style={{ color: 'rgba(0,255,255,0.5)' }} />
                            <h3 className="text-base font-bold text-white mb-2">{t.solutions.upgrade.title}</h3>
                            <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.solutions.upgrade.subtitle}</p>
                            <button className="px-5 py-2 rounded-lg text-xs font-bold transition-all"
                                style={{
                                    background: 'rgba(0,255,255,0.1)',
                                    color: '#00FFFF',
                                    border: '1px solid rgba(0,255,255,0.3)',
                                }}>
                                {t.solutions.upgrade.button}
                            </button>
                        </div>
                    </div>
                </section>

                {/* ⑥ Skin Simulation */}
                <section className="mb-8">
                    <SkinSimulationContainer language={language} simulationData={data?.patient?.simulationData} />
                </section>

            </main>

            {/* Sticky Footer CTA */}
            <div className="fixed bottom-0 left-0 right-0 z-40"
                style={{ backdropFilter: 'blur(20px)', background: 'rgba(10,10,42,0.92)', borderTop: '1px solid rgba(0,255,255,0.12)' }}>
                <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00FFFF', boxShadow: '0 0 8px #00FFFF' }} />
                        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {rt?.footer.locked || 'Your personalized master doctor recommendations are ready'}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all"
                        style={{
                            background: 'linear-gradient(135deg, #00FFFF, #00b4d8)',
                            color: '#0a0a2a',
                            boxShadow: '0 0 16px rgba(0,255,255,0.3)',
                        }}>
                        {rt?.footer.cta || '🔒 Unlock Master Profile & Book'}
                    </button>
                </div>
            </div>

            {/* Email Capture Modal */}
            <UnlockModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                language={language}
            />
        </div>
    );
}
