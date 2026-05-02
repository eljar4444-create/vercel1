import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { LOCALES, isLocale } from '@/i18n/config';
import { SITE_ORIGIN, absoluteUrlForLocale } from '@/i18n/canonical';

export function generateStaticParams() {
    return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
    params,
}: {
    params: { locale: string };
}): Promise<Metadata> {
    if (!isLocale(params.locale)) return {};
    return {};
}

export default function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    const locale = params.locale;
    if (!isLocale(locale)) notFound();
    setRequestLocale(locale);

    const websiteJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Svoi.de',
        url: SITE_ORIGIN,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${absoluteUrlForLocale(locale, '/search')}?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
            />
            {children}
        </>
    );
}
