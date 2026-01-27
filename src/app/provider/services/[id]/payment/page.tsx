'use client';

import { processPayment } from '@/app/actions/payment';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

// Icons (Simple SVGs)
const PayPalIcon = () => (
    <svg className="h-8 w-auto" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M26.96 11.23C26.79 9.39 25.68 5.75 19.46 5.75H8.38C7.57 5.75 6.89 6.36 6.81 7.15L5.42 20.93C5.36 21.57 5.86 22.11 6.5 22.11H10.95L11.83 16.51C11.91 16.03 12.33 15.68 12.82 15.68H16.27C21.91 15.68 26.31 13.41 26.96 11.23Z" fill="#253B80" />
        <path d="M22.99 11.94C22.25 14.54 19.34 16.25 15.34 16.25H11.83L11.37 19.16L10.59 24.11C10.51 24.64 10.92 25.1 11.45 25.1H15.64C16.13 25.1 16.55 24.75 16.63 24.27L17.15 20.98H17.48C20.91 20.98 23.63 19.63 24.47 16.3C24.57 15.93 24.64 15.56 24.69 15.2C24.89 15.11 25.07 14.98 25.22 14.82C25.59 14.35 25.8 13.79 25.88 13.18C25.99 12.28 25.86 11.48 25.58 10.82C25.01 11.32 24.12 11.75 22.99 11.94Z" fill="#179BD7" />
        <path d="M22.04 11.82C21.95 11.84 21.85 11.85 21.75 11.87C22.93 11.66 23.83 11.2 24.36 10.66C23.95 9.07 22.79 7.84 19.46 7.84H11.55C10.74 7.84 10.06 8.45 9.98 9.24L7.54 24.27C7.46 24.75 7.83 25.16 8.32 25.16H11.45C11.98 25.1 12.39 24.64 12.47 24.11L13.25 19.16L13.71 16.25H17.21C21.21 16.25 24.12 14.54 24.86 11.94C24.96 11.61 25.01 11.27 25.01 10.93C24.42 11.49 23.36 11.72 22.04 11.82Z" fill="#222D65" />
    </svg>
);

const CardIcon = () => (
    <svg className="h-8 w-auto" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="6" width="28" height="20" rx="2" fill="#1A1F2C" />
        <path d="M2 12H30" stroke="white" strokeWidth="2" />
        <rect x="5" y="17" width="4" height="2" rx="1" fill="#E5E7EB" />
        <rect x="11" y="17" width="8" height="2" rx="1" fill="#E5E7EB" />
    </svg>
);

const InvoiceIcon = () => (
    <svg className="h-8 w-auto" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4C6 2.9 6.9 2 8 2H24C25.1 2 26 2.9 26 4V28L16 24L6 28V4Z" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="2" />
        <path d="M10 8H22" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 14H22" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 20H16" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="20" r="2" fill="#EF4444" />
    </svg>
);

export default function PaymentPage({ params }: { params: { id: string } }) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handlePayment = async (method: string) => {
        try {
            setIsLoading(method);
            await processPayment(params.id, method);
        } catch (error) {
            console.error(error);
            setIsLoading(null);
            alert("Что-то пошло не так при обработке платежа. Попробуйте еще раз.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            <Link href="/" className="mb-8 font-bold text-2xl tracking-tighter">svoi.de</Link>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Выберите способ оплаты</h1>
                    <p className="text-gray-500 text-sm">Чтобы опубликовать ваше объявление, пожалуйста, оплатите комиссию.</p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => handlePayment('paypal')}
                        disabled={!!isLoading}
                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[#0070BA] hover:bg-blue-50/10 hover:shadow-sm transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 flex justify-center"><PayPalIcon /></div>
                            <span className="font-medium text-gray-700 group-hover:text-gray-900">PayPal</span>
                        </div>
                        {isLoading === 'paypal' ? <div className="text-xs text-blue-600">Обработка...</div> : <span className="text-gray-400">→</span>}
                    </button>

                    <button
                        onClick={() => handlePayment('card')}
                        disabled={!!isLoading}
                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 hover:shadow-sm transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 flex justify-center"><CardIcon /></div>
                            <span className="font-medium text-gray-700 group-hover:text-gray-900">Visa / Mastercard</span>
                        </div>
                        {isLoading === 'card' ? <div className="text-xs text-gray-600">Обработка...</div> : <span className="text-gray-400">→</span>}
                    </button>

                    <button
                        onClick={() => handlePayment('invoice')}
                        disabled={!!isLoading}
                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-200 hover:bg-orange-50 hover:shadow-sm transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 flex justify-center"><InvoiceIcon /></div>
                            <span className="font-medium text-gray-700 group-hover:text-gray-900">Счет (Invoice)</span>
                        </div>
                        {isLoading === 'invoice' ? <div className="text-xs text-gray-600">Обработка...</div> : <span className="text-gray-400">→</span>}
                    </button>
                </div>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Нажимая на способ оплаты, вы соглашаетесь с условиями сервиса.
                </p>
            </div>
        </div>
    );
}
