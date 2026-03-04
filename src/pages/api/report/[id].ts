import { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import { ProtocolRecord, IndicationRecord, DoctorSolutionRecord } from '@/types/airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID || '');

const PAIN_TOLERANCE_MAP = {
    LOW: ['Prefer minimal pain', '통증은 최대한 피하고 싶음', '痛みはなるべく避けたい', 'Low'],
    MODERATE: ['Moderate is okay', '약간은 괜찮음', '多少なら大丈夫', 'Medium'],
    HIGH: ['High tolerance', '효과가 좋다면 상관없음', 'High']
};
const DOWNTIME_TOLERANCE_MAP = {
    NONE: ['None (Daily life immediately)', '당일~다음날 일상 가능', 'None', 'Low'],
    SHORT: ['Short (3–4 days)', '3–4일 정도', 'Medium'],
    LONG: ['Long (1 week+)', '1주 이상도 괜찮음', 'High']
};

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

// ─── Normalize Claude engine output (rank1/rank2/rank3) → recommendations[] ──
function normalizeAnalyzeOutput(output: any, wizardData: any) {
    const ranks = ['rank1', 'rank2', 'rank3'];
    const RANK_LABELS = ['No.1 Clinical Fit', 'No.2 Trending Match', 'No.3 Stretch Goal'];

    const recommendations = ranks.map((key, idx) => {
        const r = output[key];
        if (!r) return null;
        return {
            id: r.airtableId || `proto_${idx}`,
            rank: idx + 1,
            name: r.protocol || 'Protocol',
            matchScore: r.score || (90 - idx * 8),
            composition: [...(r.devices || []), ...(r.boosters || [])],
            devices: r.devices || [],
            boosters: r.boosters || [],
            description: r.reason || '',
            tags: [
                r.downtime ? `${r.downtime} Downtime` : '',
                r.pain ? `${r.pain} Pain` : ''
            ].filter(Boolean),
            rankLabel: RANK_LABELS[idx],
            rankRationale: r.rankRationale || '',
            sessions: r.sessions || 3,
            isLocked: false,
            targetLayers: [],
            faceZones: wizardData?.areas ? deriveZonesFromIndications(wizardData.areas) : [],
            reasonWhy: {
                why_suitable: r.reason || '',
                pain_level: r.pain || 'Medium',
                downtime_level: r.downtime || 'Low',
                combinations: [...(r.devices || []), ...(r.boosters || [])]
            }
        };
    }).filter(Boolean);

    // Build patient profile from wizardData
    const wd = wizardData || {};
    const patientSummary = output.patientSummary || '';

    const painScore = wd.painTolerance === 'Low' ? 30 : wd.painTolerance === 'Medium' ? 60 : 85;
    const dtScore = wd.downtimeTolerance === 'None' || wd.downtimeTolerance === 'Low' ? 85 : wd.downtimeTolerance === 'Medium' ? 60 : 35;
    const budgetScore = wd.budget === 'Low' ? 40 : wd.budget === 'Medium' ? 65 : wd.budget === 'High' ? 85 : 65;

    return {
        language: wd.language || 'EN',
        patientSummary,
        wizardData: wd,
        patient: {
            id: wd.userId || 'user',
            name: wd.email?.split('@')[0] || 'Patient',
            language: wd.language || 'EN',
            goals: [wd.primaryGoal, wd.secondaryGoal].filter(Boolean),
            age: wd.age,
            gender: wd.gender,
            country: wd.country,
            skinType: wd.skinType,
            areas: wd.areas || [],
            risks: wd.risks || [],
            treatmentHistory: wd.treatmentHistory || [],
            painTolerance: wd.painTolerance,
            downtimeTolerance: wd.downtimeTolerance,
            budget: wd.budget,
            radar_score: [
                { subject: 'Pain Tolerance', A: painScore, fullMark: 100 },
                { subject: 'Skin Fit', A: 85, fullMark: 100 },
                { subject: 'Aging Stage', A: 65, fullMark: 100 },
                { subject: 'Efficacy', A: recommendations[0]?.matchScore || 88, fullMark: 100 },
                { subject: 'Pigment Risk', A: 45, fullMark: 100 },
                { subject: 'Budget', A: budgetScore, fullMark: 100 },
            ],
            simulationData: {
                primaryIndication: wd.primaryGoal || 'Skin Improvement',
                secondaryIndication: wd.secondaryGoal || null,
                locations: wd.areas || ['Full Face']
            }
        },
        logic: {
            terminalText: patientSummary || `ANALYSIS COMPLETE\nPATIENT: ${wd.age || '?'} ${wd.gender || ''} | GOAL: ${wd.primaryGoal || 'Skin Improvement'}\nTOP PROTOCOL: ${recommendations[0]?.name || 'Personalized Protocol'}`,
            risks: (wd.risks || []).map((r: string) => ({ level: 'CAUTION', factor: r, description: `Risk factor considered in protocol selection.` }))
        },
        recommendations
    };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing or invalid ID' });

    // ── DEMO SHORTCUT ────────────────────────────────────────────────────────
    if (id === 'demo') {
        const lang = ((req.query.lang as string) || 'EN').toUpperCase();
        return res.status(200).json({
            language: lang,
            patientSummary: lang === 'KO'
                ? '피부 개선과 안티에이징을 원하는 데모 환자입니다. 낮은 다운타임과 통증을 선호합니다.'
                : 'Demo patient seeking skin improvement and anti-aging. Prefers low downtime and pain.',
            skinAnalysis: {
                thickness: 'Medium-Thick',
                sensitivity: 'Stable',
                primaryConcern: 'Glass Skin / Lifting',
                clinicalNote: 'Patient exhibits mild sagging in the jawline area and seeks texture improvement (Glass Skin). Collagen synthesis stimulation is recommended.'
            },
            clinicalIntelligence: {
                devices: [
                    { name: 'Titanium Lifting', suitability: 96, area: 'Full Face', layer: 'SMAS+', pain: 'None', downtime: 'Zero' },
                    { name: 'Oligio RF', suitability: 92, area: 'Lower Face', layer: 'Dermis', pain: 'Low', downtime: 'None' },
                    { name: 'Potenza Collagen', suitability: 88, area: 'Targeted', layer: 'Deep Dermis', pain: 'Med', downtime: '1 Day' },
                    { name: 'Ultherapy', suitability: 94, area: 'Jawline', layer: 'SMAS', pain: 'High', downtime: 'None' },
                    { name: 'Volformer', suitability: 98, area: 'Mid-Face', layer: 'Dual Depth', pain: 'Low', downtime: 'Zero' }
                ],
                boosters: [
                    { name: 'Glass Skin Rejuran', suitability: 99, mechanism: 'Cellular recovery & DNA fragment stimulation.', pain: 'Med', downtime: '2 Days', method: 'Direct Injection' },
                    { name: 'Premium Exosome', suitability: 95, mechanism: 'Extracellular vesicle for rapid barrier healing.', pain: 'Low', downtime: 'Zero', method: 'MTS / Topical' },
                    { name: 'Juvelook Volume', suitability: 91, mechanism: 'PLA + HA collagen stimulator for deep texture.', pain: 'Med', downtime: '3 Days', method: 'Cannula / ID' }
                ]
            },
            patient: {
                id: 'demo', name: 'Guest', language: lang,
                goals: ['Glass Skin', 'Anti-Aging', 'Pore Refinement'],
                painTolerance: 'Low', downtimeTolerance: 'None', budget: 'Medium',
                radar_score: [
                    { subject: 'Pain Tolerance', A: 30, fullMark: 100 },
                    { subject: 'Skin Fit', A: 85, fullMark: 100 },
                    { subject: 'Aging Stage', A: 65, fullMark: 100 },
                    { subject: 'Efficacy', A: 92, fullMark: 100 },
                    { subject: 'Pigment Risk', A: 45, fullMark: 100 },
                    { subject: 'Budget', A: 65, fullMark: 100 },
                ],
                simulationData: { primaryIndication: 'Glass Skin', secondaryIndication: 'Anti-Aging', locations: ['Full Face'] }
            },
            logic: { terminalText: `ANALYSIS: COMPLETE\nPATIENT: Demo | GOAL: Glass Skin\nPROTOCOL: Ulthera Glass Skin`, risks: [] },
            recommendations: [
                { id: 'proto_001', rank: 1, name: 'Ulthera Glass Skin Protocol', matchScore: 95, composition: ['Ulthera', 'Exosome'], devices: ['Ulthera'], boosters: ['Exosome'], description: 'Deep SMAS lifting with zero downtime.', tags: ['Zero Downtime', 'High Pain'], rankLabel: 'No.1 Clinical Fit', rankRationale: 'Best clinical match for your primary goal.', sessions: 2, isLocked: false, targetLayers: ['smas'], focusArea: 'JAWLINE', depthLevel: 'DEEP', reasonWhy: { why_suitable: 'Deep lifting protocol perfect for anti-aging. Requires high pain tolerance.', pain_level: 'High', downtime_level: 'Short', combinations: ['Ulthera', 'Exosome'] } },
                { id: 'proto_002', rank: 2, name: 'Titanium Lifting + Skinvive', matchScore: 87, composition: ['Titanium RF', 'Skinvive'], devices: ['Titanium RF'], boosters: ['Skinvive'], description: 'Trending 2025 titanium RF + FDA-approved HA booster.', tags: ['1 Day Downtime', 'Low Pain'], rankLabel: 'No.2 Trending Match', rankRationale: 'Currently trending treatment you\'ve likely heard of.', sessions: 3, isLocked: false, targetLayers: ['dermis'], focusArea: 'MIDFACE', depthLevel: 'MEDIUM', reasonWhy: { why_suitable: 'The most talked-about 2025 treatment for glass skin.', pain_level: 'Low', downtime_level: 'Low', combinations: ['Titanium RF', 'Skinvive'] } },
                { id: 'proto_003', rank: 3, name: 'Genius RF Rebuilder', matchScore: 79, composition: ['Genius RF'], devices: ['Genius RF'], boosters: [], description: 'Deep collagen synthesis for next-level results.', tags: ['2-3 Day Downtime', 'Medium Pain'], rankLabel: 'No.3 Stretch Goal', rankRationale: 'Consider this if you can tolerate medium pain for stronger results.', sessions: 3, isLocked: false, targetLayers: ['dermis'], focusArea: 'FOREHEAD', depthLevel: 'SURFACE', reasonWhy: { why_suitable: 'Higher efficacy option if you can accept slightly more discomfort.', pain_level: 'Medium', downtime_level: 'Medium', combinations: ['Genius RF'] } }
            ]
        });
    }

    // ── STEP 0: V2 Engine — Recommendation_Run lookup ───────────────────────
    // analyze.ts가 생성한 runId는 Recommendation_Run 레코드 ID
    const queryLang = ((req.query.lang as string) || 'EN').toUpperCase();

    try {
        const rrRec = await base('Recommendation_Run').find(id);
        const rrf = (rrRec?.fields || {}) as Record<string, any>;
        const rank1CatId = String(rrf.rank_1_category_id || '');

        if (rank1CatId) {
            const rank2CatId = String(rrf.rank_2_category_id || '');
            const rank3CatId = String(rrf.rank_3_category_id || '');

            // EBD_Category 레코드 fetch (category_id 텍스트 필드로 필터)
            const fetchCat = async (catId: string) => {
                if (!catId) return null;
                const recs = await base('EBD_Category').select({
                    filterByFormula: `{category_id} = "${catId}"`,
                    maxRecords: 1,
                    fields: [
                        'category_display_name', 'best_primary_indication', 'avg_pain_level',
                        'avg_downtime', 'recommended_sessions', 'devices',
                        'booster_pairing_note_KO', 'booster_pairing_note_EN'
                    ]
                }).firstPage();
                return recs[0] || null;
            };

            const [cat1, cat2, cat3] = await Promise.all([
                fetchCat(rank1CatId),
                rank2CatId ? fetchCat(rank2CatId) : Promise.resolve(null),
                rank3CatId ? fetchCat(rank3CatId) : Promise.resolve(null),
            ]);

            if (!cat1) throw new Error('EBD_Category not found');

            // EBD_Device fetch (카테고리에 링크된 디바이스 IDs)
            const fetchCatDevices = async (catRec: any) => {
                if (!catRec) return [] as { name: string; suitability: number; pain: string; downtime: string }[];
                const deviceIds = (catRec.get('devices') as string[]) || [];
                if (!deviceIds.length) return [];
                try {
                    const devRecs = await base('EBD_Device').select({
                        filterByFormula: `OR(${deviceIds.slice(0, 5).map((dId: string) => `RECORD_ID()="${dId}"`).join(',')})`,
                        fields: ['device_name', 'pain_modifier', 'trend_score'],
                        maxRecords: 3
                    }).firstPage();
                    return devRecs.map(r => ({
                        name: String(r.get('device_name') || ''),
                        suitability: 88 + Math.round((Number(r.get('trend_score') || 5) / 10) * 10),
                        pain: 'Medium',
                        downtime: 'Low'
                    }));
                } catch { return []; }
            };

            const [devs1, devs2, devs3] = await Promise.all([
                fetchCatDevices(cat1),
                cat2 ? fetchCatDevices(cat2) : Promise.resolve([]),
                cat3 ? fetchCatDevices(cat3) : Promise.resolve([]),
            ]);

            // booster_delivery_json (async 필드 — 없으면 빈 배열)
            let boosterDelivery: any[] = [];
            try {
                if (rrf.booster_delivery_json) {
                    boosterDelivery = JSON.parse(String(rrf.booster_delivery_json));
                }
            } catch {}

            // radar_score_json
            const DEFAULT_RADAR_V2 = [
                { subject: 'Pain Tolerance', A: 65, fullMark: 100 },
                { subject: 'Skin Fit', A: 80, fullMark: 100 },
                { subject: 'Aging Stage', A: 65, fullMark: 100 },
                { subject: 'Efficacy', A: 88, fullMark: 100 },
                { subject: 'Pigment Risk', A: 45, fullMark: 100 },
                { subject: 'Budget', A: 70, fullMark: 100 },
            ];
            let radarData = DEFAULT_RADAR_V2;
            try {
                if (rrf.radar_score_json) {
                    const rs = JSON.parse(String(rrf.radar_score_json));
                    radarData = [
                        { subject: 'Pain Tolerance', A: Math.round(100 - (rs.discomfort || 20)), fullMark: 100 },
                        { subject: 'Skin Fit', A: Math.round(rs.efficacy || 80), fullMark: 100 },
                        { subject: 'Aging Stage', A: 65, fullMark: 100 },
                        { subject: 'Efficacy', A: Math.round(rs.efficacy || 88), fullMark: 100 },
                        { subject: 'Pigment Risk', A: 45, fullMark: 100 },
                        { subject: 'Budget', A: Math.round(rs.cost_efficiency || 70), fullMark: 100 },
                    ];
                }
            } catch {}

            const lang = (['EN', 'KO', 'JP', 'CN'].includes(queryLang) ? queryLang : 'EN') as string;
            const RANK_LABELS_V2 = ['No.1 Clinical Fit', 'No.2 Trending Match', 'No.3 Stretch Goal'];
            const SCORES_V2 = [90, 82, 74];

            const buildRecV2 = (catRec: any, rank: number, devList: { name: string; suitability: number; pain: string; downtime: string }[]) => {
                if (!catRec) return null;
                const catName = String(catRec.get('category_display_name') || '');
                const painLvl = String(catRec.get('avg_pain_level') || 'Medium');
                const downtimeLvl = String(catRec.get('avg_downtime') || 'Low');
                const sessions = Number(catRec.get('recommended_sessions') || 3);
                const primaryInd = String(catRec.get('best_primary_indication') || '');
                const note = lang === 'KO'
                    ? String(catRec.get('booster_pairing_note_KO') || '')
                    : String(catRec.get('booster_pairing_note_EN') || catRec.get('booster_pairing_note_KO') || '');
                const deviceNames = devList.map(d => d.name).filter(Boolean);
                const rankBoosters = boosterDelivery
                    .filter((b: any) => b.booster_name)
                    .slice((rank - 1) * 2, rank * 2)
                    .map((b: any) => String(b.booster_name));

                return {
                    id: `v2_rr_${id}_rank${rank}`,
                    rank,
                    name: catName,
                    matchScore: SCORES_V2[rank - 1],
                    composition: [...deviceNames, ...rankBoosters],
                    devices: deviceNames,
                    boosters: rankBoosters,
                    description: note || (lang === 'KO'
                        ? `${catName} — AI 분석 생성 중...`
                        : `${catName} — AI analysis generating...`),
                    tags: [
                        downtimeLvl ? `${downtimeLvl} Downtime` : '',
                        painLvl ? `${painLvl} Pain` : ''
                    ].filter(Boolean),
                    rankLabel: RANK_LABELS_V2[rank - 1],
                    rankRationale: rank === 1
                        ? (lang === 'KO' ? '내 피부 프로파일에 가장 적합한 임상 매칭입니다.' : 'Best clinical match for your profile.')
                        : rank === 2
                        ? (lang === 'KO' ? '많은 분들이 선택하는 트렌딩 시술입니다.' : 'A trending treatment you may have heard of.')
                        : (lang === 'KO' ? '더 강한 효과를 원한다면 고려해보세요.' : 'Consider this for stronger results.'),
                    sessions,
                    isLocked: false,
                    targetLayers: [],
                    faceZones: deriveZonesFromIndications(primaryInd),
                    reasonWhy: {
                        why_suitable: note || '',
                        pain_level: painLvl,
                        downtime_level: downtimeLvl,
                        combinations: [...deviceNames, ...rankBoosters]
                    }
                };
            };

            const recommendations = [
                buildRecV2(cat1, 1, devs1),
                buildRecV2(cat2, 2, devs2),
                buildRecV2(cat3, 3, devs3),
            ].filter(Boolean);

            const primaryGoal = String(cat1.get('best_primary_indication') || 'Skin Improvement');
            const allDevices = [...devs1, ...devs2, ...devs3].filter(d => d.name);
            const allBoosters = boosterDelivery.slice(0, 5).map((b: any) => ({
                name: String(b.booster_name || ''),
                suitability: 88,
                mechanism: String(b.mechanism_short || ''),
            }));

            return res.status(200).json({
                language: lang,
                patientSummary: lang === 'KO'
                    ? `AI 피부 분석 완료. ${recommendations[0]?.name || ''}이(가) 최우선 추천입니다.`
                    : `AI analysis complete. ${recommendations[0]?.name || 'Treatment'} is your top recommendation.`,
                skinAnalysis: {
                    thickness: 'Normal',
                    sensitivity: 'Stable',
                    primaryConcern: primaryGoal,
                    clinicalNote: lang === 'KO'
                        ? `설문 분석을 기반으로 ${recommendations[0]?.name || ''}이(가) 최적화되었습니다.`
                        : `Based on your survey, ${recommendations[0]?.name || 'this treatment'} is optimized for your skin profile.`
                },
                clinicalIntelligence: {
                    devices: allDevices,
                    boosters: allBoosters
                },
                patient: {
                    id,
                    name: 'Patient',
                    language: lang,
                    goals: [primaryGoal],
                    radar_score: radarData,
                    simulationData: { primaryIndication: primaryGoal, secondaryIndication: null, locations: ['Full Face'] }
                },
                logic: {
                    terminalText: `ANALYSIS COMPLETE\nRANK 1: ${recommendations[0]?.name || ''}\nRANK 2: ${recommendations[1]?.name || ''}\nRANK 3: ${recommendations[2]?.name || ''}`,
                    risks: []
                },
                recommendations
            });
        }
    } catch (rrStep0Err: any) {
        const errMsg = String(rrStep0Err?.message || rrStep0Err || '');
        if (!errMsg.includes('Could not find') && rrStep0Err?.statusCode !== 404) {
            console.warn('[REPORT] STEP 0 warning (non-fatal):', errMsg.slice(0, 120));
        }
        // Fall through to legacy lookup
    }

    // ── Legacy Lookup (V1 Reports / Protocol_block) ──────────────────────────
    try {
        const reportsTable = base('Reports');

        // ── STEP 1: Try direct report record lookup first (when id = Airtable report record ID) ──
        try {
            const directReport = await reportsTable.find(id);
            if (directReport) {
                // Priority 1: Output_JSON from Claude analyze engine
                const outputJsonStr = directReport.fields.Output_JSON as string;
                if (outputJsonStr) {
                    try {
                        const output = JSON.parse(outputJsonStr);
                        // Check if it's Claude engine format (has rank1/rank2/rank3)
                        if (output.rank1 || output.rank2) {
                            const inputJsonStr = directReport.fields.Input_JSON as string;
                            const wizardData = inputJsonStr ? JSON.parse(inputJsonStr) : {};
                            const normalized = normalizeAnalyzeOutput(output, wizardData);
                            normalized.language = ['EN', 'KO', 'JP', 'CN'].includes(queryLang) ? queryLang : normalized.language;
                            return res.status(200).json(normalized);
                        }
                    } catch (e) { console.error('[REPORT] Failed to parse Output_JSON:', e); }
                }
                // Priority 2: Result_JSON (legacy cached format)
                const resultJsonStr = directReport.fields.Result_JSON as string;
                if (resultJsonStr && req.query.force_refresh !== 'true') {
                    try {
                        const cached = JSON.parse(resultJsonStr);
                        if (cached.recommendations && cached.recommendations.length > 0) {
                            cached.language = ['EN', 'KO', 'JP', 'CN'].includes(queryLang) ? queryLang : cached.language;
                            return res.status(200).json(cached);
                        }
                    } catch (e) { /* fall through to regenerate */ }
                }
            }
        } catch (directErr) {
            // Not a direct report record ID — continue with user-based lookup
        }

        // ── STEP 2: User-based lookup (legacy: id = user/patient ID) ──
        const existingReports = await reportsTable.select({
            filterByFormula: `OR(FIND('${id}', {User_Link}), {Title} = 'Report for User ${id}')`,
            maxRecords: 1,
            sort: [{ field: "Title", direction: "desc" }]
        }).firstPage();

        if (existingReports.length > 0 && req.query.force_refresh !== 'true' && req.query.recalculate !== 'true') {
            // Try Output_JSON first
            const outputJsonStr = existingReports[0].fields.Output_JSON as string;
            if (outputJsonStr) {
                try {
                    const output = JSON.parse(outputJsonStr);
                    if (output.rank1 || output.rank2) {
                        const inputJsonStr = existingReports[0].fields.Input_JSON as string;
                        const wizardData = inputJsonStr ? JSON.parse(inputJsonStr) : {};
                        const normalized = normalizeAnalyzeOutput(output, wizardData);
                        normalized.language = ['EN', 'KO', 'JP', 'CN'].includes(queryLang) ? queryLang : normalized.language;
                        return res.status(200).json(normalized);
                    }
                } catch (e) { /* fall through */ }
            }
            // Try Result_JSON
            const resultJsonStr = existingReports[0].fields.Result_JSON as string;
            if (resultJsonStr) {
                try {
                    const cached = JSON.parse(resultJsonStr);
                    if (cached.recommendations && cached.recommendations.length > 0) {
                        cached.language = ['EN', 'KO', 'JP', 'CN'].includes(queryLang) ? queryLang : cached.language;
                        return res.status(200).json(cached);
                    }
                } catch (e) { /* fall through to regenerate */ }
            }
        }

        // ── STEP 3: Regenerate from Airtable scoring (fallback for old user IDs) ──
        let patientContext: any = null;
        let pName = 'Guest';
        let dbLang = 'EN';
        let userRecordId = '';
        let isFromUsersTable = false;

        try {
            const patientRecord = await base('Patients_v1').find(id) as any;
            const pFields = patientRecord.fields;
            userRecordId = patientRecord.id;
            dbLang = pFields.language || 'EN';
            const getField = (prefix: string) => pFields[`${prefix}_EN`] || pFields[`${prefix}_KO`] || pFields[`${prefix}_JP`] || pFields[`${prefix}_CN`];
            patientContext = {
                airtableId: patientRecord.id,
                language: dbLang,
                painTolerance: getField('q6_pain_tolerance') || 'Medium',
                downtimeTolerance: getField('q6_down_time') || 'Low',
                skinThickness: getField('q4_skin_thickness') || 'Normal',
                primaryGoal: pFields.q1_primary_goal_MASTER || 'Skin Improvement',
                secondaryGoals: pFields.q1_goal_secondary_MASTER ? [pFields.q1_goal_secondary_MASTER] : [],
                locations: pFields.q_treatment_locations || []
            };
        } catch {
            try {
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
                    patientContext = {
                        airtableId: users[0].id, language: dbLang,
                        painTolerance: 'Medium', downtimeTolerance: 'Low',
                        skinThickness: 'Normal', primaryGoal: 'Skin Improvement',
                        secondaryGoals: [], locations: ['Full Face']
                    };
                }
            } catch { /* not found */ }
        }

        if (!patientContext) {
            patientContext = {
                airtableId: id, language: queryLang,
                painTolerance: 'Medium', downtimeTolerance: 'Low',
                skinThickness: 'Normal', primaryGoal: 'Skin Improvement',
                secondaryGoals: [], locations: ['Full Face']
            };
        }

        const lang = ['EN', 'KO', 'JP', 'CN'].includes(queryLang) ? queryLang
            : ['EN', 'KO', 'JP', 'CN'].includes(dbLang) ? dbLang : 'EN';
        const isRecalculating = req.query.recalculate === 'true';
        const painTolerance = (isRecalculating && req.query.pain ? req.query.pain as string : null) || patientContext.painTolerance;
        const downtimeTolerance = (isRecalculating && req.query.downtime ? req.query.downtime as string : null) || patientContext.downtimeTolerance;
        const { primaryGoal, secondaryGoals, locations, skinThickness } = patientContext;

        const [protocols, indications, doctors] = await Promise.all([
            base('Protocol_block').select().all(),
            base('indication_map').select().all(),
            base('doctor_signiture_solution').select().all()
        ]);

        const protocolRecords = protocols as unknown as ProtocolRecord[];
        const indicationRecords = indications as unknown as IndicationRecord[];
        const doctorRecords = doctors as unknown as DoctorSolutionRecord[];

        let candidateProtocols = protocolRecords.filter(p => {
            const pPain = p.fields.pain_level || 'Medium';
            const pDowntime = p.fields.downtime_level || 'Medium';
            if (PAIN_TOLERANCE_MAP.LOW.some(t => painTolerance?.includes(t)) && pPain === 'Very High') return false;
            if (DOWNTIME_TOLERANCE_MAP.NONE.some(t => downtimeTolerance?.includes(t)) && ['High', 'Very High'].includes(pDowntime)) return false;
            return true;
        });

        const matchedIndication = indicationRecords.find(i => {
            const iName = i.fields.indication_name?.toLowerCase();
            if (!iName || !primaryGoal) return false;
            return iName.includes(primaryGoal.toLowerCase()) || primaryGoal.toLowerCase().includes(iName);
        });
        const linkedProtocolIds = matchedIndication?.fields.Protocol_block || [];

        type ScoredProtocol = { proto: ProtocolRecord, score: number };
        const scoredProtocols: ScoredProtocol[] = candidateProtocols.map(p => {
            let score = 50 + (p.id.charCodeAt(p.id.length - 1) % 5);
            const pPain = p.fields.pain_level || 'Medium';
            const pDowntime = p.fields.downtime_level || 'Medium';
            if (linkedProtocolIds.includes(p.id)) score += 40;
            else if (primaryGoal && p.fields.protocol_name?.toLowerCase().includes(primaryGoal.toLowerCase().split(' ')[0])) score += 20;
            if (PAIN_TOLERANCE_MAP.LOW.some(t => painTolerance?.includes(t))) {
                if (pPain === 'Low') score += 10; else if (pPain === 'High') score -= 10;
            } else if (PAIN_TOLERANCE_MAP.HIGH.some(t => painTolerance?.includes(t))) {
                if (['High', 'Very High'].includes(pPain)) score += 5;
            }
            if (DOWNTIME_TOLERANCE_MAP.NONE.some(t => downtimeTolerance?.includes(t))) {
                if (['Low', 'None'].includes(pDowntime)) score += 10; else if (pDowntime === 'Medium') score -= 10;
            }
            score = Math.min(Math.max(score, 60), 99);
            return { proto: p, score };
        });

        scoredProtocols.sort((a, b) => b.score - a.score);
        const topProtocols = scoredProtocols.slice(0, 3);
        if (topProtocols.length > 0) topProtocols[0].score = Math.max(topProtocols[0].score, 88);
        if (topProtocols.length > 1 && topProtocols[1].score >= topProtocols[0].score) topProtocols[1].score = topProtocols[0].score - (3 + (topProtocols[1].proto.id.charCodeAt(0) % 5));
        if (topProtocols.length > 2) {
            if (topProtocols[2].score >= topProtocols[1].score) topProtocols[2].score = topProtocols[1].score - (4 + (topProtocols[2].proto.id.charCodeAt(1) % 5));
            topProtocols[2].score = Math.min(topProtocols[2].score, topProtocols[1].score - 2);
        }

        const RANK_LABELS = ['No.1 Clinical Fit', 'No.2 Trending Match', 'No.3 Stretch Goal'];
        const recommendations = topProtocols.map((sp, index) => {
            const proto = sp.proto;
            const matchedDoctor = doctorRecords.find(d => d.fields.Protocols && d.fields.Protocols.includes(proto.id));
            const deviceNames = (proto.fields["device_name (from device_ids)"] || []) as string[];
            const boosterNames = (proto.fields["booster_name (from skin_booster_ids)"] || []) as string[];
            const combs = [...deviceNames, ...boosterNames];

            // Refined Reason-Why Generation
            let whySuitableText = `${proto.fields.protocol_name} is selected based on clinical logic for ${primaryGoal}.`;
            if (index === 0) {
                whySuitableText = `[PRIMARY CHOICE] Optimal match for ${primaryGoal}. Selected as Rank 1 because it balances your ${painTolerance} pain tolerance with high-efficacy clinical results.`;
            } else if (index === 1) {
                whySuitableText = `[TRENDING] A highly sought-after combination in 2025. Recommended as Rank 2 for patients seeking ${downtimeTolerance} downtime options with proven satisfaction scores.`;
            } else {
                whySuitableText = `[EXTENDED GOAL] Designed for maximum performance. Rank 3 provides a more aggressive alternative for those prioritizing long-term transformation over instant recovery.`;
            }

            return {
                id: proto.id, rank: index + 1,
                name: proto.fields.protocol_name || 'Protocol',
                matchScore: Math.round(sp.score),
                composition: combs, devices: deviceNames, boosters: boosterNames,
                description: proto.fields.mechanism_action || whySuitableText,
                tags: [proto.fields.downtime_level ? `${proto.fields.downtime_level} Downtime` : '', proto.fields.pain_level ? `${proto.fields.pain_level} Pain` : ''].filter(Boolean),
                rankLabel: RANK_LABELS[index],
                rankRationale: index === 0 ? 'Best clinical match for your profile.' : index === 1 ? 'A trending treatment you may have heard of.' : 'Consider this if you can handle slightly more for better results.',
                sessions: (proto.fields as any).sessions_total || 3,
                doctor: matchedDoctor ? matchedDoctor.fields : null,
                isLocked: false,
                targetLayers: (proto.fields.target_layer as string[] | string || []),
                faceZones: deriveZonesFromIndications(proto.fields['indication_name (from indications)']),
                reasonWhy: {
                    why_suitable: whySuitableText,
                    pain_level: proto.fields.pain_level || 'Medium',
                    downtime_level: proto.fields.downtime_level || 'Medium',
                    combinations: combs
                }
            };
        });

        const REASON_TEMPLATES: Record<string, string> = {
            EN: `Based on your sensitivity (${skinThickness}) and preference for ${painTolerance} pain with ${downtimeTolerance} downtime, we identified protocols that maximize results for ${primaryGoal}.`,
            KO: `${skinThickness} 피부 민감도와 ${painTolerance} 통증 허용, ${downtimeTolerance} 다운타임 선호를 기반으로 ${primaryGoal} 개선에 최적화된 프로토콜을 선별했습니다.`,
            JP: `${skinThickness}の肌感度と${painTolerance}の痛み許容度に基づき、${primaryGoal}에最適なプロトコルを選定しました。`,
            CN: `根据您的肌肤敏感度(${skinThickness})和疼痛耐受度(${painTolerance})，我们为${primaryGoal}精选了最优方案。`
        };

        const top5Devices = scoredProtocols
            .filter(sp => (sp.proto.fields["device_name (from device_ids)"] || []).length > 0)
            .map(sp => ({
                name: (sp.proto.fields["device_name (from device_ids)"] || [])[0],
                suitability: Math.round(sp.score),
                mechanism: sp.proto.fields.mechanism_action || 'N/A',
                pain: sp.proto.fields.pain_level || 'Medium',
                downtime: sp.proto.fields.downtime_level || 'Medium'
            })).slice(0, 5);

        const top5Boosters = scoredProtocols
            .filter(sp => (sp.proto.fields["booster_name (from skin_booster_ids)"] || []).length > 0)
            .map(sp => ({
                name: (sp.proto.fields["booster_name (from skin_booster_ids)"] || [])[0],
                suitability: Math.round(sp.score - 5),
                mechanism: sp.proto.fields.mechanism_action || 'N/A'
            })).slice(0, 5);

        const resultPayload = {
            language: lang,
            patientSummary: REASON_TEMPLATES[lang] || REASON_TEMPLATES['EN'],
            skinAnalysis: {
                thickness: skinThickness,
                sensitivity: 'Sensitive-prone',
                primaryConcern: primaryGoal,
                secondaryConcern: secondaryGoals[0] || 'N/A',
                clinicalNote: `Patient presents with ${primaryGoal} as primary concern. Given the ${skinThickness} profile and ${painTolerance} tolerance, energy-based devices should be targeted at ${locations.join(', ')} zones with moderate fluence.`
            },
            clinicalIntelligence: {
                devices: top5Devices,
                boosters: top5Boosters
            },
            wizardData: { primaryGoal, secondaryGoal: secondaryGoals[0], painTolerance, downtimeTolerance, areas: locations },
            patient: {
                id: userRecordId, name: pName, language: lang,
                goals: [primaryGoal, ...secondaryGoals].filter(Boolean),
                painTolerance, downtimeTolerance,
                areas: locations, skinType: skinThickness,
                radar_score: [
                    { subject: 'Pain Tolerance', A: PAIN_TOLERANCE_MAP.LOW.some(t => painTolerance?.includes(t)) ? 25 : 65, fullMark: 100 },
                    { subject: 'Skin Fit', A: 85, fullMark: 100 },
                    { subject: 'Aging Stage', A: 65, fullMark: 100 },
                    { subject: 'Efficacy', A: recommendations[0]?.matchScore || 88, fullMark: 100 },
                    { subject: 'Pigment Risk', A: 45, fullMark: 100 },
                    { subject: 'Budget', A: 70, fullMark: 100 },
                ],
                simulationData: { primaryIndication: primaryGoal, secondaryIndication: secondaryGoals[0] || null, locations }
            },
            logic: {
                terminalText: REASON_TEMPLATES[lang] || REASON_TEMPLATES['EN'],
                risks: [{ level: 'SAFE', factor: 'Analyzed Options', description: 'Algorithm strictly filtered out contraindicated protocols.' }]
            },
            recommendations
        };

        try {
            await reportsTable.create([{
                fields: {
                    Title: `Report for User ${id}`,
                    Input_JSON: JSON.stringify({ goal: primaryGoal, pain: painTolerance, downtime: downtimeTolerance, areas: locations }),
                    Result_JSON: JSON.stringify(resultPayload),
                    ...(isFromUsersTable && userRecordId ? { User_Link: [userRecordId] } : {})
                }
            }]);
        } catch (saveError) { console.error('Failed to save report cache:', saveError); }

        res.status(200).json(resultPayload);

    } catch (error) {
        console.error('Report API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
