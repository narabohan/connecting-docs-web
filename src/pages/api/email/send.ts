import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// 발신자 이메일 (Resend에서 검증한 도메인 또는 onboarding@resend.dev 무료 테스트용)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, subject, html, type, data } = req.body;

    if (!to) {
        return res.status(400).json({ error: 'Missing recipient' });
    }

    // RESEND_API_KEY가 없으면 콘솔에 로그
    if (!process.env.RESEND_API_KEY) {
        console.warn('[EMAIL] RESEND_API_KEY not set. Logging email instead:');
        console.log(`To: ${to}\nSubject: ${subject}`);
        return res.status(200).json({ success: true, id: 'no_key_mock_' + Date.now() });
    }

    try {
        const promises: Promise<any>[] = [];

        // 1. 사용자에게 리포트 이메일 발송
        if (to && html) {
            promises.push(
                resend.emails.send({
                    from: FROM_EMAIL,
                    to: [to],
                    subject: subject || '[Connecting Docs] Your Personal Skin Analysis Report',
                    html,
                })
            );
        }

        // 2. 관리자 알림 이메일 (type === 'admin_notify'이거나 ADMIN_EMAIL이 설정된 경우)
        if (ADMIN_EMAIL && data) {
            const adminHtml = `
                <h2>🔔 새 설문 완료 알림</h2>
                <p><strong>사용자 이메일:</strong> ${data.userEmail || to}</p>
                <p><strong>주요 목표:</strong> ${data.primaryGoal || '-'}</p>
                <p><strong>피부 타입:</strong> ${data.skinType || '-'}</p>
                <p><strong>Top 추천:</strong> ${data.topProtocol || '-'}</p>
                ${data.reportId ? `<p><strong>리포트 링크:</strong> <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/report/${data.reportId}">/report/${data.reportId}</a></p>` : ''}
                <hr/>
                <p style="color:#666;font-size:12px">Connecting Docs 자동 알림</p>
            `;
            promises.push(
                resend.emails.send({
                    from: FROM_EMAIL,
                    to: [ADMIN_EMAIL],
                    subject: `[Connecting Docs] 새 환자 설문 완료 - ${data.userEmail || '비회원'}`,
                    html: adminHtml,
                })
            );
        }

        const results = await Promise.all(promises);
        console.log('[EMAIL] Sent successfully:', results.map(r => r.data?.id));
        return res.status(200).json({ success: true, ids: results.map(r => r.data?.id) });

    } catch (error: any) {
        console.error('[EMAIL] Send failed:', error);
        return res.status(500).json({ error: error.message || 'Failed to send email' });
    }
}
