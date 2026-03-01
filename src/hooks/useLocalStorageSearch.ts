'use client';

const KEY_CITY = 'svoi_last_city';
const KEY_QUERY = 'svoi_last_query';

export interface StoredSearch {
    city: string;
    query: string;
}

function getStoredSafe(): StoredSearch {
    if (typeof window === 'undefined') return { city: '', query: '' };
    try {
        const city = localStorage.getItem(KEY_CITY) ?? '';
        const query = localStorage.getItem(KEY_QUERY) ?? '';
        return { city, query };
    } catch {
        return { city: '', query: '' };
    }
}

function setStoredSafe(city: string, query: string): void {
    if (typeof window === 'undefined') return;
    try {
        if (city) localStorage.setItem(KEY_CITY, city);
        else localStorage.removeItem(KEY_CITY);
        if (query) localStorage.setItem(KEY_QUERY, query);
        else localStorage.removeItem(KEY_QUERY);
    } catch {
        // ignore
    }
}

/**
 * Хук для работы с «памятью» поиска в localStorage.
 * Использовать только на клиенте: чтение — строго в useEffect, запись — при смене фильтров/URL.
 * Не использует cookies (только Web Storage API).
 */
export function useLocalStorageSearch() {
    return {
        getStored: getStoredSafe,
        setStored: setStoredSafe,
    };
}
