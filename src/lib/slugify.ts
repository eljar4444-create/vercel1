/**
 * Slugify utility for generating clean, SEO-friendly URLs.
 * Handles German umlauts and Russian Cyrillic transliteration.
 */

const GERMAN_MAP: Record<string, string> = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
    'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue',
};

const RUSSIAN_MAP: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
};

const TRANSLITERATION_MAP: Record<string, string> = {
    ...GERMAN_MAP,
    ...RUSSIAN_MAP,
};

/**
 * Converts a string into a URL-safe slug.
 * "Маникюр" → "manikure"
 * "München" → "muenchen"
 * "Брови и ресницы" → "brovi-i-resnitsy"
 */
export function slugify(text: string): string {
    return text
        .split('')
        .map((char) => TRANSLITERATION_MAP[char] || char)
        .join('')
        .toLowerCase()
        .replace(/\s+/g, '-')       // spaces → hyphens
        .replace(/[^a-z0-9-]/g, '') // remove non-alphanumeric
        .replace(/-+/g, '-')        // collapse multiple hyphens
        .replace(/^-|-$/g, '');     // trim leading/trailing hyphens
}

/**
 * Converts a slug back to a display name (capitalize first letter of each word).
 * "manikure" → "Manikure"
 * "brovi-i-resnitsy" → "Brovi I Resnitsy"
 */
export function deslugify(slug: string): string {
    return slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
