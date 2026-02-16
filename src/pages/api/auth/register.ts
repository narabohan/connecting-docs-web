import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import bcrypt from 'bcryptjs';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { role, name, email, password, hospital_name, license_number, country, specialties } = req.body;

    if (!email || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        if (role === 'patient') {
            if (!password) {
                return res.status(400).json({ error: 'Password is required for patients' });
            }
            const password_hash = await bcrypt.hash(password, 10);

            await base('Users').create([
                {
                    fields: {
                        name,
                        email,
                        password_hash,
                        // Tally ID will be synced later or passed if available from session
                    },
                },
            ]);
        } else if (role === 'doctor') {
            await base('Doctors').create([
                {
                    fields: {
                        name,
                        email,
                        hospital_name,
                        license_number,
                        country,
                        specialty_tags: specialties ? specialties.join(', ') : '', // Convert array to string for text field if needed, or array if multi-select
                        status: 'Pending'
                    },
                },
            ]);
        } else {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Mock Notification
        console.log(`[NOTIFICATION] New ${role} signed up: ${email}`);

        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
