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
        const records = await base('patient_logs').select({
            filterByFormula: `{email} = '${email.replace(/'/g, "\\'")}'`,
            sort: [{ field: 'created_at', direction: 'desc' }],
            maxRecords: 20,
        }).all();

        const reports = records.map(r => ({
            id: r.id,
            date: r.fields.created_at || r.fields.Date || '',
            topRecommendation: r.fields.top_recommendation || r.fields.Top_Recommendation || '',
            matchScore: r.fields.match_score || r.fields.Match_Score || null,
            primaryGoal: r.fields.primaryGoal || r.fields.primary_goal || '',
            skinType: r.fields.skinType || r.fields.skin_type || '',
            status: r.fields.status || 'completed',
        }));

        res.status(200).json({ reports });
    } catch (error: any) {
        console.error('Reports API Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
