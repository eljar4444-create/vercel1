'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, AtSign } from 'lucide-react';

const SERVICES_LINKS = [
    { label: 'Дизайн волос', href: '/search?q=Стрижка' },
    { label: 'Макияж', href: '/search?q=Макияж' },
    { label: 'Уход за кожей', href: '/search?q=Косметология' },
    { label: 'Велнес', href: '/search?q=Массаж' },
];

const PLATFORM_LINKS = [
    { label: 'Как это работает', href: '/guide' },
    { label: 'Для мастеров', href: '/become-pro' },
    { label: 'Журнал', href: '#' },
    { label: 'Локации', href: '/search' },
];

const COMPANY_LINKS = [
    { label: 'О нас', href: '#' },
    { label: 'Вакансии', href: '#' },
    { label: 'Пресса', href: '#' },
];

const LEGAL_LINKS = [
    { label: 'Политика конфиденциальности', href: '/datenschutz' },
    { label: 'Условия использования', href: '/agb' },
];

export function Footer() {
    const pathname = usePathname();

    // Hide footer on chat page to maximise space for messages
    if (pathname === '/' || pathname === '/chat') return null;

    return (
        <footer className="bg-[#1A1514] text-white pt-20 pb-0 px-8">
            <div className="max-w-screen-2xl mx-auto">
                {/* Logo */}
                <Link href="/" className="inline-block mb-10">
                    <span className="text-4xl font-black tracking-tight text-white">SVOI</span>
                </Link>

                {/* 4-Column Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-20">
                    {/* Column 1: УСЛУГИ */}
                    <div className="flex flex-col gap-3.5">
                        <span className="text-xs uppercase tracking-[0.2em] text-white font-bold mb-1">Услуги</span>
                        {SERVICES_LINKS.map((link) => (
                            <Link
                                key={link.href + link.label}
                                href={link.href}
                                className="text-sm text-gray-500 hover:text-white transition-colors duration-200"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Column 2: ПЛАТФОРМА */}
                    <div className="flex flex-col gap-3.5">
                        <span className="text-xs uppercase tracking-[0.2em] text-white font-bold mb-1">Платформа</span>
                        {PLATFORM_LINKS.map((link) => (
                            <Link
                                key={link.href + link.label}
                                href={link.href}
                                className="text-sm text-gray-500 hover:text-white transition-colors duration-200"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Column 3: КОМПАНИЯ */}
                    <div className="flex flex-col gap-3.5">
                        <span className="text-xs uppercase tracking-[0.2em] text-white font-bold mb-1">Компания</span>
                        {COMPANY_LINKS.map((link) => (
                            <Link
                                key={link.href + link.label}
                                href={link.href}
                                className="text-sm text-gray-500 hover:text-white transition-colors duration-200"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Column 4: ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ */}
                    <div className="flex flex-col gap-3.5">
                        <span className="text-xs uppercase tracking-[0.2em] text-white font-bold mb-1">Юридическая информация</span>
                        {LEGAL_LINKS.map((link) => (
                            <Link
                                key={link.href + link.label}
                                href={link.href}
                                className="text-sm text-gray-500 hover:text-white transition-colors duration-200"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 py-6 flex flex-col md:flex-row justify-between items-center gap-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    <p className="text-sm text-gray-600">
                        © 2026 SVOI Curated Atelier. Все права защищены.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-gray-600 hover:text-white transition-colors duration-200" aria-label="Язык">
                            <Globe className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-gray-600 hover:text-white transition-colors duration-200" aria-label="Контакт">
                            <AtSign className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
