import type { Metadata } from 'next';
import AboutClient from './AboutClient';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { localizedAlternates, resolveLocale } from '@/i18n/canonical';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
    params,
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const locale = resolveLocale(params.locale);
    const t = await getTranslations({ locale, namespace: 'about.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: localizedAlternates(locale, '/about'),
        ...(locale !== DEFAULT_LOCALE
            ? { robots: { index: false, follow: false } }
            : {}),
    };
}

export default function AboutPage() {
    return <AboutClient />;
}
