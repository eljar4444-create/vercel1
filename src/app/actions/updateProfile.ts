'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { generateUniqueProfileSlug } from '@/lib/slugify';
import { geocodeAddress } from '@/lib/geocode';

const GEO_ERROR_MESSAGE =
    'Мы не смогли найти этот адрес на карте. Пожалуйста, проверьте правильность написания города и адреса или укажите ближайший крупный ориентир.';

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    const profileId = parseInt(formData.get('profile_id') as string, 10);
    let name = (formData.get('name') as string)?.trim() ?? '';
    const providerTypeRaw = formData.get('provider_type');
    const bio = formData.get('bio') as string;
    const phone = formData.get('phone') as string;
    let city = (formData.get('city') as string)?.trim() ?? '';
    let address = (formData.get('address') as string)?.trim() ?? '';
    const providerType = providerTypeRaw === 'SALON' ? 'SALON' : 'PRIVATE';
    const studioImagesRaw = formData.get('studioImages');
    let studioImages: string[] = [];

    if (typeof studioImagesRaw === 'string' && studioImagesRaw.trim()) {
        try {
            const parsed = JSON.parse(studioImagesRaw);
            if (Array.isArray(parsed)) {
                studioImages = parsed
                    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                    .slice(0, 8);
            }
        } catch {
            return { success: false, error: 'Некорректный формат фотографий студии.' };
        }
    }

    if (isNaN(profileId)) {
        return { success: false, error: 'Профиль не указан.' };
    }

    const currentProfile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: {
            user_id: true, user_email: true, name: true,
            city: true, slug: true, address: true, bio: true,
            latitude: true, longitude: true,
        },
    });
    if (!currentProfile) return { success: false, error: 'Профиль не найден.' };

    if (!name) name = currentProfile.name ?? '';
    if (!city) city = (currentProfile.city ?? '').trim();
    if (providerType === 'SALON' && !address) address = (currentProfile.address ?? '').trim();
    const bioToSave = (typeof bio === 'string' && bio.trim()) ? bio.trim() : (currentProfile.bio ?? '');

    if (!name || !city) {
        return { success: false, error: 'Имя и город обязательны.' };
    }
    if (providerType === 'SALON' && !address) {
        return { success: false, error: 'Для салона укажите полный адрес.' };
    }

    try {
        if (session.user.role !== 'ADMIN') {
            const ownsByUserId = currentProfile.user_id && currentProfile.user_id === session.user.id;
            const ownsByEmail = session.user.email && currentProfile.user_email === session.user.email;
            if (!ownsByUserId && !ownsByEmail) {
                return { success: false, error: 'Недостаточно прав.' };
            }
        }

        const nameChanged = name !== currentProfile.name;
        const addressChanged = address !== (currentProfile.address ?? '');

        let officialCity = city;
        let latitude = currentProfile.latitude;
        let longitude = currentProfile.longitude;

        if (nameChanged || addressChanged || city !== currentProfile.city) {
            try {
                const fullAddress = (providerType === 'SALON' && address) ? address : city;
                const coords = await geocodeAddress(fullAddress, city, '');
                if (!coords) {
                    return { success: false, error: GEO_ERROR_MESSAGE };
                }
                latitude = coords.lat;
                longitude = coords.lng;
                officialCity = coords.city || city;
                console.log(`[updateProfile] Geocoded ${officialCity}: ${coords.lat}, ${coords.lng}`);
            } catch (geoError) {
                console.error('[updateProfile] Geocoding error:', geoError);
                return { success: false, error: GEO_ERROR_MESSAGE };
            }
        }

        // Re-generate slug if name or city changed
        const cityChanged = officialCity !== currentProfile.city;
        const newSlug = (nameChanged || cityChanged)
            ? await generateUniqueProfileSlug(name, officialCity, profileId)
            : currentProfile.slug;

        // If profile somehow has no coordinates (legacy), force geocoding
        if (latitude == null || longitude == null) {
            try {
                const fullAddress = (providerType === 'SALON' && address) ? address : city;
                const coords = await geocodeAddress(fullAddress, city, '');
                if (!coords) {
                    return { success: false, error: GEO_ERROR_MESSAGE };
                }
                latitude = coords.lat;
                longitude = coords.lng;
                officialCity = coords.city || city;
                console.log(`[updateProfile] Backfilled coords for profile #${profileId}: ${coords.lat}, ${coords.lng}`);
            } catch (geoError) {
                console.error('[updateProfile] Backfill geocoding error:', geoError);
                return { success: false, error: GEO_ERROR_MESSAGE };
            }
        }

        const updated = await prisma.profile.update({
            where: { id: profileId },
            data: {
                name,
                slug: newSlug,
                provider_type: providerType,
                bio: bioToSave || null,
                phone: phone || null,
                city: officialCity,
                address: providerType === 'SALON' ? address || null : null,
                studioImages,
                latitude,
                longitude,
            },
            select: { slug: true },
        });

        revalidatePath('/dashboard', 'layout');
        revalidatePath(`/salon/${updated.slug}`);

        return { success: true };
    } catch (error: any) {
        console.error('updateProfile error:', error);
        return { success: false, error: 'Ошибка при сохранении профиля.' };
    }
}
