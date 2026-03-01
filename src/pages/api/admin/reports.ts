import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Fetch all recent reports from Airtable
        const records = await base('Reports').select({
            sort: [{ field: 'Created_at', direction: 'desc' }],
            maxRecords: 100,
        }).all().catch(async () => {
            // Fallback if Created_at sorting fails
            return base('Reports').select({
                maxRecords: 100,
            }).all();
        });

        const reports = records.map(r => {
            let topRecommendation = '';
            let matchScore: number | null = null;
            let primaryGoal = '';
            let skinType = '';

            try {
                const output = JSON.parse(r.fields.Output_JSON as string || '{}');
                topRecommendation = output.rank1?.protocol || '';
                matchScore = output.rank1?.score ?? null;
            } catch { /* ignore */ }

            try {
                const input = JSON.parse(r.fields.Input_JSON as string || '{}');
                primaryGoal = input.primaryGoal || '';
                skinType = input.skinType || '';
            } catch { /* ignore */ }

            return {
                id: r.id,
                date: r.fields.Created_at || r.fields.created_at || r._rawJson.createdTime || '',
                topRecommendation,
                matchScore,
                primaryGoal,
                skinType,
                title: r.fields.Title || `Report ${r.id}`,
                status: (r.fields.Status as string) || 'completed',
            };
        });

        res.status(200).json({ reports });
    } catch (error: any) {
        console.error('Admin Reports API Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
