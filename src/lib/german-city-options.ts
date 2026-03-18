import { GERMAN_CITIES } from '@/constants/germanCities';

export type GermanCitySelection = {
    value: string;
    germanName: string;
    russianName: string;
    searchText: string;
    isPopular: boolean;
    aliases: string[];
    lat: number | null;
    lng: number | null;
};

function prettifyCity(raw: string) {
    return raw
        .split(/[\s-]+/)
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join(' ');
}

export function normalizeGermanCityName(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-zа-яё\s-]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

const POPULAR_CITY_TOKENS = new Set([
    'berlin', 'берлин',
    'hamburg', 'гамбург',
    'münchen', 'munchen', 'мюнхен',
    'köln', 'koeln', 'кёльн', 'кельн',
    'frankfurt', 'frankfurt am main', 'франкфурт', 'франкфурт-на-майне',
    'stuttgart', 'штутгарт',
    'düsseldorf', 'duesseldorf', 'дюссельдорф',
    'leipzig', 'лейпциг',
    'dortmund', 'дортмунд',
    'essen', 'эссен',
    'bremen', 'бремен',
    'dresden', 'дрезден',
    'hannover', 'ганновер',
    'nürnberg', 'nuernberg', 'нюрнберг',
]);

export const GERMAN_CITY_OPTIONS: GermanCitySelection[] = GERMAN_CITIES.map((city: any) => {
    const names = Array.isArray(city.names) ? city.names : [];
    const cyrillicName = names.find((name: string) => /[а-яё]/i.test(name));
    const latinName = names.find((name: string) => /[a-z]/i.test(name));
    const primaryName = cyrillicName || names[0] || city.data?.display_name?.split(',')?.[0] || '';
    const germanName = prettifyCity((latinName || city.data?.display_name?.split(',')?.[0] || primaryName).trim());
    const russianName = prettifyCity((cyrillicName || primaryName).trim());
    const value = prettifyCity(primaryName.trim());
    const searchParts = [
        ...names,
        ...(Array.isArray(city.triggers) ? city.triggers : []),
        city.data?.display_name || '',
        value,
    ]
        .map((part) => String(part).toLowerCase())
        .join(' ');

    const isPopularByNames = names.some((name: string) => POPULAR_CITY_TOKENS.has(String(name).toLowerCase()));
    const isPopularByValue = POPULAR_CITY_TOKENS.has(value.toLowerCase());
    const aliases = [
        ...names,
        city.data?.display_name || '',
        value,
    ]
        .map((part) => normalizeGermanCityName(String(part)))
        .filter(Boolean);

    const lat = Number(city.data?.lat);
    const lng = Number(city.data?.lon);

    return {
        value,
        germanName,
        russianName,
        searchText: searchParts,
        isPopular: isPopularByNames || isPopularByValue,
        aliases,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
    };
}).filter((item) => item.value);

export function findGermanCitySelection(value: string) {
    const normalized = normalizeGermanCityName(value);
    if (!normalized) return null;

    return GERMAN_CITY_OPTIONS.find((city) =>
        city.aliases.includes(normalized) || normalizeGermanCityName(city.value) === normalized
    ) ?? null;
}
