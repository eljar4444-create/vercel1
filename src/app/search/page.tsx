export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { getCityFilterVariants } from "@/constants/searchSuggestions";
import { GERMAN_CITIES } from "@/constants/germanCities";
import { SearchInteractiveLayout } from "@/components/search/SearchInteractiveLayout";
import { ActiveFilters } from "@/components/search/ActiveFilters";
import { getFavoriteProfileIds } from "@/app/actions/favorites";
import { geocodeCity } from "@/lib/geocode";
import { calculateMapZoom } from "@/components/search/types";
import type { Metadata } from "next";

const QUICK_FILTERS = ['Рядом со мной', 'Топ рейтинг', 'Стрижка', 'Маникюр', 'Массаж'];

const DEFAULT_CITY_COORDS = {
    lat: 52.52,
    lng: 13.405,
};

// ~50km bounding box offset in degrees (rough approximation)
const DEFAULT_BBOX_OFFSET_LAT = 0.45;
const DEFAULT_BBOX_OFFSET_LNG = 0.7;

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

    // Bounding box from URL (set by client-side map interactions)
    const urlMinLat = typeof searchParams.minLat === 'string' ? parseFloat(searchParams.minLat) : undefined;
    const urlMaxLat = typeof searchParams.maxLat === 'string' ? parseFloat(searchParams.maxLat) : undefined;
    const urlMinLng = typeof searchParams.minLng === 'string' ? parseFloat(searchParams.minLng) : undefined;
    const urlMaxLng = typeof searchParams.maxLng === 'string' ? parseFloat(searchParams.maxLng) : undefined;

    // Legacy lat/lng support (e.g. from search bar)
    const urlLat = typeof searchParams.lat === 'string' ? parseFloat(searchParams.lat) : undefined;
    const urlLng = typeof searchParams.lng === 'string' ? parseFloat(searchParams.lng) : undefined;
    const urlRadius = typeof searchParams.radius === 'string' ? parseFloat(searchParams.radius) : undefined;

    const andConditions: any[] = [
        { is_verified: true },
        { category: { slug: { not: 'health' } } },
        { user: { isBanned: false } },
    ];

    if (categoryFilter && categoryFilter !== 'health') {
        andConditions.push({ category: { slug: categoryFilter } });
    }

    // --- Bounding Box geo filter ---
    let initialCenter: [number, number] | undefined = undefined;
    let hasBboxFilter = false;

    // 1. Explicit bounding box from URL (from map user drag)
    if (
        urlMinLat !== undefined && urlMaxLat !== undefined &&
        urlMinLng !== undefined && urlMaxLng !== undefined &&
        !isNaN(urlMinLat) && !isNaN(urlMaxLat) && !isNaN(urlMinLng) && !isNaN(urlMaxLng)
    ) {
        andConditions.push({
            latitude: { not: null, gte: urlMinLat, lte: urlMaxLat },
        });
        andConditions.push({
            longitude: { not: null, gte: urlMinLng, lte: urlMaxLng },
        });
        // CRITICAL: Do NOT set initialCenter here! 
        // This coordinates block comes from the user panning the map. 
        // If we compute the center of the viewport and pass it down as initialCenter, 
        // the MapUpdater will see a "new" initialCenter and fly to it, causing jumps.
        hasBboxFilter = true;
    }
    // 2. Legacy lat/lng → computed bounding box and explicit center
    else if (urlLat !== undefined && urlLng !== undefined && !isNaN(urlLat) && !isNaN(urlLng)) {
        andConditions.push({
            latitude: { not: null, gte: urlLat - DEFAULT_BBOX_OFFSET_LAT, lte: urlLat + DEFAULT_BBOX_OFFSET_LAT },
        });
        andConditions.push({
            longitude: { not: null, gte: urlLng - DEFAULT_BBOX_OFFSET_LNG, lte: urlLng + DEFAULT_BBOX_OFFSET_LNG },
        });
        initialCenter = [urlLat, urlLng];
        hasBboxFilter = true;
    }
    // 3. City string → geocode and compute bounding box
    else if (cityFilter) {
        let coords = await geocodeCity(cityFilter);
        if (!coords) {
            coords = resolveCityCoordinates(cityFilter);
        }
        if (coords) {
            andConditions.push({
                latitude: { not: null, gte: coords.lat - DEFAULT_BBOX_OFFSET_LAT, lte: coords.lat + DEFAULT_BBOX_OFFSET_LAT },
            });
            andConditions.push({
                longitude: { not: null, gte: coords.lng - DEFAULT_BBOX_OFFSET_LNG, lte: coords.lng + DEFAULT_BBOX_OFFSET_LNG },
            });
            initialCenter = [coords.lat, coords.lng];
            hasBboxFilter = true;
        }
    }

    // Fallback: no geo filter → string-based city matching
    if (!hasBboxFilter && cityFilter) {
        const cityVariants = getCityFilterVariants(cityFilter);
        andConditions.push({
            OR: cityVariants.map((variant) => ({
                city: { contains: variant, mode: 'insensitive' },
            })),
        });
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

    const mapMarkers = profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        provider_type: profile.provider_type,
        city: profile.city,
        address: profile.provider_type === 'SALON' ? profile.address : null,
        lat: profile.latitude,
        lng: profile.longitude,
        image: profile.image_url,
        slug: profile.slug,
    }));

    const favoriteProfileIds = await getFavoriteProfileIds();

    const mappedProfiles = profiles.map((profile: any) => ({
        id: profile.id,
        slug: profile.slug,
        name: profile.name,
        provider_type: profile.provider_type,
        city: profile.city,
        address: profile.provider_type === 'SALON' ? profile.address : null,
        image_url: profile.image_url,
        services: (profile.services || []).map((service: any) => ({
            id: service.id,
            title: service.title,
            price: Number(service.price),
            duration_min: service.duration_min,
        })),
    }));

    return (
        <main className="h-[calc(100vh-64px)] overflow-hidden bg-[#FCFAF8]">
            <Suspense fallback={<div className="flex h-full items-center justify-center"><p className="text-slate-500">Загрузка...</p></div>}>
                <SearchInteractiveLayout
                    initialProfiles={mappedProfiles}
                    initialMapMarkers={mapMarkers}
                    favoriteIds={favoriteProfileIds}
                    initialCenter={initialCenter}
                    initialZoom={urlRadius ? calculateMapZoom(urlRadius) : undefined}
                    radiusKm={urlRadius}
                    headerContent={
                        <nav aria-label="Быстрые фильтры" className="sticky top-0 z-10 -mx-4 mb-4 border-b border-[#E5E0D8]/50 bg-[#FCFAF8] px-4 py-2 md:-mx-6 md:px-6">
                            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
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
                                            className="min-h-[36px] flex items-center whitespace-nowrap rounded-full border border-[#E5E0D8] bg-transparent px-3 py-1.5 text-xs text-stone-600 transition hover:border-[#C8B9AC] hover:bg-white"
                                        >
                                            {filter}
                                        </Link>
                                    );
                                })}
                            </div>
                        </nav>
                    }
                />
            </Suspense>
        </main>
    );
}
