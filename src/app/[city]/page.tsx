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
 * e.g. "muenchen" → "München", "berlin" → "Berlin"
 */
function resolveCityName(slug: string): string {
    const decoded = decodeURIComponent(slug).toLowerCase().replace(/-/g, ' ');

    for (const entry of GERMAN_CITIES) {
        for (const name of entry.names) {
            if (name.toLowerCase() === decoded) {
                // Return the German display name
                const display = entry.data?.display_name?.split(',')?.[0]?.trim();
                return display || name.charAt(0).toUpperCase() + name.slice(1);
            }
        }
        // Also try matching slugified versions
        const display = entry.data?.display_name?.split(',')?.[0]?.trim() || '';
        if (display.toLowerCase().replace(/\s+/g, '-') === decoded.replace(/\s+/g, '-')) {
            return display;
        }
    }

    // Fallback: capitalize the slug
    return deslugify(slug);
}

export async function generateMetadata({
    params,
}: {
    params: { city: string };
}): Promise<Metadata> {
    const cityName = resolveCityName(params.city);

    return {
        title: `Мастера красоты в г. ${cityName} — Запись онлайн | Svoi.de`,
        description: `Найдите лучших мастеров красоты в ${cityName}. Сравните цены, посмотрите портфолио и запишитесь онлайн на Svoi.de. Бесплатно и без комиссии.`,
    };
}

export default async function CityPage({
    params,
}: {
    params: { city: string };
}) {
    const cityName = resolveCityName(params.city);
    const cityVariants = getCityFilterVariants(cityName);

    const andConditions: any[] = [
        { is_verified: true },
        { category: { slug: { not: 'health' } } },
    ];

    if (cityVariants.length > 0) {
        andConditions.push({
            OR: cityVariants.map((variant) => ({
                city: { contains: variant, mode: 'insensitive' },
            })),
        });
    }

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
                <nav aria-label="Навигация" className="mb-6">
                    <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-800">
                        ← На главную
                    </Link>
                </nav>

                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Мастера красоты в {cityName}
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
                                В городе {cityName} пока нет зарегистрированных мастеров.
                            </p>
                            <Link
                                href="/search"
                                className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Искать по всей Германии
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
