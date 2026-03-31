import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import { Resend } from 'resend';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { uid, email, name, photoUrl, provider, role } = req.body;

        if (!uid || !email) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const usersTable = base('Users');

        // Check if user already exists in Airtable
        const existingUsers = await usersTable.select({
            filterByFormula: `{firebase_uid} = '${uid}'`,
            maxRecords: 1,
        }).firstPage();

        let isNewUser = false;
        let recordId = '';

        if (existingUsers.length > 0) {
            // User exists, return the Airtable record ID and potentially updated role
            recordId = existingUsers[0].id;
            const dbRole = existingUsers[0].fields.role as string;

            // We return dbRole so the frontend can update its context if Airtable changed it
            return res.status(200).json({ success: true, recordId, isNewUser, dbRole });
        } else {
            // New user, create record
            isNewUser = true;
            const newRecord = await usersTable.create([
                {
                    fields: {
                        firebase_uid: uid,
                        email: email,
                        name: name || email.split('@')[0], // fallback to email prefix if name is empty
                        provider: provider || 'unknown',
                        role: role || 'patient',
                        ...(photoUrl ? { photo_url: photoUrl } : {}),
                    }
                }
            ]);
            recordId = newRecord[0].id;

            // Send Notification to Admin
            const adminEmail = process.env.ADMIN_EMAIL;
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

            if (adminEmail && process.env.RESEND_API_KEY) {
                try {
                    await resend.emails.send({
                        from: `ConnectingDocs <${fromEmail}>`,
                        to: adminEmail,
                        subject: `🎉 새 유저 가입 알림: ${name || email}`,
                        html: `
                            <div style="font-family: sans-serif; p-line-height: 1.5;">
                                <h2>새로운 유저가 가입했습니다!</h2>
                                <ul>
                                    <li><strong>이름:</strong> ${name || '미입력'}</li>
                                    <li><strong>이메일:</strong> ${email}</li>
                                    <li><strong>권한(Role):</strong> ${role || 'patient'}</li>
                                    <li><strong>가입 방식:</strong> ${provider}</li>
                                </ul>
                                <p>Airtable의 Users 테이블에서 확인하실 수 있습니다.</p>
                            </div>
                        `
                    });
                    console.log(`Admin notification sent to ${adminEmail} for new user ${email}`);
                } catch (emailError) {
                    console.error('Failed to send admin notification email:', emailError);
                    // We don't want to fail the sync just because the email failed
                }
            }
        }

        return res.status(200).json({ success: true, recordId, isNewUser, dbRole: role || 'patient' });
    } catch (error: any) {
        console.error('Error syncing user to Airtable:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
