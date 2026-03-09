import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Basic Stats (Counts)
        // Note: Airtable full counts require iterating or using a view with metadata. 
        // For simplicity in V1, we fetch the first page or use maxRecords to get a sense.
        // For real production, we'd use a summary table or count fields.

        const patientsPage = await base('Patients_v1').select({ maxRecords: 100, sort: [{ field: 'Timestamp', direction: 'desc' }] }).firstPage();
        const reportsPage = await base('Reports').select({ maxRecords: 100 }).firstPage();
        const matchesPage = await base('Matches').select({ maxRecords: 100 }).firstPage();

        // 2. Recent Leads (Patients)
        const recentLeads = patientsPage.slice(0, 5).map(r => ({
            id: r.id,
            email: r.fields['Email'] || 'Anonymous',
            goal: r.fields['Primary_Goal'] || 'General',
            country: r.fields['Country'] || 'Unknown',
            timestamp: r.fields['Timestamp'] || r.get('Created_at'),
            status: r.fields['Status'] || 'New'
        }));

        // 3. System Health (Airtable Connections)
        const signaturePoolCount = await base('Protocol_block').select({
            filterByFormula: '{is_signiture_solution} = 1',
            fields: ['protocol_name']
        }).all();

        // 4. Summarize stats
        const stats = {
            totalPatients: patientsPage.length, // Simplified count
            totalReports: reportsPage.length,
            totalMatches: matchesPage.length,
            signaturePoolSize: signaturePoolCount.length,
            recentLeads
        };

        res.status(200).json(stats);
    } catch (error: any) {
        console.error('[ADMIN_STATS] Error:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
}
