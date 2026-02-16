import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, title, concept, description, machines, downtime, pain, price } = req.body;

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

        // 2. Create Signature Solution Record
        // Ensure "Signature_Solutions" table exists in Airtable with these fields
        await base('Signature_Solutions').create([
            {
                fields: {
                    Doctor: [doctorId], // Link to Doctor
                    Title: title,
                    Concept: concept,
                    Description: description,
                    Devices: machines, // Text field
                    Downtime: downtime, // Single select
                    Pain_Level: pain,    // Single select
                    Price_Range: price,
                    Status: 'Pending Review'
                },
            },
        ]);

        console.log(`[DOCTOR] Signature Solution created for ${email}`);

        // 3. Update Doctor Status
        await base('Doctors').update([
            {
                id: doctorId,
                fields: {
                    status: 'Under Review'
                }
            }
        ]);

        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Signature Solution Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
