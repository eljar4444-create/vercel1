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

const EN_LAYOUT = "`qwertyuiop[]asdfghjkl;'zxcvbnm,./";
const RU_LAYOUT = "ёйцукенгшщзхъфывапролджэячсмитьбю.";

function switchKeyboardLayout(raw: string, from: string, to: string) {
    const lower = raw.toLowerCase();
    let next = '';
    for (const char of lower) {
        const index = from.indexOf(char);
        next += index >= 0 ? to[index] : char;
    }
    return next;
}

function buildNormalizedCandidates(raw: string) {
    const candidates = new Set<string>();
    const input = String(raw || '').trim();
    if (!input) return candidates;

    const addCandidate = (value: string) => {
        const normalized = normalizeCityName(value);
        if (normalized) candidates.add(normalized);
    };

    addCandidate(input);
    addCandidate(switchKeyboardLayout(input, EN_LAYOUT, RU_LAYOUT));
    addCandidate(switchKeyboardLayout(input, RU_LAYOUT, EN_LAYOUT));

    return candidates;
}

type CityRecord = {
    value: string;
    aliases: string[];
    rawAliases: string[];
};

const CITY_RECORDS: CityRecord[] = GERMAN_CITIES.map((city: any) => {
    const names = Array.isArray(city.names) ? city.names : [];
    const cyrillicName = names.find((name: string) => /[а-яё]/i.test(name));
    const primaryName = cyrillicName || names[0] || city.data?.display_name?.split(',')?.[0] || '';
    const value = prettifyCity(String(primaryName).trim());
    const displayCity = String(city.data?.display_name || '').split(',')[0]?.trim();
    const rawAliases = [value, ...names.map((n: string) => prettifyCity(String(n))), displayCity]
        .map((part) => String(part).trim())
        .filter(Boolean);
    const aliases = [...names, city.data?.display_name || '', value]
        .map((part) => normalizeCityName(String(part)))
        .filter(Boolean);

    return { value, aliases, rawAliases };
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

const CITY_BY_VALUE = new Map<string, CityRecord>();
CITY_RECORDS.forEach((city) => {
    CITY_BY_VALUE.set(normalizeCityName(city.value), city);
});

const CITY_ALIAS_LABELS = new Set<string>();
const CITY_ALIAS_CANDIDATES: Array<{ label: string; normalized: string }> = [];
CITY_RECORDS.forEach((city) => {
    city.rawAliases.forEach((aliasRaw) => {
        const label = String(aliasRaw || '').trim();
        const normalized = normalizeCityName(label);
        if (!label || !normalized) return;
        const key = `${normalized}:${label.toLowerCase()}`;
        if (CITY_ALIAS_LABELS.has(key)) return;
        CITY_ALIAS_LABELS.add(key);
        CITY_ALIAS_CANDIDATES.push({ label, normalized });
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
    const normalizedCandidates = buildNormalizedCandidates(rawCity);
    const normalizedCandidateList = Array.from(normalizedCandidates);
    if (normalizedCandidates.size === 0) return null;

    for (const normalized of normalizedCandidateList) {
        const direct = CITY_ALIAS_MAP.get(normalized);
        if (direct) return direct;
    }

    for (const normalized of normalizedCandidateList) {
        const mapped = FALLBACK_CITY_ALIASES[normalized];
        if (mapped) {
            const byMapped = CITY_ALIAS_MAP.get(mapped);
            if (byMapped) return byMapped;
        }
    }

    let fuzzy: string | null = null;
    for (const normalized of normalizedCandidateList) {
        CITY_ALIAS_MAP.forEach((value, alias) => {
            if (!fuzzy && (alias.includes(normalized) || normalized.includes(alias))) {
                fuzzy = value;
            }
        });
        if (fuzzy) break;
    }
    return fuzzy;
}

export function getCityFilterVariants(rawCity: string): string[] {
    const input = String(rawCity || '').trim();
    if (!input) return [];

    const variants = new Set<string>([input]);
    const normalizedCandidates = buildNormalizedCandidates(input);
    variants.add(switchKeyboardLayout(input, EN_LAYOUT, RU_LAYOUT));
    variants.add(switchKeyboardLayout(input, RU_LAYOUT, EN_LAYOUT));

    const resolved = resolveGermanCity(input);

    if (resolved) {
        variants.add(resolved);
        const cityRecord = CITY_BY_VALUE.get(normalizeCityName(resolved));
        if (cityRecord) {
            cityRecord.rawAliases.forEach((alias) => variants.add(alias));
        }
    } else if (normalizedCandidates.size > 0) {
        CITY_RECORDS.forEach((city) => {
            const matched = Array.from(normalizedCandidates).some(
                (candidate) => city.aliases.some((alias) => alias.includes(candidate) || candidate.includes(alias))
            );

            if (matched) {
                variants.add(city.value);
                city.rawAliases.forEach((alias) => variants.add(alias));
            }
        });
    }

    return Array.from(variants).filter(Boolean);
}

export function getGermanCitySuggestions(rawInput: string, limit = 10): string[] {
    const input = String(rawInput || '').trim();
    if (!input) {
        return GERMAN_CITY_SUGGESTIONS.slice(0, limit);
    }

    const normalizedCandidates = buildNormalizedCandidates(input);
    const lowerInput = input.toLowerCase();
    const hasLatin = /[a-z]/i.test(input);
    const hasCyrillic = /[а-яё]/i.test(input);

    const matches = CITY_ALIAS_CANDIDATES
        .filter((candidate) =>
            Array.from(normalizedCandidates).some(
                (normalized) =>
                    candidate.normalized.includes(normalized) || normalized.includes(candidate.normalized)
            )
        )
        .map((candidate) => ({
            label: candidate.label,
            startsWith: candidate.label.toLowerCase().startsWith(lowerInput),
            scriptScore: hasLatin
                ? (/^[a-z\s-]+$/i.test(candidate.label) ? 1 : 0)
                : hasCyrillic
                  ? (/^[а-яё\s-]+$/i.test(candidate.label) ? 1 : 0)
                  : 0,
            length: candidate.label.length,
        }))
        .sort((a, b) => {
            if (a.startsWith !== b.startsWith) return a.startsWith ? -1 : 1;
            if (a.scriptScore !== b.scriptScore) return b.scriptScore - a.scriptScore;
            return a.length - b.length;
        });

    const dedup = new Set<string>();
    const result: string[] = [];
    for (const match of matches) {
        const dedupKey = match.label.toLowerCase();
        if (dedup.has(dedupKey)) continue;
        dedup.add(dedupKey);
        result.push(match.label);
        if (result.length >= limit) break;
    }

    return result;
}

