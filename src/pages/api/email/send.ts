
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, subject, html, data } = req.body;

    if (!to) {
        return res.status(400).json({ error: 'Missing recipient' });
    }

    // MOCK RESEND
    console.log('--- [MOCK EMAIL SERVICE] ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Payload Data:`, data ? JSON.stringify(data).slice(0, 100) + '...' : 'None');
    console.log('--- [END MOCK] ---');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return res.status(200).json({ success: true, id: 'mock_email_id_' + Date.now() });
}
