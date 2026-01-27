import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_if_missing', {
    // @ts-ignore
    apiVersion: '2022-11-15',
});

export async function POST(req: NextRequest) {
    try {
        const { amount } = await req.json();

        if (!process.env.STRIPE_SECRET_KEY) {
            // If no key, we can't create a real intent.
            // But we can return a mock secret OR error.
            // Since user WANTS real payment, we should error or warn.
            // However, to keep existing flows working if key missing, maybe we shouldn't crash hard?
            // No, user explicitly asked for Real Payment.
            console.warn("STRIPE_SECRET_KEY is missing!");
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount || 999, // 9.99 EUR
            currency: 'eur',
            payment_method_types: ['card'],
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
        console.error("Stripe Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
