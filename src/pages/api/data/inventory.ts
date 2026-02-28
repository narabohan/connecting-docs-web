
import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const records = await base('Equipment_Inventory').select({
            view: 'Grid view'
        }).all();

        const inventory = records.map(record => ({
            id: record.id,
            name: record.get('Name') as string,
            category: record.get('Category') as string,
            description: record.get('Description') as string
        }));

        // Group by category for easier frontend use
        const grouped = inventory.reduce((acc, item) => {
            const cat = item.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {} as Record<string, typeof inventory>);

        res.status(200).json({
            items: inventory,
            grouped
        });
    } catch (error) {
        console.error('Inventory fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
}
