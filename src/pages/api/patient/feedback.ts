import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const {
        patientEmail,
        reportId,
        overallSatisfaction,
        resultAchieved,
        sideEffects,
        painActual,
        downtimeActual,
        wouldReturn,
        wouldRecommend,
        openFeedback,
        treatmentDate,
        clinicName,
        submittedAt,
    } = req.body;

    try {
        const feedbackFields: Record<string, any> = {
            Patient_Email: patientEmail || 'anonymous',
            Report_ID: reportId || '',
            Overall_Satisfaction: overallSatisfaction,
            Result_Achieved: resultAchieved,
            Side_Effects: Array.isArray(sideEffects) ? sideEffects.join(', ') : '',
            Pain_Actual: painActual,
            Downtime_Actual: downtimeActual,
            Would_Return: wouldReturn === true ? 'Yes' : wouldReturn === false ? 'No' : 'Not answered',
            Would_Recommend: wouldRecommend === true ? 'Yes' : wouldRecommend === false ? 'No' : 'Not answered',
            Open_Feedback: openFeedback || '',
            Treatment_Date: treatmentDate || '',
            Clinic_Name: clinicName || '',
            Submitted_At: submittedAt || new Date().toISOString(),
        };

        try {
            // Try Patient_Feedback table first
            await base('Patient_Feedback').create(feedbackFields);
        } catch {
            // Fall back: update Reports record with feedback summary
            if (reportId) {
                try {
                    await base('Reports').update(reportId, {
                        Patient_Feedback: JSON.stringify({
                            overallSatisfaction,
                            resultAchieved,
                            sideEffects,
                            painActual,
                            downtimeActual,
                            wouldReturn,
                            wouldRecommend,
                            openFeedback,
                            submittedAt,
                        }),
                        Feedback_Score: overallSatisfaction,
                    });
                } catch {
                    console.log('Feedback: no Airtable table configured, skipping storage');
                }
            }
        }

        // Update linked Match record if exists
        if (reportId) {
            try {
                const matches = await base('Matches').select({
                    filterByFormula: `{Report_ID} = '${reportId}'`,
                    maxRecords: 1,
                }).firstPage();

                if (matches.length > 0) {
                    await base('Matches').update(matches[0].id, {
                        Patient_Feedback_Score: overallSatisfaction,
                        Patient_Feedback_Note: openFeedback || '',
                    });
                }
            } catch {
                // Non-critical — ignore
            }
        }

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Feedback API error:', error);
        // Return 200 to avoid bad UX — feedback logging failures shouldn't block the user
        return res.status(200).json({ success: true, warning: 'Feedback logged locally' });
    }
}
