import { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import { PatientRecord, ProtocolRecord, IndicationRecord, DoctorSolutionRecord } from '@/types/airtable';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid Patient ID' });
    }

    // ── DEMO SHORTCUT ───────────────────────────────────────────────
    if (id === 'demo') {
        const lang = ((req.query.lang as string) || 'EN').toUpperCase();
        return res.status(200).json({
            language: lang,
            patient: {
                id: 'demo',
                name: 'Guest',
                language: lang,
                goals: ['Glass Skin', 'Anti-Aging', 'Pore Refinement'],
                profile: [
                    { subject: 'Skin Thickness', A: 72, fullMark: 100 },
                    { subject: 'Pain Tolerance', A: 65, fullMark: 100 },
                    { subject: 'Downtime', A: 80, fullMark: 100 },
                    { subject: 'Pigment Risk', A: 55, fullMark: 100 },
                    { subject: 'Aging Stage', A: 60, fullMark: 100 },
                ],
                simulationData: { primaryIndication: 'Glass Skin', secondaryIndication: 'Anti-Aging', locations: ['Full Face'] }
            },
            logic: {
                terminalText: `PATIENT_ANALYSIS: COMPLETE\nRISK_FILTER: ACTIVE\nPROTOCOL_MATCH: 3 candidates found\nBEST_MATCH: Ulthera Deep Lifting [SCORE: 95]\nCLINICAL_EVIDENCE: VALIDATED\nOUTPUT_READY`,
                risks: [
                    { level: 'DANGER', factor: 'Melasma', description: 'High-heat laser treatments (CO2, aggressive IPL) are contraindicated due to hyperpigmentation risk.' },
                    { level: 'CAUTION', factor: 'Sensitive Skin', description: 'HIFU at maximum energy may cause excessive redness. Use moderate settings only.' },
                    { level: 'SAFE', factor: 'RF Energy', description: 'Radiofrequency-based protocols are fully cleared for your skin type.' },
                    { level: 'SAFE', factor: 'Exosomes', description: 'Regenerative boosters are ideal complements to your skin barrier needs.' },
                ]
            },
            recommendations: [
                {
                    id: 'proto_001',
                    rank: 1,
                    name: 'Ulthera Glass Skin Protocol',
                    matchScore: 95,
                    composition: ['Ulthera', 'Exosome Boost', 'LaseMD'],
                    description: 'Triple-layer approach targeting SMAS for deep lifting while simultaneously reinforcing skin barrier. Clinical gold standard for glass skin with anti-aging.',
                    tags: ['Zero Downtime', 'Low Pain', 'Premium'],
                    energyDepth: 'smas',
                    isLocked: false,
                },
                {
                    id: 'proto_002',
                    rank: 2,
                    name: 'Genius RF Rebuilder',
                    matchScore: 88,
                    composition: ['Genius RF', 'Rejuran Healer', 'Pico Toning'],
                    description: 'Deep collagen synthesis via microneedling RF combined with PDRN regeneration. Optimal for texture and pore refinement without significant downtime.',
                    tags: ['1-2 Day Downtime', 'Moderate Pain', 'Standard'],
                    energyDepth: 'dermis',
                    isLocked: false,
                },
                {
                    id: 'proto_003',
                    rank: 3,
                    name: 'InMode V-Line Sculptor',
                    matchScore: 81,
                    composition: ['InMode FX', 'Jaw Botox', 'Potenza'],
                    description: 'High-voltage pulse permanently reduces volume while RF tightens surrounding tissue. Precisely designed for contour and V-line definition.',
                    tags: ['3-5 Day Downtime', 'Moderate Pain', 'Standard'],
                    energyDepth: 'hypodermis',
                    isLocked: false,
                }
            ]
        });
    }
    // ── END DEMO ─────────────────────────────────────────────────────

    try {
        // 1. Fetch Patient Data
        const patientRecord = await base('Patients_v1').find(id) as unknown as PatientRecord;
        const pFields = patientRecord.fields;

        // Language Detection
        const queryLang = (req.query.lang as string)?.toUpperCase();
        const dbLang = pFields.language || 'EN';
        let lang = queryLang || dbLang;

        if (!['EN', 'KO', 'JP', 'CN'].includes(lang)) {
            lang = 'EN';
        }

        // Coalesce Logic for Multi-lingual fields
        const getField = (prefix: string) => {
            return pFields[`${prefix}_EN` as keyof typeof pFields] ||
                pFields[`${prefix}_KO` as keyof typeof pFields] ||
                pFields[`${prefix}_JP` as keyof typeof pFields] ||
                pFields[`${prefix}_CN` as keyof typeof pFields];
        };

        const painTolerance = getField('q6_pain_tolerance');
        const downtimeTolerance = getField('q6_down_time'); // Corrected field name
        const skinThickness = getField('q4_skin_thickness');

        // Handle Missing Goal Gracefully for MVP/Testing
        let primaryGoal = pFields.q1_primary_goal_MASTER;
        if (!primaryGoal) {
            console.warn(`Patient ${id} missing primary goal. Defaulting to 'Skin Improvement'.`);
            primaryGoal = "Skin Improvement";
        }

        const secondaryGoals = pFields.q1_goal_secondary_MASTER ? [pFields.q1_goal_secondary_MASTER] : [];
        const locations = pFields.q_treatment_locations || [];

        // 2. Fetch Knowledge Base
        const [protocols, indications, doctors] = await Promise.all([
            base('Protocol_block').select().all(),
            base('indication_map').select().all(),
            base('doctor_signiture_solution').select().all()
        ]);

        const protocolRecords = protocols as unknown as ProtocolRecord[];
        const indicationRecords = indications as unknown as IndicationRecord[];
        const doctorRecords = doctors as unknown as DoctorSolutionRecord[];

        // --- LOGIC CORE ---

        // Step A: Filter Constraints (Pain & Downtime)
        let allowedProtocols = protocolRecords.filter(p => {
            const pPain = p.fields.pain_level || 'Medium';
            const pDowntime = p.fields.downtime_level || 'Medium';

            // Pain Filter
            if (painTolerance && PAIN_TOLERANCE_MAP.LOW.some(t => painTolerance.includes(t))) {
                if (['High', 'Very High'].includes(pPain)) return false;
            }
            if (painTolerance && PAIN_TOLERANCE_MAP.MODERATE.some(t => painTolerance.includes(t))) {
                if (pPain === 'Very High') return false;
            }

            // Downtime Filter
            if (downtimeTolerance && DOWNTIME_TOLERANCE_MAP.NONE.some(t => downtimeTolerance.includes(t))) {
                if (['Medium', 'High', 'Very High'].includes(pDowntime)) return false;
            }
            if (downtimeTolerance && DOWNTIME_TOLERANCE_MAP.SHORT.some(t => downtimeTolerance.includes(t))) {
                if (['High', 'Very High'].includes(pDowntime)) return false;
            }

            return true;
        });

        // Step B: Match Indication
        const matchedIndication = indicationRecords.find(i => {
            const iName = i.fields.indication_name?.toLowerCase();
            const pGoal = primaryGoal?.toLowerCase();
            if (!iName || !pGoal) return false;
            return iName.includes(pGoal) || pGoal.includes(iName);
        });

        let recommendedProtocolIds: string[] = [];

        if (matchedIndication && matchedIndication.fields.Protocol_block) {
            recommendedProtocolIds = matchedIndication.fields.Protocol_block;
        } else {
            recommendedProtocolIds = allowedProtocols.map(p => p.id);
        }

        // Step C: Select Protocol (Intersection)
        const finalProtocols = allowedProtocols.filter(p => recommendedProtocolIds.includes(p.id));

        const topProtocols = finalProtocols.slice(0, 3);

        // Step D: Match Doctor
        const recommendations = topProtocols.map(proto => {
            const matchedDoctor = doctorRecords.find(d =>
                d.fields.Protocols && d.fields.Protocols.includes(proto.id)
            );

            const deviceNames = proto.fields["device_name (from device_ids)"] || [];

            return {
                id: proto.id,
                rank: 1, // calculated in map index later if needed, or pass index
                name: proto.fields.protocol_name,
                matchScore: 95, // Placeholder
                composition: deviceNames,
                description: proto.fields.mechanism_action || "Clinical protocol optimized for your goals.",
                tags: [proto.fields.downtime_level, proto.fields.pain_level].filter(Boolean) as string[],
                doctor: matchedDoctor ? matchedDoctor.fields : null,
                isLocked: false
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
        const tSkin = skinThickness || (lang === 'KO' ? '보통' : 'Normal');
        const tPain = painTolerance || (lang === 'KO' ? '보통' : 'Standard');
        const tGoal = primaryGoal || (lang === 'KO' ? '피부 개선' : 'Skin Improvement');
        const tDowntime = downtimeTolerance || (lang === 'KO' ? '일상 복귀 가능' : 'manageable');

        const reasonWhy = template
            .replace('{skin}', String(tSkin))
            .replace('{pain}', String(tPain))
            .replace('{goal}', String(tGoal))
            .replace('{downtime}', String(tDowntime));


        // Response Construction
        res.status(200).json({
            language: lang,
            patient: {
                id: patientRecord.id,
                name: "Guest",
                language: lang,
                goals: [primaryGoal],
                profile: [
                    { subject: 'Pain Safe', A: 80, fullMark: 100 },
                    { subject: 'Downtime', A: 80, fullMark: 100 },
                    { subject: 'Efficacy', A: 90, fullMark: 100 },
                    { subject: 'Skin Fit', A: 95, fullMark: 100 },
                    { subject: 'Budget', A: 70, fullMark: 100 },
                ],
                simulationData: {
                    primaryIndication: primaryGoal,
                    secondaryIndication: secondaryGoals[0] || null, // Just take first for now
                    locations: locations
                }
            },
            logic: {
                terminalText: reasonWhy,
                risks: [
                    { level: "SAFE", factor: "Clinical Continuity", description: "Standard CCR protocols applied for post-procedure safety." }
                ]
            },
            recommendations: recommendations.map((r, i) => ({ ...r, rank: i + 1, isLocked: i > 0 }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
