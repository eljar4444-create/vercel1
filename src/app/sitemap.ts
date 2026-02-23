import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/slugify';

const BASE_URL = 'https://www.svoi.de';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Static routes
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/agb`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/datenschutz`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/impressum`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ];

    // 2. Dynamic profile pages (/salon/:slug)
    const profiles = await prisma.profile.findMany({
        select: { slug: true, created_at: true },
    });

    const profileRoutes: MetadataRoute.Sitemap = profiles.map((profile) => ({
        url: `${BASE_URL}/salon/${profile.slug}`,
        lastModified: profile.created_at,
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    // 3. Geo pages — unique cities (/city-slug)
    const citiesRaw = await prisma.profile.findMany({
        select: { city: true },
        distinct: ['city'],
    });

    const cityRoutes: MetadataRoute.Sitemap = citiesRaw.map(({ city }) => ({
        url: `${BASE_URL}/${slugify(city)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    return [...staticRoutes, ...profileRoutes, ...cityRoutes];
}
