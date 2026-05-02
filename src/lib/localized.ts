import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/config';

type TranslationRow<K extends string> = {
    locale: string;
} & Partial<Record<K, string | null>>;

export function normalizeContentLocale(locale: string | null | undefined): Locale {
    return locale && isLocale(locale) ? locale : DEFAULT_LOCALE;
}

export function getLocalizedText<K extends string>(
    baseValue: string | null | undefined,
    translations: readonly TranslationRow<K>[] | null | undefined,
    locale: string | null | undefined,
    field: K,
    fallbackLocale: Locale = DEFAULT_LOCALE,
): string | null {
    const normalizedLocale = normalizeContentLocale(locale);
    const normalizedFallback = normalizeContentLocale(fallbackLocale);
    const base = baseValue ?? null;

    if (!translations || translations.length === 0) {
        return base;
    }

    const preferred = translations.find((translation) => translation.locale === normalizedLocale)?.[field];
    if (typeof preferred === 'string' && preferred.trim().length > 0) {
        return preferred;
    }

    const fallback = translations.find((translation) => translation.locale === normalizedFallback)?.[field];
    if (typeof fallback === 'string' && fallback.trim().length > 0) {
        return fallback;
    }

    return base;
}

export function localizeCategoryName<
    T extends { name: string; translations?: readonly TranslationRow<'name'>[] | null },
>(category: T, locale: string | null | undefined): string {
    return getLocalizedText(category.name, category.translations, locale, 'name') ?? category.name;
}

export function localizeService<
    T extends {
        title: string;
        description?: string | null;
        translations?: readonly TranslationRow<'title' | 'description'>[] | null;
    },
>(service: T, locale: string | null | undefined): T {
    return {
        ...service,
        title: getLocalizedText(service.title, service.translations, locale, 'title') ?? service.title,
        description: getLocalizedText(service.description ?? null, service.translations, locale, 'description'),
    };
}

export function localizeProfileBio<
    T extends { bio?: string | null; translations?: readonly TranslationRow<'bio'>[] | null },
>(profile: T, locale: string | null | undefined): string | null {
    return getLocalizedText(profile.bio ?? null, profile.translations, locale, 'bio');
}
