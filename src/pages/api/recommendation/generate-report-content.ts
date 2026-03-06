import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Initialize APIs
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appS8kd8H48DMYXct');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Constants for Airtable table and field names
const TABLE_RECOMMENDATION_RUN = 'tblAv5eoTae4Al5zy';
const TABLE_PATIENTS = 'tblmSsnekC2dcY73R';
const TABLE_SKIN_BOOSTER = 'tblta0NVjbNgh8Avs';
const TABLE_DELIVERY_METHOD = 'tblSkK0h6HYveFHRd';
const TABLE_EBD_CATEGORY = 'tblCCnizVeFcNpjbj';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { runId, patientId } = req.body;

        // 1. Fetch Recommendation_Run record to get details
        const recRun = await airtable(TABLE_RECOMMENDATION_RUN).find(runId);

        // 2. Resolve patientId if not provided (from linked record)
        let resolvedPatientId = patientId;
        if (!resolvedPatientId) {
            const linkedPatient = recRun.get('Patients_v1') as string[];
            if (linkedPatient && linkedPatient.length > 0) {
                resolvedPatientId = linkedPatient[0];
            }
        }

        if (!resolvedPatientId) {
            console.error(`Patient ID missing and could not be resolved for Run: ${runId}`);
            return res.status(400).json({ error: 'patientId is missing' });
        }

        console.log(`Starting recommendation content generation for Run: ${runId} (Patient: ${resolvedPatientId})`);

        // Task 4 and Task 5 run concurrently
        const [boosterResult, whyCatResult] = await Promise.allSettled([
            generateBoosterDeliveryJson(recRun),
            generateWhyCategoryTexts(recRun, resolvedPatientId)
        ]);

        if (boosterResult.status === 'rejected') {
            console.error('Task 4 Failed:', boosterResult.reason);
        }
        if (whyCatResult.status === 'rejected') {
            console.error('Task 5 Failed:', whyCatResult.reason);
        }

        return res.status(200).json({
            success: true,
            boosterResult: boosterResult.status === 'fulfilled' ? 'success' : 'failed',
            whyCatResult: whyCatResult.status === 'fulfilled' ? 'success' : 'failed'
        });

    } catch (error) {
        console.error('Error generating report content:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

// ----------------------------------------------------------------------------
// Task 4: Skin Booster Delivery Method Mapping
// ----------------------------------------------------------------------------
async function generateBoosterDeliveryJson(recRun: any) {
    const runId = recRun.id;
    // 1. Fetch Recommendation_Run record to get top5_booster_ids
    // const recRun = await airtable(TABLE_RECOMMENDATION_RUN).find(runId);

    // Handling array of linked records or pure JSON string depending on implementation
    let top5BoosterIds: string[] = [];
    const rawBoosterIds = recRun.get('top5_booster_ids');

    if (Array.isArray(rawBoosterIds)) {
        top5BoosterIds = rawBoosterIds as string[];
    } else if (typeof rawBoosterIds === 'string') {
        try {
            top5BoosterIds = JSON.parse(rawBoosterIds);
        } catch (e) {
            console.error("Could not parse top5_booster_ids JSON", e);
        }
    }

    if (!top5BoosterIds || top5BoosterIds.length === 0) {
        console.log(`No boosters found for Run: ${runId}`);
        return;
    }

    // Optimize by fetching all delivery methods at once and creating a lookup map
    const deliveryRecords = await airtable(TABLE_DELIVERY_METHOD).select().all();
    const deliveryMap = new Map();
    deliveryRecords.forEach(record => {
        // Find the URL if there's an image
        const attachments = record.get('delivery_image') as any[];
        const imageUrl = attachments && attachments.length > 0 ? attachments[0].url : null;

        deliveryMap.set(record.id, {
            delivery_id: record.get('delivery_id'),
            delivery_name: record.get('delivery_name'),
            pain_level: String(record.get('typical_pain_level')),
            downtime: String(record.get('typical_downtime')),
            notes: record.get('notes'),
            image_url: imageUrl
        });
    });

    const painScale: Record<string, number> = {
        'Very low': 1,
        'Low': 2,
        'Medium': 3,
        'High': 4,
        'Very high': 5
    };

    const boosterJson = [];

    // 2. Process each booster
    for (const boosterId of top5BoosterIds) {
        try {
            const booster = await airtable(TABLE_SKIN_BOOSTER).find(boosterId);
            const basePainLevel = String(booster.get('pain_level') || 'Medium');
            const basePainNum = painScale[basePainLevel] || 3;

            const deliveryLinks = (booster.get('delivery_method') as string[]) || [];
            const deliveryOptions = deliveryLinks.map(dmId => {
                const dm = deliveryMap.get(dmId);
                if (!dm) return null;

                const dmPainNum = painScale[dm.pain_level] || 3;

                let painDelta = 'same';
                if (dmPainNum < basePainNum) painDelta = 'reduces';
                else if (dmPainNum > basePainNum) painDelta = 'increases';

                return {
                    delivery_id: dm.delivery_id,
                    delivery_name: dm.delivery_name,
                    pain_level: dm.pain_level,
                    pain_num: dmPainNum,
                    pain_delta: painDelta,
                    downtime: dm.downtime,
                    notes: dm.notes,
                    image_url: dm.image_url
                };
            }).filter(Boolean);

            boosterJson.push({
                booster_id: booster.get('booster_id'),
                booster_name: booster.get('booster_name'),
                base_pain_level: basePainLevel,
                base_pain_num: basePainNum,
                canonical_role: booster.get('canonical_role'),
                key_value: booster.get('key_value'),
                delivery_options: deliveryOptions
            });
        } catch (e) {
            console.error(`Failed to process booster ${boosterId}`, e);
        }
    }

    // 3. Update Airtable with JSON result
    await airtable(TABLE_RECOMMENDATION_RUN).update(runId, {
        'booster_delivery_json': JSON.stringify(boosterJson)
    });

    console.log(`booster_delivery_json generated and saved for Run: ${runId}`);
}

// ----------------------------------------------------------------------------
// Task 5: Why This Category Personalized LLM Generation
// ----------------------------------------------------------------------------
async function generateWhyCategoryTexts(recRun: any, patientId: string) {
    const runId = recRun.id;
    // 1. Fetch Recommendation_Run to get ranked categories
    // const recRun = await airtable(TABLE_RECOMMENDATION_RUN).find(runId);
    const rank1Id = Array.isArray(recRun.get('rank_1_category_id')) ? (recRun.get('rank_1_category_id') as any)[0] : recRun.get('rank_1_category_id');
    const rank2Id = Array.isArray(recRun.get('rank_2_category_id')) ? (recRun.get('rank_2_category_id') as any)[0] : recRun.get('rank_2_category_id');
    const rank3Id = Array.isArray(recRun.get('rank_3_category_id')) ? (recRun.get('rank_3_category_id') as any)[0] : recRun.get('rank_3_category_id');

    if (!rank1Id) {
        console.log(`No categories ranked for Run: ${runId}`);
        return;
    }

    // 2. Fetch Patient Data
    const patient = await airtable(TABLE_PATIENTS).find(patientId);
    const patientData = {
        primary_concern: patient.get('Primary_Concern_Category') || 'General Improvement',
        pain_sensitivity: patient.get('Pain_Tolerance') || 'Unknown',
        budget_level: patient.get('Budget_Preference') || 'Unknown',
        concern_area: patient.get('Primary_Concern_Area') || 'Full Face'
    };

    // 3. Fetch Category Data
    const getCatData = async (catId: string) => {
        if (!catId) return null;
        try {
            const cat = await airtable(TABLE_EBD_CATEGORY).find(catId);
            return {
                id: catId,
                name: cat.get('category_display_name'),
                reason_why_ko: cat.get('reason_why_template'),
                reason_why_en: cat.get('reason_why_EN'),
                pain: cat.get('avg_pain_level'),
                downtime: cat.get('avg_downtime'),
                aggressiveness: cat.get('aggressiveness_score')
            };
        } catch (e) {
            console.error(`Error fetching category ${catId}`, e);
            return null;
        }
    };

    const [cat1, cat2, cat3] = await Promise.all([
        getCatData(rank1Id as string),
        getCatData(rank2Id as string),
        getCatData(rank3Id as string)
    ]);

    // 4. Set up Parallel LLM Calls
    const llmPromises = [];

    if (cat1) {
        llmPromises.push(callClaudeKO({ catData: cat1, patientData }).then(res => ({ field: 'why_cat1_KO', value: res, fallback: cat1.reason_why_ko })));
        llmPromises.push(callGptEN({ catData: cat1, patientData }).then(res => ({ field: 'why_cat1_EN', value: res, fallback: cat1.reason_why_en })));
    }
    if (cat2) {
        llmPromises.push(callClaudeKO({ catData: cat2, patientData }).then(res => ({ field: 'why_cat2_KO', value: res, fallback: cat2.reason_why_ko })));
        llmPromises.push(callGptEN({ catData: cat2, patientData }).then(res => ({ field: 'why_cat2_EN', value: res, fallback: cat2.reason_why_en })));
    }
    if (cat3) {
        llmPromises.push(callClaudeKO({ catData: cat3, patientData }).then(res => ({ field: 'why_cat3_KO', value: res, fallback: cat3.reason_why_ko })));
        llmPromises.push(callGptEN({ catData: cat3, patientData }).then(res => ({ field: 'why_cat3_EN', value: res, fallback: cat3.reason_why_en })));
    }

    const results = await Promise.all(llmPromises);

    // 5. Build Update Payload
    const updatePayload: Record<string, any> = {};
    results.forEach(res => {
        updatePayload[res.field] = res.value || res.fallback; // Use fallback if LLM failed or returned empty
    });

    // 6. Update Airtable
    if (Object.keys(updatePayload).length > 0) {
        await airtable(TABLE_RECOMMENDATION_RUN).update(runId, updatePayload as any);
        console.log(`Why Category Texts generated and saved for Run: ${runId}`);
    }
}

// ----------------------------------------------------------------------------
// LLM Helpers
// ----------------------------------------------------------------------------
async function callClaudeKO({ catData, patientData }: { catData: any, patientData: any }) {
    try {
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307", // Using Haiku for speed, Sonnet can be used if higher reasoning needed
            max_tokens: 300,
            system: "당신은 피부과 전문 상담 AI입니다. 임상 정보와 환자의 설문 응답을 바탕으로, 환자가 이해할 수 있는 친절하고 쉬운 한국어로 설명해주세요. 3-4문장, 의학 용어는 괄호로 부연, 환자 입장에서 '왜 이게 나한테 맞나'를 중심으로 작성하세요.",
            messages: [
                {
                    role: "user",
                    content: `[카테고리 임상 정보]
카테고리: ${catData.name}
임상 설명: ${catData.reason_why_ko}
평균 통증: ${catData.pain} / 다운타임: ${catData.downtime} / 공격성: ${catData.aggressiveness}/5

[이 환자의 주요 설문 응답]
주요 고민: ${patientData.primary_concern}
통증 민감도: ${patientData.pain_sensitivity}
예산 수준: ${patientData.budget_level}
관심 부위: ${patientData.concern_area}

위 정보를 바탕으로 "왜 이 치료 방식이 이 환자에게 맞는지"를 환자 눈높이에서 3-4문장으로 한국어로 설명해주세요.`
                }
            ]
        });
        // Handle the text block correctly
        const textBlock = response.content.find(block => block.type === 'text');
        return textBlock ? textBlock.text : null;
    } catch (error) {
        console.error(`Claude Error for ${catData.name}:`, error);
        return null;
    }
}

async function callGptEN({ catData, patientData }: { catData: any, patientData: any }) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost efficient and fast, upgrades to gpt-4o if needed
            messages: [
                {
                    role: "system",
                    content: "You are a professional aesthetic medicine consultant AI. Based on clinical information and the patient's survey responses, explain in friendly, easy-to-understand English why this treatment category is suited for this specific patient. 3-4 sentences maximum."
                },
                {
                    role: "user",
                    content: `[Category clinical info]
Category: ${catData.name}
Clinical description: ${catData.reason_why_en}
Avg pain: ${catData.pain} / Downtime: ${catData.downtime} / Aggressiveness: ${catData.aggressiveness}/5

[Patient survey responses]
Primary concern: ${patientData.primary_concern}
Pain sensitivity: ${patientData.pain_sensitivity}
Budget level: ${patientData.budget_level}
Concern Area: ${patientData.concern_area}

Explain in 3-4 sentences why this category is ideal for this patient.`
                }
            ]
        });
        return response.choices[0]?.message?.content || null;
    } catch (error) {
        console.error(`GPT Error for ${catData.name}:`, error);
        return null;
    }
}
