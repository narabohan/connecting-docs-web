/**
 * POST /api/detail/enrich
 * Layer 2: Claude enrichment for DeviceDetailModal
 *
 * Body: { type: 'device'|'booster', itemName: string, patientContext: {...}, language: string }
 * Returns: { enrichment: string }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { type, itemName, patientContext = {}, language = 'EN' } = req.body;
    if (!itemName) return res.status(400).json({ error: 'itemName required' });

    const langMap: Record<string, string> = {
        KO: 'Korean', EN: 'English', JP: 'Japanese', CN: 'Mandarin Chinese'
    };
    const responseLang = langMap[language] || 'English';

    const contextStr = [
        patientContext.primaryGoal && `Primary goal: ${patientContext.primaryGoal}`,
        patientContext.skinType && `Skin type: ${patientContext.skinType}`,
        patientContext.budget && `Budget preference: ${patientContext.budget}`,
    ].filter(Boolean).join(', ') || 'general patient';

    const prompt = type === 'device'
        ? `In 2-3 sentences in ${responseLang}, explain why the medical aesthetic device "${itemName}" would specifically benefit a patient with these characteristics: ${contextStr}. Focus on the clinical benefit and mechanism. Be specific and empathetic, not generic.`
        : `In 2-3 sentences in ${responseLang}, explain the clinical benefit of the skin booster "${itemName}" for a patient with: ${contextStr}. Mention the mechanism and why it pairs well with their profile. Be specific, warm, and accessible.`;

    try {
        const msg = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            messages: [{ role: 'user', content: prompt }],
        });

        const enrichment = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
        return res.status(200).json({ enrichment });
    } catch (error: any) {
        console.error('[detail/enrich]', error);
        return res.status(500).json({ enrichment: null });
    }
}
