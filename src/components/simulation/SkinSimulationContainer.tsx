'use client';
import { useState, useEffect } from 'react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import ConstraintSelectors from './ConstraintSelectors';
import LiveRadar from './LiveRadar';
import FaceMannequin from './FaceMannequin';
import SkinLayerSection from './SkinLayerSection';
import ProtocolSelector from './ProtocolSelector';
import { RefreshCw, CheckCircle, BrainCircuit, Sparkles } from 'lucide-react';

interface RecommendationProtocol {
    id: string;
    rank: number;
    name: string;
    matchScore: number;
    faceZones?: string[];
    targetLayers?: string | string[];
    reasonWhy?: {
        pain_level: string;
        downtime_level: string;
        why_suitable: string;
    };
}

interface SimulationData {
    primaryIndication: string;
    secondaryIndication?: string;
    locations?: string[];
}

interface SkinSimulationContainerProps {
    language: LanguageCode;
    simulationData?: SimulationData;
    recommendations?: RecommendationProtocol[];
    onRecalculate?: (pain: string, downtime: string) => void;
    isRecalculating?: boolean;
}

export default function SkinSimulationContainer({
    language,
    simulationData,
    recommendations = [],
    onRecalculate,
    isRecalculating
}: SkinSimulationContainerProps) {
    const t = REPORT_TRANSLATIONS[language]?.simulation || REPORT_TRANSLATIONS['EN'].simulation;

    // Gamification sliders: 1 (Low), 2 (Mid), 3 (High)
    const [pain, setPain] = useState(2);
    const [downtime, setDowntime] = useState(2);
    const [budget, setBudget] = useState(2);

    // Selected protocol (rank 1, 2, or 3)
    const [selectedRank, setSelectedRank] = useState(1);
    const selectedProtocol = recommendations.find(r => r.rank === selectedRank) || recommendations[0];

    // Derived face zones and layers from selected protocol
    // Priority: API faceZones → goal-based derivation → hardcoded defaults (always shows something)
    const rawFaceZones: string[] = selectedProtocol?.faceZones?.length
        ? selectedProtocol.faceZones
        : (simulationData?.primaryIndication
            ? deriveZonesFromGoal(simulationData.primaryIndication)
            : []);
    // Absolute fallback: show Forehead + Cheek + Jawline if nothing else is available
    const faceZones: string[] = rawFaceZones.length > 0 ? rawFaceZones : ['Forehead', 'Cheek', 'Jawline'];

    const rawTargetLayers: string[] = parseTargetLayers(selectedProtocol?.targetLayers);
    const targetLayersForDisplay: string[] = rawTargetLayers.length > 0
        ? rawTargetLayers
        : (simulationData?.primaryIndication
            ? deriveLayersFromGoal(simulationData.primaryIndication)
            : ['Epidermis', 'Dermis']); // default: show Epidermis + Dermis for any goal

    // Radar state
    const [radarData, setRadarData] = useState<any[]>([]);
    const [isGlassSkinUnlocked, setIsGlassSkinUnlocked] = useState(false);

    const mapScore = (val: number) => Math.min(100, Math.max(40, 40 + (val - 1) * 30));

    useEffect(() => {
        const liftingScore = mapScore(pain * 0.6 + budget * 0.4);
        const firmnessScore = mapScore(budget * 0.7 + pain * 0.3);
        const textureScore = mapScore(downtime * 0.6 + budget * 0.4);
        const glowScore = mapScore((4 - pain) * 0.7 + (4 - downtime) * 0.3);
        const safetyScore = mapScore((4 - pain) * 0.5 + (4 - downtime) * 0.5);

        setRadarData([
            { subject: t.radar.lifting, A: liftingScore, fullMark: 100 },
            { subject: t.radar.firmness, A: firmnessScore, fullMark: 100 },
            { subject: t.radar.texture, A: textureScore, fullMark: 100 },
            { subject: t.radar.glow, A: glowScore, fullMark: 100 },
            { subject: t.radar.safety, A: safetyScore, fullMark: 100 },
        ]);

        const avg = (liftingScore + firmnessScore + textureScore + glowScore + safetyScore) / 5;
        setIsGlassSkinUnlocked(avg > 80);
    }, [pain, downtime, budget, t]);

    const handleRecalculate = () => {
        if (!onRecalculate) return;
        const painMap: Record<number, string> = { 1: 'Prefer minimal pain', 2: 'Moderate is okay', 3: 'High tolerance' };
        const downtimeMap: Record<number, string> = { 1: 'None (Daily life immediately)', 2: 'Short (3–4 days)', 3: 'Long (1 week+)' };
        onRecalculate(painMap[pain], downtimeMap[downtime]);
    };

    const sectionTitle = language === 'KO' ? '맞춤 피부 블루프린트'
        : language === 'JP' ? 'パーソナルスキンブループリント'
            : language === 'CN' ? '个性化皮肤蓝图' : 'Personalized Skin Blueprint';

    return (
        <div className="w-full bg-[#03060A] border-t border-white/5 relative overflow-hidden" id="simulation">
            {/* Background glows */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[#00FFA0]/5 blur-3xl rounded-full translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-[#00FFA0]/5 blur-3xl rounded-full -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 container mx-auto px-6 py-10">
                {/* Section Header */}
                <div className="text-center mb-12 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FFA0]/10 border border-[#00FFA0]/20 text-[#00FFA0] text-xs font-mono font-bold uppercase tracking-widest">
                        <BrainCircuit className="w-3 h-3" />
                        {sectionTitle.toUpperCase()}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight uppercase italic block">
                        {sectionTitle}
                    </h2>
                </div>

                {/* Part 1: Protocol Selector + Face Map + Skin Layers */}
                <div className="mb-10">
                    {/* Protocol Selection Tabs (only show if we have data) */}
                    {recommendations.length > 0 && (
                        <ProtocolSelector
                            protocols={recommendations}
                            selected={selectedRank}
                            onSelect={setSelectedRank}
                            language={language}
                        />
                    )}

                    {/* Visualization Grid — ALWAYS visible */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ minHeight: 340 }}>
                        <FaceMannequin
                            primaryZones={faceZones}
                            language={language}
                            protocolName={selectedProtocol?.name || (recommendations.length === 0 ? (simulationData?.primaryIndication || undefined) : undefined)}
                        />
                        <SkinLayerSection
                            activeLayers={targetLayersForDisplay}
                            language={language}
                            protocolName={selectedProtocol?.name}
                        />
                    </div>

                    {/* Why this protocol */}
                    {selectedProtocol?.reasonWhy?.why_suitable && (
                        <div className="mt-4 rounded-xl px-5 py-3 text-sm font-mono italic"
                            style={{ background: 'rgba(0,255,160,0.04)', border: '1px solid rgba(0,255,160,0.1)', color: 'rgba(0,255,160,0.8)' }}>
                            💡 {selectedProtocol.reasonWhy.why_suitable}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="border-t border-white/5 mb-8" />

                {/* Part 2: What-If Sliders + Radar */}
                <div className="mb-3 text-center">
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold" style={{ color: 'rgba(0,255,160,0.5)' }}>
                        {language === 'KO' ? '조건 변경 시 어떤 시술이 더 가능해지는지 탐색하세요'
                            : language === 'JP' ? '条件を変えてさらなる可能性を探ってください'
                                : language === 'CN' ? '调整条件，探索更多可能性'
                                    : 'Adjust constraints to discover more treatment options'}
                    </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left: Sliders */}
                    <div className="xl:col-span-4">
                        <ConstraintSelectors
                            pain={pain} setPain={setPain}
                            downtime={downtime} setDowntime={setDowntime}
                            budget={budget} setBudget={setBudget}
                            language={language}
                        />
                    </div>

                    {/* Right: Radar */}
                    <div className="xl:col-span-8 flex flex-col gap-6">
                        <div className="h-[320px]">
                            <LiveRadar data={radarData} language={language} />
                        </div>

                        {isGlassSkinUnlocked && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-center gap-3 animate-pulse">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold tracking-widest uppercase text-sm">{t.badge}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recalculate CTA */}
                <div className="mt-10 text-center space-y-4">
                    <div className="bg-white/5 rounded-2xl p-5 max-w-xl mx-auto border border-white/10 backdrop-blur-sm">
                        <p className="text-gray-300 font-medium mb-4 text-sm">{t.evaluation}</p>
                        <button
                            onClick={() => { setPain(2); setDowntime(2); setBudget(2); }}
                            className="text-sm text-[#00FFA0] hover:text-[#00FFA0]/80 hover:underline flex items-center justify-center gap-2 mx-auto font-mono uppercase font-bold">
                            <RefreshCw className="w-4 h-4" />
                            {t.retry}
                        </button>
                    </div>

                    <button
                        onClick={handleRecalculate}
                        disabled={isRecalculating}
                        className={`bg-white text-black px-10 py-4 rounded-full font-bold text-base transition-transform transform flex items-center gap-3 mx-auto shadow-[0_0_20px_rgba(255,255,255,0.3)] ${isRecalculating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 hover:scale-105'}`}>
                        {isRecalculating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                        {isRecalculating
                            ? (language === 'KO' ? '재계산 중...' : language === 'JP' ? '再計算中...' : language === 'CN' ? '重新计算中...' : 'Recalculating...')
                            : (language === 'KO' ? '조건 적용 후 추천 재계산' : language === 'JP' ? '条件適用して再計算' : language === 'CN' ? '应用条件并重新推荐' : 'Apply & Recalculate Recommendations')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper: parse targetLayers from Airtable (can be string, string[], or undefined)
function parseTargetLayers(raw: string | string[] | undefined): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        return raw.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
}

// Fallback zone derivation from goal string
function deriveZonesFromGoal(goal: string): string[] {
    const zones = new Set<string>();
    if (/lift|sag|jaw|neck|v.line|contour/i.test(goal)) { zones.add('Jawline'); zones.add('Neck'); zones.add('Submental'); }
    if (/firm|elast|cheek|volume/i.test(goal)) zones.add('Cheek');
    if (/texture|pore|glow|bright|tone|glass/i.test(goal)) { zones.add('Forehead'); zones.add('Cheek'); }
    if (/wrinkle|frown|forehead/i.test(goal)) { zones.add('Forehead'); }
    if (/pigment|melasma|spot|redness/i.test(goal)) { zones.add('Cheek'); }
    if (/eye|orbital/i.test(goal)) zones.add('Periorbital');
    if (zones.size === 0) { zones.add('Cheek'); zones.add('Forehead'); zones.add('Jawline'); } // universal fallback
    return Array.from(zones);
}

// Fallback skin layer derivation from goal string
function deriveLayersFromGoal(goal: string): string[] {
    const layers: string[] = [];
    if (/lift|sag|jaw|contour|v.line|smas/i.test(goal)) { layers.push('SMAS'); layers.push('SubQ_Fat'); }
    if (/firm|elast|collagen|dermis/i.test(goal)) { layers.push('Papillary_Dermis'); layers.push('Reticular_Dermis'); }
    if (/texture|pore|glow|bright|tone|glass|skin/i.test(goal)) { layers.push('Stratum_Corneum'); layers.push('Epidermis'); layers.push('DE_Junction'); }
    if (/muscle|jaw|sculpt/i.test(goal)) layers.push('Muscle');
    if (layers.length === 0) { layers.push('Epidermis'); layers.push('Reticular_Dermis'); } // fallback
    return layers;
}
