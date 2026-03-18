import { Header } from '@/components/Header';
import { Toaster } from 'react-hot-toast';
import localFont from 'next/font/local';
import { Providers } from '@/components/Providers';
import './globals.css';
import { Footer } from '@/components/Footer';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Inter, Playfair_Display } from 'next/font/google';
import { cn } from "@/lib/utils";

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-inter',
    display: 'swap',
});

const playfair = Playfair_Display({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-playfair',
    display: 'swap',
    weight: ['400', '500', '600', '700'],
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
        <html lang="ru" className={cn("font-sans")}>
            <body className={`${inter.variable} ${playfair.variable} font-sans antialiased text-gray-900 min-h-screen flex flex-col`}>
                <Providers>
                    <Suspense fallback={<div className="relative z-50 h-16 border-b border-stone-200 bg-transparent" />}>
                        <Header />
                    </Suspense>
                    <main className="flex-1">
                        {children}
                    </main>
                    <Footer />
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
