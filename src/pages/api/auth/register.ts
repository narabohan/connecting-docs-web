import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import bcrypt from 'bcryptjs';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        role, name, email, password,
        gender, age_group, country, language,
        primary_concerns, past_treatments,
        hospital_name, license_number, specialties
    } = req.body;

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
                        gender: gender || '',
                        age_group: age_group || '',
                        country: country || '',
                        language: language || 'KO',
                        primary_concerns: Array.isArray(primary_concerns)
                            ? primary_concerns.join(', ')
                            : (primary_concerns || ''),
                        past_treatments: Array.isArray(past_treatments)
                            ? past_treatments.join(', ')
                            : (past_treatments || ''),
                        role: 'patient',
                        created_at: new Date().toISOString(),
                    },
                },
            ]);

        } else if (role === 'doctor') {
            await base('Doctors').create([
                {
                    fields: {
                        name,
                        email,
                        hospital_name: hospital_name || '',
                        license_number: license_number || '',
                        country: country || '',
                        language: language || 'KO',
                        specialty_tags: Array.isArray(specialties)
                            ? specialties.join(', ')
                            : (specialties || ''),
                        status: 'Pending',
                        plan: 'Basic',
                        created_at: new Date().toISOString(),
                    },
                },
            ]);
        } else {
            return res.status(400).json({ error: 'Invalid role' });
        }

        console.log(`[NOTIFICATION] New ${role} signed up: ${email}`);
        res.status(200).json({ success: true });

    } catch (error: any) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
