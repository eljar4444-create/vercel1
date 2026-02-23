export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getCityFilterVariants } from '@/constants/searchSuggestions';
import { GERMAN_CITIES } from '@/constants/germanCities';
import { SearchResultListItem } from '@/components/search/SearchResultListItem';
import { deslugify } from '@/lib/slugify';
import type { Metadata } from 'next';

/**
 * Resolve slug back to a pretty German city name from GERMAN_CITIES.
 */
function resolveCityName(slug: string): string {
    const decoded = decodeURIComponent(slug).toLowerCase().replace(/-/g, ' ');

    for (const entry of GERMAN_CITIES) {
        for (const name of entry.names) {
            if (name.toLowerCase() === decoded) {
                const display = entry.data?.display_name?.split(',')?.[0]?.trim();
                return display || name.charAt(0).toUpperCase() + name.slice(1);
            }
        }
        const display = entry.data?.display_name?.split(',')?.[0]?.trim() || '';
        if (display.toLowerCase().replace(/\s+/g, '-') === decoded.replace(/\s+/g, '-')) {
            return display;
        }
    }

    return deslugify(slug);
}

/**
 * Resolve category slug to a display name.
 * First tries DB, then falls back to deslugify.
 */
async function resolveCategoryName(slug: string): Promise<string> {
    const decoded = decodeURIComponent(slug);

    try {
        const category = await prisma.category.findUnique({
            where: { slug: decoded },
            select: { name: true },
        });
        if (category) return category.name;
    } catch {
        // DB not available, fallback
    }

    return deslugify(decoded);
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export async function generateMetadata({
    params,
}: {
    params: { city: string; category: string };
}): Promise<Metadata> {
    const cityName = resolveCityName(params.city);
    const categoryName = capitalize(await resolveCategoryName(params.category));

    return {
        title: `${categoryName} в г. ${cityName} — Запись онлайн | Svoi.de`,
        description: `Ищете лучших мастеров по услуге ${categoryName} в ${cityName}? Сравните цены, посмотрите портфолио и запишитесь онлайн на Svoi.de. Бесплатно и без комиссии.`,
    };
}

export default async function CityCategoryPage({
    params,
}: {
    params: { city: string; category: string };
}) {
    const cityName = resolveCityName(params.city);
    const categorySlug = decodeURIComponent(params.category);
    const categoryName = capitalize(await resolveCategoryName(params.category));
    const cityVariants = getCityFilterVariants(cityName);

    // Build query conditions
    const andConditions: any[] = [
        { is_verified: true },
        { category: { slug: { not: 'health' } } },
    ];

    // City filter
    if (cityVariants.length > 0) {
        andConditions.push({
            OR: cityVariants.map((variant) => ({
                city: { contains: variant, mode: 'insensitive' },
            })),
        });
    }

    // Category filter: try matching by Category.slug OR by service title
    andConditions.push({
        OR: [
            { category: { slug: categorySlug } },
            { category: { name: { contains: categoryName, mode: 'insensitive' } } },
            {
                services: {
                    some: {
                        title: { contains: categoryName, mode: 'insensitive' },
                    },
                },
            },
        ],
    });

    let profiles: any[] = [];
    try {
        profiles = await prisma.profile.findMany({
            where: { AND: andConditions },
            include: { category: true, services: true },
            orderBy: { created_at: 'desc' },
            take: 50,
        });
    } catch (e: any) {
        console.error('DB Error:', e);
    }

    return (
        <main className="min-h-screen bg-[#fbfbfb]">
            <div className="container mx-auto max-w-5xl px-4 py-8">
                <nav aria-label="Навигация" className="mb-6 flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/" className="transition hover:text-slate-800">Главная</Link>
                    <span>/</span>
                    <Link href={`/${params.city}`} className="transition hover:text-slate-800">{cityName}</Link>
                    <span>/</span>
                    <span className="text-slate-700 font-medium">{categoryName}</span>
                </nav>

                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    {categoryName} в {cityName}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    {profiles.length > 0
                        ? `Найдено ${profiles.length} специалистов`
                        : 'Специалисты пока не найдены'}
                </p>

                <div className="mt-8">
                    {profiles.length > 0 ? (
                        profiles.map((profile: any) => (
                            <SearchResultListItem
                                key={profile.id}
                                profile={{
                                    id: profile.id,
                                    slug: profile.slug,
                                    name: profile.name,
                                    provider_type: profile.provider_type,
                                    city: profile.city,
                                    address: profile.address,
                                    image_url: profile.image_url,
                                    services: (profile.services || []).map((s: any) => ({
                                        id: s.id,
                                        title: s.title,
                                        price: Number(s.price),
                                        duration_min: s.duration_min,
                                    })),
                                }}
                            />
                        ))
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                            <h2 className="text-lg font-semibold text-slate-900">Специалисты не найдены</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                По запросу «{categoryName}» в городе {cityName} пока нет мастеров.
                            </p>
                            <Link
                                href={`/${params.city}`}
                                className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Все мастера в {cityName}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
