'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe media query hook.
 * Returns `false` during SSR and the first client render to prevent
 * React hydration mismatches. The real value is set after mount via useEffect.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(query);
        setMatches(mql.matches);

        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [query]);

    return matches;
}
