import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import RadarProfile from '@/components/report/RadarProfile';
import LogicTerminal from '@/components/report/LogicTerminal';
import SolutionCard from '@/components/report/SolutionCard';
import RiskAssessment from '@/components/report/RiskAssessment';
import { Loader2, Download, Lock } from 'lucide-react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

export default function ReportPage() {
    const router = useRouter();
    const { id } = router.query;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        // Simulate "Processing" time for effect
        const fetchData = async () => {
            try {
                // Pass the lang query param if it exists
                const langParam = router.query.lang ? `?lang=${router.query.lang}` : '';
                const res = await fetch(`/api/report/${id}${langParam}`);
                // Allow 404 for now to see if we can get partial data, or handle error better
                if (!res.ok) {
                    console.error("Report fetch failed:", res.status, res.statusText);
                    throw new Error('Report generation failed');
                }
                const json = await res.json();

                // Artificial delay for "Analysis" feel
                setTimeout(() => {
                    setData(json);
                    setLoading(false);
                }, 2000);
            } catch (err) {
                console.error(err);
                setError('Failed to load clinical report. Please try again or contact support.');
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Safe Defaults & Translation Setup
    const language = (data?.language || "EN") as LanguageCode;
    const t = REPORT_TRANSLATIONS[language] || REPORT_TRANSLATIONS['EN'];

    if (loading) {
        // Basic loading state (translation might not be ready if data not fetched, default to EN)
        const tLoad = REPORT_TRANSLATIONS['EN'].loading; // Default Loading in EN usually safer
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white font-mono">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <div className="text-sm tracking-widest animate-pulse">{tLoad.title}</div>
                <div className="text-xs text-gray-500 mt-2">{tLoad.subtitle}</div>
            </div>
        );
    }

    if (error) {
        return <div className="min-h-screen bg-[#050505] text-red-500 flex items-center justify-center font-mono">{error}</div>;
    }

    const patientName = data?.patient?.name || "Guest";
    const goals = data?.patient?.goals || [];
    const profileData = data?.patient?.profile || [];
    const logicText = data?.logic?.terminalText || "ANALYSIS COMPLETED.";
    const risks = data?.logic?.risks || [];
    const recommendations = data?.recommendations || [];

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
            <Head>
                <title>{t.header.title} | {patientName}</title>
            </Head>

            {/* Global Header */}
            <header className="border-b border-white/5 bg-[#050505]/80 backdrop-blur fixed top-0 w-full z-10">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="font-bold tracking-tighter">
                        Connecting<span className="text-blue-500">Docs</span>
                        <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 font-normal">{t.header.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-xs font-mono text-gray-400 hover:text-white transition-colors" onClick={() => window.print()}>
                            <Download className="w-4 h-4 inline mr-1" /> {t.header.export}
                        </button>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="text-xs font-bold text-blue-400">{language}</div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 pt-24 pb-20">
                {/* Top Section: Split Grid (Mirror vs Logic) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Quadrant A: The Mirror (Radar) */}
                    <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 relative">
                        <h2 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-6">{t.radar.title}</h2>
                        <RadarProfile data={profileData} language={language} />
                        <div className="mt-4 flex flex-wrap gap-2">
                            {goals.map((goal: string, i: number) => (
                                <span key={i} className="text-xs px-2 py-1 bg-white/5 rounded text-gray-300 border border-white/5">{goal}</span>
                            ))}
                        </div>
                    </section>

                    {/* Quadrant B: The Logic (Terminal) */}
                    <section className="h-full">
                        <LogicTerminal text={logicText} language={language} />
                    </section>
                </div>

                {/* Middle Section: Solutions */}
                <section className="mb-12">
                    <div className="flex items-end justify-between mb-6">
                        <h2 className="text-2xl md:text-3xl font-bold">{t.solutions.title}</h2>
                        <div className="text-sm text-gray-400 hidden md:block">{t.solutions.subtitle}</div>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
                        {recommendations.map((rec: any) => (
                            <div key={rec.id} className="snap-center">
                                <SolutionCard {...rec} language={language} />
                            </div>
                        ))}

                        {/* Premium Upsell Card */}
                        <div className="min-w-[300px] bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/30 rounded-xl p-8 flex flex-col items-center justify-center text-center snap-center">
                            <Lock className="w-8 h-8 text-blue-400 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">{t.solutions.upgrade.title}</h3>
                            <p className="text-sm text-gray-400 mb-6">{t.solutions.upgrade.subtitle}</p>
                            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors">
                                {t.solutions.upgrade.button}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Bottom Section: Risk Assessment */}
                <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-8">
                    <RiskAssessment risks={risks} language={language} />
                </section>
            </main>
        </div>
    );
}
