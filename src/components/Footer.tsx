'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, AtSign } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LOCALES, DEFAULT_LOCALE } from '@/i18n/config';

const HOMEPAGE_PATHS = new Set<string>([
    '/',
    ...LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((l) => `/${l}`),
]);

export function Footer() {
    const pathname = usePathname();
    const t = useTranslations('footer');

    // Hide on locale homepages (use HomepageFooter) and on chat (maximise message space).
    if (!pathname || HOMEPAGE_PATHS.has(pathname) || pathname === '/chat') return null;

    const servicesLinks = [
        { label: t('services.hairDesign'), href: '/search?q=Стрижка' },
        { label: t('services.makeup'),     href: '/search?q=Макияж' },
        { label: t('services.skincare'),   href: '/search?q=Косметология' },
        { label: t('services.wellness'),   href: '/search?q=Массаж' },
    ];

    const platformLinks = [
        { label: t('links.about'),     href: '/about' },
        { label: t('links.guide'),     href: '/guide' },
        { label: t('links.becomePro'), href: '/become-pro' },
    ];

    const legalLinks = [
        { label: t('links.impressum'),   href: '/impressum' },
        { label: t('links.datenschutz'), href: '/datenschutz' },
        { label: t('links.agb'),         href: '/agb' },
    ];

    return (
        <footer className="bg-[#1A1514] text-white pt-20 pb-0 px-8">
            <div className="max-w-screen-2xl mx-auto">
                {/* Logo */}
                <Link href="/" className="inline-block mb-10">
                    <span className="text-4xl font-black tracking-tight text-white">SVOI</span>
                </Link>

                {/* 3-Column Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-12 mb-20">
                    {/* Column 1: УСЛУГИ */}
                    <div className="flex flex-col gap-3.5">
                        <span className="text-xs uppercase tracking-[0.2em] text-white font-bold mb-1">{t('columns.services')}</span>
                        {servicesLinks.map((link) => (
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
                        <span className="text-xs uppercase tracking-[0.2em] text-white font-bold mb-1">{t('columns.platform')}</span>
                        {platformLinks.map((link) => (
                            <Link
                                key={link.href + link.label}
                                href={link.href}
                                className="text-sm text-gray-500 hover:text-white transition-colors duration-200"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Column 3: ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ */}
                    <div className="flex flex-col gap-3.5">
                        <span className="text-xs uppercase tracking-[0.2em] text-white font-bold mb-1">{t('columns.legal')}</span>
                        {legalLinks.map((link) => (
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
                        {t('copyright', { year: new Date().getFullYear() })}
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-gray-600 hover:text-white transition-colors duration-200" aria-label={t('language')}>
                            <Globe className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-gray-600 hover:text-white transition-colors duration-200" aria-label={t('contact')}>
                            <AtSign className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
