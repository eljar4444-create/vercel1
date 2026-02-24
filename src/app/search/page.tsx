export const dynamic = 'force-dynamic';
export const revalidate = 0;

import prisma from "@/lib/prisma";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { getCityFilterVariants } from "@/constants/searchSuggestions";
import { GERMAN_CITIES } from "@/constants/germanCities";
import { SearchResultListItem } from "@/components/search/SearchResultListItem";
import { SearchResultsMap } from "@/components/search/SearchResultsMap";
import { geocodeCity } from "@/lib/geocode";
import type { Metadata } from "next";
import { Prisma } from "@prisma/client";

const QUICK_FILTERS = ['Рядом со мной', 'Топ рейтинг', 'Стрижка', 'Маникюр', 'Массаж'];

const DEFAULT_CITY_COORDS = {
    lat: 52.52,
    lng: 13.405,
};

function resolveCityCoordinates(city: string) {
    const normalized = city.trim().toLowerCase();
    const match = GERMAN_CITIES.find((entry) =>
        entry.names.some((name: string) => normalized.includes(name.toLowerCase()))
    );

    if (!match) return DEFAULT_CITY_COORDS;
    return {
        lat: Number(match.data.lat) || DEFAULT_CITY_COORDS.lat,
        lng: Number(match.data.lon) || DEFAULT_CITY_COORDS.lng,
    };
}

export async function generateMetadata({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
    const city = typeof searchParams.city === 'string' ? searchParams.city : undefined;
    const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;

    const parts: string[] = [];
    if (query) parts.push(query);
    parts.push('Поиск мастеров');
    if (city) parts.push(`в ${city}`);
    parts.push('Svoi.de');

    const title = parts.join(' — ');
    const description = city
        ? `Найдите лучших мастеров красоты${query ? ` по запросу «${query}»` : ''} в городе ${city}. Онлайн-запись на Svoi.de.`
        : `Найдите лучших мастеров красоты${query ? ` по запросу «${query}»` : ''} в Германии. Онлайн-запись на Svoi.de.`;

    return {
        title,
        description,
    };
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const categoryFilter = typeof searchParams.category === 'string' ? searchParams.category : undefined;
    const cityFilter = typeof searchParams.city === 'string' ? searchParams.city : undefined;
    const queryFilter = typeof searchParams.q === 'string' ? searchParams.q : undefined;
    const radiusParam = typeof searchParams.radius === 'string' ? parseInt(searchParams.radius, 10) : 50;
    const radiusKm = isNaN(radiusParam) || radiusParam <= 0 ? 50 : radiusParam;

    const andConditions: any[] = [{ is_verified: true }, { category: { slug: { not: 'health' } } }];

    if (categoryFilter && categoryFilter !== 'health') {
        andConditions.push({ category: { slug: categoryFilter } });
    }

    // --- Geo-radius search ---
    let geoCenter: { lat: number; lng: number } | null = null;
    let geoProfileIds: number[] | null = null;

    if (cityFilter) {
        // Try to geocode the search city for radius search
        const coords = await geocodeCity(cityFilter);
        if (coords) {
            geoCenter = coords;

            // Haversine query: find Profile IDs within radiusKm
            try {
                const nearbyProfiles = await prisma.$queryRaw<{ id: number; distance: number }[]>`
                    SELECT id,
                        (6371 * acos(
                            LEAST(1.0, GREATEST(-1.0,
                                cos(radians(${coords.lat})) * cos(radians(latitude))
                                * cos(radians(longitude) - radians(${coords.lng}))
                                + sin(radians(${coords.lat})) * sin(radians(latitude))
                            ))
                        )) AS distance
                    FROM "Profile"
                    WHERE latitude IS NOT NULL
                      AND longitude IS NOT NULL
                      AND (6371 * acos(
                            LEAST(1.0, GREATEST(-1.0,
                                cos(radians(${coords.lat})) * cos(radians(latitude))
                                * cos(radians(longitude) - radians(${coords.lng}))
                                + sin(radians(${coords.lat})) * sin(radians(latitude))
                            ))
                          )) <= ${radiusKm}
                    ORDER BY distance ASC
                `;
                geoProfileIds = nearbyProfiles.map((p) => p.id);
            } catch (e) {
                console.error('[search] Haversine query failed:', e);
                // Fall through to string-based city filter below
            }
        }

        if (geoProfileIds !== null) {
            // Use geo IDs filter
            if (geoProfileIds.length === 0) {
                // No providers in radius → force empty result
                andConditions.push({ id: { in: [] } });
            } else {
                andConditions.push({ id: { in: geoProfileIds } });
            }
        } else {
            // Fallback: old city string matching
            const cityVariants = getCityFilterVariants(cityFilter);
            andConditions.push({
                OR: cityVariants.map((variant) => ({
                    city: { contains: variant, mode: 'insensitive' },
                })),
            });
        }
    }

    if (queryFilter) {
        andConditions.push({
            OR: [
                { name: { contains: queryFilter, mode: 'insensitive' } },
                { city: { contains: queryFilter, mode: 'insensitive' } },
                { category: { name: { contains: queryFilter, mode: 'insensitive' } } },
                {
                    services: {
                        some: {
                            title: { contains: queryFilter, mode: 'insensitive' },
                        },
                    },
                },
            ],
        });
    }

    const where: any = { AND: andConditions };

    let profiles: any[] = [];
    try {
        profiles = await prisma.profile.findMany({
            where,
            include: {
                category: true,
                services: true,
            },
            orderBy: { created_at: 'desc' },
            take: 50,
        });
    } catch (e: any) {
        console.error("DB Error:", e);
    }

    // If we have geo IDs, sort profiles by their geo-order (distance ASC)
    if (geoProfileIds && geoProfileIds.length > 0) {
        const orderMap = new Map(geoProfileIds.map((id, index) => [id, index]));
        profiles.sort((a: any, b: any) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
    }

    const mapMarkers = profiles.map((profile) => {
        // Prefer real lat/lng from Profile, fall back to city lookup
        const hasCoords = profile.latitude != null && profile.longitude != null;
        const coords = hasCoords
            ? { lat: profile.latitude as number, lng: profile.longitude as number }
            : resolveCityCoordinates(profile.city || '');
        return {
            id: profile.id,
            name: profile.name,
            providerType: profile.provider_type,
            city: profile.city,
            address: profile.address,
            lat: coords.lat,
            lng: coords.lng,
        };
    });

    return (
        <main className="h-[calc(100vh-64px)] overflow-hidden bg-white">
            <div className="flex h-full flex-col lg:flex-row">
                <div className="h-full w-full overflow-y-auto bg-[#fbfbfb] p-4 pb-24 md:p-5 lg:w-[48%] xl:w-[46%]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h1 className="text-lg font-semibold text-slate-900">
                            {profiles.length > 0
                                ? `Найдено ${profiles.length} специалистов`
                                : 'Специалисты не найдены'}
                        </h1>
                        <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-800">
                            На главную
                        </Link>
                    </div>

                    <nav aria-label="Быстрые фильтры" className="sticky top-0 z-10 -mx-4 mb-4 border-b border-slate-200 bg-[#fbfbfb] px-4 py-2 md:-mx-5 md:px-5">
                        <div className="flex gap-2 overflow-x-auto pb-0.5">
                            {['Все', ...QUICK_FILTERS].map((filter) => {
                                const params = new URLSearchParams();
                                if (filter === 'Все') {
                                    if (cityFilter) params.set('city', cityFilter);
                                    if (queryFilter) params.set('q', queryFilter);
                                } else if (cityFilter) {
                                    params.set('city', cityFilter);
                                }

                                if (filter === 'Рядом со мной') {
                                    if (queryFilter) params.set('q', queryFilter);
                                } else if (filter === 'Топ рейтинг') {
                                    params.set('sort', 'rating');
                                    if (queryFilter) params.set('q', queryFilter);
                                } else if (filter !== 'Все') {
                                    params.set('q', filter);
                                }
                                return (
                                    <Link
                                        key={filter}
                                        href={`/search?${params.toString()}`}
                                        className="min-h-[44px] flex items-center whitespace-nowrap rounded-full border border-slate-200 bg-transparent px-3 py-1.5 text-xs text-slate-700 transition hover:border-slate-300 hover:bg-white"
                                    >
                                        {filter}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    {(cityFilter || queryFilter) && (
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            {cityFilter && (
                                <Link
                                    href={`/search${queryFilter ? `?q=${encodeURIComponent(queryFilter)}` : ''}`}
                                    aria-label={`Удалить фильтр: ${cityFilter}`}
                                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                    {cityFilter}{geoCenter ? ` (${radiusKm} км)` : ''}
                                    <X className="h-3 w-3" />
                                </Link>
                            )}
                            {queryFilter && (
                                <Link
                                    href={`/search${cityFilter ? `?city=${encodeURIComponent(cityFilter)}` : ''}`}
                                    aria-label={`Удалить фильтр: ${queryFilter}`}
                                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-100"
                                >
                                    <Search className="h-3 w-3" />
                                    {queryFilter}
                                    <X className="h-3 w-3" />
                                </Link>
                            )}
                        </div>
                    )}

                    {profiles.length > 0 ? (
                        <div>
                            {profiles.map((profile: any) => (
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
                                        services: (profile.services || []).map((service: any) => ({
                                            id: service.id,
                                            title: service.title,
                                            price: Number(service.price),
                                            duration_min: service.duration_min,
                                        })),
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                            <h2 className="text-lg font-semibold text-slate-900">Специалисты не найдены</h2>
                            <p className="mt-2 text-sm text-slate-500">Попробуйте изменить запрос или город.</p>
                            <Link
                                href="/search"
                                className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Сбросить фильтры
                            </Link>
                        </div>
                    )}
                </div>

                <aside className="relative hidden h-full border-l border-slate-200 bg-slate-100 lg:block lg:w-[52%] xl:w-[54%]">
                    <SearchResultsMap markers={mapMarkers} />
                </aside>
            </div>
        </main>
    );
}

