export const LANGUAGES = {
  'Русский': { flag: '🇷🇺', label: 'Русский' },
  'Украинский': { flag: '🇺🇦', label: 'Украинский' },
  'Немецкий': { flag: '🇩🇪', label: 'Немецкий' },
} as const;

export type ProviderLanguage = keyof typeof LANGUAGES;

const LANGUAGE_ALIASES: Record<string, ProviderLanguage> = {
  ru: 'Русский',
  ua: 'Украинский',
  uk: 'Украинский',
  de: 'Немецкий',
  'Русский': 'Русский',
  'Украинский': 'Украинский',
  'Немецкий': 'Немецкий',
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
