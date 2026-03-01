import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, title, concept, description, machines, downtime, pain, price, skin_boosters, injection_methods, treatment_focus, tier } = req.body;

    if (!email || !title) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Find the Doctor ID based on Email
        const doctorRecords = await base('Doctors').select({
            filterByFormula: `{email} = '${email}'`,
            maxRecords: 1
        }).firstPage();

        if (doctorRecords.length === 0) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        const doctorId = doctorRecords[0].id;

        // 2. Check solution count and tier limits
        const existingSolutions = await base('Signature_Solutions').select({
            filterByFormula: `FIND('${doctorId}', {Doctor})`
        }).all();

        const solutionCount = existingSolutions.length;
        const vipCount = existingSolutions.filter(s => s.fields.Tier === 'VIP').length;

        // Get doctor's plan from Users table
        const userRecords = await base('Users').select({
            filterByFormula: `{email} = '${email}'`,
            maxRecords: 1
        }).firstPage();

        const userPlan = userRecords.length > 0 ? (userRecords[0].fields.subscription_tier as string || 'Free') : 'Free';

        // Plan limits
        const limits: Record<string, { maxSolutions: number; maxVIP: number }> = {
            'Free': { maxSolutions: 1, maxVIP: 1 },
            'Standard': { maxSolutions: 3, maxVIP: 1 },
            'Premium': { maxSolutions: 5, maxVIP: 5 },
            'Platinum': { maxSolutions: 999, maxVIP: 999 }
        };

        const currentLimit = limits[userPlan] || limits['Free'];

        // Check solution count limit
        if (solutionCount >= currentLimit.maxSolutions) {
            return res.status(403).json({
                error: 'Solution limit reached',
                message: `Your ${userPlan} plan allows up to ${currentLimit.maxSolutions} solution(s). Upgrade to add more.`,
                upgradeRequired: true
            });
        }

        // Check VIP tier limit
        if (tier === 'VIP' && vipCount >= currentLimit.maxVIP) {
            return res.status(403).json({
                error: 'VIP solution limit reached',
                message: `Your ${userPlan} plan allows up to ${currentLimit.maxVIP} VIP solution(s). Upgrade for more VIP slots.`,
                upgradeRequired: true
            });
        }

        // 3. Create Signature Solution Record
        await base('Signature_Solutions').create([
            {
                fields: {
                    Doctor: [doctorId], // Link to Doctor
                    Title: title,
                    Concept: concept,
                    Description: description,
                    Devices: machines, // Text field
                    Skin_Boosters: skin_boosters,
                    Injection_Methods: injection_methods,
                    Treatment_Focus: treatment_focus,
                    Tier: tier || 'Standard', // New Field: Entry/Standard/VIP
                    Downtime: downtime, // Single select
                    Pain_Level: pain,    // Single select
                    Price_Range: price,
                    Status: 'Active'
                },
            },
        ]);

        console.log(`[DOCTOR] Signature Solution created for ${email}`);

        // 4. Update Doctor Status
        await base('Doctors').update([
            {
                id: doctorId,
                fields: {
                    status: 'Active'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            solutionCount: solutionCount + 1,
            limit: currentLimit.maxSolutions
        });
    } catch (error: any) {
        console.error('Signature Solution Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
