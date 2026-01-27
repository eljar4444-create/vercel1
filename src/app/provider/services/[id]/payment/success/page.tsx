'use client';

import { completePayment } from '@/app/actions/payment';
import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export default function PaymentSuccessCallbackPage({ params }: { params: { id: string } }) {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            // Complete the payment on server
            completePayment(params.id)
                .catch(err => console.error("Payment completion failed", err));
        }
    }, [params.id]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 text-gray-400 animate-spin mb-4" />
            <h2 className="text-xl font-medium text-gray-900">Проверка платежа...</h2>
            <p className="text-gray-500 text-sm mt-2">Пожалуйста, не закрывайте страницу</p>
        </div>
    );
}
