
import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

type MatchResult = {
    doctorId: string;
    doctorName: string;
    description: string; // Doctor's solution description
    score: number;
    matchDetails: string[];
    hospitalName?: string;
    solutionTitle: string;
    priceRange: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { reportId } = req.body;

    if (!reportId) {
        return res.status(400).json({ error: 'Missing reportId' });
    }

    try {
        // 1. Fetch Patient Report
        const reportRecord = await base('Reports').find(reportId);
        const inputJson = JSON.parse(reportRecord.get('Input_JSON') as string || '{}');
        const outputJson = JSON.parse(reportRecord.get('Output_JSON') as string || '{}');

        // Extract Patient Criteria
        const patientGoal = (inputJson.primaryGoal || '').toLowerCase(); // e.g. "lifting", "volume"
        const patientPain = inputJson.painTolerance || 'Mid'; // Low, Mid, High
        const patientDowntime = inputJson.downtimeTolerance || 'Mid'; // None, Low, Mid, High

        // AI Recommended Protocol Keywords (Simple extraction)
        const recommendedProtocol = (outputJson.rank1?.protocol || '').toLowerCase();

        // 2. Fetch All Doctor Solutions (In MVP, fetch all. In Prod, filter by Status='Approved')
        // For testing, we verify 'Under Review' or 'Pending Review' too if 'Approved' is empty
        const solutions = await base('Signature_Solutions').select({
            // filterByFormula: "{Status} = 'Approved'", // Commented out for testing
            view: 'Grid view'
        }).all();

        // 3. Helper for scoring
        const calculateScore = (solution: any) => {
            let score = 0;
            const details: string[] = [];

            // A. Symptom/Focus Match (40pts)
            const docFocus = (solution.get('Treatment_Focus') as string || '').toLowerCase();
            if (docFocus && patientGoal.includes(docFocus)) {
                score += 40;
                details.push(`Addresses your goal of ${docFocus}`);
            } else if (docFocus === 'texture' && (patientGoal.includes('pore') || patientGoal.includes('scar'))) {
                score += 40;
                details.push(`Addresses your concern for texture/pores`);
            } else if (docFocus === 'lifting' && (patientGoal.includes('sagging') || patientGoal.includes('elasticity'))) {
                score += 40;
                details.push(`Specializes in lifting`);
            }

            // B. Device/Protocol Match (30pts)
            const docDevices = (solution.get('Devices') as string || '').toLowerCase();
            const docBoosters = ((solution.get('Skin_Boosters') as string[]) || []).join(' ').toLowerCase();

            // Check overlaps with Recommended Protocol
            // e.g. Rec: "Ulthera" -> Doc has "Ulthera"
            const keywords = ['ulthera', 'shurink', 'inmode', 'forma', 'titan', 'potenza', 'rejuran', 'juvelook', 'ldm', 'pico', 'thermage', 'exosomes'];

            let deviceMatch = false;
            for (const key of keywords) {
                if (recommendedProtocol.includes(key) && (docDevices.includes(key) || docBoosters.includes(key))) {
                    score += 30;
                    details.push(`Uses ${key} as recommended`);
                    deviceMatch = true;
                    break;
                }
            }
            // Fallback: If no direct keyword match, check generic category match? (Skipped for MVP)

            // C. Constraints (25pts)
            // Pain
            const docPain = solution.get('Pain_Level') as string; // Low, Mid, High
            let painScore = 0;
            if (patientPain === 'High') painScore = 15; // Can tolerate anything
            else if (patientPain === 'Mid' && docPain !== 'High') painScore = 15;
            else if (patientPain === 'Low' && docPain === 'Low') painScore = 15;

            if (painScore > 0) {
                score += 15;
                // details.push("Matches pain tolerance");
            }

            // Downtime
            const docDowntime = solution.get('Downtime') as string; // None, Low, Mid, High
            let downtimeScore = 0;
            // logic: If patient wants 'None', doc must be 'None'. If 'Low', doc can be 'None' or 'Low'.
            const levels = { 'None': 0, 'Low': 1, 'Mid': 2, 'High': 3 };
            const pLevel = levels[patientDowntime as keyof typeof levels] || 2;
            const dLevel = levels[docDowntime as keyof typeof levels] || 2;

            if (dLevel <= pLevel) {
                score += 10;
                details.push("Fits downtime preference");
            }

            // D. Bonus: Location/Hospital (5pts) -> Skipped for now, assume generic +5
            score += 5;

            return { score, details };
        };

        // 4. Rank Solutions
        const rankedResults: MatchResult[] = [];

        for (const sol of solutions) {
            const { score, details } = calculateScore(sol);

            // Fetch Doctor Name (Linked Record)
            // 'Doctor' field returns array of IDs [recXXX]. We might need to fetch names if not expanded.
            // But we can just use the ID and let frontend fetch or use what we have.
            // Actually Airtable SDK might strictly return IDs for linked fields unless looked up.
            // For MVP, we'll try to get name if possible or just return generic.

            // Wait, we need the HOSPITAL name. That's in the Doctors table.
            // Since we can't efficiently join in one API call easily without 'linked record' expansion complexity or separate fetches.
            // We will do a quick fetch of the doctor record.
            const doctorIds = sol.get('Doctor') as string[];
            let doctorName = 'Unknown Doctor';
            let hospitalName = 'Partner Clinic';

            if (doctorIds && doctorIds.length > 0) {
                // Optimization: We could cache these or fetch all doctors once.
                // For MVP with few doctors, finding by ID is okay.
                try {
                    const doc = await base('Doctors').find(doctorIds[0]);
                    doctorName = doc.get('name') as string;
                    hospitalName = doc.get('hospital_name') as string || hospitalName;
                } catch (e) { /* ignore */ }
            }

            rankedResults.push({
                doctorId: doctorIds ? doctorIds[0] : 'unknown',
                doctorName,
                hospitalName,
                solutionTitle: sol.get('Title') as string,
                description: sol.get('Concept') as string || sol.get('Description') as string,
                score,
                matchDetails: details,
                priceRange: sol.get('Price_Range') as string
            });
        }

        // Sort by Score Descending
        rankedResults.sort((a, b) => b.score - a.score);

        // Top 3
        const top3 = rankedResults.slice(0, 3);

        // 5. Persist Matches to Airtable
        // We need the Patient's User ID. We can get it from the Report record.
        const patientId = reportRecord.get('User') ? (reportRecord.get('User') as string[])[0] : null;

        if (patientId) {
            const matchesToCreate = top3.map(match => ({
                fields: {
                    Patient: [patientId],
                    Doctor: [match.doctorId],
                    Algorithm_Score: match.score,
                    Status: 'New',
                    Match_Date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
                }
            }));

            // Airtable creates max 10 at a time. We have 3.
            try {
                await base('Matches').create(matchesToCreate);
                console.log(`[MATCH] Saved ${matchesToCreate.length} matches for Patient ${patientId}`);
            } catch (dbErr) {
                console.error("Failed to save matches to DB", dbErr);
            }
        }

        res.status(200).json({ matches: top3 });

    } catch (error: any) {
        console.error('Matching Engine Error:', error);
        res.status(500).json({ error: error.message || 'Matching failed' });
    }
}
