
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { priceId, tierName } = req.body;
    const mode = process.env.STRIPE_MODE || 'sandbox';

    console.log(`[Billing] Creating session for ${tierName} (${priceId}) in ${mode} mode`);

    try {
        if (mode === 'sandbox') {
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Return a simulated success URL (which would be the dashboard or report page)
            return res.status(200).json({
                url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/report/demo?upgrade=success&tier=${tierName}`,
                mock: true
            });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('Missing STRIPE_SECRET_KEY');
        }

        // Initialize Stripe ONLY when needed and with the correct version
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-01-27.acacia' as any, // TypeScript might complain about exact string match, casting to any is safest for build
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/report/demo?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?canceled=true`,
        });

        res.status(200).json({ url: session.url });
    } catch (err: any) {
        console.error('[Billing Error]', err);
        res.status(500).json({ statusCode: 500, message: err.message });
    }
}
