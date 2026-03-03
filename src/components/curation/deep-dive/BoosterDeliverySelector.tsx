import React, { useState } from 'react';
import { BoosterDeliveryItem } from '@/types/airtable';

// Minimal Tooltip - Can be replaced with Radix UI or Framer Motion tooltip later
const Tooltip: React.FC<{ content: string }> = ({ content }) => (
    <span className="group relative z-10 inline-block cursor-help ml-1">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-xs font-bold">?</span>
        <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg text-center">
            {content}
        </span>
    </span>
);

const PAIN_SCORE_MAP: Record<string, number> = {
    'None': 1, 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5
};

const PainDots: React.FC<{ score: number; max?: number }> = ({ score, max = 5 }) => {
    return (
        <div className="flex gap-1 items-center">
            <span className="text-xs text-slate-500 mr-1">통증</span>
            {[...Array(max)].map((_, i) => (
                <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < score ? (score >= 4 ? 'bg-red-400' : 'bg-emerald-400') : 'bg-slate-200'}`}
                />
            ))}
        </div>
    );
};

export const DeliveryMethodCard: React.FC<{
    deliveryName: string;
    painLevel?: string;
    isSafetyRequired?: boolean;
    safetyReason?: string | null;
}> = ({ deliveryName, painLevel = 'Medium', isSafetyRequired, safetyReason }) => {
    const painScore = PAIN_SCORE_MAP[painLevel] ?? 3;

    return (
        <div className={`mt-3 p-3 rounded-md border text-sm flex max-sm:flex-col items-start sm:items-center justify-between gap-2 ${isSafetyRequired ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                <span className="font-medium text-slate-700">{deliveryName}</span>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
                <PainDots score={painScore} />
                {isSafetyRequired && (
                    <div className="flex items-center text-xs text-orange-600 font-medium">
                        🛡️ 안전 프로토콜 적용
                        {safetyReason && <Tooltip content={safetyReason} />}
                    </div>
                )}
            </div>
        </div>
    );
};

export const SessionInfo: React.FC<{
    sessions?: number | null;
    intervalWeeks?: number | null;
}> = ({ sessions, intervalWeeks }) => {
    if (!sessions) return null;

    return (
        <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-blue-50/50 text-blue-800 rounded-md text-sm">
            <span className="text-xl">📅</span>
            <span>
                권장 <strong>{sessions}회</strong> 코스
                {intervalWeeks && (
                    <> <span className="text-blue-300 mx-1">•</span> <strong>{intervalWeeks}주</strong> 간격</>
                )}
            </span>
        </div>
    );
};

const CARE_BADGE_MAP: Record<string, string> = {
    'Recovery': '회복 가속',
    'PostCare_Recovery': '회복 가속',
    'Inflammation_Control': '염증 완화',
    'PrePostCare_Support': '피부 사전 보호',
};

export const SupportingCareChips: React.FC<{
    items: { supportcare_id: string; supportcare_name: string; canonical_role: string }[];
}> = ({ items }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">✨ 보조 케어 제안</div>
            <div className="flex flex-wrap gap-2">
                {items.map(item => (
                    <span key={item.supportcare_id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                        {item.supportcare_name}
                        {CARE_BADGE_MAP[item.canonical_role] && (
                            <span className="opacity-60 font-normal">({CARE_BADGE_MAP[item.canonical_role]})</span>
                        )}
                    </span>
                ))}
            </div>
        </div>
    );
};

export const BoosterDeliverySelector: React.FC<{
    boosters: BoosterDeliveryItem[];
    pairingNote?: string | null;
}> = ({ boosters, pairingNote }) => {
    const [selectedIdx, setSelectedIdx] = useState(0);
    if (!boosters || boosters.length === 0) return null;

    const selected = boosters[selectedIdx];

    return (
        <div className="mt-5 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <span className="text-lg">💉</span> 추천 스킨부스터
            </h4>

            {boosters.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
                    {boosters.map((b, i) => (
                        <button
                            key={b.booster_id}
                            onClick={() => setSelectedIdx(i)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${i === selectedIdx ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {b.booster_name} <span className="opacity-70 font-normal ml-1">({b.canonical_role})</span>
                        </button>
                    ))}
                </div>
            )}

            {selected && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-sm text-slate-600 mb-2">
                        <span className="font-medium">타겟 주입층:</span> {selected.injection_target_layer || '진피층'}
                    </div>

                    <DeliveryMethodCard
                        deliveryName={selected.delivery_name}
                        painLevel={selected.delivery_pain_level}
                        isSafetyRequired={selected.is_safety_required}
                        safetyReason={selected.safety_reason_KO}
                    />

                    {pairingNote && (
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600 leading-relaxed border-l-2 border-l-indigo-400">
                            <span className="font-semibold text-indigo-700 block mb-1">시너지 효과</span>
                            {pairingNote}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
