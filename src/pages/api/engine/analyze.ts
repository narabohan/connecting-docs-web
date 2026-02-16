import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import Airtable from 'airtable';

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

// Fallback Mock Data (Moved up for scope)
const MOCK_RESPONSE = {
    rank1: {
        protocol: "Ulthera Deep Lifting",
        score: 95,
        reason: "Based on your concern for sagging, ultrasound energy is the most effective solution for deep fascial tightening.",
        downtime: "None",
        pain: "Moderate"
    },
    rank2: {
        protocol: "Rejuran Healer",
        score: 88,
        reason: "To support the lifting effect, regenerating the skin barrier thickness is crucial.",
        downtime: "1-2 Days (Bumps)",
        pain: "Moderate"
    },
    rank3: {
        protocol: "Pico Toning",
        score: 82,
        reason: "Address overall skin tone uniformity while lifting is in progress.",
        downtime: "None",
        pain: "Mild"
    }
};

// Full Tally-Parity Data Structure
type AnalysisRequest = {
    // Intro
    age: string;
    gender: string;
    country: string;

    // Goals
    primaryGoal: string;
    secondaryGoal: string;

    // Risks
    risks: string[];
    acneStatus?: string;
    pigmentType?: string[];

    // Areas
    areas: string[];
    poreType?: string;
    priorityArea?: string;

    // Skin & Style
    skinType: string;
    treatmentStyle: string;
    volumePreference?: string;

    // Preferences
    painTolerance: string;
    downtimeTolerance: string;
    budget: string;
    frequency: string;

    // History
    treatmentHistory: string[];
    historySatisfaction?: string;

    // Habits
    careHabits: string[];

    // User Context
    userId?: string;
    userEmail?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const data = req.body as AnalysisRequest;

    if (!process.env.CLAUDE_API_KEY) {
        console.error("CLAUDE_API_KEY is missing");
        return res.status(200).json(MOCK_RESPONSE);
    }

    try {
        const systemPrompt = `
      You are an expert dermatologist specializing in Asian skin physiology and aesthetic procedures (K-Beauty).
      Your goal is to analyze the patient's comprehensive profile and recommend the Top 3 Treatment Protocols based on the "Connecting Docs Clinical Logic".

      **PATIENT PROFILE:**
      - **Demographics:** ${data.age}, ${data.gender}, ${data.country}
      - **Goals:** Primary: ${data.primaryGoal}, Secondary: ${data.secondaryGoal}
      - **Concerns/Areas:** ${data.areas.join(', ')} (Priority: ${data.priorityArea || 'None'})
      - **Risk Factors:** ${data.risks.join(', ')}
        ${data.acneStatus ? `- Acne Status: ${data.acneStatus}` : ''}
        ${data.pigmentType ? `- Pigment Pattern: ${data.pigmentType.join(', ')}` : ''}
      - **Skin Profile:** ${data.skinType} (Pores: ${data.poreType || 'N/A'})
      - **Preferences:** 
        - Style: ${data.treatmentStyle}
        - Pain Tolerance: ${data.painTolerance}
        - Downtime: ${data.downtimeTolerance}
        - Budget: ${data.budget}
        - Frequency: ${data.frequency}
      - **History:** ${data.treatmentHistory.join(', ')} (Satisfaction: ${data.historySatisfaction || 'N/A'})
      - **Habits:** ${data.careHabits.join(', ')}

      **CORE CLINICAL LOGIC (Strictly Follow):**
      
      **1. Risk-First Filtering:**
      - **Thin Skin / Sensitive:** Avoid high-intensity HIFU (Ulthera Deep). Prioritize RF (Oligio, Thermage) or LDM.
      - **Melasma/Pigment Risk:** ABSOLUTELY NO high-heat lasers (CO2) or aggressive IPL. Recommend Pico Toning or Potenza (low energy) + Exosomes.
      - **Acne (Inflammatory):** Prioritize inflammation control (Capri Laser, PDT, Potenza Acne Mode) BEFORE scarring sequences.
      - **Volume Goal:** If user wants "Natural Regeneration", suggest Sculptra/Juvelook. If "Instant", suggest HA Fillers.

      **2. Preference Alignment:**
      - **Low Pain Tolerance:** Recommend sedation or low-pain alternatives (Titan, LinearZ) over Ulthera/Thermage without sedation.
      - **Short Downtime:** Avoid fractional lasers (Fraxel) or deep peels. Stick to non-ablative RF or Toning.
      - **Budget "Economy":** Recommend Shurink Universe (HIFU) or OralMed (LinearZ) instead of Thermage/Ulthera.

      **Output Requirements:**
      - Return a JSON object with keys: "rank1", "rank2", "rank3".
      - Each rank must have: 
        - "protocol": Precise name of the treatment combo.
        - "score": Relevance score (0-100).
        - "reason": A clinical explanation referencing SPECIFIC patient data (e.g. "Because you have melasma [Risk] and prefer low downtime [Pref], we avoided CO2...").
        - "downtime": Specific recovery time.
        - "pain": Pain level assessment.
      
      **Tone:** Professional, Empathetic, Authoritative yet Accessible.
    `;

        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1500,
            temperature: 0.4,
            system: systemPrompt,
            messages: [
                { role: "user", content: "Analyze this patient and recommend the best treatment protocol." },
                { role: "assistant", content: "{" }
            ]
        });

        console.log('Claude Response:', msg.content);

        const rawContent = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const fullJson = "{" + rawContent;
        const jsonMatch = fullJson.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error("Invalid JSON format from Claude");
        }

        const result = JSON.parse(jsonMatch[0]);

        // SAVE TO AIRTABLE (If User Authenticated)
        if (data.userEmail) {
            try {
                // 1. Find User ID if not provided (Safety check)
                let userId = data.userId;
                if (!userId) {
                    const userRecords = await base('Users').select({
                        filterByFormula: `{email} = '${data.userEmail}'`,
                        maxRecords: 1
                    }).firstPage();
                    if (userRecords.length > 0) userId = string(userRecords[0].id);
                }

                if (userId) {
                    await base('Reports').create([
                        {
                            fields: {
                                User: [userId],
                                Input_JSON: JSON.stringify(data),
                                Output_JSON: JSON.stringify(result),
                                Status: 'Completed'
                            }
                        }
                    ]);
                    console.log(`[REPORT] Saved for ${data.userEmail}`);
                }
            } catch (dbError) {
                console.error("Failed to save report to Airtable:", dbError);
                // Non-blocking error
            }
        }

        res.status(200).json(result);

    } catch (error: any) {
        console.error('Clinical Engine Error:', error);
        res.status(500).json({ error: 'Analysis failed', mock: MOCK_RESPONSE });
    }
}

// Helper to cast ID to string if needed, though Airtable IDs are strings
function string(val: any): string {
    return String(val);
}
