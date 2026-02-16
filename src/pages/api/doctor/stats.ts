
import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.query;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Missing email' });
    }

    try {
        // 1. Fetch Doctor Record
        const doctorRecords = await base('Doctors').select({
            filterByFormula: `{email} = '${email}'`,
            maxRecords: 1
        }).firstPage();

        if (doctorRecords.length === 0) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        const doctor = doctorRecords[0];
        const doctorId = doctor.id;

        // 2. Fetch Match Count
        // Query Matches table for records where Doctor links to this ID
        // Note: Linked records are arrays. Formula: FIND('recID', ARRAYJOIN({Doctor}))
        // const matches = await base('Matches').select({
        //     filterByFormula: `FIND('${doctorId}', ARRAYJOIN({Doctor}))`,
        //     fields: ['Match_ID'] // optimize fetch
        // }).all();

        // Optimization: For MVP, maybe we just trust the 'Match_Appearances' field in Doctor table if we had a rollup?
        // But for real-time, let's query. Or assume 'Matches' table has a 'Doctor_Email' lookup? No.
        // Let's try the FIND formula.

        const matchRecords = await base('Matches').select({
            filterByFormula: `SEARCH('${doctorId}', ARRAYJOIN({Doctor})) > 0`,
            fields: ['Match_ID']
        }).all();

        const matchCount = matchRecords.length;

        // 3. Current Stats
        const currentPoints = (doctor.get('Points') as number) || 0;
        const tier = (doctor.get('Tier') as string) || 'Bronze';

        // 4. Calculate Next Reward / Tier
        let nextTier = 'Silver';
        let pointsToNext = 1000 - currentPoints;

        if (currentPoints >= 5000) {
            nextTier = 'Diamond';
            pointsToNext = 0;
        } else if (currentPoints >= 2500) {
            nextTier = 'Platinum';
            pointsToNext = 5000 - currentPoints;
        } else if (currentPoints >= 1000) {
            nextTier = 'Gold';
            pointsToNext = 2500 - currentPoints;
        } else {
            // Bronze -> Silver
            pointsToNext = 1000 - currentPoints;
        }

        if (pointsToNext < 0) pointsToNext = 0;
        const progressPercent = Math.min(100, Math.max(0, ((1000 - pointsToNext) / 1000) * 100)); // Simplified linear progress for demo

        res.status(200).json({
            points: currentPoints,
            tier,
            matchCount,
            nextTier,
            pointsToNext,
            progressPercent
        });

    } catch (error: any) {
        console.error('Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
}
