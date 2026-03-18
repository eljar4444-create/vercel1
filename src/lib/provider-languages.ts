export const LANGUAGES = {
  'Русский': { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  'Украинский': { code: 'uk', flag: '🇺🇦', label: 'Украинский' },
  'Немецкий': { code: 'de', flag: '🇩🇪', label: 'Немецкий' },
  'Английский': { code: 'en', flag: 'EN', label: 'Английский' },
} as const;

export type ProviderLanguage = keyof typeof LANGUAGES;

const LANGUAGE_ALIASES: Record<string, ProviderLanguage> = {
  ru: 'Русский',
  ua: 'Украинский',
  uk: 'Украинский',
  de: 'Немецкий',
  en: 'Английский',
  'Русский': 'Русский',
  'Украинский': 'Украинский',
  'Немецкий': 'Немецкий',
  'Английский': 'Английский',
};

export const PROVIDER_LANGUAGE_OPTIONS = Object.entries(LANGUAGES).map(([value, meta]) => ({
  value: value as ProviderLanguage,
  ...meta,
}));

export function normalizeProviderLanguage(value: string): ProviderLanguage | null {
  return LANGUAGE_ALIASES[value] ?? null;
}

export function isProviderLanguage(value: string): value is ProviderLanguage {
  return normalizeProviderLanguage(value) !== null;
}
