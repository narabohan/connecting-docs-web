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

        // 2. Fetch matches or solutions to calculate points
        const solutionsTable = base('doctor_signiture_solution');
        const solutionRecords = await solutionsTable.select({
            filterByFormula: `FIND('${userId}', {User_Link})`,
        }).all();

        // Calculate points based on mock adoptions/saves since Matches MVP is minimal right now
        let totalSaves = 0;
        let totalAdoptions = 0;

        solutionRecords.forEach(doc => {
            const saves = (doc.fields.saves as number) || Math.floor(Math.random() * 20);
            const adoptions = (doc.fields.adoptions as number) || Math.floor(Math.random() * 5);
            totalSaves += saves;
            totalAdoptions += adoptions;
        });

        // Gamification Formula (Base logic)
        // 10 points per save, 50 points per adoption
        const points = (totalSaves * 10) + (totalAdoptions * 50) + 1250; // Add base 1250 for testing visuals

        // Tier Logic
        let tier = 'Bronze';
        let nextTier = 'Silver';
        let tierThreshold = 0;
        let nextThreshold = 2000;

        if (points >= 10000) {
            tier = 'Diamond';
            nextTier = 'Max';
            tierThreshold = 10000;
            nextThreshold = 10000;
        } else if (points >= 5000) {
            tier = 'Platinum';
            nextTier = 'Diamond';
            tierThreshold = 5000;
            nextThreshold = 10000;
        } else if (points >= 2000) {
            tier = 'Gold';
            nextTier = 'Platinum';
            tierThreshold = 2000;
            nextThreshold = 5000;
        } else if (points >= 500) {
            tier = 'Silver';
            nextTier = 'Gold';
            tierThreshold = 500;
            nextThreshold = 2000;
        }

        const pointsToNext = nextTier === 'Max' ? 0 : nextThreshold - points;
        const progressPercent = nextTier === 'Max' ? 100 : Math.max(0, Math.min(100, ((points - tierThreshold) / (nextThreshold - tierThreshold)) * 100));

        res.status(200).json({
            points,
            tier,
            matchCount: totalSaves,
            nextTier,
            pointsToNext,
            progressPercent
        });
    } catch (error: any) {
        console.error('Error fetching doctor stats:', error);
        res.status(500).json({ error: error.message });
    }
}
