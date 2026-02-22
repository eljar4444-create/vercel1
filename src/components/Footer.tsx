'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
    const pathname = usePathname();

    // Hide footer on chat page to maximize space for messages
    if (pathname === '/chat') return null;

    return (
        <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-6 text-sm text-gray-500">
                <Link href="/impressum" className="hover:text-gray-900 transition-colors">
                    Impressum
                </Link>
                <span className="hidden md:inline text-gray-300">|</span>
                <Link href="/agb" className="hover:text-gray-900 transition-colors">
                    AGB
                </Link>
                <span className="hidden md:inline text-gray-300">|</span>
                <Link href="/datenschutz" className="hover:text-gray-900 transition-colors">
                    Datenschutz
                </Link>
            </div>
            <div className="text-center text-xs text-gray-400 mt-4">
                © {new Date().getFullYear()} Исполнители. Все права защищены.
            </div>
        </footer>
    );
}
