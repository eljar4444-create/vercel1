import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProfileClient } from '@/components/ProfileClient';

export const dynamic = 'force-dynamic';

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
            city: true,
            address: true,
            image_url: true,
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
                    price: true,
                    duration_min: true,
                },
            },
        },
    });

    if (!profile) notFound();

    // Serialize for client component (Decimal → string, Date → string)
    const serialized = {
        id: profile.id,
        name: profile.name,
        city: profile.city,
        address: profile.address,
        image_url: profile.image_url,
        bio: profile.bio,
        phone: profile.phone,
        is_verified: profile.is_verified,
        created_at: profile.created_at.toISOString(),
        attributes: profile.attributes,
        category: profile.category
            ? { id: profile.category.id, name: profile.category.name, slug: profile.category.slug }
            : null,
        services: profile.services.map(s => ({
            id: s.id,
            title: s.title,
            price: s.price.toString(),
            duration_min: s.duration_min,
        })),
    };

    return <ProfileClient profile={serialized} />;
}
