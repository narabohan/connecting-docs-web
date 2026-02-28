import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const email = req.query.email as string;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // 1. Find User ID
        const usersTable = base('Users');
        const userRecords = await usersTable.select({
            filterByFormula: `{email} = '${email}'`,
            maxRecords: 1,
        }).firstPage();

        if (userRecords.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = userRecords[0].id;

        // 2. Fetch doctor's solutions
        const solutionsTable = base('doctor_signiture_solution');

        // Ensure you check the exact field name for linking the doctor in Airtable (e.g., 'User_Link' or 'Doctor')
        // Using a broad search via FIND for robustness if it's an array of links
        const solutionRecords = await solutionsTable.select({
            filterByFormula: `FIND('${userId}', {User_Link})`,
        }).all();

        let totalClicks = 0;
        let totalSaves = 0;
        let totalAdoptions = 0;

        const solutions = solutionRecords.map(doc => {
            // Placeholder: Replace with actual Airtable fields if defined
            const clicks = (doc.fields.clicks as number) || Math.floor(Math.random() * 50);
            const saves = (doc.fields.saves as number) || Math.floor(Math.random() * 20);
            const adoptions = (doc.fields.adoptions as number) || Math.floor(Math.random() * 5);

            totalClicks += clicks;
            totalSaves += saves;
            totalAdoptions += adoptions;

            return {
                id: doc.id,
                name: doc.fields.title || doc.fields.solution_name || 'Unnamed Protocol',
                tier: doc.fields.tier || 'Standard',
                clicks: clicks,
                saves: saves,
                adoptions: adoptions,
                matchCount: saves,
                status: 'Active',
                targetConditions: doc.fields.target_conditions || '',
                createdAt: doc._rawJson.createdTime || new Date().toISOString()
            };
        });

        // Placeholder for Matches table, waitlist
        const totalMatches = totalSaves; // Mocking

        res.status(200).json({
            solutions,
            stats: {
                totalClicks,
                totalSaves,
                totalAdoptions,
                totalMatches
            }
        });
    } catch (error: any) {
        console.error('Error fetching doctor solutions:', error);
        res.status(500).json({ error: error.message });
    }
}
