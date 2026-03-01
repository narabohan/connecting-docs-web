import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import Airtable from 'airtable';
import { savePatientLog } from '../intelligence/save-log';

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

// ─── Currently Trending Treatments (updated seasonally) ─────────────────────
// These are treatments patients actively search for / have heard of.
// RANK 2 must always be one of these (or most similar available).
const TRENDING_TREATMENTS_2025 = [
    'Titanium Lifting',
    'Titanium RF',
    'Pico Genesis',
    'PicoWay',
    'Salmon DNA',
    'Salmon PDRN',
    'Rejuran',
    'Skinvive',
    'Juvelook',
    'Polynucleotide',
    'Thread Lift',
    'PDO Thread',
    'Morpheus8',
    'Potenza',
    'Ultraformer',
    'LaseMD Ultra',
    'Exosome',
    'ASCE+',
    'PN Therapy',
    'MTS Stamp',
    'Aqua Booster',
];

type ProtocolRecord = {
    id: string;
    name: string;
    painLevel: string;
    downtimeLevel: string;
    targetLayer: string[];
    boosters: string[];
    devices: string[];
    sessionsTotal: number;
    sessionInterval: string;
    notes: string;
    isSigniture: boolean;
};

async function loadProtocolPool(): Promise<ProtocolRecord[]> {
    try {
        const records = await base('Protocol_block').select({
            fields: [
                'protocol_name', 'pain_level', 'downtime_level',
                'target_layer', 'booster_name (from skin_booster_ids)',
                'device_name (from device_ids)', 'sequence_steps',
                'sessions_total', 'session_interval_weeks', 'notes',
                'is_signiture_solution'
            ]
        }).all();

        return records.map(r => ({
            id: r.id,
            name: String(r.get('protocol_name') || ''),
            painLevel: String(r.get('pain_level') || 'Medium'),
            downtimeLevel: String(r.get('downtime_level') || 'Low'),
            targetLayer: (r.get('target_layer') as string[] || []),
            boosters: (r.get('booster_name (from skin_booster_ids)') as string[] || []),
            devices: (r.get('device_name (from device_ids)') as string[] || []),
            sessionsTotal: Number(r.get('sessions_total') || 3),
            sessionInterval: String(r.get('session_interval_weeks') || '4 weeks'),
            notes: String(r.get('notes') || ''),
            isSigniture: Boolean(r.get('is_signiture_solution')),
        })).filter(p => p.name.length > 0);
    } catch (err) {
        console.error('[PROTOCOL_POOL] Failed:', err);
        return [];
    }
}

const PAIN_ORDER = ['None', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
const DOWNTIME_ORDER = ['None', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];

function filterProtocols(protocols: ProtocolRecord[], data: AnalysisRequest): ProtocolRecord[] {
    const painMap: Record<string, string> = { 'Low': 'Low', 'low': 'Low', 'Medium': 'Medium', 'medium': 'Medium', 'High': 'High', 'high': 'High' };
    const dtMap: Record<string, string> = { 'None': 'None', 'none': 'None', 'Low': 'Low', 'low': 'Low', 'Medium': 'Medium', 'medium': 'Medium', 'High': 'High', 'high': 'High' };
    const maxPain = painMap[data.painTolerance] || 'High';
    const maxDt = dtMap[data.downtimeTolerance] || 'Medium';
    const maxPainIdx = PAIN_ORDER.indexOf(maxPain);
    const maxDtIdx = DOWNTIME_ORDER.indexOf(maxDt);
    return protocols.filter(p => {
        const pIdx = PAIN_ORDER.indexOf(p.painLevel);
        const dIdx = DOWNTIME_ORDER.indexOf(p.downtimeLevel);
        return (pIdx === -1 || pIdx <= maxPainIdx) && (dIdx === -1 || dIdx <= maxDtIdx);
    });
}

// ─── Analysis Request Type ─────────────────────────────────────────────────
type AnalysisRequest = {
    age: string;
    gender: string;
    country: string;
    primaryGoal: string;
    secondaryGoal: string;
    risks: string[];
    acneStatus?: string;
    pigmentType?: string[];
    areas: string[];
    poreType?: string;
    priorityArea?: string;
    skinType: string;
    treatmentStyle: string;
    volumePreference?: string;
    painTolerance: string;
    downtimeTolerance: string;
    budget: string;
    frequency: string;
    treatmentHistory: string[];
    historySatisfaction?: string;
    careHabits: string[];
    userId?: string;
    userEmail?: string;
    language?: 'KO' | 'EN' | 'CN' | 'JP';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const data = req.body as AnalysisRequest;

    if (!process.env.CLAUDE_API_KEY) {
        console.error('[ENGINE] CLAUDE_API_KEY missing — returning mock');
        return res.status(200).json(buildMockResponse(data));
    }

    const allProtocols = await loadProtocolPool();
    const filteredProtocols = filterProtocols(allProtocols, data);
    const eligibleProtocols = filteredProtocols.length >= 3 ? filteredProtocols : allProtocols;

    // Identify trending protocols available in this patient's pool
    const trendingAvailable = eligibleProtocols.filter(p =>
        TRENDING_TREATMENTS_2025.some(t => p.name.toLowerCase().includes(t.toLowerCase()) ||
            p.devices.some(d => d.toLowerCase().includes(t.toLowerCase())) ||
            p.boosters.some(b => b.toLowerCase().includes(t.toLowerCase())))
    );

    const protocolContext = eligibleProtocols.slice(0, 40).map((p, i) => {
        const b = p.boosters.length > 0 ? p.boosters.join(', ') : 'None';
        const d = p.devices.length > 0 ? p.devices.join(', ') : 'None';
        const isTrending = TRENDING_TREATMENTS_2025.some(t =>
            p.name.toLowerCase().includes(t.toLowerCase()) ||
            d.toLowerCase().includes(t.toLowerCase()) ||
            b.toLowerCase().includes(t.toLowerCase())
        );
        const n = p.notes.length > 100 ? p.notes.substring(0, 100) + '...' : p.notes;
        return `${i + 1}. [ID:${p.id}]${isTrending ? ' [TRENDING-2025]' : ''} "${p.name}" | Pain:${p.painLevel} | DT:${p.downtimeLevel} | ${p.sessionsTotal}x sessions\n   Devices: ${d} | Boosters: ${b}\n   ${n}`;
    }).join('\n\n');

    const trendingContext = trendingAvailable.length > 0
        ? `\nTRENDING PROTOCOLS AVAILABLE: ${trendingAvailable.map(p => `"${p.name}"`).join(', ')}`
        : '\nNote: No clearly trending protocol found — use the most publicly-known one available.';

    try {
        const pt = data;
        const lang = pt.language || 'EN';

        const summaryInstruction = lang === 'KO'
            ? '한국어로 환자 요약을 작성하세요 (2-3문장).'
            : lang === 'JP'
            ? '日本語で患者サマリーを記述してください（2〜3文）。'
            : lang === 'CN'
            ? '请用中文写患者摘要（2-3句话）。'
            : 'Write patient summary in English (2-3 sentences).';

        const systemPrompt = `You are a senior aesthetic dermatologist specializing in Korean medical aesthetics and global skin care trends.

CRITICAL RULES:
1. Select Top 3 ONLY from the APPROVED PROTOCOL LIST below. Never invent protocol names.
2. RANK ASSIGNMENT RULES — follow strictly:
   - RANK 1 (No.1 Clinical Fit): The most medically appropriate protocol for this patient's primary goal, optimizing for safety and efficacy. This is your pure clinical recommendation — the patient may or may not have heard of it, but it IS the best match.
   - RANK 2 (No.2 Trending Match): MUST be a currently trending treatment that the patient is eligible for (pain/downtime within tolerance). Choose from [TRENDING-2025] marked protocols. Patients recognize trending names (Titanium Lifting, Pico, Rejuran, etc.) and feel validated when they see them. If no trending protocol is eligible, pick the most publicly known one.
   - RANK 3 (No.3 Stretch Goal): A protocol that would be achievable if the patient increased their pain or downtime tolerance by ONE level. Show them what's possible. This creates aspiration. It may be slightly outside their current stated tolerance.

=== APPROVED PROTOCOLS (Airtable Database) ===
${protocolContext}
${trendingContext}
==============================================

PATIENT PROFILE:
- ${pt.age}, ${pt.gender}, ${pt.country}
- Primary Goal: ${pt.primaryGoal} | Secondary: ${pt.secondaryGoal}
- Concerns/Areas: ${pt.areas.join(', ')}${pt.priorityArea ? ` (Priority: ${pt.priorityArea})` : ''}
- Risks: ${pt.risks.join(', ') || 'None'}${pt.acneStatus ? ` | Acne: ${pt.acneStatus}` : ''}${pt.pigmentType ? ` | Pigment: ${pt.pigmentType.join(', ')}` : ''}
- Skin: ${pt.skinType}${pt.poreType ? ` | Pores: ${pt.poreType}` : ''} | Style: ${pt.treatmentStyle}
- Pain Tolerance: ${pt.painTolerance} | Downtime: ${pt.downtimeTolerance} | Budget: ${pt.budget} | Frequency: ${pt.frequency}
- History: ${pt.treatmentHistory.join(', ') || 'None'}${pt.historySatisfaction ? ` (Satisfaction: ${pt.historySatisfaction})` : ''}
- Habits: ${pt.careHabits.join(', ') || 'None'}

CLINICAL SELECTION CRITERIA:
1. Indication match (primary goal alignment) — most important
2. Safety filters (melasma → no aggressive heat; inflammatory acne → anti-inflammatory first; sensitive → low energy)
3. Pain/downtime preference fit
4. EBD+Booster combos earn bonus for multi-concern profiles
5. For RANK 2: must pick a [TRENDING-2025] protocol that patient qualifies for
6. For RANK 3: can exceed patient's stated tolerance by 1 level if significantly more effective

PATIENT SUMMARY INSTRUCTION: ${summaryInstruction}
Write a 2-3 sentence clinical profile summary explaining: (1) who this patient is clinically, (2) what their key constraints are, (3) what treatment approach they need. Be specific, mention their actual goals and tolerances.

OUTPUT — valid JSON only, no markdown:
{
  "patientSummary": "2-3 sentence clinical profile",
  "rank1": {"protocol":"exact name","airtableId":"recXXX","score":90,"reason":"cite specific patient data points","rankRationale":"Why this is the best clinical fit","downtime":"Low","pain":"Medium","boosters":["name"],"devices":["name"],"sessions":3},
  "rank2": {"protocol":"exact trending name","airtableId":"recXXX","score":83,"reason":"...","rankRationale":"This is a trending treatment you've likely heard of — here's why it works for you","downtime":"Low","pain":"Low","boosters":[],"devices":["name"],"sessions":3},
  "rank3": {"protocol":"exact name","airtableId":"recXXX","score":76,"reason":"...","rankRationale":"If you can tolerate slightly more [pain/downtime], this achieves significantly better results","downtime":"Medium","pain":"Medium","boosters":[],"devices":["name"],"sessions":4}
}`;

        const msg = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2000,
            temperature: 0.6,
            system: systemPrompt,
            messages: [
                { role: 'user', content: 'Analyze this patient and assign the Top 3 protocols following the RANK ASSIGNMENT RULES exactly.' },
                { role: 'assistant', content: '{' }
            ]
        });

        const rawContent = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const fullJson = '{' + rawContent;
        const jsonMatch = fullJson.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid JSON from Claude');

        const result = JSON.parse(jsonMatch[0]);
        console.log('[ENGINE] Claude result:', JSON.stringify(result).substring(0, 200));

        // ─── Save & Email ──────────────────────────────────────────────────
        if (data.userEmail) {
            try {
                let userId = data.userId;
                if (!userId) {
                    const userRecords = await base('Users').select({
                        filterByFormula: `{email} = '${data.userEmail}'`, maxRecords: 1
                    }).firstPage();
                    if (userRecords.length > 0) userId = String(userRecords[0].id);
                }

                let reportId: string | undefined;
                if (userId) {
                    const reportRecords = await base('Reports').create([{ fields: {
                        User: [userId],
                        Input_JSON: JSON.stringify(data),
                        Output_JSON: JSON.stringify(result),
                        Status: 'Completed'
                    }}]);
                    reportId = reportRecords[0].id;
                    (result as any).reportId = reportId;

                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://connectingdocs.ai';
                    const reportUrl = `${baseUrl}/report/${reportId}`;
                    const patientSummary = result.patientSummary || '';

                    // Rich email with all 3 recommendations
                    const rankBadge = (n: number) => ['🥇', '🥈', '🥉'][n - 1];
                    const rankTitle = (n: number) => ['No.1 Clinical Fit', 'No.2 Trending Match', 'No.3 Stretch Goal'][n - 1];
                    const rankRow = (rank: any, n: number) => rank ? `
                        <div style="margin-bottom:16px;padding:16px;border-radius:8px;background:#0a1a10;border:1px solid #1a3a22">
                            <div style="color:#00FF88;font-size:12px;font-weight:bold;margin-bottom:6px">${rankBadge(n)} ${rankTitle(n)}</div>
                            <div style="color:#fff;font-size:16px;font-weight:bold;margin-bottom:6px">${rank.protocol || ''}</div>
                            <div style="color:#9ca3af;font-size:13px;margin-bottom:6px">${rank.reason || ''}</div>
                            <div style="color:#4b5563;font-size:11px">Pain: ${rank.pain || '?'} | Downtime: ${rank.downtime || '?'} | ${rank.sessions || 3} sessions</div>
                            ${rank.devices?.length ? `<div style="color:#22d3ee;font-size:11px;margin-top:4px">Devices: ${rank.devices.join(', ')}</div>` : ''}
                            ${rank.boosters?.length ? `<div style="color:#a78bfa;font-size:11px">Boosters: ${rank.boosters.join(', ')}</div>` : ''}
                        </div>` : '';

                    const userHtml = `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#050505;color:#fff;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#00FF88,#22d3ee);padding:4px 0"></div>
  <div style="padding:32px">
    <div style="color:#00FF88;font-size:11px;font-weight:bold;letter-spacing:0.2em;margin-bottom:8px">CONNECTING DOCS · CLINICAL INTELLIGENCE</div>
    <h1 style="color:#fff;font-size:24px;font-weight:bold;margin:0 0 8px">Your Skin Analysis Report is Ready</h1>
    <p style="color:#6b7280;font-size:13px;margin:0 0 24px">Our AI engine has analyzed your skin profile and selected 3 personalized protocols.</p>

    ${patientSummary ? `<div style="background:#0a1a10;border:1px solid #1a3a22;border-radius:8px;padding:16px;margin-bottom:24px">
      <div style="color:#00FF88;font-size:10px;font-weight:bold;letter-spacing:0.15em;margin-bottom:8px">CLINICAL PROFILE</div>
      <p style="color:#d1d5db;font-size:13px;line-height:1.6;margin:0">${patientSummary}</p>
    </div>` : ''}

    <div style="margin-bottom:24px">
      <div style="color:#9ca3af;font-size:10px;font-weight:bold;letter-spacing:0.15em;margin-bottom:12px">YOUR PERSONALIZED PROTOCOLS</div>
      ${rankRow(result.rank1, 1)}
      ${rankRow(result.rank2, 2)}
      ${rankRow(result.rank3, 3)}
    </div>

    <a href="${reportUrl}" style="display:block;background:linear-gradient(135deg,#00FF88,#22d3ee);color:#000;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;text-align:center">View Full Interactive Report →</a>
    <p style="color:#374151;font-size:11px;margin-top:24px;text-align:center">Connecting Docs · connectingdocs.ai</p>
  </div>
  <div style="background:linear-gradient(135deg,#00FF88,#22d3ee);padding:2px 0"></div>
</div>`;

                    const baseUrlForFetch = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                    fetch(`${baseUrlForFetch}/api/email/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: data.userEmail,
                            subject: '[Connecting Docs] Your Personal Skin Analysis Report is Ready 📊',
                            html: userHtml,
                            data: { userEmail: data.userEmail, primaryGoal: data.primaryGoal, skinType: data.skinType, topProtocol: result.rank1?.protocol, reportId },
                        }),
                    }).catch(e => console.error('[EMAIL] Failed:', e));

                    if (process.env.MAKE_WEBHOOK_URL) {
                        fetch(process.env.MAKE_WEBHOOK_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ event: 'new_report_generated', userEmail: data.userEmail, reportId, topProtocol: result.rank1?.protocol, primaryGoal: data.primaryGoal, budget: data.budget, language: data.language ?? 'EN' }),
                        }).catch(e => console.error('[WEBHOOK] Failed:', e));
                    }
                }
            } catch (dbError) {
                console.error('[DB] Failed to save report:', dbError);
            }

            try {
                savePatientLog({
                    sessionId: (result as any).reportId || `session_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    userId: data.userId,
                    userEmail: data.userEmail,
                    tallyData: data,
                    analysisInput: { primaryGoal: data.primaryGoal, secondaryGoal: data.secondaryGoal, areas: data.areas, painTolerance: data.painTolerance, downtimeTolerance: data.downtimeTolerance, budget: data.budget },
                    reportId: (result as any).reportId
                });
            } catch (logError) { console.error('[LOG] Failed:', logError); }
        }

        res.status(200).json(result);

    } catch (error: any) {
        console.error('[ENGINE] Error:', error);
        res.status(200).json(buildMockResponse(data));
    }
}

// ─── Dynamic mock (varies by patient profile) ────────────────────────────────
function buildMockResponse(data: AnalysisRequest) {
    const isLowPain = data.painTolerance === 'Low';
    const isLowDT = data.downtimeTolerance === 'None' || data.downtimeTolerance === 'Low';
    const lang = data.language || 'EN';

    const summary = lang === 'KO'
        ? `${data.age || '?'} ${data.gender || ''} 환자로 ${data.primaryGoal || '피부 개선'}을 원하시며, ${isLowPain ? '낮은 통증' : '중간 통증'}과 ${isLowDT ? '최소 다운타임' : '단기 다운타임'}을 선호합니다. 현재 ${data.areas?.join(', ') || '전체 얼굴'} 부위에 집중 개선이 필요합니다.`
        : `${data.age || '?'} ${data.gender || ''} patient seeking ${data.primaryGoal || 'skin improvement'} with ${isLowPain ? 'low pain' : 'medium pain'} and ${isLowDT ? 'minimal downtime' : 'short downtime'} preferences. Focus areas: ${data.areas?.join(', ') || 'full face'}.`;

    const r1 = isLowPain && isLowDT
        ? { protocol: 'MNRF + Exosome (Glass Skin Booster)', score: 91, reason: 'MNRF micro-channels maximize Exosome delivery with minimal discomfort.', downtime: 'Low (1-2 days redness)', pain: 'Low', airtableId: 'rec5hdvZhPb9AKek6', boosters: ['Exosome (ASCE+)'], devices: ['Potenza'], sessions: 3 }
        : { protocol: 'Morpheus8 + Rejuran', score: 90, reason: 'Deep fractional RF with PDRN repair booster for comprehensive rejuvenation.', downtime: 'Medium (3-4 days)', pain: 'Medium', airtableId: 'recMorpheus8', boosters: ['Rejuran Healer'], devices: ['Morpheus8'], sessions: 3 };

    const r2 = isLowDT
        ? { protocol: 'LaseMD Ultra + Skinvive (Glow Genesis)', score: 83, reason: "FDA-approved Skinvive HA via LaseMD channels — 2025's most talked-about glass skin combo.", downtime: 'Low (1 day)', pain: 'Low', airtableId: 'recOZuAXwBMeJqPEi', boosters: ['Skinvive'], devices: ['LaseMD Ultra'], sessions: 4 }
        : { protocol: 'Titanium Lifting + Juvelook', score: 84, reason: '2025 trending titanium RF with structural HA booster — the treatment everyone is talking about.', downtime: 'Low', pain: 'Low', airtableId: 'recTitaniumLifting', boosters: ['Juvelook'], devices: ['Titanium RF'], sessions: 3 };

    const r3 = { protocol: 'Genius RF Rebuilder', score: 76, reason: 'Highest efficacy collagen synthesis — consider this if you can handle medium pain for dramatically better results.', downtime: 'Medium (2-3 days)', pain: 'Medium', airtableId: 'recGenius', boosters: [], devices: ['Genius RF'], sessions: 3 };

    return {
        patientSummary: summary,
        rank1: { ...r1, rankRationale: 'Best clinical match for your primary goal and skin profile.' },
        rank2: { ...r2, rankRationale: "This is a trending 2025 treatment you've likely heard of — and it works for you." },
        rank3: { ...r3, rankRationale: 'Consider this if you can accept slightly more discomfort — the results are significantly stronger.' }
    };
}
