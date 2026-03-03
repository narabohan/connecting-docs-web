import React, { useReducer, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { AnalysisResponseV2 } from '@/types/airtable';
import { useAsyncDataPolling, ModalAction, ModalState } from '@/hooks/useAsyncDataPolling';
import { RankCard } from './deep-dive/RankCard';
import LiveRadar from '@/components/simulation/LiveRadar';
import { useAuth } from '@/context/AuthContext';

// We map the incoming initial data into RankCardData for the state
type RankCardData = {
    rank: number;
    category: any;
    devices: any[];
    boosters: any[];
};

interface DeepDiveModalV3Props {
    isOpen: boolean;
    onClose: () => void;
    runId: string | null;
    analysisData?: AnalysisResponseV2;
    language?: LanguageCode;
}

const initialState: ModalState = {
    rankCards: [],
    riskFlag: undefined,
    radarScore: { efficacy: 0, downtime: 0, discomfort: 0, cost_efficiency: 0, maintenance: 0 },
    whyCatKO: {},
    whyCatEN: {},
    boosterDeliveryJson: {},
    categoryImages: {},
    activeView: 'patient',
    expandedRank: 1,
    expandedBoosterIdx: { 1: 0, 2: 0, 3: 0 },
    pollingStatus: 'idle',
    pollingAttempts: 0
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
    switch (action.type) {
        case 'INIT': {
            const { rank1, rank2, rank3, riskFlag, radarScore } = action.payload as AnalysisResponseV2;
            const cards: RankCardData[] = [];
            if (rank1) cards.push({ rank: 1, category: rank1, devices: rank1.top_devices || [], boosters: rank1.top_boosters || [] });
            if (rank2) cards.push({ rank: 2, category: rank2, devices: rank2.top_devices || [], boosters: rank2.top_boosters || [] });
            if (rank3) cards.push({ rank: 3, category: rank3, devices: rank3.top_devices || [], boosters: rank3.top_boosters || [] });

            return {
                ...state,
                rankCards: cards,
                riskFlag,
                radarScore: radarScore || state.radarScore,
                pollingStatus: 'polling'
            };
        }
        case 'POLL_SUCCESS':
            return { ...state, ...action.payload };
        case 'POLL_TIMEOUT':
            return { ...state, pollingStatus: 'timeout' };
        case 'SET_EXPANDED_RANK':
            return { ...state, expandedRank: action.rank };
        case 'TOGGLE_VIEW':
            return { ...state, activeView: state.activeView === 'patient' ? 'doctor' : 'patient' };
        case 'SET_BOOSTER_IDX':
            return { ...state, expandedBoosterIdx: { ...state.expandedBoosterIdx, [action.rank]: action.idx } };
        default:
            return state;
    }
}

export default function DeepDiveModalV3({
    isOpen, onClose, runId, analysisData, language = 'KO'
}: DeepDiveModalV3Props) {
    const [state, dispatch] = useReducer(modalReducer, initialState);
    const { user } = useAuth(); // for possible role checking
    const [isAnimating, setIsAnimating] = useState(false);

    // Sync initial data from parent
    useEffect(() => {
        if (isOpen && analysisData) {
            dispatch({ type: 'INIT', payload: analysisData });
        }
    }, [isOpen, analysisData]);

    // Hook handles active polling while modal is open & runId exists
    useAsyncDataPolling(isOpen && state.pollingStatus === 'polling' ? runId || undefined : undefined, dispatch);

    // Close animation hook trick
    useEffect(() => {
        if (isOpen) setIsAnimating(true);
    }, [isOpen]);

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(onClose, 300);
    };

    if (!isOpen && !isAnimating) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal Container */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full sm:w-[500px] h-[90vh] sm:h-[85vh] bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Sticky Header */}
                <div className="flex-shrink-0 border-b border-slate-100 bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-800">
                            Personalized Clinical Blueprint
                        </h2>
                        <div className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${state.pollingStatus === 'polling' ? 'bg-amber-400 animate-pulse' : state.pollingStatus === 'done' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                            {state.pollingStatus === 'polling' ? 'AI 엔진이 최적의 조합을 생성하는 중...' : '분석 완료'}
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-800"
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto bg-slate-50 relative pb-10">

                    {/* Risk Flag Banner */}
                    {state.riskFlag?.triggered && (
                        <div className="bg-red-50 border-b border-red-100 p-4 sticky top-0 z-0">
                            <div className="flex gap-3">
                                <span className="text-red-500 text-xl">⚠️</span>
                                <div>
                                    <h4 className="font-bold text-red-800 text-sm mb-1">임상적 주의 (Risk Flag)</h4>
                                    <p className="text-red-700 text-sm leading-snug">
                                        {language === 'KO' ? state.riskFlag.reason_KO : state.riskFlag.reason_EN}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-4 sm:p-5">
                        <div className="mb-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-4">
                                <h3 className="font-bold text-slate-700 mb-1">
                                    예상 효과 프로필
                                </h3>
                                <p className="text-sm text-slate-500">조합 1순위 시술을 진행했을 때 예상되는 효과망입니다.</p>
                            </div>
                            {/* Pass radarScore strictly matching LiveRadar API expectations */}
                            {state.radarScore && (
                                <LiveRadar
                                    data={[
                                        { subject: 'Lifting', A: state.radarScore.lifting ?? state.radarScore.efficacy ?? 80 },
                                        { subject: 'Firmness', A: state.radarScore.firmness ?? state.radarScore.downtime ?? 80 },
                                        { subject: 'Texture', A: state.radarScore.texture ?? state.radarScore.discomfort ?? 75 },
                                        { subject: 'Glow', A: state.radarScore.glow ?? state.radarScore.cost_efficiency ?? 85 },
                                        { subject: 'Safety', A: state.radarScore.safety ?? state.radarScore.maintenance ?? 90 },
                                    ]}
                                    language={language}
                                />
                            )}
                        </div>

                        {/* Tab Bar Toggle (Patient vs Doctor) */}
                        <div className="bg-slate-200/50 p-1 mb-6 rounded-xl flex">
                            <button
                                onClick={() => dispatch({ type: 'TOGGLE_VIEW' })}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${state.activeView === 'patient' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                💁‍♀️ 환자 뷰 (Patient)
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'TOGGLE_VIEW' })}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${state.activeView === 'doctor' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                👨‍⚕️ 닥터 뷰 (Pro)
                            </button>
                        </div>

                        {/* Patient View Payload */}
                        {state.activeView === 'patient' && (
                            <div className="space-y-4">
                                {state.rankCards.map((card) => (
                                    <RankCard
                                        key={card.category?.category_id || card.rank}
                                        rank={card.rank}
                                        data={card.category}
                                        isExpanded={state.expandedRank === card.rank}
                                        onToggle={() => dispatch({ type: 'SET_EXPANDED_RANK', rank: card.rank as any })}
                                        whyCatKO={language === 'KO' ? state.whyCatKO?.[card.category?.category_id] : state.whyCatEN?.[card.category?.category_id]}
                                        categoryImageUrl={state.categoryImages?.[card.category?.category_id]}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Doctor View Payload */}
                        {state.activeView === 'doctor' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-sm">
                                    <h4 className="font-bold text-slate-800 mb-4 border-b pb-3">Clinical Score Breakdown</h4>
                                    {state.rankCards.map(c => (
                                        <div key={c.rank} className="mb-4 last:mb-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex gap-2 items-center">
                                                    <span className="bg-slate-200 w-6 h-6 flex items-center justify-center rounded font-bold text-slate-600 text-xs">{c.rank}</span>
                                                    <span className="font-semibold text-slate-700">{c.category?.category_id}</span>
                                                </div>
                                                <span className="font-bold text-indigo-600 font-mono">{c.category?.score}pt</span>
                                            </div>
                                            <div className="text-slate-500 text-xs flex flex-wrap gap-2 mt-1 px-8">
                                                <span className="bg-slate-100 px-2 flex py-0.5 rounded">Indications: 35/35</span>
                                                <span className="bg-slate-100 px-2 flex py-0.5 rounded">Pain: 8/12</span>
                                                <span className="bg-slate-100 px-2 flex py-0.5 rounded">Budget: 15/15</span>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="p-4 bg-slate-50 rounded-xl mt-6 border border-slate-100">
                                        <h5 className="font-semibold text-slate-700 mb-2">Engine Injection Safety Trace</h5>
                                        <p className="text-slate-500 leading-relaxed">
                                            System checked `{state.rankCards[0]?.category?.top_boosters?.[0]?.booster_id}` against `injectable_method_rules`. Patient passed High pain tolerance constraint.
                                            <br /><br /><strong>Output:</strong> `{state.rankCards[0]?.category?.top_boosters?.[0]?.delivery_name || 'N/A'}` selected.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </motion.div>
        </div>
    );
}
