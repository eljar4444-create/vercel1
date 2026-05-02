import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/slugify';
import { SITE_ORIGIN, languageAlternates } from '@/i18n/canonical';

// Must mirror RESERVED_SLUGS in src/app/[locale]/[city]/page.tsx
const RESERVED_SLUGS = new Set([
    'login', 'register', 'auth', 'api', 'admin', 'dashboard',
    'onboarding', 'search', 'account', 'provider', 'salon', 'become-pro',
]);

type EntryInput = {
    path: string;
    lastModified?: Date;
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
};

function entry({ path, lastModified, changeFrequency, priority }: EntryInput): MetadataRoute.Sitemap[number] {
    return {
        url: `${SITE_ORIGIN}${path === '/' ? '' : path}`,
        lastModified: lastModified ?? new Date(),
        changeFrequency,
        priority,
        alternates: { languages: languageAlternates(path) },
    };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        entry({ path: '/',             changeFrequency: 'daily',   priority: 1.0 }),
        entry({ path: '/become-pro',   changeFrequency: 'monthly', priority: 0.9 }),
        entry({ path: '/search',       changeFrequency: 'daily',   priority: 0.9 }),
        entry({ path: '/about',        changeFrequency: 'monthly', priority: 0.8 }),
        entry({ path: '/guide',        changeFrequency: 'monthly', priority: 0.8 }),
        entry({ path: '/agb',          changeFrequency: 'monthly', priority: 0.3 }),
        entry({ path: '/datenschutz',  changeFrequency: 'monthly', priority: 0.3 }),
        entry({ path: '/impressum',    changeFrequency: 'monthly', priority: 0.3 }),
    ];

    try {
        const publishedProfiles = await prisma.profile.findMany({
            where: { status: 'PUBLISHED' },
            select: {
                slug: true,
                city: true,
                updatedAt: true,
                category: { select: { slug: true } },
            },
        });

        const profileRoutes: MetadataRoute.Sitemap = publishedProfiles.map((profile) =>
            entry({
                path: `/salon/${profile.slug}`,
                lastModified: profile.updatedAt || new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
            })
        );

        const citySlugsRaw = new Set<string>();
        for (const profile of publishedProfiles) {
            const s = slugify(profile.city);
            if (s && !RESERVED_SLUGS.has(s)) {
                citySlugsRaw.add(s);
            }
        }

        const cityRoutes: MetadataRoute.Sitemap = Array.from(citySlugsRaw).map((citySlug) =>
            entry({ path: `/${citySlug}`, changeFrequency: 'weekly', priority: 0.7 })
        );

        const cityCategoryPairs = new Set<string>();
        for (const profile of publishedProfiles) {
            const citySlug = slugify(profile.city);
            const categorySlug = profile.category?.slug;
            if (
                citySlug &&
                !RESERVED_SLUGS.has(citySlug) &&
                categorySlug &&
                categorySlug !== 'health'
            ) {
                cityCategoryPairs.add(`${citySlug}/${categorySlug}`);
            }
        }

        const cityCategoryRoutes: MetadataRoute.Sitemap = Array.from(cityCategoryPairs).map(
            (pair) => entry({ path: `/${pair}`, changeFrequency: 'weekly', priority: 0.9 })
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
