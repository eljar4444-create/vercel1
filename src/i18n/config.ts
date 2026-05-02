export const LOCALES = ['ru', 'de', 'uk'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ru';

export const PREFIXED_LOCALES: ReadonlyArray<Locale> = ['de', 'uk'];

export function isLocale(value: unknown): value is Locale {
    return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function isPrefixedLocale(value: unknown): value is Exclude<Locale, typeof DEFAULT_LOCALE> {
    return typeof value === 'string' && (PREFIXED_LOCALES as readonly string[]).includes(value);
}

export const HTML_LANG: Record<Locale, string> = {
    ru: 'ru',
    de: 'de',
    uk: 'uk',
};
