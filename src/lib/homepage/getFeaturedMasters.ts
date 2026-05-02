import 'server-only';
import prisma from '@/lib/prisma';
import { localizeCategoryName, localizeService } from '@/lib/localized';

export type ProviderType = 'SALON' | 'PRIVATE' | 'INDIVIDUAL';

export interface FeaturedMaster {
    id: number;
    slug: string;
    name: string;
    category: string;
    city: string;
    isVerified: boolean;
    providerType: ProviderType;
    avgRating: string;
    reviewCount: number;
    workPhotoUrl: string | null;
    services: { title: string; price: number; durationMin: number }[];
}

export async function getFeaturedMasters(limit: number = 8, locale: string = 'ru'): Promise<FeaturedMaster[]> {
    try {
        const masters = await prisma.profile.findMany({
            where: {
                user: { isBanned: false },
                status: 'PUBLISHED',
                is_verified: true,
            },
            take: limit,
            include: {
                reviews: { select: { rating: true } },
                category: { select: { name: true, translations: { select: { locale: true, name: true } } } },
                user: { select: { image: true } },
                services: {
                    select: {
                        title: true,
                        price: true,
                        duration_min: true,
                        translations: { select: { locale: true, title: true, description: true } },
                    },
                    take: 2,
                },
                photos: {
                    where: { serviceId: null, staffId: null },
                    orderBy: { position: 'asc' },
                    select: { url: true },
                    take: 1,
                },
            },
            orderBy: { created_at: 'desc' },
        });

        return masters.map((master) => {
            const avgRating =
                master.reviews.length > 0
                    ? (
                          master.reviews.reduce((sum, r) => sum + r.rating, 0) /
                          master.reviews.length
                      ).toFixed(1)
                    : '5.0';

            const isSalon = master.provider_type === 'SALON';

            const interiorPhoto =
                master.photos[0]?.url?.trim() ||
                master.studioImages.find((p) => typeof p === 'string' && p.trim().length > 0) ||
                master.gallery.find((p) => typeof p === 'string' && p.trim().length > 0) ||
                null;

            const avatarPhoto = master.image_url?.trim() || master.user?.image?.trim() || null;

            const workPhotoUrl = isSalon ? interiorPhoto : avatarPhoto || interiorPhoto;

            return {
                id: master.id,
                slug: master.slug,
                name: master.name,
                category: master.category ? localizeCategoryName(master.category, locale) : 'Beauty Pro',
                city: master.city,
                isVerified: master.is_verified,
                providerType: master.provider_type as ProviderType,
                avgRating,
                reviewCount: master.reviews.length,
                workPhotoUrl,
                services: master.services.map((rawService) => {
                    const service = localizeService(rawService, locale);
                    return {
                        title: service.title,
                        price: Number(service.price),
                        durationMin: service.duration_min,
                    };
                }),
            };
        });
    } catch (e) {
        console.warn('[getFeaturedMasters] DB unreachable, returning empty list:', e);
        return [];
    }
}
