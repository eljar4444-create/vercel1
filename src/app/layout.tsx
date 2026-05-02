import { Header } from '@/components/Header';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/Providers';
import './globals.css';
import { Footer } from '@/components/Footer';
import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { Inter } from 'next/font/google';
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, HTML_LANG, isLocale } from '@/i18n/config';

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://www.svoi.de'),
    title: "Svoi.de — Маркетплейс услуг",
    description: "Найдите идеального специалиста для любой задачи на Svoi.de",
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

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const xLocale = headers().get('x-locale');
    const locale = isLocale(xLocale) ? xLocale : DEFAULT_LOCALE;
    const messages = await getMessages();

    return (
        <html lang={HTML_LANG[locale]} className={cn("font-sans")}>
            <body className={`${inter.variable} font-sans antialiased text-gray-900 min-h-[100dvh] flex flex-col pb-[env(safe-area-inset-bottom)]`}>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
                />
                <NextIntlClientProvider locale={locale} messages={messages}>
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
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
