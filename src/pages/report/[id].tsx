import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Loader2, Download, Lock, ArrowLeft, Stethoscope, Sparkles, Activity, ChevronRight } from 'lucide-react';

import EfficacyEngine from '@/components/report/EfficacyEngine';
import Top3Solutions from '@/components/report/Top3Solutions';
import UnlockModal from '@/components/report/UnlockModal';
import PatientProfileSummary from '@/components/report/PatientProfileSummary';
import SkinSimulationContainer from '@/components/simulation/SkinSimulationContainer';
import ClinicalIntelligence from '@/components/report/ClinicalIntelligence';
import PatientSkinSummary from '@/components/report/PatientSkinSummary';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_RADAR_DATA = [
    { subject: 'Pain Tolerance', A: 65, fullMark: 100 },
    { subject: 'Skin Fit', A: 75, fullMark: 100 },
    { subject: 'Aging Stage', A: 60, fullMark: 100 },
    { subject: 'Efficacy', A: 85, fullMark: 100 },
    { subject: 'Pigment Risk', A: 45, fullMark: 100 },
    { subject: 'Budget', A: 70, fullMark: 100 },
];

export default function ReportPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user } = useAuth();
    const isAdmin = user?.email === 'narabohan@gmail.com' || (user as any)?.role === 'admin';

    // States
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [alignmentScore, setAlignmentScore] = useState(92);
    const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
    const [activeItemName, setActiveItemName] = useState<string | undefined>();
    const [simulating, setSimulating] = useState(false);

    const language = (data?.language || 'EN') as LanguageCode;
    const t = REPORT_TRANSLATIONS[language] || REPORT_TRANSLATIONS['EN'];

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const langParam = router.query.lang ? `?lang=${router.query.lang}` : '';
                const res = await fetch(`/api/report/${id}${langParam}`);
                if (!res.ok) throw new Error('Report generation failed');
                const json = await res.json();

                if (json.recommendations?.[0]) {
                    setSelectedProtocol(json.recommendations[0]);
                    setAlignmentScore(json.recommendations[0].matchScore || 92);
                }

                setTimeout(() => { setData(json); setLoading(false); }, 1200);
            } catch (err) {
                console.error(err);
                setTimeout(() => { setData(null); setLoading(false); }, 1200);
            }
        };
        fetchData();
    }, [id, router.query.lang]);

    // Polling for why_cat if not already fetched
    useEffect(() => {
        if (!id || !data?.recommendations?.[0]) return;
        const lang = language as string;

        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            if (attempts > 12) {
                clearInterval(interval);
                return;
            }
            try {
                const res = await fetch(`/api/engine/get-run?runId=${id}`);
                const runData = await res.json();

                if (runData[`why_cat1_${lang}`]) {
                    setData((prev: any) => {
                        if (!prev) return prev;
                        const newRecs = [...prev.recommendations];
                        if (newRecs[0]) newRecs[0].description = runData[`why_cat1_${lang}`];
                        if (newRecs[1] && runData[`why_cat2_${lang}`]) newRecs[1].description = runData[`why_cat2_${lang}`];
                        if (newRecs[2] && runData[`why_cat3_${lang}`]) newRecs[2].description = runData[`why_cat3_${lang}`];
                        return { ...prev, recommendations: newRecs };
                    });

                    setSelectedProtocol((prev: any) => {
                        if (!prev) return prev;
                        const rank = prev.rank;
                        const matchedCat = runData[`why_cat${rank}_${lang}`];
                        if (matchedCat) {
                            return { ...prev, description: matchedCat };
                        }
                        return prev;
                    });

                    clearInterval(interval);
                }
            } catch (e) { }
        }, 5000);

        return () => clearInterval(interval);
    }, [id, !!data, language]);

    const handleSelectProtocol = (proto: any) => {
        setSelectedProtocol(proto);
        setAlignmentScore(proto.matchScore);
        setActiveItemName(undefined);
    };

    const handleSelectDevice = (device: any) => {
        setSimulating(true);
        setActiveItemName(device.name);
        // Live score adjustment for feedback
        const delta = Math.floor(Math.random() * 8) - 4;
        const newScore = Math.min(100, Math.max(75, (device.suitability || alignmentScore) + delta));
        setTimeout(() => {
            setAlignmentScore(newScore);
            setSimulating(false);
        }, 500);
    };

    const handleSelectBooster = (booster: any) => {
        setSimulating(true);
        setActiveItemName(booster.name);
        setTimeout(() => setSimulating(false), 400);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center font-mono bg-[#02020a]">
                <Loader2 className="w-10 h-10 animate-spin mb-6 text-cyan-400" />
                <div className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase animate-pulse">
                    Initializing High-Depth Intelligence...
                </div>
            </div>
        );
    }

    const patientName = data?.patient?.name || 'Guest';
    const profileRadarData = data?.patient?.radar_score || DEFAULT_RADAR_DATA;
    const recommendations = data?.recommendations || [];

    // Realistic fallback/placeholder for clinical intelligence list
    const clinicalIntel = data?.clinicalIntelligence || {
        devices: [
            { name: 'Titanium Lifting', suitability: 96, area: 'Full Face', layer: 'SMAS+', pain: 'None', downtime: 'Zero' },
            { name: 'Oligio RF', suitability: 92, area: 'Lower Face', layer: 'Dermis', pain: 'Low', downtime: 'None' },
            { name: 'Potenza Collagen', suitability: 88, area: 'Targeted', layer: 'Deep Dermis', pain: 'Med', downtime: '1 Day' },
            { name: 'Ultherapy', suitability: 94, area: 'Jawline', layer: 'SMAS', pain: 'High', downtime: 'None' },
            { name: 'Volformer', suitability: 98, area: 'Mid-Face', layer: 'Dual Depth', pain: 'Low', downtime: 'Zero' }
        ],
        boosters: [
            { name: 'Glass Skin Rejuran', suitability: 99, mechanism: 'Cellular recovery & DNA fragment stimulation.', pain: 'Med', downtime: '2 Days', method: 'Direct Injection' },
            { name: 'Premium Exosome', suitability: 95, mechanism: 'Extracellular vesicle for rapid barrier healing.', pain: 'Low', downtime: 'Zero', method: 'MTS / Topical' },
            { name: 'Juvelook Volume', suitability: 91, mechanism: 'PLA + HA collagen stimulator for deep texture.', pain: 'Med', downtime: '3 Days', method: 'Cannula / ID' }
        ]
    };

    return (
        <div className="min-h-screen bg-[#02020a] selection:bg-cyan-500/30 font-mono text-white">
            <Head>
                <title>{patientName}'s Intelligence Report | Connecting Docs</title>
            </Head>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 w-full z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 py-4 px-8">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.back()} className="text-[10px] font-black tracking-widest text-white/40 uppercase hover:text-white transition-colors flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Exit Portal
                        </button>
                        <div className="h-4 w-px bg-white/10 hidden md:block" />
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-[10px] font-black text-cyan-400 italic">LOGIC_ACTIVE</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] font-black">{patientName}</span>
                            <span className="text-[8px] text-white/30 uppercase tracking-[0.2em]">Profile Verified #8421</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-600/20 border border-white/10 flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-cyan-400" />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="pt-28 pb-32 px-8">
                <div className="max-w-[1400px] mx-auto space-y-24">

                    {/* 1. AI Diagnosis Summary & Score Heading */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-8">
                            <PatientSkinSummary
                                data={data?.skinAnalysis || {}}
                                language={language}
                            />
                        </div>
                        <div className="lg:col-span-4 text-center">
                            <div className="p-12 rounded-[3.5rem] bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 relative group">
                                <div className="absolute inset-0 bg-cyan-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-[10px] font-black tracking-[0.4em] text-cyan-400 uppercase mb-4 block">Selection Synergy</span>
                                <div className="text-8xl font-black text-white mb-2 tabular-nums">{alignmentScore}%</div>
                                <span className="text-xs font-bold text-cyan-400/50 uppercase tracking-[0.2em]">Clinical Alignment</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Top 3 Protocols (Priority Grid) */}
                    <Top3Solutions
                        recommendations={recommendations}
                        language={language}
                        selectedProtocolId={selectedProtocol?.id}
                        onSelectProtocol={handleSelectProtocol}
                        onUnlock={() => setIsModalOpen(true)}
                    />

                    {/* 3. Efficacy & Device Match Engine */}
                    <EfficacyEngine
                        radarData={profileRadarData}
                        devices={clinicalIntel.devices}
                        onSelectDevice={handleSelectDevice}
                        activeDeviceName={activeItemName}
                        language={language}
                    />

                    {/* 4. Booster Combinations (Synergy Row) */}
                    <ClinicalIntelligence
                        boosters={clinicalIntel.boosters}
                        onSelectItem={handleSelectBooster}
                        activeItemName={activeItemName}
                        language={language}
                    />

                    {/* 5. Anatomic Visual Simulation */}
                    <section className="space-y-12">
                        <div className="flex items-center justify-between border-b border-white/5 pb-8">
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 italic">Spatial Intelligence</h3>
                                <p className="text-sm text-white/30 font-mono">Real-time Anatomic Projections of Selected Protocol</p>
                            </div>
                            <div className="hidden lg:flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-white/40 uppercase">Target Area</span>
                                    <span className="text-sm font-bold text-cyan-400">{selectedProtocol?.focusArea || 'Face Full'}</span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-white/40 uppercase">Clinical Depth</span>
                                    <span className="text-sm font-bold text-violet-400">{selectedProtocol?.depthLevel || 'Dual Layer'}</span>
                                </div>
                            </div>
                        </div>
                        <SkinSimulationContainer
                            language={language}
                            recommendations={recommendations}
                        />
                    </section>

                    {/* 6. Legal / Quality Footer */}
                    <footer className="pt-24 border-t border-white/5 text-center space-y-4">
                        <div className="flex items-center justify-center gap-2 text-white/20">
                            <Activity className="w-4 h-4" />
                            <span className="text-[10px] font-black tracking-widest uppercase italic">Logic Layer: Clinical Judgment Graph v4.2.1</span>
                        </div>
                        <p className="text-[10px] text-white/10 max-w-2xl mx-auto uppercase tracking-tighter leading-relaxed">
                            Disclaimer: This report is a pre-consulting intelligence output based on digital profiles.
                            Final clinical diagnosis must be performed by a licensed medical professional in-person.
                        </p>
                    </footer>
                </div>
            </main>

            {/* Global CTA */}
            <div className="fixed bottom-0 left-0 w-full z-[60] bg-gradient-to-t from-black via-black/90 to-transparent pb-8 pt-12 px-4 flex justify-center pointer-events-none">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group pointer-events-auto relative flex items-center justify-center gap-3 px-8 sm:px-12 py-4 sm:py-5 rounded-full bg-[#00FF88] text-black font-black text-sm sm:text-base uppercase tracking-widest shadow-[0_10px_40px_rgba(0,255,136,0.3)] hover:scale-105 active:scale-95 transition-all w-full max-w-md mx-auto"
                >
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="truncate">
                        {language === 'KO' ? '10불 내고 예약하기' :
                            language === 'JP' ? '10ドルで予約する' :
                                language === 'CN' ? '支付$10预约咨询' :
                                    'Book a Consultation ($10)'}
                    </span>
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1" />
                </button>
            </div>

            <UnlockModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <style jsx global>{`
                ::selection { background: rgba(0,255,255,0.3); }
                body { background-color: #02020a !important; }
            `}</style>
        </div>
    );
}
