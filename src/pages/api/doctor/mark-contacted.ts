import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST' && req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { matchId } = req.body;

    if (!matchId) {
        return res.status(400).json({ message: 'matchId is required' });
    }

    try {
        const matchesTable = base('Matches');

        await matchesTable.update([
            {
                id: matchId,
                fields: {
                    Status: 'Contacted',
                    Contacted_At: new Date().toISOString()
                }
            }
        ]);

        return res.status(200).json({ success: true, message: 'Patient marked as contacted.' });
    } catch (error: any) {
        console.error('Error marking contacted:', error);
        return res.status(500).json({ error: error.message });
    }
}
