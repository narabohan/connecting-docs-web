import { useState, useEffect } from 'react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import ConstraintSelectors from './ConstraintSelectors';
import LiveRadar from './LiveRadar';
import MakeFaceMannequin from './FaceMannequin';
import SkinLayerSection from './SkinLayerSection';
import { Save, Sparkles, RefreshCw, CheckCircle, BrainCircuit } from 'lucide-react';

interface SimulationData {
    primaryIndication: string;
    secondaryIndication?: string;
    locations?: string[];
}

interface SkinSimulationContainerProps {
    language: LanguageCode;
    simulationData?: SimulationData;
}

export default function SkinSimulationContainer({ language, simulationData }: SkinSimulationContainerProps) {
    const t = REPORT_TRANSLATIONS[language]?.simulation || REPORT_TRANSLATIONS['EN'].simulation;

    // State: 1 (Low/Economy), 2 (Mid/Standard), 3 (High/Premium)
    const [pain, setPain] = useState(2);
    const [downtime, setDowntime] = useState(2);
    const [budget, setBudget] = useState(2);

    // Derived Logic (Simulation Matrix)
    const [radarData, setRadarData] = useState<any[]>([]);
    const [activeLayers, setActiveLayers] = useState<string[]>([]);

    // Zone Logic for Face Mannequin
    const [primaryZones, setPrimaryZones] = useState<string[]>([]);
    const [secondaryZones, setSecondaryZones] = useState<string[]>([]);

    const [isGlassSkinUnlocked, setIsGlassSkinUnlocked] = useState(false);

    // Helper to map Indication string to Zones and Layers
    const getIndicationLogic = (indication: string) => {
        const map: Record<string, { zones: string[], layers: string[] }> = {
            'Lifting': { zones: ['Jawline', 'Neck'], layers: ['SMAS', 'Muscle'] },
            'Sagging': { zones: ['Jawline', 'Cheek'], layers: ['SMAS', 'Dermis'] },
            'Firmness': { zones: ['Cheek'], layers: ['Dermis'] },
            'Elasticity': { zones: ['Cheek', 'EyeArea'], layers: ['Dermis'] },
            'Texture': { zones: ['Cheek', 'Forehead'], layers: ['Epidermis'] },
            'Pores': { zones: ['Nose', 'Cheek'], layers: ['Epidermis'] },
            'Glow': { zones: ['Forehead', 'Cheek'], layers: ['Epidermis', 'Dermis'] },
            'Wrinkles': { zones: ['EyeArea', 'Forehead'], layers: ['Dermis'] },
            'Pigmentation': { zones: ['Cheek', 'EyeArea'], layers: ['Epidermis'] },
            'Redness': { zones: ['Cheek', 'Nose'], layers: ['Epidermis'] }
        };

        for (const key in map) {
            if (indication.toLowerCase().includes(key.toLowerCase())) return map[key];
        }
        return { zones: [], layers: [] };
    };

    useEffect(() => {
        // --- 1. Radar Calculation (1-3 Scale) ---
        // Axes: Lifting, Firmness, Texture, Skin Glow, Safety

        // Lifting: High Pain (Energy) + High Budget -> strong lifting
        const liftingScore = mapScore((pain * 0.6 + budget * 0.4));

        // Firmness: Budget (Volume) + Pain (Energy)
        const firmnessScore = mapScore((budget * 0.7 + pain * 0.3));

        // Texture: Downtime (Resurfacing) + Budget
        // Higher downtime typically means stronger resurfacing -> better texture result
        const textureScore = mapScore((downtime * 0.6 + budget * 0.4));

        // Glow: Low Pain + Low Downtime (Gentle care) is safer, but High Budget (Boosters) adds glow
        // User logic: "Low Pain/Budget increases Safety and Glow" (Wait, usually boosters cost money/pain? sticking to user request)
        // User: "Low Pain increases 'Safety' and 'Glow'."
        const glowScore = mapScore(((4 - pain) * 0.7 + (4 - downtime) * 0.3));

        // Safety: Low Pain + Low Downtime
        // User logic: "High Pain/Budget ... slightly reduces Safety"
        const safetyScore = mapScore(((4 - pain) * 0.5 + (4 - downtime) * 0.5));

        setRadarData([
            { subject: t.radar.lifting, A: liftingScore, fullMark: 100 },
            { subject: t.radar.firmness, A: firmnessScore, fullMark: 100 },
            { subject: t.radar.texture, A: textureScore, fullMark: 100 },
            { subject: t.radar.glow, A: glowScore, fullMark: 100 },
            { subject: t.radar.safety, A: safetyScore, fullMark: 100 },
        ]);

        // --- 2. Tally Data Integration (Indications & Locations) ---
        let calculatedLayers = new Set<string>();
        let pZones = new Set<string>();
        let sZones = new Set<string>();

        // A. Apply Manual Input Logic first
        if (downtime === 1) calculatedLayers.add('Epidermis');
        if (downtime >= 2 || pain >= 2) calculatedLayers.add('Dermis');
        if (pain === 3 || budget === 3) {
            calculatedLayers.add('SMAS');
            calculatedLayers.add('Muscle');
        }

        // B. Apply Simulation Data (Tally) overrides/additions
        if (simulationData) {
            // Primary Indication
            if (simulationData.primaryIndication) {
                const logic = getIndicationLogic(simulationData.primaryIndication);
                logic.layers.forEach(l => calculatedLayers.add(l));
                logic.zones.forEach(z => pZones.add(z));
            }
            // Secondary Indication
            if (simulationData.secondaryIndication) {
                const logic = getIndicationLogic(simulationData.secondaryIndication);
                logic.layers.forEach(l => calculatedLayers.add(l));
                logic.zones.forEach(z => sZones.add(z));
            }
            // Explicit Locations
            if (simulationData.locations) {
                // Map text locations to our simplified zones if needed, or assume they match
                simulationData.locations.forEach(loc => {
                    // Simple mapping or direct add if matches our FaceMannequin keys
                    if (['Forehead', 'Cheek', 'Jawline', 'EyeArea', 'Nose', 'Neck'].includes(loc)) {
                        pZones.add(loc);
                    }
                });
            }
        } else {
            // Fallback for Landing Page (Manual Simulator) - visualize based on "inferred" impact
            if (liftingScore > 70) pZones.add('Jawline');
            if (textureScore > 70) pZones.add('Cheek');
            if (glowScore > 80) pZones.add('Forehead');
        }

        setActiveLayers(Array.from(calculatedLayers));
        setPrimaryZones(Array.from(pZones));
        setSecondaryZones(Array.from(sZones));

        // --- 3. Gamification ---
        const avg = (liftingScore + firmnessScore + textureScore + glowScore + safetyScore) / 5;
        setIsGlassSkinUnlocked(avg > 80);

    }, [pain, downtime, budget, simulationData, t]);

    // Helper to map 1-3 range to 40-100 radar value
    const mapScore = (val: number) => {
        // val is roughly 1 to 3
        return Math.min(100, Math.max(40, 40 + (val - 1) * 30));
    };

    return (
        <div className="w-full bg-[#0a0a2a] p-6 lg:p-12 border-t border-white/5 relative overflow-hidden" id="simulation">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-900/5 blur-3xl rounded-full translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-cyan-900/5 blur-3xl rounded-full -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 container mx-auto">
                {/* Header */}
                <div className="text-center mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-2">
                        <BrainCircuit className="w-3 h-3" />
                        AI SIMULATION ENGINE
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 inline-block">
                        {t.title}
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">{t.subtitle}</p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                    {/* Left: Input Selectors - Col Span 3 */}
                    <div className="xl:col-span-3">
                        <ConstraintSelectors
                            pain={pain} setPain={setPain}
                            downtime={downtime} setDowntime={setDowntime}
                            budget={budget} setBudget={setBudget}
                            language={language}
                        />
                    </div>

                    {/* Middle: Visuals (Radar + Face) - Col Span 6 */}
                    <div className="xl:col-span-6 flex flex-col gap-6">
                        {/* Radar Chart */}
                        <div className="h-[400px]">
                            <LiveRadar data={radarData} language={language} />
                        </div>

                        {/* Gamification Notification */}
                        {isGlassSkinUnlocked && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-center gap-3 animate-pulse">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold tracking-widest uppercase text-sm">{t.badge}</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Skin Layers & Face Map - Col Span 3 */}
                    <div className="xl:col-span-3 flex flex-col gap-6">
                        <MakeFaceMannequin
                            primaryZones={primaryZones}
                            secondaryZones={secondaryZones}
                            language={language}
                        />
                        <SkinLayerSection
                            activeLayers={activeLayers}
                            painLevel={pain}
                            language={language}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-16 text-center space-y-6">
                    <div className="bg-white/5 rounded-2xl p-6 max-w-2xl mx-auto border border-white/10 backdrop-blur-sm">
                        <p className="text-gray-300 font-medium mb-4">{t.evaluation}</p>
                        <button
                            onClick={() => { setPain(2); setDowntime(2); setBudget(2); }}
                            className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline flex items-center justify-center gap-2 mx-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {t.retry}
                        </button>
                    </div>

                    <button className="bg-white text-black hover:bg-gray-200 px-10 py-4 rounded-full font-bold text-lg transition-transform transform hover:scale-105 flex items-center gap-3 mx-auto shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        <CheckCircle className="w-5 h-5" />
                        {t.finalCall}
                    </button>
                </div>
            </div>
        </div>
    );
}
