import { useEffect } from 'react';
import type { Dispatch } from 'react';

type ModalState = {
    rankCards: any[];
    riskFlag?: any;
    radarScore?: any;
    whyCatKO: Record<string, string>;
    whyCatEN: Record<string, string>;
    boosterDeliveryJson: any;
    categoryImages: Record<string, string>;
    activeView: 'patient' | 'doctor';
    expandedRank: 1 | 2 | 3;
    expandedBoosterIdx: Record<number, number>;
    pollingStatus: 'idle' | 'polling' | 'done' | 'timeout';
    pollingAttempts: number;
};

type ModalAction =
    | { type: 'INIT'; payload: any }
    | { type: 'POLL_SUCCESS'; payload: Partial<ModalState> }
    | { type: 'POLL_TIMEOUT' }
    | { type: 'SET_EXPANDED_RANK'; rank: 1 | 2 | 3 }
    | { type: 'TOGGLE_VIEW' }
    | { type: 'SET_BOOSTER_IDX'; rank: number; idx: number };

export function useAsyncDataPolling(runId: string | undefined, dispatch: Dispatch<ModalAction>) {
    const MAX_ATTEMPTS = 12;
    const BASE_INTERVAL = 5000;

    useEffect(() => {
        if (!runId) return;

        let attempts = 0;
        let timeoutId: NodeJS.Timeout;

        const poll = async () => {
            attempts++;

            try {
                // If it's the first attempt, we also trigger the generation just in case the backend fire-and-forget failed
                if (attempts === 1) {
                    fetch('/api/recommendation/generate-report-content', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ runId, patientId: '' }) // patientDocs will be fetched by ID in worker
                    }).catch(e => console.error('Background trigger error:', e));
                }

                const res = await fetch(`/api/engine/get-run?runId=${runId}`);
                const data = await res.json();

                const isComplete = data.status === 'complete' || (data.why_cat_KO && data.booster_delivery_json);

                dispatch({
                    type: 'POLL_SUCCESS',
                    payload: {
                        whyCatKO: data.why_cat_KO ? JSON.parse(data.why_cat_KO) : undefined,
                        whyCatEN: data.why_cat_EN ? JSON.parse(data.why_cat_EN) : undefined,
                        boosterDeliveryJson: data.booster_delivery_json ? JSON.parse(data.booster_delivery_json) : undefined,
                        categoryImages: data.category_image_urls ? JSON.parse(data.category_image_urls) : undefined,
                        pollingStatus: isComplete ? 'done' : 'polling',
                        radarScore: data.radar_score_json ? JSON.parse(data.radar_score_json) : undefined,
                    }
                });

                if (!isComplete && attempts < MAX_ATTEMPTS) {
                    const delay = attempts <= 2 ? BASE_INTERVAL : BASE_INTERVAL + (attempts - 2) * 2000;
                    timeoutId = setTimeout(poll, delay);
                } else if (!isComplete) {
                    dispatch({ type: 'POLL_TIMEOUT' });
                }
            } catch (err) {
                if (attempts < MAX_ATTEMPTS) {
                    timeoutId = setTimeout(poll, BASE_INTERVAL);
                } else {
                    dispatch({ type: 'POLL_TIMEOUT' });
                }
            }
        };

        // start after brief delay
        timeoutId = setTimeout(poll, 2000);

        return () => clearTimeout(timeoutId);
    }, [runId, dispatch]);
}

export type { ModalState, ModalAction };
