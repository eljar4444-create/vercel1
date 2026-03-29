import { describe, it, expect } from 'vitest';
import { getPublicProfileFilters, wouldProfileBePublic } from '@/lib/publicQueryFilters';

// ──────────────────────────────────────────────────────────
// Suite 6.1 — Canonical Filter Structure
// ──────────────────────────────────────────────────────────
describe('getPublicProfileFilters', () => {
    it('returns an array of filter conditions', () => {
        const filters = getPublicProfileFilters();
        expect(Array.isArray(filters)).toBe(true);
        expect(filters.length).toBeGreaterThanOrEqual(4);
    });

    it('includes PUBLISHED status filter', () => {
        const filters = getPublicProfileFilters();
        const statusFilter = filters.find((f: any) => f.status === 'PUBLISHED');
        expect(statusFilter).toBeDefined();
    });

    it('includes is_verified: true filter', () => {
        const filters = getPublicProfileFilters();
        const verifiedFilter = filters.find((f: any) => f.is_verified === true);
        expect(verifiedFilter).toBeDefined();
    });

    it('includes user.isBanned: false filter', () => {
        const filters = getPublicProfileFilters();
        const bannedFilter = filters.find((f: any) => f.user?.isBanned === false);
        expect(bannedFilter).toBeDefined();
    });

    it('excludes health category', () => {
        const filters = getPublicProfileFilters();
        const categoryFilter = filters.find((f: any) => f.category?.slug?.not === 'health');
        expect(categoryFilter).toBeDefined();
    });
});

// ──────────────────────────────────────────────────────────
// Suite 6.2 — Negative Tests: Incomplete profiles NEVER appear
// ──────────────────────────────────────────────────────────
describe('wouldProfileBePublic — visibility gate', () => {
    const validProfile = {
        status: 'PUBLISHED',
        is_verified: true,
        user: { isBanned: false },
        category: { slug: 'beauty' },
    };

    it('accepts a fully valid PUBLISHED profile', () => {
        expect(wouldProfileBePublic(validProfile)).toBe(true);
    });

    it('rejects DRAFT status', () => {
        expect(wouldProfileBePublic({ ...validProfile, status: 'DRAFT' })).toBe(false);
    });

    it('rejects PENDING_REVIEW status', () => {
        expect(wouldProfileBePublic({ ...validProfile, status: 'PENDING_REVIEW' })).toBe(false);
    });

    it('rejects SUSPENDED status', () => {
        expect(wouldProfileBePublic({ ...validProfile, status: 'SUSPENDED' })).toBe(false);
    });

    it('rejects unverified profiles (is_verified: false)', () => {
        expect(wouldProfileBePublic({ ...validProfile, is_verified: false })).toBe(false);
    });

    it('rejects banned user profiles', () => {
        expect(wouldProfileBePublic({
            ...validProfile,
            user: { isBanned: true },
        })).toBe(false);
    });

    it('rejects health category profiles', () => {
        expect(wouldProfileBePublic({
            ...validProfile,
            category: { slug: 'health' },
        })).toBe(false);
    });

    it('accepts PUBLISHED profile even if image_url is null (publish gate prevents this state)', () => {
        // The public query does NOT check image_url — the publish gate enforces it.
        // If somehow a PUBLISHED profile has no avatar, it still passes the query filter.
        // This is by design: publish gate = completeness check, query = status check.
        expect(wouldProfileBePublic(validProfile)).toBe(true);
    });
});
