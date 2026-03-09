import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { matchId, note } = req.body;

    if (!matchId) {
        return res.status(400).json({ message: 'matchId is required' });
    }

    try {
        const matchesTable = base('Matches');

        // Update status to "Contacted" and optionally add a note + contacted timestamp
        const fields: Record<string, any> = {
            Status: 'Contacted',
            Contacted_At: new Date().toISOString(),
        };

        if (note) {
            fields['Doctor_Note'] = note;
        }

        await matchesTable.update(matchId, fields);

        return res.status(200).json({ success: true, matchId, status: 'Contacted' });
    } catch (error: any) {
        console.error('Error marking contacted:', error);
        return res.status(500).json({ error: error.message });
    }
}
