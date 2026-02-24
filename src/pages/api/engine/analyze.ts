import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import Airtable from 'airtable';
import { savePatientLog } from '../intelligence/save-log';

// ─── Clients ─────────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

// ─── Protocol Pool Type ───────────────────────────────────────────────────────
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

// ─── Load Protocol Pool from Airtable ────────────────────────────────────────
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
            sessionInterval: String(r.get('session_interval_weeks') || '4 weeks (1M)'),
            notes: String(r.get('notes') || ''),
            isSigniture: Boolean(r.get('is_signiture_solution')),
        })).filter(p => p.name.length > 0);
    } catch (err) {
        console.error('[PROTOCOL_POOL] Failed to load from Airtable:', err);
        return [];
    }
}

// ─── Rule-Based Pre-Filter ───────────────────────────────────────────────────
const PAIN_ORDER = ['None', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
const DOWNTIME_ORDER = ['None', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];

function filterProtocols(protocols: ProtocolRecord[], data: AnalysisRequest): ProtocolRecord[] {
    const painMap: Record<string, string> = {
        'Low': 'Low', 'low': 'Low',
        'Medium': 'Medium', 'medium': 'Medium',
        'High': 'High', 'high': 'High'
    };
    const dtMap: Record<string, string> = {
        'None': 'None', 'none': 'None',
        'Low': 'Low', 'low': 'Low',
        'Medium': 'Medium', 'medium': 'Medium',
        'High': 'High', 'high': 'High'
    };
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

// ─── Fallback Mock (uses real Airtable protocol names) ───────────────────────
const MOCK_RESPONSE = {
    rank1: {
        protocol: "MNRF + Exosome (Glass Skin Booster)",
        score: 91,
        reason: "MNRF micro-channels maximize Exosome growth factor delivery, addressing pore refinement, glow and skin regeneration simultaneously.",
        downtime: "Low (1-3 days redness)",
        pain: "Medium",
        airtableId: "rec5hdvZhPb9AKek6",
        boosters: ["Exosome (ASCE+)"],
        devices: ["Potenza"],
        sessions: 3
    },
    rank2: {
        protocol: "Rejuvelook (Rejuran + Juvelook Layering)",
        score: 85,
        reason: "Korea's top booster combo: Rejuran repairs barrier while Juvelook adds structural collagen and hydration HA.",
        downtime: "Low",
        pain: "Medium",
        airtableId: "reciuh4vqppdirQu7",
        boosters: ["Rejuran Healer", "Juvelook"],
        devices: [],
        sessions: 4
    },
    rank3: {
        protocol: "LaseMD Ultra + Skinvive (Glow Genesis)",
        score: 79,
        reason: "Lunch-time protocol: LaseMD MTZ channels deliver FDA-approved Skinvive HA for 6-month lasting glass skin glow.",
        downtime: "Low",
        pain: "Low",
        airtableId: "recOZuAXwBMeJqPEi",
        boosters: ["Skinvive"],
        devices: ["LaseMD Ultra"],
        sessions: 4
    }
};

// ─── Analysis Request Type ─────────────────────────────────────────────────────
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
};

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const data = req.body as AnalysisRequest;

    if (!process.env.CLAUDE_API_KEY) {
        console.error("CLAUDE_API_KEY is missing");
        return res.status(200).json(MOCK_RESPONSE);
    }

    // ─── Step 1: Load & Filter Protocol Pool from Airtable ─────────────────
    const allProtocols = await loadProtocolPool();
    const filteredProtocols = filterProtocols(allProtocols, data);
    const eligibleProtocols = filteredProtocols.length >= 3 ? filteredProtocols : allProtocols;
    console.log(`[ENGINE] Protocols: total=${allProtocols.length} → eligible=${eligibleProtocols.length}`);

    // ─── Step 2: Build Airtable Context for Claude ──────────────────────────
    const protocolContext = eligibleProtocols.slice(0, 40).map((p, i) => {
        const b = p.boosters.length > 0 ? p.boosters.join(', ') : 'None';
        const d = p.devices.length > 0 ? p.devices.join(', ') : 'None';
        const n = p.notes.length > 120 ? p.notes.substring(0, 120) + '...' : p.notes;
        return `${i + 1}. [ID:${p.id}] "${p.name}" | Pain:${p.painLevel} | Downtime:${p.downtimeLevel} | ${p.sessionsTotal} sessions\n   Boosters: ${b} | Devices: ${d}\n   ${n}`;
    }).join('\n\n');

    try {
        const pt = data;
        // ─── Step 3: Inject Airtable Context into Claude Prompt ──────────
        const systemPrompt = `You are a senior aesthetic dermatologist specializing in Korean medical aesthetics and Asian skin physiology.

CRITICAL RULE: Select Top 3 ONLY from the APPROVED PROTOCOL LIST below. Never invent protocol names.

=== APPROVED PROTOCOLS (Airtable Clinical Database) ===
${protocolContext}
=======================================================

PATIENT PROFILE:
- ${pt.age}, ${pt.gender}, ${pt.country}
- Primary Goal: ${pt.primaryGoal} | Secondary: ${pt.secondaryGoal}
- Concerns: ${pt.areas.join(', ')}${pt.priorityArea ? ` (Priority: ${pt.priorityArea})` : ''}
- Risks: ${pt.risks.join(', ')}${pt.acneStatus ? ` | Acne: ${pt.acneStatus}` : ''}${pt.pigmentType ? ` | Pigment: ${pt.pigmentType.join(', ')}` : ''}
- Skin: ${pt.skinType}${pt.poreType ? ` | Pores: ${pt.poreType}` : ''} | Style: ${pt.treatmentStyle}
- Pain Tolerance: ${pt.painTolerance} | Downtime: ${pt.downtimeTolerance} | Budget: ${pt.budget} | Frequency: ${pt.frequency}
- History: ${pt.treatmentHistory.join(', ')}${pt.historySatisfaction ? ` (Satisfaction: ${pt.historySatisfaction})` : ''}
- Habits: ${pt.careHabits.join(', ')}

RANKING CRITERIA:
1. Indication match (primary goal alignment)
2. Safety first (melasma → no aggressive heat lasers; inflammatory acne → anti-inflammatory protocols first; sensitive skin → low energy)
3. Pain/downtime preference fit
4. EBD+Booster combos earn bonus for complex multi-concern profiles
5. Barrier damage/rosacea/sensitivity concerns → Rejuran/Exosome/Re2O protocols rank higher

OUTPUT (valid JSON only, no markdown wrapper):
{"rank1":{"protocol":"exact name from list","airtableId":"recXXXXXX","score":90,"reason":"cite specific patient data","downtime":"Low","pain":"Medium","boosters":["Exosome"],"devices":["Potenza"],"sessions":3},"rank2":{...same fields...},"rank3":{...same fields...}}`;

        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1800,
            temperature: 0.3,
            system: systemPrompt,
            messages: [
                { role: "user", content: "Analyze this patient and select the Top 3 protocols from the approved list." },
                { role: "assistant", content: "{" }
            ]
        });

        console.log('[ENGINE] Claude response received');

        const rawContent = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const fullJson = "{" + rawContent;
        const jsonMatch = fullJson.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error("Invalid JSON format from Claude");
        }

        const result = JSON.parse(jsonMatch[0]);

        // ─── Step 4: Save to Airtable (If User Authenticated) ──────────────
        if (data.userEmail) {
            try {
                let userId = data.userId;
                if (!userId) {
                    const userRecords = await base('Users').select({
                        filterByFormula: `{email} = '${data.userEmail}'`,
                        maxRecords: 1
                    }).firstPage();
                    if (userRecords.length > 0) userId = String(userRecords[0].id);
                }

                let reportId: string | undefined;

                if (userId) {
                    const reportRecords = await base('Reports').create([
                        {
                            fields: {
                                User: [userId],
                                Input_JSON: JSON.stringify(data),
                                Output_JSON: JSON.stringify(result),
                                Status: 'Completed'
                            }
                        }
                    ]);
                    reportId = reportRecords[0].id;
                    console.log(`[REPORT] Saved for ${data.userEmail} (ID: ${reportId})`);
                    (result as any).reportId = reportId;

                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                    const reportUrl = reportId ? `${baseUrl}/report/${reportId}` : baseUrl;

                    const userHtml = `
                        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050505;color:#fff;padding:32px;border-radius:12px">
                            <h1 style="color:#22d3ee;margin-bottom:8px">Your Skin Analysis Report is Ready 📄</h1>
                            <p style="color:#9ca3af">Based on your skin profile, our Clinical Intelligence Engine has created your personalized treatment plan.</p>
                            <hr style="border-color:#1f2937;margin:24px 0"/>
                            <h2 style="color:#fff;font-size:18px">🏆 Top Recommendation</h2>
                            <p style="color:#22d3ee;font-size:20px;font-weight:bold">${result.rank1?.protocol || 'Personalized Protocol'}</p>
                            <p style="color:#9ca3af">${result.rank1?.reason || ''}</p>
                            <div style="margin-top:24px">
                                <a href="${reportUrl}" style="background:#22d3ee;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">View Full Report →</a>
                            </div>
                            <p style="color:#4b5563;font-size:12px;margin-top:32px">This is an automated message from Connecting Docs</p>
                        </div>
                    `;

                    fetch(`${baseUrl}/api/email/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: data.userEmail,
                            subject: '[Connecting Docs] Your Personal Skin Analysis Report 📄',
                            html: userHtml,
                            data: {
                                userEmail: data.userEmail,
                                primaryGoal: data.primaryGoal,
                                skinType: data.skinType,
                                topProtocol: result.rank1?.protocol,
                                reportId,
                            },
                        }),
                    }).catch(e => console.error('[EMAIL] Failed to send report email:', e));
                }
            } catch (dbError) {
                console.error("Failed to save report to Airtable:", dbError);
            }

            try {
                savePatientLog({
                    sessionId: (result as any).reportId || `session_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    userId: data.userId,
                    userEmail: data.userEmail,
                    tallyData: data,
                    analysisInput: {
                        primaryGoal: data.primaryGoal,
                        secondaryGoal: data.secondaryGoal,
                        areas: data.areas,
                        painTolerance: data.painTolerance,
                        downtimeTolerance: data.downtimeTolerance,
                        budget: data.budget
                    },
                    reportId: (result as any).reportId
                });
            } catch (logError) {
                console.error("Failed to save patient log:", logError);
            }
        }

        res.status(200).json(result);

    } catch (error: any) {
        console.error('[ENGINE] Error:', error);
        res.status(500).json({ error: 'Analysis failed', mock: MOCK_RESPONSE });
    }
}
