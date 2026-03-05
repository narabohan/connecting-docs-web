/**
 * /api/engine/analyze  — V3 Fast (Async Architecture)
 * ─────────────────────────────────────────────────────
 * Step 1 (this file, ~1-2s):
 *   - Save survey data to Recommendation_Run (status='processing')
 *   - Return { runId } immediately to client
 *   - Trigger Netlify Background Function for Claude call
 *
 * Step 2 (analyze-clinical-background, up to 15min):
 *   - Fetches all Airtable knowledge bases
 *   - Calls Claude Opus
 *   - Updates Recommendation_Run with V3 results + status='completed'
 *
 * Client (/report/[id].tsx) polls every 5s until data is ready.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import { savePatientLog } from '../intelligence/save-log';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);
const TBL_RECOMMENDATION_RUN = 'tblAv5eoTae4Al5zy';

export type AnalysisRequest = {
    primaryGoal?: string;
    secondaryGoal?: string;
    budget?: string;
    userId?: string;
    userEmail?: string;
    language?: string;
    [key: string]: unknown;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const surveyData: AnalysisRequest = req.body;

        // ─── Step 1: Create Recommendation_Run record (status=processing) ───
        let runId: string;
        try {
            const rrRec = await base(TBL_RECOMMENDATION_RUN).create([{
                fields: {
                    survey_meta_json: JSON.stringify(surveyData),
                    status: 'processing',
                }
            }]);
            runId = rrRec[0].id;
        } catch (airtableErr) {
            console.error('[Analyze] Airtable create failed:', airtableErr);
            return res.status(500).json({ error: 'Failed to create analysis record' });
        }

        // ─── Step 2: Trigger Netlify Background Function (fire-and-forget) ──
        // Background function runs up to 15 minutes — no timeout issue
        const netlifyUrl = process.env.URL || process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;
        const bgUrl = `${netlifyUrl}/.netlify/functions/analyze-clinical-background`;

        // Fire without awaiting — client already has runId
        fetch(bgUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ runId }),
        }).catch(e => console.warn('[Analyze] BG trigger failed (will retry on next poll):', e));

        // 800ms grace window to ensure the fetch request is fully initiated
        // (TCP handshake + header send must complete before Lambda exits)
        await new Promise(r => setTimeout(r, 800));

        // ─── Step 3: Log & return runId immediately ──────────────────────────
        try {
            savePatientLog({
                sessionId: runId,
                timestamp: new Date().toISOString(),
                userId: surveyData.userId,
                userEmail: surveyData.userEmail,
                tallyData: surveyData,
                analysisInput: {
                    primaryGoal: surveyData.primaryGoal,
                    secondaryGoal: surveyData.secondaryGoal,
                    budget: surveyData.budget,
                },
                reportId: runId,
            });
        } catch (logErr) {
            console.warn('[Analyze] Log failed (non-critical):', logErr);
        }

        return res.status(200).json({
            runId,
            reportId: runId,   // backward-compat alias
            status: 'processing',
        });

    } catch (error: any) {
        console.error('[Analyze] Unexpected error:', error);
        return res.status(500).json({ error: '분석 시작 중 오류가 발생했습니다.' });
    }
}
