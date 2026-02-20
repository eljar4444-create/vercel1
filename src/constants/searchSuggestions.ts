import { GERMAN_CITIES } from '@/constants/germanCities';

export const POPULAR_SERVICES = [
    'Маникюр',
    'Педикюр',
    'Массаж',
    'Стрижка',
    'Окрашивание',
    'Наращивание ресниц',
    'Шугаринг',
    'Косметолог',
    'Стоматолог',
];

function prettifyCity(raw: string) {
    return raw
        .split(/[\s-]+/)
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join(' ');
}

function normalizeCityName(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-zа-яё\s-]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

type CityRecord = {
    value: string;
    aliases: string[];
};

const CITY_RECORDS: CityRecord[] = GERMAN_CITIES.map((city: any) => {
    const names = Array.isArray(city.names) ? city.names : [];
    const cyrillicName = names.find((name: string) => /[а-яё]/i.test(name));
    const primaryName = cyrillicName || names[0] || city.data?.display_name?.split(',')?.[0] || '';
    const value = prettifyCity(String(primaryName).trim());
    const aliases = [...names, city.data?.display_name || '', value]
        .map((part) => normalizeCityName(String(part)))
        .filter(Boolean);

    return { value, aliases };
}).filter((city) => city.value);

const seen = new Set<string>();
export const GERMAN_CITY_SUGGESTIONS = CITY_RECORDS.filter((city) => {
    const key = city.value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
}).map((city) => city.value);

const CITY_ALIAS_MAP = new Map<string, string>();
CITY_RECORDS.forEach((city) => {
    CITY_ALIAS_MAP.set(normalizeCityName(city.value), city.value);
    city.aliases.forEach((alias) => {
        if (!CITY_ALIAS_MAP.has(alias)) {
            CITY_ALIAS_MAP.set(alias, city.value);
        }
    });
});

const FALLBACK_CITY_ALIASES: Record<string, string> = {
    cologne: 'кёльн',
    munich: 'мюнхен',
    nuremberg: 'нюрнберг',
    frankfurt: 'франкфурт',
    dusseldorf: 'дюссельдорф',
};

export function resolveGermanCity(rawCity: string): string | null {
    const normalized = normalizeCityName(rawCity);
    if (!normalized) return null;

    const direct = CITY_ALIAS_MAP.get(normalized);
    if (direct) return direct;

    const mapped = FALLBACK_CITY_ALIASES[normalized];
    if (mapped) {
        const byMapped = CITY_ALIAS_MAP.get(mapped);
        if (byMapped) return byMapped;
    }

    let fuzzy: string | null = null;
    CITY_ALIAS_MAP.forEach((value, alias) => {
        if (!fuzzy && (alias.includes(normalized) || normalized.includes(alias))) {
            fuzzy = value;
        }
    });
    return fuzzy;
}

