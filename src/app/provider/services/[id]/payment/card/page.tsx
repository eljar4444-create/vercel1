'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { completePayment } from '@/app/actions/payment';
import Link from 'next/link';

// Make sure to add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Make sure to add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function MockCardForm({ serviceId }: { serviceId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        await completePayment(serviceId);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg mb-4 border border-yellow-200">
                ⚠️ Тестовый режим: Stripe ключи не найдены.
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Номер карты</label>
                <Input
                    placeholder="0000 0000 0000 0000"
                    required
                    pattern="\d*"
                    minLength={16}
                    maxLength={19}
                    className="bg-gray-50 border-gray-200"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Срок действия</label>
                    <Input
                        placeholder="MM/YY"
                        required
                        maxLength={5}
                        className="bg-gray-50 border-gray-200"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">CVC</label>
                    <Input
                        placeholder="123"
                        required
                        maxLength={3}
                        type="password"
                        className="bg-gray-50 border-gray-200"
                    />
                </div>
            </div>
            <div className="pt-4">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black hover:bg-gray-800 text-white font-bold h-11 rounded-xl"
                >
                    {isLoading ? 'Обработка (Тест)...' : 'Оплатить 9.99 € (Тест)'}
                </Button>
            </div>
        </form>
    );
}

function CheckoutForm({ serviceId }: { serviceId: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);

        const host = window.location.origin;

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return to our success callback
                return_url: `${host}/provider/services/${serviceId}/payment/success`,
            },
        });

        if (error.type === "card_error" || error.type === "validation_error") {
            setMessage(error.message || "An unexpected error occurred.");
        } else {
            setMessage("An unexpected error occurred.");
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />

            <button
                disabled={isLoading || !stripe || !elements}
                id="submit"
                className="w-full bg-black hover:bg-gray-800 text-white font-bold h-11 rounded-xl disabled:opacity-50 transition-all"
            >
                {isLoading ? "Обработка..." : "Оплатить 9.99 €"}
            </button>

            {message && <div className="text-red-500 text-sm text-center">{message}</div>}
        </form>
    );
}

export default function CardPaymentPage({ params }: { params: { id: string } }) {
    const [clientSecret, setClientSecret] = useState("");
    const isStripeEnabled = !!stripeKey;

    useEffect(() => {
        if (!isStripeEnabled) return;

        // Create PaymentIntent as soon as the page loads
        fetch("/api/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: 999 }), // 9.99 EUR
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.clientSecret) setClientSecret(data.clientSecret);
                else console.error("Failed to load client secret", data);
            });
    }, [isStripeEnabled]);

    const appearance = {
        theme: 'stripe',
    };

    // @ts-ignore
    const options = {
        clientSecret,
        appearance,
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            <Link href="/" className="mb-8 font-bold text-2xl tracking-tighter">svoi.de</Link>

            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Оплата картой {isStripeEnabled ? '(Stripe)' : '(Тест)'}</h1>
                    <p className="text-sm text-gray-500">
                        {isStripeEnabled ? 'Безопасная оплата через Stripe' : 'Демонстрационный режим'}
                    </p>
                </div>

                {isStripeEnabled ? (
                    clientSecret && stripePromise ? (
                        <Elements options={options} stripe={stripePromise}>
                            <CheckoutForm serviceId={params.id} />
                        </Elements>
                    ) : (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    )
                ) : (
                    <MockCardForm serviceId={params.id} />
                )}
            </div>
        </div>
    );
}
