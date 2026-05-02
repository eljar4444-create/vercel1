import type { Metadata } from 'next';
import GuideClient from './GuideClient';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { localizedAlternates, resolveLocale } from '@/i18n/canonical';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
    params,
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const locale = resolveLocale(params.locale);
    const t = await getTranslations({ locale, namespace: 'guide.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: localizedAlternates(locale, '/guide'),
        ...(locale !== DEFAULT_LOCALE
            ? { robots: { index: false, follow: false } }
            : {}),
    };
}

export default function GuidePage() {
    return <GuideClient />;
}
