'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SERVICES_LINKS = [
    { label: 'Маникюр', href: '/search?q=Маникюр' },
    { label: 'Стрижка', href: '/search?q=Стрижка' },
    { label: 'Массаж', href: '/search?q=Массаж' },
    { label: 'Брови и ресницы', href: '/search?q=Брови' },
    { label: 'Косметология', href: '/search?q=Косметология' },
];

const MASTERS_LINKS = [
    { label: 'Стать партнёром', href: '/become-pro' },
    { label: 'Кабинет мастера', href: '/dashboard' },
];

const COMPANY_LINKS = [
    { label: 'Impressum', href: '/impressum' },
    { label: 'AGB', href: '/agb' },
    { label: 'Datenschutz', href: '/datenschutz' },
];

export function Footer() {
    const pathname = usePathname();

    // Hide footer on chat page to maximise space for messages
    if (pathname === '/chat') return null;

    return (
        <footer className="border-t border-gray-100 bg-white">
            <div className="container mx-auto max-w-6xl px-4">

                {/* ── Main columns ── */}
                <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">

                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="mb-4 inline-block">
                            <img
                                src="/logo.png?v=6"
                                alt="Svoi.de"
                                className="h-9 w-auto object-contain"
                            />
                        </Link>
                        <p className="max-w-xs text-sm leading-relaxed text-gray-400">
                            Маркетплейс бьюти-услуг для русскоязычного сообщества в Германии.
                        </p>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-gray-900">Услуги</h4>
                        <ul className="space-y-2.5">
                            {SERVICES_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    href="/search"
                                    className="text-sm font-medium text-yellow-600 transition-colors hover:text-yellow-700"
                                >
                                    Все категории →
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Masters */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-gray-900">Мастерам</h4>
                        <ul className="space-y-2.5">
                            {MASTERS_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-gray-900">Компания</h4>
                        <ul className="space-y-2.5">
                            {COMPANY_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ── Bottom bar ── */}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 py-5 text-xs text-gray-400 sm:flex-row">
                    <span>© {new Date().getFullYear()} Svoi.de — Все права защищены.</span>
                    <span>Германия 🇩🇪</span>
                </div>
            </div>
        </footer>
    );
}
