import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.query;
    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Fetch signature solutions for this doctor
        const records = await base('signature_solutions').select({
            filterByFormula: `{doctor_email} = '${email.replace(/'/g, "\\'")}'`,
            sort: [{ field: 'created_at', direction: 'desc' }],
        }).all();

        const solutions = records.map(r => ({
            id: r.id,
            name: r.fields.solution_name || r.fields.Name || '',
            tier: r.fields.tier || 'Basic',
            clicks: Number(r.fields.clicks || 0),
            saves: Number(r.fields.saves || 0),
            adoptions: Number(r.fields.adoptions || 0),
            matchCount: Number(r.fields.match_count || 0),
            status: r.fields.status || 'active',
            targetConditions: r.fields.target_conditions || '',
            createdAt: r.fields.created_at || '',
        }));

        // Aggregate stats
        const totalClicks = solutions.reduce((acc, s) => acc + s.clicks, 0);
        const totalSaves = solutions.reduce((acc, s) => acc + s.saves, 0);
        const totalAdoptions = solutions.reduce((acc, s) => acc + s.adoptions, 0);
        const totalMatches = solutions.reduce((acc, s) => acc + s.matchCount, 0);

        res.status(200).json({
            solutions,
            stats: { totalClicks, totalSaves, totalAdoptions, totalMatches },
        });
    } catch (error: any) {
        console.error('Doctor Solutions API Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
