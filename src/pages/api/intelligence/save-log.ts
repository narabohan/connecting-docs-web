import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * Patient Log Service
 * Automatically saves every analysis session to ConnectingDocs_Intelligence
 */

const INTELLIGENCE_DIR = path.join(
    process.cwd(),
    '..',
    'ConnectingDocs_Intelligence',
    'patient_logs'
);

interface PatientLogData {
    sessionId: string;
    timestamp: string;
    userId?: string;
    userEmail?: string;
    tallyData: any;
    analysisInput: any;
    reportId?: string;
}

export function savePatientLog(data: PatientLogData): boolean {
    try {
        // Ensure directory exists
        if (!fs.existsSync(INTELLIGENCE_DIR)) {
            fs.mkdirSync(INTELLIGENCE_DIR, { recursive: true });
        }

        // Generate filename
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = date.toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
        const filename = `patient_log_${dateStr}_${timeStr}_${data.sessionId}.json`;
        const filepath = path.join(INTELLIGENCE_DIR, filename);

        // Anonymize user data
        const anonymizedData = {
            ...data,
            userId: data.userId ? `user_anon_${Buffer.from(data.userId).toString('base64').slice(0, 8)}` : undefined,
            userEmail: data.userEmail ? '***@***.***' : undefined,
            _original_timestamp: data.timestamp,
            _logged_at: new Date().toISOString()
        };

        // Write to file
        fs.writeFileSync(filepath, JSON.stringify(anonymizedData, null, 2));

        console.log(`[PATIENT_LOG] Saved to: ${filename}`);
        return true;
    } catch (error) {
        console.error('[PATIENT_LOG] Failed to save:', error);
        return false;
    }
}

/**
 * API Endpoint for manual log testing
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const logData: PatientLogData = {
        sessionId: req.body.sessionId || `session_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: req.body.userId,
        userEmail: req.body.userEmail,
        tallyData: req.body.tallyData || {},
        analysisInput: req.body.analysisInput || {},
        reportId: req.body.reportId
    };

    const success = savePatientLog(logData);

    if (success) {
        return res.status(200).json({
            success: true,
            message: 'Patient log saved to ConnectingDocs_Intelligence'
        });
    } else {
        return res.status(500).json({
            success: false,
            error: 'Failed to save patient log'
        });
    }
}
