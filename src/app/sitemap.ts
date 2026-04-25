import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/slugify';

const BASE_URL = 'https://www.svoi.de';

// Must mirror RESERVED_SLUGS in src/app/[city]/page.tsx
const RESERVED_SLUGS = new Set([
    'login', 'register', 'auth', 'api', 'admin', 'dashboard',
    'onboarding', 'search', 'account', 'provider', 'salon', 'become-pro',
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Static routes
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: BASE_URL,                       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
        { url: `${BASE_URL}/become-pro`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
        { url: `${BASE_URL}/search`,            lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
        { url: `${BASE_URL}/about`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${BASE_URL}/guide`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${BASE_URL}/agb`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/datenschutz`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/impressum`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ];

    try {
        // ── Single query: fetch all published profiles with their city and category slug ──
        // This lets us derive:
        //   a) the set of distinct city slugs
        //   b) only city×category pairs that have ≥ 1 real profile (no ghost pages indexed)
        const publishedProfiles = await prisma.profile.findMany({
            where: { status: 'PUBLISHED' },
            select: {
                slug: true,
                city: true,
                category: { select: { slug: true } },
            },
        });

        // 2. Profile pages (/salon/:slug)
        // Profile model has no updated_at; use new Date() so Google always
        // considers these pages fresh and re-crawls for price/portfolio changes.
        const profileRoutes: MetadataRoute.Sitemap = publishedProfiles.map((profile) => ({
            url: `${BASE_URL}/salon/${profile.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        }));

        // 3. Distinct city pages (/:citySlug)
        const citySlugsRaw = new Set<string>();
        for (const profile of publishedProfiles) {
            const s = slugify(profile.city);
            if (s && !RESERVED_SLUGS.has(s)) {
                citySlugsRaw.add(s);
            }
        }
        const citySlugs = Array.from(citySlugsRaw);

        const cityRoutes: MetadataRoute.Sitemap = citySlugs.map((citySlug) => ({
            url: `${BASE_URL}/${citySlug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));

        // 4. City × Category landing pages (/:citySlug/:categorySlug)
        //    Only emit pairs where ≥ 1 published profile actually exists —
        //    prevents Google indexing hundreds of empty pages.
        const cityCategoryPairs = new Set<string>();
        for (const profile of publishedProfiles) {
            const citySlug = slugify(profile.city);
            const categorySlug = profile.category?.slug;
            if (
                citySlug &&
                !RESERVED_SLUGS.has(citySlug) &&
                categorySlug &&
                categorySlug !== 'health' // excluded from search filters everywhere
            ) {
                cityCategoryPairs.add(`${citySlug}/${categorySlug}`);
            }
        }

        const cityCategoryRoutes: MetadataRoute.Sitemap = Array.from(cityCategoryPairs).map(
            (pair) => ({
                url: `${BASE_URL}/${pair}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.9,
            })
        );

        return [
            ...staticRoutes,
            ...profileRoutes,
            ...cityRoutes,
            ...cityCategoryRoutes,
        ];
    } catch (e) {
        console.warn('[sitemap] DB unreachable, returning static routes only:', e);
        return staticRoutes;
    }
}
