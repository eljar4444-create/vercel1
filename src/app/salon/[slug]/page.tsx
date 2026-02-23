import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProfileClient } from '@/components/ProfileClient';
import { GERMAN_CITIES } from '@/constants/germanCities';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const DEFAULT_CITY_COORDS = {
    lat: 52.52,
    lng: 13.405,
};
const addressCoordsCache = new Map<string, { lat: number; lng: number }>();

function resolveCityCoordinates(city: string) {
    const normalized = city.trim().toLowerCase();
    const match = GERMAN_CITIES.find((entry) =>
        entry.names.some((name) => normalized.includes(name.toLowerCase()))
    );

    if (!match) {
        return DEFAULT_CITY_COORDS;
    }

    return {
        lat: Number(match.data.lat) || DEFAULT_CITY_COORDS.lat,
        lng: Number(match.data.lon) || DEFAULT_CITY_COORDS.lng,
    };
}

async function resolveAddressCoordinates(address: string, city: string) {
    const query = [address, city, 'Deutschland'].filter(Boolean).join(', ').trim();
    if (!query) return null;

    const cached = addressCoordsCache.get(query);
    if (cached) return cached;

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
            {
                headers: {
                    'Accept-Language': 'de,en',
                    'User-Agent': 'svoi.de/1.0 (support@svoi.de)',
                },
                cache: 'no-store',
            }
        );
        if (!response.ok) return null;

        const payload = (await response.json()) as Array<{ lat: string; lon: string }>;
        const first = payload?.[0];
        if (!first) return null;

        const lat = Number(first.lat);
        const lng = Number(first.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const coords = { lat, lng };
        addressCoordsCache.set(query, coords);
        return coords;
    } catch {
        return null;
    }
}

async function getProfileBySlug(slug: string) {
    return prisma.profile.findUnique({
        where: { slug },
        select: {
            id: true,
            slug: true,
            name: true,
            provider_type: true,
            city: true,
            address: true,
            image_url: true,
            gallery: true,
            studioImages: true,
            bio: true,
            phone: true,
            is_verified: true,
            created_at: true,
            attributes: true,
            schedule: true,
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            services: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    images: true,
                    price: true,
                    duration_min: true,
                },
            },
        },
    });
}

export async function generateMetadata({
    params,
}: {
    params: { slug: string };
}): Promise<Metadata> {
    const profile = await getProfileBySlug(params.slug);
    if (!profile) {
        return { title: 'Профиль не найден | Svoi.de' };
    }

    const topService = profile.services.length > 0 ? profile.services[0].title : profile.category?.name || 'Мастер красоты';
    const title = `${profile.name} — ${topService} в ${profile.city} | Svoi.de`;
    const description = profile.bio
        ? profile.bio.slice(0, 150).trim() + (profile.bio.length > 150 ? '…' : '')
        : `${profile.name} — ${topService} в ${profile.city}. Онлайн-запись через Svoi.de.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            ...(profile.image_url ? { images: [{ url: profile.image_url }] } : {}),
        },
    };
}

export default async function SalonProfilePage({
    params,
}: {
    params: { slug: string };
}) {
    const profile = await getProfileBySlug(params.slug);
    if (!profile) notFound();

    const cityCoordinates = resolveCityCoordinates(profile.city);
    const preciseCoordinates =
        profile.provider_type === 'SALON' && profile.address
            ? await resolveAddressCoordinates(profile.address, profile.city)
            : null;
    const mapCoordinates = preciseCoordinates || cityCoordinates;

    // Compute values for JSON-LD
    const services = profile.services || [];
    const topService = services.length > 0 ? services[0].title : profile.category?.name || 'Мастер красоты';
    const prices = services.map(s => Number(s.price)).filter(p => Number.isFinite(p) && p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : undefined;
    const priceRange = minPrice !== undefined && maxPrice !== undefined
        ? `€${minPrice.toFixed(0)} - €${maxPrice.toFixed(0)}`
        : '€€€';
    const bioText = (profile.bio || '').trim();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: profile.name,
        description: bioText || `${topService} in ${profile.city}`,
        address: {
            '@type': 'PostalAddress',
            addressLocality: profile.city,
            ...(profile.address ? { streetAddress: profile.address } : {}),
            addressCountry: 'DE',
        },
        ...(profile.image_url ? { image: profile.image_url } : {}),
        priceRange,
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '5.0',
            reviewCount: '48',
            bestRating: '5',
            worstRating: '1',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: mapCoordinates.lat,
            longitude: mapCoordinates.lng,
        },
        url: `https://svoi.de/salon/${profile.slug}`,
    };

    // Serialize for client component (Decimal → string, Date → string)
    const serialized = {
        id: profile.id,
        name: profile.name,
        provider_type: profile.provider_type,
        city: profile.city,
        address: profile.address,
        image_url: profile.image_url,
        gallery: profile.gallery,
        studioImages: profile.studioImages,
        bio: profile.bio,
        phone: profile.phone,
        is_verified: profile.is_verified,
        created_at: profile.created_at.toISOString(),
        latitude: mapCoordinates.lat,
        longitude: mapCoordinates.lng,
        attributes: profile.attributes,
        category: profile.category
            ? { id: profile.category.id, name: profile.category.name, slug: profile.category.slug }
            : null,
        services: profile.services.map(s => ({
            id: s.id,
            title: s.title,
            description: s.description,
            images: s.images,
            price: s.price.toString(),
            duration_min: s.duration_min,
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProfileClient profile={serialized} />
        </>
    );
}
