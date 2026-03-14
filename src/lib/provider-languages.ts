export const PROVIDER_LANGUAGE_OPTIONS = [
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'uk', label: 'Украинский', flag: '🇺🇦' },
  { value: 'de', label: 'Немецкий', flag: '🇩🇪' },
] as const;

export type ProviderLanguage = (typeof PROVIDER_LANGUAGE_OPTIONS)[number]['value'];

export const PROVIDER_LANGUAGE_VALUES = PROVIDER_LANGUAGE_OPTIONS.map((option) => option.value);

export function isProviderLanguage(value: string): value is ProviderLanguage {
  return PROVIDER_LANGUAGE_VALUES.includes(value as ProviderLanguage);
}
