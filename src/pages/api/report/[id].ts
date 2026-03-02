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

        // Match Indication for Score Boost - More flexible matching
        const matchedIndications = indicationRecords.filter(i => {
            const iName = i.fields.indication_name?.toLowerCase() || '';
            if (!iName || !primaryGoal) return false;

            const goalLower = primaryGoal.toLowerCase();
            const goalKeywords = goalLower.split(/[\s-_]+/);

            // Check for any keyword match
            return goalKeywords.some(keyword => iName.includes(keyword) || keyword.includes(iName)) ||
                iName.includes(goalLower) ||
                goalLower.includes(iName);
        });

        // Collect all linked protocol IDs from matched indications
        const linkedProtocolIds = Array.from(new Set(
            matchedIndications.flatMap(ind => ind.fields.Protocol_block || [])
        ));

        console.log(`[RECOMMENDATION ENGINE] Primary Goal: "${primaryGoal}", Matched ${matchedIndications.length} indications, ${linkedProtocolIds.length} linked protocols`);

        // Step B: Calculate Scores with better diversity
        type ScoredProtocol = { proto: ProtocolRecord, score: number };
        const scoredProtocols: ScoredProtocol[] = candidateProtocols.map((p, index) => {
            // Base score with more randomness for diversity
            let score = 50 + (p.id.charCodeAt(p.id.length - 1) % 10) + (index % 3) * 2;
            const pPain = p.fields.pain_level || 'Medium';
            const pDowntime = p.fields.downtime_level || 'Medium';
            const pName = p.fields.protocol_name?.toLowerCase() || '';

            // 1. Primary Goal Fit (+40 for exact match, +30 for strong match, +15 for keyword match)
            if (linkedProtocolIds.includes(p.id)) {
                score += 40;
                console.log(`  ✓ Protocol "${p.fields.protocol_name}" matched via indication_map (+40)`);
            } else if (primaryGoal) {
                const goalLower = primaryGoal.toLowerCase();
                const goalKeywords = goalLower.split(/[\s-_]+/).filter(k => k.length > 3);

                // Check protocol name for goal keywords
                const matchedKeywords = goalKeywords.filter(keyword => pName.includes(keyword));
                if (matchedKeywords.length > 0) {
                    const keywordBonus = Math.min(matchedKeywords.length * 10, 30);
                    score += keywordBonus;
                    console.log(`  ~ Protocol "${p.fields.protocol_name}" keyword match (${matchedKeywords.join(', ')}) (+${keywordBonus})`);
                }

                // Check indication names linked to this protocol
                const protocolIndications = p.fields['indication_name (from indications)'] || [];
                const indicationMatch = Array.isArray(protocolIndications) && protocolIndications.some((ind: any) => {
                    const indLower = String(ind).toLowerCase();
                    return goalKeywords.some(keyword => indLower.includes(keyword));
                });
                if (indicationMatch) {
                    score += 15;
                    console.log(`  ~ Protocol "${p.fields.protocol_name}" indication match (+15)`);
                }
            }

            // 2. Pain Fit (+15 / -40 for rigorous differentiation)
            if (painTolerance && PAIN_TOLERANCE_MAP.LOW.some(t => painTolerance.includes(t))) {
                if (pPain === 'Low' || pPain === 'Very Low' || pPain === 'None') {
                    score += 20;
                } else if (pPain === 'High' || pPain === 'Very High' || pPain === 'Medium') {
                    score -= 40; // Massive penalty for high/medium pain if user wants low
                }
            } else if (painTolerance && PAIN_TOLERANCE_MAP.HIGH.some(t => painTolerance.includes(t))) {
                if (['High', 'Very High'].includes(pPain)) {
                    score += 10; // Tolerable and usually effective
                }
            }

            // 3. Downtime Fit (+15 / -40 for rigorous differentiation)
            if (downtimeTolerance && DOWNTIME_TOLERANCE_MAP.NONE.some(t => downtimeTolerance.includes(t))) {
                if (pDowntime === 'Low' || pDowntime === 'None' || pDowntime === 'Very Low') {
                    score += 20;
                } else if (pDowntime === 'High' || pDowntime === 'Very High' || pDowntime === 'Medium') {
                    score -= 40; // Massive penalty for downtime if user wants none
                }
            } else if (downtimeTolerance && DOWNTIME_TOLERANCE_MAP.LONG.some(t => downtimeTolerance.includes(t))) {
                if (['High', 'Very High'].includes(pDowntime)) {
                    score += 8; // User can tolerate downtime for better results
                }
            }

            // 4. Device Diversity Bonus - favor different device types
            const deviceNames = p.fields["device_name (from device_ids)"] || [];
            const hasLaser = Array.isArray(deviceNames) && deviceNames.some((d: any) => String(d).toLowerCase().includes('laser'));
            const hasRF = Array.isArray(deviceNames) && deviceNames.some((d: any) => String(d).toLowerCase().match(/rf|radio|genius|inmode|thermage/));
            const hasHIFU = Array.isArray(deviceNames) && deviceNames.some((d: any) => String(d).toLowerCase().match(/hifu|ulther|ultraformer|doublo/));

            if (hasLaser) score += 3;
            if (hasRF) score += 5; // RF is popular and safe
            if (hasHIFU) score += 4;

            // Normalize to 55-98 range (wider range for more diversity)
            score = Math.min(Math.max(score, 55), 98);
            return { proto: p, score };
        });

        // Step C: Advanced Sorting & Selection Logic
        scoredProtocols.sort((a, b) => b.score - a.score);

        // 1. Rank 1: Best Match (Direct top scorer)
        const rank1 = scoredProtocols[0];

        // 2. Rank 2: Trending & Safe (e.g., Titanium Lifting / Inmode) for Low Downtime/Pain
        let rank2 = scoredProtocols.find(p => p.proto.id !== rank1?.proto.id && (p.proto.fields.protocol_name?.toLowerCase().includes('titanium') || p.proto.fields.protocol_name?.toLowerCase().includes('티타늄') || p.proto.fields.protocol_name?.toLowerCase().includes('inmode')));

        // Fallback if no specific trending device is found, or if user tolerance is high
        if (!rank2 || (painTolerance && PAIN_TOLERANCE_MAP.HIGH.some(t => painTolerance.includes(t)))) {
            rank2 = scoredProtocols.find(p => p.proto.id !== rank1?.proto.id);
        }

        // 3. Rank 3: Trade-off (Higher efficacy, slightly more pain/downtime)
        let rank3 = scoredProtocols.find(p =>
            p.proto.id !== rank1?.proto.id &&
            p.proto.id !== rank2?.proto.id &&
            (['High', 'Very High'].includes(p.proto.fields.pain_level as string) || ['High', 'Very High'].includes(p.proto.fields.downtime_level as string))
        );

        // Fallback for Rank 3
        if (!rank3) {
            rank3 = scoredProtocols.find(p => p.proto.id !== rank1?.proto.id && p.proto.id !== rank2?.proto.id);
        }

        const topProtocols = [rank1, rank2, rank3].filter(Boolean) as typeof scoredProtocols;

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
            } else if (matchedIndications.some(ind => ind.fields.Protocol_block?.includes(proto.id))) {
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

        // Step E: Reason Why Generation (Rule-based hybrid engine)
        const generateReasonWhy = () => {
            const r1Name = recommendations[0]?.name || 'the primary treatment';
            const r2Name = recommendations[1]?.name || 'a trending option';
            const r3Name = recommendations[2]?.name || 'an intensive option';

            if (lang === 'KO') {
                return `환자님의 임상 데이터(통증 허용도: ${painTolerance || '보통'}, 회복 기간: ${downtimeTolerance || '보통'})를 종합 분석한 결과입니다.\n\n1순위로 추천드리는 [${r1Name}]은 환자님의 최우선 목표인 '${primaryGoal}' 개선에 임상적 적합도가 가장 높습니다. 추가로, 최근 트렌디하게 각광받으며 부담 없이 시술 가능한 [${r2Name}]을 2순위로 제안합니다.\n\n만약 약간의 다운타임을 더 감수하더라도 확실하고 강력한 피부 개선(Trade-off)을 원하신다면 3순위인 [${r3Name}] 시술도 훌륭한 대안이 될 수 있습니다. 각 시술의 구체적인 로직 프로파일을 아래에서 확인해보세요.`;
            }
            if (lang === 'JP') {
                return `患者様の臨床データ（痛みの許容度：${painTolerance || '普通'}、ダウンタイム：${downtimeTolerance || '普通'}）を総合的に分析した結果です。\n\n第1位としてお勧めする[${r1Name}]は、患者様の最優先目標である「${primaryGoal}」の改善に最も高い臨床的適合性を示しています。さらに、最近トレンドとして注目され、負担なく施術可能な[${r2Name}]を第2位として提案します。\n\nもし、少しのダウンタイムを許容しても、確実で強力な肌の改善（トレードオフ）をご希望の場合は、第3位の[${r3Name}]も素晴らしい選択肢となります。以下の各施術の具体的なロジックプロファイルをご確認ください。`;
            }
            // English & default fallback
            return `Based on your clinical data (Pain tolerance: ${painTolerance || 'Medium'}, Downtime: ${downtimeTolerance || 'Medium'}), we have analyzed your profile.\n\nOur top recommendation, [${r1Name}], provides the highest clinical match for your primary goal of '${primaryGoal}'. Additionally, we suggest [${r2Name}] as a highly trending, low-burden alternative.\n\nIf you are willing to accept slightly more downtime for maximum efficacy (a clinical trade-off), [${r3Name}] is an excellent intensive option. Review the detailed logic profile for each below.`;
        }

        const reasonWhy = generateReasonWhy();

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
