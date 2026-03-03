import React from 'react';
import { CategoryRankResult, DeviceSummary } from '@/types/airtable';
import { BoosterDeliverySelector, SessionInfo, SupportingCareChips } from './BoosterDeliverySelector';

// ─── Skeleton loaders ─────────────────────────────────────────────────────
const CategoryImageSkeleton = () => (
    <div className="w-16 h-16 bg-slate-200 animate-pulse rounded-lg border border-slate-100 flex-shrink-0" />
);

const TextSkeleton = ({ lines = 2 }: { lines?: number }) => (
    <div className="space-y-2 mt-2">
        {[...Array(lines)].map((_, i) => (
            <div key={i} className={`h-4 bg-slate-200 animate-pulse rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
    </div>
);

// ─── Device mini-list ─────────────────────────────────────────────────────
const DeviceSelector: React.FC<{ devices?: DeviceSummary[] }> = ({ devices }) => {
    if (!devices || devices.length === 0) return null;
    return (
        <div className="mt-4">
            <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">⚡ 장비 옵션</div>
            <div className="flex gap-2 flex-wrap">
                {devices.map((d, i) => (
                    <div
                        key={d.device_id || i}
                        className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-700 font-medium"
                    >
                        {d.device_name || d.device_id}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Main RankCard ─────────────────────────────────────────────────────────
interface RankCardProps {
    rank: number;
    data: CategoryRankResult;
    isExpanded: boolean;
    onToggle: () => void;
    whyCatKO?: string;
    categoryImageUrl?: string;
}

export const RankCard: React.FC<RankCardProps> = ({
    rank, data, isExpanded, onToggle, whyCatKO, categoryImageUrl
}) => {
    if (!data) return null;

    const displayName = (data.category_id ?? `시술 ${rank}번`).replace(/_/g, ' ');

    return (
        <div className={`overflow-hidden transition-all duration-300 border rounded-2xl mb-4 ${isExpanded
                ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-50'
                : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'}`}
        >
            {/* Header — always visible */}
            <div
                className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none transition-colors ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                onClick={onToggle}
            >
                <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold shadow-sm ${rank === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                    >
                        {rank}
                    </div>

                    {categoryImageUrl
                        ? <img src={categoryImageUrl} alt={displayName} className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm" />
                        : <CategoryImageSkeleton />
                    }

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight capitalize">
                            {displayName}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5">
                            <div className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                적합도 {data.score ?? '--'}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'bg-indigo-100 rotate-180' : 'bg-slate-100'}`}>
                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Body — expanded only */}
            {isExpanded && (
                <div className="p-4 sm:p-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">

                    {/* Why Text */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed text-sm">
                        {whyCatKO ? <p>{whyCatKO}</p> : <TextSkeleton lines={3} />}
                    </div>

                    <DeviceSelector devices={data.top_devices} />

                    <BoosterDeliverySelector
                        boosters={data.top_boosters ?? []}
                        pairingNote={data.booster_pairing_note_KO}
                    />

                    <SessionInfo
                        sessions={data.recommended_sessions}
                        intervalWeeks={data.session_interval_weeks}
                    />

                    <SupportingCareChips items={data.recommended_supporting_care ?? []} />
                </div>
            )}
        </div>
    );
};
