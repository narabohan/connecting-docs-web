import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import bcrypt from 'bcryptjs';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user by email
        const records = await base('Users').select({
            filterByFormula: `{email} = '${email}'`,
            maxRecords: 1
        }).firstPage();

        if (records.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const userRecord = records[0];
        const storedHash = userRecord.get('password_hash') as string;

        if (!storedHash) {
            return res.status(401).json({ error: 'Invalid login method. Please reset password.' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, storedHash);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Return user session data (Mock Token for now)
        const userData = {
            id: userRecord.id, // Record ID for linking
            name: userRecord.get('name'),
            email: userRecord.get('email'),
            role: 'patient', // Default for now, can be dynamic
            language: userRecord.get('Language') || 'EN'
        };

        res.status(200).json({
            success: true,
            token: `mock-jwt-token-${userRecord.id}`, // In prod, use real JWT
            user: userData
        });

    } catch (error: any) {
        console.error('Login Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
