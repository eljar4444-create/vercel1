'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { generateUniqueSlug } from '@/lib/generateUniqueSlug';
import { geocodeAddress } from '@/lib/geocode';

const GEO_ERROR_MESSAGE =
    'Мы не смогли найти этот адрес на карте. Пожалуйста, проверьте правильность написания города и адреса или укажите ближайший крупный ориентир.';

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    const profileId = parseInt(formData.get('profile_id') as string, 10);
    const name = formData.get('name') as string;
    const providerTypeRaw = formData.get('provider_type');
    const bio = formData.get('bio') as string;
    const phone = formData.get('phone') as string;
    const city = formData.get('city') as string;
    const address = formData.get('address') as string;
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

    if (isNaN(profileId) || !name || !city) {
        return { success: false, error: 'Имя и город обязательны.' };
    }
    if (providerType === 'SALON' && !String(address || '').trim()) {
        return { success: false, error: 'Для салона укажите полный адрес.' };
    }

    try {
        const currentProfile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: {
                user_id: true, user_email: true, name: true,
                city: true, slug: true, address: true,
                latitude: true, longitude: true,
            },
        });
        if (!currentProfile) return { success: false, error: 'Профиль не найден.' };

        if (session.user.role !== 'ADMIN') {
            const ownsByUserId = currentProfile.user_id && currentProfile.user_id === session.user.id;
            const ownsByEmail = session.user.email && currentProfile.user_email === session.user.email;
            if (!ownsByUserId && !ownsByEmail) {
                return { success: false, error: 'Недостаточно прав.' };
            }
        }

        // Re-generate slug if name or city changed
        const nameChanged = name !== currentProfile.name;
        const cityChanged = city !== currentProfile.city;
        const addressChanged = address !== (currentProfile.address ?? '');
        const newSlug = (nameChanged || cityChanged)
            ? await generateUniqueSlug(name, city, profileId)
            : currentProfile.slug;

        // ── Strict geocoding when location changed ──
        let latitude = currentProfile.latitude;
        let longitude = currentProfile.longitude;

        if (cityChanged || addressChanged) {
            try {
                const fullAddress = (providerType === 'SALON' && address) ? address : city;
                const coords = await geocodeAddress(fullAddress, city, '');
                if (!coords) {
                    return { success: false, error: GEO_ERROR_MESSAGE };
                }
                latitude = coords.lat;
                longitude = coords.lng;
                console.log(`[updateProfile] Geocoded ${city}: ${coords.lat}, ${coords.lng}`);
            } catch (geoError) {
                console.error('[updateProfile] Geocoding error:', geoError);
                return { success: false, error: GEO_ERROR_MESSAGE };
            }
        }

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
                bio: bio || null,
                phone: phone || null,
                city,
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
