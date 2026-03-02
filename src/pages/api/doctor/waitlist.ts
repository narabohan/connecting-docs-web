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
        // 1. Get Doctor's User ID
        const usersTable = base('Users');
        const userRecords = await usersTable.select({
            filterByFormula: `{email} = '${email}'`,
            maxRecords: 1,
        }).firstPage();

        if (userRecords.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const doctorId = userRecords[0].id;

        // 2. Fetch matches where Doctor_Link matches
        const matchesTable = base('Matches');

        // We look for matches assigned to this doctor. 
        // Note: Field names must correspond to Airtable.
        const matchRecords = await matchesTable.select({
            filterByFormula: `FIND('${doctorId}', {Doctor_Link})`,
            sort: [{ field: 'Created', direction: 'desc' }]
        }).all();

        const waitlist = await Promise.all(matchRecords.map(async doc => {
            let patientEmail = 'Anonymous';
            let primaryObject = 'General Rejuvenation';
            let riskFactors: string[] = [];
            let reportId = '';

            if (doc.fields.Patient && Array.isArray(doc.fields.Patient) && doc.fields.Patient.length > 0) {
                const patientId = doc.fields.Patient[0];
                try {
                    const p = await base('Patients_v1').find(patientId);
                    patientEmail = p.fields.email as string || patientEmail;

                    // Basic risk parsing if available on Patient record
                    if (p.fields.Age) primaryObject = `Age ${p.fields.Age}`;
                } catch (e) {
                    try {
                        const u = await base('Users').find(patientId);
                        patientEmail = u.fields.email as string || patientEmail;
                    } catch (e2) { }
                }
            }

            // Attempt to load rich data from the linked Report if it exists
            if (doc.fields.Report && Array.isArray(doc.fields.Report) && doc.fields.Report.length > 0) {
                try {
                    reportId = doc.fields.Report[0];
                    const reportDoc = await base('Reports').find(reportId);
                    const rawJson = reportDoc.fields.Raw_JSON as string;
                    if (rawJson) {
                        const parsed = JSON.parse(rawJson);
                        if (parsed.Survey_Responses) {
                            if (parsed.Survey_Responses['1. Primary Goal']) {
                                primaryObject = parsed.Survey_Responses['1. Primary Goal'];
                            }

                            // Check common risk boolean strings
                            const risks: string[] = [];
                            if (parsed.Survey_Responses['5. Melasma/Pigmentation']?.toLowerCase() === 'yes') risks.push('Melasma Risk');
                            if (parsed.Survey_Responses['6. Active Acne']?.toLowerCase() === 'yes') risks.push('Active Acne');
                            if (parsed.Survey_Responses['7. Sensitive Skin/Redness']?.toLowerCase() === 'yes') risks.push('Sensitive');
                            riskFactors = risks;
                        }
                    }
                } catch (e) { console.error('Error parsing report data in waitlist payload', e); }
            }

            return {
                id: doc.id,
                patientEmail: patientEmail,
                status: doc.fields.Status || 'New',
                score: doc.fields.Algorithm_Score || 'N/A',
                solutionId: doc.fields.Solution_ID || '',
                createdAt: doc.fields.Match_Date || doc._rawJson.createdTime || new Date().toISOString(),
                reportId: reportId,
                primaryObject,
                riskFactors
            };
        }));

        res.status(200).json({ waitlist });
    } catch (error: any) {
        console.error('Error fetching waitlist:', error);
        res.status(500).json({ error: error.message });
    }
}
