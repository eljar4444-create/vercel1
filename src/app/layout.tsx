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
    metadataBase: new URL('https://www.svoi.de'),
    title: "Svoi.de — Маркетплейс услуг",
    description: "Найдите идеального специалиста для любой задачи на Svoi.de",
    alternates: {
        canonical: '/',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Svoi.de',
    url: 'https://www.svoi.de',
    logo: 'https://www.svoi.de/logo.png',
};

const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Svoi.de',
    url: 'https://www.svoi.de',
    potentialAction: {
        '@type': 'SearchAction',
        target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://www.svoi.de/search?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="de" className={cn("font-sans")}>
            <body className={`${inter.variable} font-sans antialiased text-gray-900 min-h-[100dvh] flex flex-col pb-[env(safe-area-inset-bottom)]`}>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
                />
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
