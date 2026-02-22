import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProfileClient } from '@/components/ProfileClient';
import { GERMAN_CITIES } from '@/constants/germanCities';

export const dynamic = 'force-dynamic';

const DEFAULT_CITY_COORDS = {
    lat: 52.52,
    lng: 13.405,
};

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

export default async function ProfileDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const profileId = parseInt(params.id, 10);
    if (isNaN(profileId)) notFound();

    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: {
            id: true,
            name: true,
            provider_type: true,
            city: true,
            address: true,
            image_url: true,
            gallery: true,
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

    if (!profile) notFound();

    const cityCoordinates = resolveCityCoordinates(profile.city);

    // Serialize for client component (Decimal → string, Date → string)
    const serialized = {
        id: profile.id,
        name: profile.name,
        provider_type: profile.provider_type,
        city: profile.city,
        address: profile.address,
        image_url: profile.image_url,
        gallery:
            profile.gallery.length > 0
                ? profile.gallery
                : [
                      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1600&q=80',
                      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80',
                      'https://images.unsplash.com/photo-1633681926035-ec1ac984418a?auto=format&fit=crop&w=1600&q=80',
                  ],
        bio: profile.bio,
        phone: profile.phone,
        is_verified: profile.is_verified,
        created_at: profile.created_at.toISOString(),
        latitude: cityCoordinates.lat,
        longitude: cityCoordinates.lng,
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

    return <ProfileClient profile={serialized} />;
}
