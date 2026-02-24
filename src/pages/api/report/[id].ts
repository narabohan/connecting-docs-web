import { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import { ProtocolRecord, IndicationRecord, DoctorSolutionRecord } from '@/types/airtable';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID || '');

// Constants for Filtering Logic
const PAIN_TOLERANCE_MAP = {
    LOW: ['Prefer minimal pain', '통증은 최대한 피하고 싶음', '痛みはなるべく避けたい'],
    MODERATE: ['Moderate is okay', '약간은 괜찮음', '多少なら大丈夫'],
    HIGH: ['High tolerance', '효과가 좋다면 상관없음']
};

const DOWNTIME_TOLERANCE_MAP = {
    NONE: ['None (Daily life immediately)', '당일~다음날 일상 가능'],
    SHORT: ['Short (3–4 days)', '3–4일 정도'],
    LONG: ['Long (1 week+)', '1주 이상도 괜찮음']
};

// Maps indication keywords to facial treatment zones
function deriveZonesFromIndications(indications: any): string[] {
    if (!indications) return [];
    const indicationList = Array.isArray(indications) ? indications : [String(indications)];
    const zones = new Set<string>();
    indicationList.forEach((ind: string) => {
        const lower = ind.toLowerCase();
        if (/lift|sag|jaw|neck|v.line|contour/i.test(lower)) { zones.add('Jawline'); zones.add('Neck'); }
        if (/firm|elast|cheek|volume|lifting/i.test(lower)) zones.add('Cheek');
        if (/texture|pore|glow|bright|tone/i.test(lower)) { zones.add('Forehead'); zones.add('Cheek'); }
        if (/wrinkle|frown|forehead/i.test(lower)) { zones.add('EyeArea'); zones.add('Forehead'); }
        if (/pigment|melasma|spot|redness|rosacea/i.test(lower)) { zones.add('Cheek'); zones.add('Nose'); }
        if (/eye|eyebag|undereye/i.test(lower)) zones.add('EyeArea');
        if (/nose/i.test(lower)) zones.add('Nose');
    });
    return Array.from(zones);
}

// Types for generic Patient Data structure (abstracted from both Patients_v1 and Users)
interface ParsedPatientContext {
    airtableId: string;
    language: string;
    painTolerance: string;
    downtimeTolerance: string;
    skinThickness: string;
    primaryGoal: string;
    secondaryGoals: string[];
    locations: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid ID' });
    }

    // ── DEMO SHORTCUT ───────────────────────────────────────────────
    if (id === 'demo') {
        const lang = ((req.query.lang as string) || 'EN').toUpperCase();
        return res.status(200).json({
            language: lang,
            patient: {
                id: 'demo', name: 'Guest', language: lang, goals: ['Glass Skin', 'Anti-Aging', 'Pore Refinement'], profile: [
                    { subject: 'Skin Thickness', A: 72, fullMark: 100 },
                    { subject: 'Pain Tolerance', A: 65, fullMark: 100 },
                    { subject: 'Downtime', A: 80, fullMark: 100 },
                    { subject: 'Pigment Risk', A: 55, fullMark: 100 },
                    { subject: 'Aging Stage', A: 60, fullMark: 100 },
                ], simulationData: { primaryIndication: 'Glass Skin', secondaryIndication: 'Anti-Aging', locations: ['Full Face'] }
            },
            logic: { terminalText: `PATIENT_ANALYSIS: COMPLETE\nRISK_FILTER: ACTIVE...`, risks: [] },
            recommendations: [
                { id: 'proto_001', rank: 1, name: 'Ulthera Glass Skin Protocol', matchScore: 95, composition: ['Ulthera', 'Exosome'], description: 'Deep lifting.', tags: ['Zero Downtime', 'Low Pain'], energyDepth: 'smas', isLocked: false },
                { id: 'proto_002', rank: 2, name: 'Genius RF Rebuilder', matchScore: 88, composition: ['Genius RF'], description: 'Collagen synthesis.', tags: ['1-2 Day Downtime'], energyDepth: 'dermis', isLocked: false }
            ]
        });
    }
    // ── END DEMO ─────────────────────────────────────────────────────

    try {
        const queryLang = ((req.query.lang as string) || 'EN').toUpperCase();

        // 1. Caching Check (Reports Table)
        const reportsTable = base('Reports');
        const existingReports = await reportsTable.select({
            filterByFormula: `OR(FIND('${id}', {User_Link}), {Title} = 'Report for User ${id}')`,
            maxRecords: 1,
            sort: [{ field: "Title", direction: "desc" }] // fallback sort
        }).firstPage();

        if (existingReports.length > 0 && req.query.force_refresh !== 'true' && req.query.recalculate !== 'true') {
            const reportJSONStr = existingReports[0].fields.Result_JSON as string;
            if (reportJSONStr) {
                console.log(`Cache hit for Report ID: ${id}`);
                const cachedReport = JSON.parse(reportJSONStr);
                // Dynamically override language if requested differently
                if (cachedReport.language !== queryLang) {
                    cachedReport.language = ['EN', 'KO', 'JP', 'CN'].includes(queryLang) ? queryLang : 'EN';
                }
                return res.status(200).json(cachedReport);
            }
        }

        // 2. Fetch Patient/User Data
        let patientContext: ParsedPatientContext | null = null;
        let pName = 'Guest';
        let dbLang = 'EN';
        let userRecordId = '';
        let isFromUsersTable = false;

        try {
            // First try Patients_v1 table (backward compatibility)
            const patientRecord = await base('Patients_v1').find(id) as any;
            const pFields = patientRecord.fields;
            userRecordId = patientRecord.id;

            dbLang = pFields.language || 'EN';
            const getField = (prefix: string) => pFields[`${prefix}_EN`] || pFields[`${prefix}_KO`] || pFields[`${prefix}_JP`] || pFields[`${prefix}_CN`];

            patientContext = {
                airtableId: patientRecord.id,
                language: dbLang,
                painTolerance: getField('q6_pain_tolerance') || '',
                downtimeTolerance: getField('q6_down_time') || '',
                skinThickness: getField('q4_skin_thickness') || '',
                primaryGoal: pFields.q1_primary_goal_MASTER || "Skin Improvement",
                secondaryGoals: pFields.q1_goal_secondary_MASTER ? [pFields.q1_goal_secondary_MASTER] : [],
                locations: pFields.q_treatment_locations || []
            };
        } catch (e) {
            // If not found in Patients_v1, try finding in Users table by firebase_uid or recordId
            const users = await base('Users').select({
                filterByFormula: `OR(RECORD_ID() = '${id}', {firebase_uid} = '${id}')`,
                maxRecords: 1
            }).firstPage();

            if (users.length > 0) {
                const u = users[0].fields as any;
                userRecordId = users[0].id;
                isFromUsersTable = true;
                pName = u.name || 'User';
                dbLang = u.Language || 'EN';
                // For MVP, if pure User without survey data, use defaults
                patientContext = {
                    airtableId: users[0].id,
                    language: dbLang,
                    painTolerance: 'Moderate is okay',
                    downtimeTolerance: 'Short (3–4 days)',
                    skinThickness: 'Normal',
                    primaryGoal: 'Skin Improvement',
                    secondaryGoals: [],
                    locations: ['Full Face']
                };
            }
        }

        if (!patientContext) {
            console.log(`User ${id} not found in DB. Falling back to default mock profile for demonstration.`);
            patientContext = {
                airtableId: id,
                language: queryLang,
                painTolerance: 'Moderate is okay',
                downtimeTolerance: 'Short (3–4 days)',
                skinThickness: 'Normal',
                primaryGoal: 'Skin Improvement',
                secondaryGoals: [],
                locations: ['Full Face']
            };
        }

        let lang = ['EN', 'KO', 'JP', 'CN'].includes(queryLang) ? queryLang : ['EN', 'KO', 'JP', 'CN'].includes(dbLang) ? dbLang : 'EN';

        // Recalculate parameters overriding
        const isRecalculating = req.query.recalculate === 'true';
        const overridePain = isRecalculating && req.query.pain ? req.query.pain as string : null;
        const overrideDowntime = isRecalculating && req.query.downtime ? req.query.downtime as string : null;

        const { primaryGoal, secondaryGoals, locations } = patientContext;
        const skinThickness = patientContext.skinThickness;
        const painTolerance = overridePain || patientContext.painTolerance;
        const downtimeTolerance = overrideDowntime || patientContext.downtimeTolerance;

        // 3. Fetch Knowledge Base
        const [protocols, indications, doctors] = await Promise.all([
            base('Protocol_block').select().all(),
            base('indication_map').select().all(),
            base('doctor_signiture_solution').select().all()
        ]);

        const protocolRecords = protocols as unknown as ProtocolRecord[];
        const indicationRecords = indications as unknown as IndicationRecord[];
        const doctorRecords = doctors as unknown as DoctorSolutionRecord[];

        // --- DYNAMIC SCORING ENGINE ---

        // Step A: Hard Filter (Only absolutely contraindicated)
        let candidateProtocols = protocolRecords.filter(p => {
            const pPain = p.fields.pain_level || 'Medium';
            const pDowntime = p.fields.downtime_level || 'Medium';

            // Absolute dealbreakers:
            if (painTolerance && PAIN_TOLERANCE_MAP.LOW.some(t => painTolerance.includes(t)) && pPain === 'Very High') return false;
            if (downtimeTolerance && DOWNTIME_TOLERANCE_MAP.NONE.some(t => downtimeTolerance.includes(t)) && ['High', 'Very High'].includes(pDowntime)) return false;

            return true;
        });

        // Match Indication for Score Boost
        const matchedIndication = indicationRecords.find(i => {
            const iName = i.fields.indication_name?.toLowerCase();
            if (!iName || !primaryGoal) return false;
            return iName.includes(primaryGoal.toLowerCase()) || primaryGoal.toLowerCase().includes(iName);
        });

        const linkedProtocolIds = matchedIndication?.fields.Protocol_block || [];

        // Step B: Calculate Scores
        type ScoredProtocol = { proto: ProtocolRecord, score: number };
        const scoredProtocols: ScoredProtocol[] = candidateProtocols.map(p => {
            let score = 50 + (p.id.charCodeAt(p.id.length - 1) % 5); // Base score with slight deterministic noise
            const pPain = p.fields.pain_level || 'Medium';
            const pDowntime = p.fields.downtime_level || 'Medium';

            // 1. Primary Goal Fit (+40)
            if (linkedProtocolIds.includes(p.id)) {
                score += 40;
            } else if (primaryGoal && p.fields.protocol_name?.toLowerCase().includes(primaryGoal.toLowerCase().split(' ')[0])) {
                score += 20; // partial match by name
            }

            // 2. Pain Fit (+10 / -10)
            if (painTolerance && PAIN_TOLERANCE_MAP.LOW.some(t => painTolerance.includes(t))) {
                if (pPain === 'Low') score += 10;
                else if (pPain === 'High') score -= 10;
            } else if (painTolerance && PAIN_TOLERANCE_MAP.HIGH.some(t => painTolerance.includes(t))) {
                if (['High', 'Very High'].includes(pPain)) score += 5; // Tolerable and usually effective
            }

            // 3. Downtime Fit (+10 / -10)
            if (downtimeTolerance && DOWNTIME_TOLERANCE_MAP.NONE.some(t => downtimeTolerance.includes(t))) {
                if (pDowntime === 'Low' || pDowntime === 'None') score += 10;
                else if (pDowntime === 'Medium') score -= 10;
            }

            // Normalize
            score = Math.min(Math.max(score, 60), 99);
            return { proto: p, score };
        });

        // Step C: Sort & Top 3
        scoredProtocols.sort((a, b) => b.score - a.score);
        const topProtocols = scoredProtocols.slice(0, 3);

        // Visual Tie-Breaker (Curve adjustment if data is sparse)
        if (topProtocols.length > 0) {
            topProtocols[0].score = Math.max(topProtocols[0].score, 88);
        }
        if (topProtocols.length > 1) {
            if (topProtocols[1].score >= topProtocols[0].score) topProtocols[1].score = topProtocols[0].score - (3 + (topProtocols[1].proto.id.charCodeAt(0) % 5));
        }
        if (topProtocols.length > 2) {
            if (topProtocols[2].score >= topProtocols[1].score) topProtocols[2].score = topProtocols[1].score - (4 + (topProtocols[2].proto.id.charCodeAt(1) % 5));
            // Ensure visual degradation 
            topProtocols[2].score = Math.min(topProtocols[2].score, topProtocols[1].score - 2);
        }

        // Step D: Map to Response Format
        const recommendations = topProtocols.map((sp, index) => {
            const proto = sp.proto;
            const matchedDoctor = doctorRecords.find(d => d.fields.Protocols && d.fields.Protocols.includes(proto.id));
            const deviceNames = proto.fields["device_name (from device_ids)"] || [];
            const boosterNames = proto.fields["booster_name (from skin_booster_ids)"] || [];

            // Dynamic combination (EBD + Booster)
            const combs = Array.isArray(deviceNames) && Array.isArray(boosterNames)
                ? [...deviceNames, ...boosterNames]
                : [];

            let whySuitableText = "Clinical protocol optimized for your goals.";
            if (primaryGoal && proto.fields.protocol_name?.toLowerCase().includes(primaryGoal.toLowerCase().split(' ')[0])) {
                whySuitableText = `Directly targets your primary goal of ${primaryGoal}.`;
            } else if (matchedIndication?.fields.Protocol_block?.includes(proto.id)) {
                whySuitableText = `Highly recommended for ${primaryGoal} based on clinical data.`;
            }

            return {
                id: proto.id,
                rank: index + 1,
                name: proto.fields.protocol_name || 'Protocol',
                matchScore: Math.round(sp.score),
                composition: deviceNames,
                description: proto.fields.mechanism_action || "Clinical protocol optimized for your goals.",
                tags: [proto.fields.downtime_level ? `${proto.fields.downtime_level} Downtime` : '', proto.fields.pain_level ? `${proto.fields.pain_level} Pain` : ''].filter(Boolean),
                doctor: matchedDoctor ? matchedDoctor.fields : null,
                isLocked: index > 0,
                // Blueprint data: real Airtable target layer + computed face zones
                targetLayers: (proto.fields.target_layer as string[] | string || []),
                faceZones: deriveZonesFromIndications(proto.fields['indication_name (from indications)']),
                // Reason Why Object for Top 3 Detail View
                reasonWhy: {
                    why_suitable: whySuitableText,
                    pain_level: proto.fields.pain_level || 'Medium',
                    downtime_level: proto.fields.downtime_level || 'Medium',
                    combinations: combs
                }
            };
        });

        // Step E: Reason Why Generation
        const REASON_TEMPLATES: Record<string, string> = {
            EN: "Based on your sensitivity ({skin}) and preference for {pain} pain levels, we selected treatments that focus on {goal} while respecting your request for {downtime} downtime.",
            KO: "고객님의 피부 민감도({skin})와 통증 선호도({pain})를 고려하여, {downtime} 다운타임 내에서 {goal} 개선 효과를 극대화할 수 있는 시술을 엄선했습니다.",
            JP: "お客様の肌の敏感さ({skin})と痛みの許容度({pain})に基づき、{downtime}のダウンタイムで{goal}に焦点を当てた治療法を選定しました。",
            CN: "基于您的皮肤敏感度({skin})和疼痛耐受度({pain})，我们选择了专注于{goal}的治疗方案，同时满足您对{downtime}恢复期的要求。"
        };

        const template = REASON_TEMPLATES[lang] || REASON_TEMPLATES['EN'];
        const reasonWhy = template
            .replace('{skin}', String(skinThickness || (lang === 'KO' ? '보통' : 'Normal')))
            .replace('{pain}', String(painTolerance || (lang === 'KO' ? '보통' : 'Standard')))
            .replace('{goal}', String(primaryGoal || (lang === 'KO' ? '피부 개선' : 'Skin Improvement')))
            .replace('{downtime}', String(downtimeTolerance || (lang === 'KO' ? '유연한' : 'manageable')));

        const resultPayload = {
            language: lang,
            patient: {
                id: userRecordId,
                name: pName,
                language: lang,
                goals: [primaryGoal],
                profile: [
                    { subject: 'Pain Safe', A: PAIN_TOLERANCE_MAP.LOW.some(t => painTolerance?.includes(t)) ? 90 : 60, fullMark: 100 },
                    { subject: 'Downtime', A: DOWNTIME_TOLERANCE_MAP.NONE.some(t => downtimeTolerance?.includes(t)) ? 90 : 60, fullMark: 100 },
                    { subject: 'Efficacy', A: topProtocols[0]?.score || 80, fullMark: 100 },
                    { subject: 'Skin Fit', A: 90, fullMark: 100 },
                    { subject: 'Budget', A: 70, fullMark: 100 },
                ],
                simulationData: {
                    primaryIndication: primaryGoal,
                    secondaryIndication: secondaryGoals[0] || null,
                    locations: locations
                }
            },
            logic: {
                terminalText: reasonWhy,
                risks: [
                    { level: "SAFE", factor: "Analyzed Options", description: "Algorithm strictly filtered out contraindicated protocols." }
                ]
            },
            recommendations
        };

        // 4. Save to Reports Table (Cache it!)
        try {
            await reportsTable.create([
                {
                    fields: {
                        Title: `Report for User ${id}`,
                        Input_JSON: JSON.stringify({ goal: primaryGoal, pain: painTolerance, downtime: downtimeTolerance }),
                        Result_JSON: JSON.stringify(resultPayload),
                        ...(isFromUsersTable && userRecordId ? { User_Link: [userRecordId] } : {})
                    }
                }
            ]);
            console.log(`Saved new cached Report for User ${id}`);
        } catch (saveError) {
            console.error('Failed to save report cache to Airtable:', saveError);
        }

        res.status(200).json(resultPayload);

    } catch (error) {
        console.error('Report API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
