/**
 * /api/report-chat
 * ─────────────────────────────────────────────────────────────────────────────
 * Report Copilot — Streaming Q&A endpoint for DeepDiveModal
 *
 * POST body:
 *   { runId: string, question: string, language?: 'KO'|'EN'|'JP'|'CN' }
 *
 * Response: SSE stream  (text/event-stream)
 *   data: { text: "..." }       — incremental tokens
 *   data: { done: true }        — end of stream
 *
 * Context injected into Claude:
 *   1. Recommendation_Run rank1/2/3 category IDs
 *   2. Each category's display name, indication, sessions, budget, booster note
 *   3. Top devices per category (device_name, budget_tier, evidence)
 *   4. Top boosters per category (booster_name, canonical_role, target_layer)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import Anthropic from '@anthropic-ai/sdk';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID!
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Language helper ───────────────────────────────────────────────────────
const LANG_NAME: Record<string, string> = {
    KO: 'Korean',
    EN: 'English',
    JP: 'Japanese',
    CN: 'Mandarin Chinese',
};

// ─── Fetch helpers ─────────────────────────────────────────────────────────

async function fetchCategoryById(categoryId: string) {
    try {
        const recs = await base('EBD_Category')
            .select({
                filterByFormula: `{category_id} = "${categoryId}"`,
                maxRecords: 1,
                fields: [
                    'category_display_name', 'best_primary_indication',
                    'recommended_sessions', 'session_interval_weeks',
                    'budget_tier', 'avg_pain_level', 'avg_downtime',
                    'booster_pairing_note_KO', 'booster_pairing_note_EN',
                    'devices',
                ],
            })
            .all();
        return recs[0] || null;
    } catch {
        return null;
    }
}

async function fetchDevicesForCategory(deviceIds: string[]): Promise<string[]> {
    if (!deviceIds || deviceIds.length === 0) return [];
    try {
        const recs = await base('EBD_Device')
            .select({
                filterByFormula: `FIND(RECORD_ID(), '${deviceIds.join(',')}') > 0`,
                maxRecords: 4,
                fields: ['device_name', 'budget_tier', 'evidence_basis', 'launch_year'],
            })
            .all();
        return recs.map(r =>
            `${r.get('device_name')} (${r.get('budget_tier') || 'Mid'} tier, launched ${r.get('launch_year') || 'N/A'}, evidence: ${r.get('evidence_basis') || 'N/A'})`
        );
    } catch {
        return [];
    }
}

async function fetchBoostersForRoles(roles: string): Promise<string[]> {
    if (!roles) return [];
    try {
        const roleList = roles.split(',').map(s => s.trim());
        const filterFormula = roleList
            .map(r => `{canonical_role} = "${r}"`)
            .join(', ');
        const recs = await base('Skin_booster')
            .select({
                filterByFormula: `OR(${filterFormula})`,
                maxRecords: 4,
                fields: ['booster_name', 'canonical_role', 'injection_target_layer', 'Mechanism'],
            })
            .all();
        return recs.map(r =>
            `${r.get('booster_name')} [${r.get('canonical_role')}] — layer: ${r.get('injection_target_layer') || 'dermis'}`
        );
    } catch {
        return [];
    }
}

// ─── Build context string ──────────────────────────────────────────────────

async function buildPatientContext(runId: string, language: string): Promise<string> {
    // 1. Fetch Recommendation_Run
    let runRec: Airtable.Record<Airtable.FieldSet> | null = null;
    try {
        runRec = await base('Recommendation_Run').find(runId);
    } catch {
        return '(No recommendation data available)';
    }

    const catIds = [
        runRec.get('rank_1_category_id'),
        runRec.get('rank_2_category_id'),
        runRec.get('rank_3_category_id'),
    ].filter(Boolean) as string[];

    const surveyMetaRaw = runRec.get('survey_meta_json');
    let surveyMeta: Record<string, any> = {};
    try { surveyMeta = JSON.parse(String(surveyMetaRaw || '{}')); } catch { }

    const contextLines: string[] = [];

    // 2. Per-rank detail
    for (let i = 0; i < catIds.length; i++) {
        const catRec = await fetchCategoryById(catIds[i]);
        if (!catRec) continue;

        const rank = i + 1;
        const catName = catRec.get('category_display_name');
        const indication = catRec.get('best_primary_indication');
        const sessions = catRec.get('recommended_sessions');
        const interval = catRec.get('session_interval_weeks');
        const budgetTier = catRec.get('budget_tier');
        const painLevel = catRec.get('avg_pain_level');
        const downtime = catRec.get('avg_downtime');
        const boosterNote = language === 'KO'
            ? (catRec.get('booster_pairing_note_KO') || catRec.get('booster_pairing_note_EN'))
            : catRec.get('booster_pairing_note_EN');
        const preferredRoles = String(catRec.get('preferred_booster_roles') || '');

        const deviceIds = (catRec.get('devices') as string[]) || [];
        const deviceDescs = await fetchDevicesForCategory(deviceIds.slice(0, 3));
        const boosterDescs = await fetchBoostersForRoles(preferredRoles);

        contextLines.push(`
RANK ${rank}: ${catName}
  Primary indication: ${indication}
  Recommended sessions: ${sessions} (every ${interval} weeks)
  Budget tier: ${budgetTier} | Pain: ${painLevel} | Downtime: ${downtime}
  Top devices: ${deviceDescs.join(' | ') || 'See clinic'}
  Paired boosters: ${boosterDescs.join(' | ') || 'None specified'}
  Pairing note: ${boosterNote || '—'}
`);
    }

    // 3. Append patient visit context if available
    if (surveyMeta.koreaVisitPlan && surveyMeta.koreaVisitPlan !== 'undecided') {
        const visitMap: Record<string, string> = {
            resident: 'Lives in Korea (full course possible)',
            long: `Visiting Korea for ${surveyMeta.koreaStayDays || '14+'} days`,
            short: `Short visit to Korea (${surveyMeta.koreaStayDays || '≤3'} days)`,
        };
        contextLines.push(`\nPATIENT VISIT STATUS: ${visitMap[surveyMeta.koreaVisitPlan] || 'Unknown'}`);
    }

    return contextLines.join('\n') || '(Context unavailable)';
}

// ─── Main Handler ──────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { runId, question, language = 'EN' } = req.body;

    if (!runId || !question) {
        return res.status(400).json({ error: 'runId and question are required' });
    }

    try {
        // Build context from Airtable
        const patientContext = await buildPatientContext(runId, language);

        const responseLang = LANG_NAME[language] || 'English';

        const systemPrompt = `You are ConnectingDocs AI, a specialized Korean medical aesthetics advisor embedded inside a personalized treatment report.

You are answering a patient's question about their specific AI-generated recommendations. You have access to their exact recommendation results below.

PATIENT'S PERSONALIZED RECOMMENDATIONS:
${patientContext}

RESPONSE GUIDELINES:
- Always respond in ${responseLang}
- Be warm, empathetic, and clinically precise
- Reference the specific treatments recommended above when relevant
- Explain WHY a treatment was recommended for this patient (not generic info)
- Keep answers concise (2-4 sentences), but expand if the question warrants it
- Do not recommend treatments outside what's already in the recommendations unless asked
- Never provide pricing or book appointments — direct to clinic consultation
- If asked about a specific device vs another, compare based on the data above
- Short-stay patients: acknowledge their time constraint and prioritize single-session options`;

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

        // Stream from Claude
        const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 600,
            system: systemPrompt,
            messages: [{ role: 'user', content: String(question) }],
        });

        for await (const chunk of stream) {
            if (
                chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta'
            ) {
                res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
            }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();

    } catch (error: any) {
        console.error('[REPORT CHAT]', error);
        if (!res.headersSent) {
            return res.status(500).json({ error: error.message || 'Internal server error' });
        }
        try { res.end(); } catch { }
    }
}
