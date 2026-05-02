import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from './config';

export const SITE_ORIGIN = 'https://www.svoi.de';

function normalizePath(path: string): string {
    if (!path || path === '/') return '/';
    return path.startsWith('/') ? path : `/${path}`;
}

export function pathForLocale(locale: Locale, path: string): string {
    const normalized = normalizePath(path);
    if (locale === DEFAULT_LOCALE) {
        return normalized;
    }
    return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}

export function absoluteUrlForLocale(locale: Locale, path: string): string {
    const localized = pathForLocale(locale, path);
    return localized === '/' ? SITE_ORIGIN : `${SITE_ORIGIN}${localized}`;
}

export function localizedCanonical(locale: Locale, path: string): string {
    return pathForLocale(locale, path);
}

export type LanguageAlternates = Partial<Record<Locale | 'x-default', string>>;

export function languageAlternates(path: string): LanguageAlternates {
    const alternates: LanguageAlternates = {};
    for (const locale of LOCALES) {
        alternates[locale] = absoluteUrlForLocale(locale, path);
    }
    alternates['x-default'] = absoluteUrlForLocale(DEFAULT_LOCALE, path);
    return alternates;
}

export function localizedAlternates(locale: Locale, path: string) {
    return {
        canonical: localizedCanonical(locale, path),
        languages: languageAlternates(path),
    };
}

export function resolveLocale(value: unknown): Locale {
    return isLocale(value) ? value : DEFAULT_LOCALE;
}
