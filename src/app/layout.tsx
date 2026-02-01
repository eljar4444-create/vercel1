import { Header } from '@/components/Header';
import { Toaster } from 'react-hot-toast';
import localFont from 'next/font/local';
import { Providers } from '@/components/Providers';
import './globals.css';
import { Footer } from '@/components/Footer';
import type { Metadata } from 'next';

const outfit = localFont({
    src: '../../public/fonts/Outfit-Latin.woff2',
    variable: '--font-outfit',
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
        <html lang="en">
            <body className={`${outfit.className} antialiased bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
                <Providers>
                    <Header />
                    <main className="flex-1 pt-28">
                        {children}
                    </main>
                    <Footer />
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
