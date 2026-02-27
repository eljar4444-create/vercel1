import { Header } from '@/components/Header';
import { Toaster } from 'react-hot-toast';
import localFont from 'next/font/local';
import { Providers } from '@/components/Providers';
import './globals.css';
import { Footer } from '@/components/Footer';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Inter } from 'next/font/google';

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata: Metadata = {
    title: "Svoi.de — Маркетплейс услуг",
    description: "Найдите идеального специалиста для любой задачи на Svoi.de",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru">
            <body className={`${inter.variable} font-sans antialiased bg-[#F5F2EB] text-gray-900 min-h-screen flex flex-col`}>
                <Providers>
                    <Suspense fallback={<div className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-slate-200 bg-[#F5F2EB]" />}>
                        <Header />
                    </Suspense>
                    <main className="flex-1 pt-16">
                        {children}
                    </main>
                    <Footer />
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
