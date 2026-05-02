import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function HomepageFooter() {
    const t = await getTranslations('footer');

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
        <footer className="bg-[#160e0a] text-white pt-20 pb-10 px-8">
            <div className="max-w-screen-2xl mx-auto">
                {/* Logo */}
                <Link href="/" className="inline-block mb-8">
                    <span className="text-3xl font-black text-white">SVOI</span>
                </Link>

                {/* Columns */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-20">
                    <div className="flex flex-col gap-4">
                        <span className="text-xs uppercase tracking-widest text-white font-bold mb-2">{t('columns.services')}</span>
                        {servicesLinks.map((link) => (
                            <Link key={link.href + link.label} href={link.href} className="text-sm text-gray-500 hover:text-white transition-all">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div className="flex flex-col gap-4">
                        <span className="text-xs uppercase tracking-widest text-white font-bold mb-2">{t('columns.platform')}</span>
                        {platformLinks.map((link) => (
                            <Link key={link.href + link.label} href={link.href} className="text-sm text-gray-500 hover:text-white transition-all">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div className="flex flex-col gap-4">
                        <span className="text-xs uppercase tracking-widest text-white font-bold mb-2">{t('columns.legal')}</span>
                        {legalLinks.map((link) => (
                            <Link key={link.href + link.label} href={link.href} className="text-sm text-gray-500 hover:text-white transition-all">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm text-gray-500">{t('copyright', { year: new Date().getFullYear() })}</p>
                    <div className="flex gap-8">
                        <Link href="#" className="text-gray-500 hover:text-white transition-all" aria-label={t('language')}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                            </svg>
                        </Link>
                        <Link href="#" className="text-gray-500 hover:text-white transition-all" aria-label={t('contact')}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
