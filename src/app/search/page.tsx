export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { getCityFilterVariants } from "@/constants/searchSuggestions";
import { GERMAN_CITIES } from "@/constants/germanCities";
import { SearchInteractiveLayout } from "@/components/search/SearchInteractiveLayout";
import { ActiveFilters } from "@/components/search/ActiveFilters";
import { getFavoriteProfileIds } from "@/app/actions/favorites";
import { geocodeCity } from "@/lib/geocode";
import { calculateMapZoom } from "@/components/search/types";
import type { Metadata } from "next";
import { SearchQuickFilters } from "@/components/search/SearchQuickFilters";

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
    const languageFilter = typeof searchParams.language === 'string' ? searchParams.language : undefined;

    // Bounding box from URL (set by client-side map interactions)
    const urlMinLat = typeof searchParams.minLat === 'string' ? parseFloat(searchParams.minLat) : undefined;
    const urlMaxLat = typeof searchParams.maxLat === 'string' ? parseFloat(searchParams.maxLat) : undefined;
    const urlMinLng = typeof searchParams.minLng === 'string' ? parseFloat(searchParams.minLng) : undefined;
    const urlMaxLng = typeof searchParams.maxLng === 'string' ? parseFloat(searchParams.maxLng) : undefined;

    // Legacy lat/lng support (e.g. from search bar)
    const urlLat = typeof searchParams.lat === 'string' ? parseFloat(searchParams.lat) : undefined;
    const urlLng = typeof searchParams.lng === 'string' ? parseFloat(searchParams.lng) : undefined;
    const urlRadius = typeof searchParams.radius === 'string' ? parseFloat(searchParams.radius) : undefined;

    const sortParam = typeof searchParams.sort === 'string' ? searchParams.sort : undefined;
    const todayFilter = searchParams.today === 'true';
    const homeVisitFilter = searchParams.homeVisit === 'true';
    const promoFilter = searchParams.promo === 'true';
    const inSalonFilter = searchParams.inSalon === 'true';
    const cardPaymentFilter = searchParams.cardPayment === 'true';
    const instantBookingFilter = searchParams.instantBooking === 'true';

    const andConditions: any[] = [
        { status: 'PUBLISHED' },
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

    if (languageFilter) {
        andConditions.push({ languages: { has: languageFilter } });
    }

    if (homeVisitFilter) {
        andConditions.push({
            attributes: {
                path: ['homeVisit'],
                equals: true,
            },
        });
    }

    if (promoFilter) {
        andConditions.push({
            attributes: {
                path: ['hasPromo'],
                equals: true,
            },
        });
    }

    if (todayFilter) {
        andConditions.push({
            attributes: {
                path: ['availableToday'],
                equals: true,
            },
        });
    }

    if (inSalonFilter) {
        andConditions.push({
            OR: [
                { provider_type: 'SALON' },
                { attributes: { path: ['inSalon'], equals: true } },
            ],
        });
    }

    if (cardPaymentFilter) {
        andConditions.push({
            attributes: {
                path: ['cardPayment'],
                equals: true,
            },
        });
    }

    if (instantBookingFilter) {
        andConditions.push({
            attributes: {
                path: ['instantBooking'],
                equals: true,
            },
        });
    }

    const where: any = { AND: andConditions };

    let orderBy: any = { created_at: 'desc' };
    if (sortParam === 'rating') {
        orderBy = { reviews: { _avg: { rating: 'desc' } } };
    }

    let profiles: any[] = [];
    try {
        profiles = await prisma.profile.findMany({
            where,
            include: {
                category: true,
                services: true,
                reviews: true,
            },
            orderBy,
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
        <main className="h-[calc(100dvh-64px)] overflow-hidden bg-transparent">
            <Suspense fallback={<div className="flex h-full items-center justify-center"><p className="text-slate-500">Загрузка...</p></div>}>
                <SearchInteractiveLayout
                    initialProfiles={mappedProfiles}
                    initialMapMarkers={mapMarkers}
                    favoriteIds={favoriteProfileIds}
                    initialCenter={initialCenter}
                    initialZoom={urlRadius ? calculateMapZoom(urlRadius) : undefined}
                    radiusKm={urlRadius}
                    headerContent={
                        <>
                            <ActiveFilters
                                cityFilter={cityFilter}
                                queryFilter={queryFilter}
                                languageFilter={languageFilter}
                            />
                            <SearchQuickFilters />
                        </>
                    }
                />
            </Suspense>
        </main>
    );
}
