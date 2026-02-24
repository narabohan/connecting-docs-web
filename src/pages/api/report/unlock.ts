import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email, reportId } = req.body;

    if (!email || !reportId) {
        return res.status(400).json({ message: 'Email and reportId are required' });
    }

    try {
        // 1. Fetch the Report to get recommended solutions/doctors
        const reportsTable = base('Reports');
        const reportRecords = await reportsTable.select({
            filterByFormula: `OR(FIND('${reportId}', {User_Link}), {Title} = 'Report for User ${reportId}')`,
            maxRecords: 1,
        }).firstPage();

        if (reportRecords.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const reportJSONStr = reportRecords[0].fields.Result_JSON as string;
        let recommendations = [];
        let patientProfile: any = null;

        if (reportJSONStr) {
            const reportData = JSON.parse(reportJSONStr);
            recommendations = reportData.recommendations || [];
            patientProfile = reportData.patient || {};
        }

        // 2. Resolve Patient ID
        let patientId = reportRecords[0].fields.User_Link ? (reportRecords[0].fields.User_Link as string[])[0] : null;

        if (!patientId) {
            // Find by email in Users
            try {
                const users = await base('Users').select({
                    filterByFormula: `OR({email} = '${email}', {Email} = '${email}')`,
                    maxRecords: 1
                }).firstPage();

                if (users.length > 0) {
                    patientId = users[0].id;
                } else {
                    const newUser = await base('Users').create([{
                        fields: {
                            email: email,
                            name: 'Guest User',
                            role: 'patient'
                        }
                    }]);
                    patientId = newUser[0].id;
                }
            } catch (e) {
                console.error("Error finding or creating user:", e);
                // Fallback to anonymous if creation fails
                patientId = reportRecords[0].id; // Just use report ID if all fails
            }
        }

        // 3. Determine mapped doctors
        let topDoctorLinks: string[] = [];
        let score = 0;

        if (recommendations.length > 0) {
            const topRec = recommendations[0];
            score = topRec.matchScore || 0;
            const proto = topRec.proto || {};
            // Assuming proto links to doctor directly via User_Link or Doctor_Link
            if (proto.fields && proto.fields.User_Link) {
                topDoctorLinks = proto.fields.User_Link;
            } else if (topRec.doctorId && topRec.doctorId !== 'unknown') {
                topDoctorLinks = [topRec.doctorId];
            }
        }

        const matchesTable = base('Matches');
        await matchesTable.create([
            {
                fields: {
                    Patient: [patientId],
                    ...(topDoctorLinks.length > 0 ? { Doctor: topDoctorLinks } : {}),
                    Algorithm_Score: score,
                    Status: 'New',
                    Match_Date: new Date().toISOString().split('T')[0]
                }
            }
        ]);

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Error creating unlock match:', error);
        return res.status(500).json({ error: error.message });
    }
}
