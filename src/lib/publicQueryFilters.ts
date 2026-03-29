/**
 * Canonical WHERE clause conditions for ALL public-facing profile queries.
 * Every public surface (search page, city page, city+category page, API)
 * MUST include these filters to ensure only fully-published, verified,
 * non-banned profiles appear in results.
 *
 * This is the single source of truth for the Public Visibility Gate.
 */
export function getPublicProfileFilters() {
    return [
        { status: 'PUBLISHED' as const },
        { is_verified: true },
        { category: { slug: { not: 'health' } } },
        { user: { isBanned: false } },
    ];
}

/**
 * Type helper: checks if a profile state would pass the public filter.
 * Used for testing/verification purposes.
 */
export function wouldProfileBePublic(profile: {
    status: string;
    is_verified: boolean;
    user?: { isBanned: boolean } | null;
    category?: { slug: string } | null;
}): boolean {
    if (profile.status !== 'PUBLISHED') return false;
    if (!profile.is_verified) return false;
    if (profile.user?.isBanned) return false;
    if (profile.category?.slug === 'health') return false;
    return true;
}
