import { Header } from '@/components/Header';
import { Toaster } from 'react-hot-toast';
import localFont from 'next/font/local';
import { Providers } from '@/components/Providers';
import './globals.css';
import { Footer } from '@/components/Footer';
import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';

import { Inter } from 'next/font/google';
import { cn } from "@/lib/utils";

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata: Metadata = {
    title: "Svoi.de — Маркетплейс услуг",
    description: "Найдите идеального специалиста для любой задачи на Svoi.de",
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru" className={cn("font-sans")}>
            <body className={`${inter.variable} font-sans antialiased text-gray-900 min-h-[100dvh] flex flex-col pb-[env(safe-area-inset-bottom)]`}>
                <Providers>
                    <Suspense fallback={<div className="relative z-50 h-16 bg-[#1A1514]" />}>
                        <Header />
                    </Suspense>
                    <main className="flex-grow">
                        {children}
                    </main>
                    <Footer />
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
