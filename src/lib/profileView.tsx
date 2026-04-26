import 'server-only';
import { cache } from 'react';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { GERMAN_CITIES } from '@/constants/germanCities';
import { ProfileClient } from '@/components/ProfileClient';
import { parseSchedule } from '@/lib/scheduling';
import { LANGUAGES, normalizeProviderLanguage } from '@/lib/provider-languages';

const SCHEMA_DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
] as const;

function buildOpeningHoursSpecification(rawSchedule: Prisma.JsonValue | null | undefined) {
    if (rawSchedule == null) return [];
    const parsed = parseSchedule(rawSchedule);
    const specs: Array<{
        '@type': 'OpeningHoursSpecification';
        dayOfWeek: string;
        opens: string;
        closes: string;
    }> = [];

    for (const day of parsed.days) {
        const dayName = SCHEMA_DAY_NAMES[day.day];
        if (!dayName) continue;
        for (const interval of day.intervals) {
            specs.push({
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: dayName,
                opens: interval.start,
                closes: interval.end,
            });
        }
    }
    return specs;
}

function buildKnowsLanguage(languages: string[]) {
    const codes = new Set<string>();
    for (const raw of languages) {
        const canonical = normalizeProviderLanguage(raw);
        if (!canonical) continue;
        const code = LANGUAGES[canonical]?.code;
        if (code) codes.add(code);
    }
    return Array.from(codes);
}

const DEFAULT_CITY_COORDS = { lat: 52.52, lng: 13.405 };

const PROFILE_VIEW_SELECT = {
    id: true,
    slug: true,
    user_id: true,
    name: true,
    provider_type: true,
    city: true,
    address: true,
    image_url: true,
    gallery: true,
    studioImages: true,
    bio: true,
    phone: true,
    latitude: true,
    longitude: true,
    is_verified: true,
    created_at: true,
    attributes: true,
    schedule: true,
    status: true,
    category: { select: { id: true, name: true, slug: true } },
    services: {
        select: {
            id: true,
            title: true,
            description: true,
            images: true,
            price: true,
            duration_min: true,
            photos: { orderBy: { position: 'asc' as const }, select: { url: true } },
        },
    },
    reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' as const },
        select: {
            id: true,
            comment: true,
            rating: true,
            createdAt: true,
            client: { select: { name: true } },
        },
    },
    staff: {
        select: {
            id: true,
            name: true,
            avatarUrl: true,
            specialty: true,
            experience: true,
            rating: true,
            tags: true,
            photos: { orderBy: { position: 'asc' as const }, select: { url: true } },
        },
    },
    photos: {
        where: { serviceId: null, staffId: null },
        orderBy: { position: 'asc' as const },
        select: { url: true },
    },
} satisfies Prisma.ProfileSelect;

export type ProfileForView = Prisma.ProfileGetPayload<{ select: typeof PROFILE_VIEW_SELECT }>;

export const fetchProfileForView = cache(async (
    slug: string,
    opts: { includeDraft: boolean }
): Promise<ProfileForView | null> => {
    return prisma.profile.findFirst({
        where: opts.includeDraft ? { slug } : { slug, status: 'PUBLISHED' },
        select: PROFILE_VIEW_SELECT,
    });
});

function resolveCityCoordinates(city: string) {
    const normalized = city.trim().toLowerCase();
    const match = GERMAN_CITIES.find((entry) =>
        entry.names.some((name) => normalized.includes(name.toLowerCase()))
    );
    if (!match) return DEFAULT_CITY_COORDS;
    return {
        lat: Number(match.data.lat) || DEFAULT_CITY_COORDS.lat,
        lng: Number(match.data.lon) || DEFAULT_CITY_COORDS.lng,
    };
}



export async function PublicProfileView({
    profile,
    isPreview = false,
}: {
    profile: ProfileForView;
    isPreview?: boolean;
}) {
    const languageRows = await prisma.$queryRaw<Array<{ languages: string[] | null }>>`
        SELECT "languages"
        FROM "Profile"
        WHERE "id" = ${profile.id}
        LIMIT 1
    `;
    const profileLanguages = languageRows[0]?.languages ?? [];

    const cityCoordinates = resolveCityCoordinates(profile.city);
    const mapCoordinates =
        profile.latitude != null && profile.longitude != null
            ? { lat: profile.latitude, lng: profile.longitude }
            : cityCoordinates;

    const reviewStats = await prisma.review.aggregate({
        where: { profileId: profile.id },
        _avg: { rating: true },
        _count: { id: true },
    });
    const averageRating = reviewStats._avg.rating ? Number(reviewStats._avg.rating.toFixed(1)) : 5.0;
    const reviewCount = reviewStats._count.id || 0;

    const services = profile.services || [];
    const topService = services.length > 0 ? services[0].title : profile.category?.name || 'Мастер красоты';
    const prices = services.map((s) => Number(s.price)).filter((p) => Number.isFinite(p) && p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : undefined;
    const priceRange =
        minPrice !== undefined && maxPrice !== undefined
            ? `€${minPrice.toFixed(0)} - €${maxPrice.toFixed(0)}`
            : null;
    const bioText = (profile.bio || '').trim();

    const schemaType: string | string[] =
        profile.provider_type === 'SALON'
            ? 'BeautySalon'
            : ['Person', 'HealthAndBeautyBusiness'];

    const openingHours = buildOpeningHoursSpecification(profile.schedule);
    const knowsLanguage = buildKnowsLanguage(profileLanguages);
    const phone = profile.phone?.trim() || null;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        name: profile.name,
        description: bioText || `${topService} in ${profile.city}`,
        address: {
            '@type': 'PostalAddress',
            addressLocality: profile.city,
            ...(profile.address ? { streetAddress: profile.address } : {}),
            addressCountry: 'DE',
        },
        ...(profile.image_url ? { image: profile.image_url } : {}),
        ...(priceRange ? { priceRange } : {}),
        ...(phone ? { telephone: phone } : {}),
        ...(knowsLanguage.length > 0 ? { knowsLanguage } : {}),
        ...(openingHours.length > 0 ? { openingHoursSpecification: openingHours } : {}),
        ...(reviewCount > 0 && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: averageRating.toString(),
                reviewCount: reviewCount.toString(),
                bestRating: '5',
                worstRating: '1',
            },
        }),
        ...(services.length > 0 && {
            hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Услуги',
                itemListElement: services
                    .map((s) => ({
                        '@type': 'Offer',
                        itemOffered: { '@type': 'Service', name: s.title },
                        price: Number(s.price),
                        priceCurrency: 'EUR',
                    }))
                    .filter((offer) => Number.isFinite(offer.price) && offer.price > 0),
            },
        }),
        geo: {
            '@type': 'GeoCoordinates',
            latitude: mapCoordinates.lat,
            longitude: mapCoordinates.lng,
        },
        url: `https://www.svoi.de/salon/${profile.slug}`,
    };

    const serialized = {
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        provider_type: profile.provider_type,
        city: profile.city,
        address: profile.address,
        image_url: profile.image_url,
        gallery: profile.gallery,
        studioImages: [
            ...(profile.photos?.map((p) => p.url) ?? []),
            ...(profile.studioImages ?? []),
        ],
        bio: profile.bio,
        phone: profile.phone,
        languages: profileLanguages,
        is_verified: profile.is_verified,
        created_at:
            profile.created_at instanceof Date
                ? profile.created_at.toISOString()
                : String(profile.created_at),
        latitude: mapCoordinates.lat,
        longitude: mapCoordinates.lng,
        attributes: profile.attributes,
        category: profile.category
            ? { id: profile.category.id, name: profile.category.name, slug: profile.category.slug }
            : null,
        services: profile.services.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            images: s.images,
            portfolioPhotos: s.photos.map((p) => p.url),
            price: s.price.toString(),
            duration_min: s.duration_min,
        })),
        averageRating,
        reviewCount,
        reviews:
            profile.reviews?.map((r) => ({
                id: r.id,
                comment: r.comment,
                rating: r.rating,
                createdAt:
                    r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
                clientName: r.client?.name ?? 'Клиент',
            })) ?? [],
        staff:
            profile.staff?.map((s) => ({
                id: s.id,
                name: s.name,
                avatarUrl: s.avatarUrl,
                specialty: s.specialty,
                experience: s.experience,
                rating: typeof s.rating === 'number' ? s.rating : 5.0,
                tags: s.tags ?? [],
                photos: s.photos?.map((p) => p.url) ?? [],
            })) ?? [],
    };

    return (
        <>
            {isPreview && (
                <div className="sticky top-0 z-50 w-full bg-amber-100 border-b border-amber-300 px-4 py-2.5 text-center text-sm text-amber-900 shadow-sm">
                    Это режим предпросмотра. Клиенты видят вашу опубликованную версию по основной ссылке.
                </div>
            )}
            {!isPreview && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ProfileClient profile={serialized} />
        </>
    );
}
