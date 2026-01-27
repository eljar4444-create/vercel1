import { Header } from '@/components/Header';
import { Toaster } from 'react-hot-toast';
import { Outfit } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';
import { Footer } from '@/components/Footer';

const outfit = Outfit({ subsets: ['latin'] });

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
