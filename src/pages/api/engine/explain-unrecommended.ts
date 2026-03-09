import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import Airtable from 'airtable';

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || '',
});

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { deviceName, userData } = req.body;

    try {
        // 1. Fetch Device Info from Airtable EBD_Device
        const deviceRecords = await base('EBD_Device').select({
            filterByFormula: `{name} = '${deviceName}'`,
            maxRecords: 1
        }).firstPage();

        const device = deviceRecords[0]?.fields || { name: deviceName };

        // 2. Generate Explanation with Claude
        const systemPrompt = `You are the "ConnectingDocs" Clinical Intelligence Engine.
Your task is to explain why a specific aesthetic device is NOT recommended for a patient, or what precautions are needed.

=== PATIENT PROFILE ===
- Goals: ${userData.primaryGoal}, ${userData.secondaryGoal}
- Concerns: ${userData.areas?.join(', ')}
- Skin Type: ${userData.skinType}
- Preferences: Pain Tolerance (${userData.painTolerance}), Downtime (${userData.downtimeTolerance})
- History: ${userData.treatmentHistory?.join(', ')}

=== TARGET EQUIPMENT ===
- Name: ${deviceName}
- Indications: ${device.indications || 'General aesthetic'}
- Pain/Downtime: ${device.pain_level || 'Varies'} / ${device.downtime_level || 'Varies'}
- Features: ${device.notes || 'N/A'}

=== RESPONSE STRUCTURE (JSON ONLY) ===
Provide a detailed, structured reasoning comparison.
1. Characteristics & Indications of the device.
2. Pain & Downtime profile.
3. Comparative Reasoning: Why it doesn't match the patient's profile (e.g., "Too painful for your tolerance," "Targets different layers than your concern," etc.)
4. Suitability Score: A percentage (0-100%).
5. Precautions: Important things to know if the patient insists on this treatment.

{
  "deviceName": "...",
  "characteristics": "...",
  "painDowntime": "...",
  "reasoningSteps": [
    "Step 1: Alignment check with [Concern]...",
    "Step 2: Risk assessment for [Skin Type]...",
    "Step 3: Preference check [Pain/Downtime]..."
  ],
  "suitabilityScore": 45,
  "precautions": "...",
  "conclusion": "..."
}`;

        const msg = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1500,
            temperature: 0,
            system: systemPrompt,
            messages: [{ role: "user", content: `Why is ${deviceName} not the top recommendation for me?` }]
        });

        const result = JSON.parse(msg.content[0].type === 'text' ? msg.content[0].text : '{}');
        res.status(200).json(result);

    } catch (error) {
        console.error("[EXPLAIN_UNRECOMMENDED] Error:", error);
        res.status(500).json({ error: "Failed to generate explanation" });
    }
}
