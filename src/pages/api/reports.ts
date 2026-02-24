import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.query;
    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // 1. Users 테이블에서 해당 이메일의 유저 ID 조회
        const userRecords = await base('Users').select({
            filterByFormula: `{email} = '${email.replace(/'/g, "\\'")}'`,
            maxRecords: 1,
        }).firstPage();

        if (userRecords.length === 0) {
            return res.status(200).json({ reports: [] });
        }

        const userId = userRecords[0].id;

        // 2. Reports 테이블에서 해당 유저의 리포트 조회 (FIND로 링크 필드 필터)
        const records = await base('Reports').select({
            filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
            sort: [{ field: 'Created_at', direction: 'desc' }],
            maxRecords: 20,
        }).all().catch(async () => {
            // Created_at 필드가 없을 경우 정렬 없이 재시도
            return base('Reports').select({
                filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
                maxRecords: 20,
            }).all();
        });

        const reports = records.map(r => {
            // Output_JSON에서 top 추천 파싱 시도
            let topRecommendation = '';
            let matchScore: number | null = null;
            let primaryGoal = '';
            let skinType = '';

            try {
                const output = JSON.parse(r.fields.Output_JSON as string || '{}');
                topRecommendation = output.rank1?.protocol || '';
                matchScore = output.rank1?.score ?? null;
            } catch { /* ignore */ }

            try {
                const input = JSON.parse(r.fields.Input_JSON as string || '{}');
                primaryGoal = input.primaryGoal || '';
                skinType = input.skinType || '';
            } catch { /* ignore */ }

            return {
                id: r.id,
                date: r.fields.Created_at || r.fields.created_at || '',
                topRecommendation,
                matchScore,
                primaryGoal,
                skinType,
                status: (r.fields.Status as string) || 'completed',
            };
        });

        res.status(200).json({ reports });
    } catch (error: any) {
        console.error('Reports API Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
