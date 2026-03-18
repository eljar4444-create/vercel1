'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { generateUniqueProfileSlug } from '@/lib/slugify';
import { geocodeAddress } from '@/lib/geocode';
import { requireProviderProfile } from '@/lib/auth-helpers';
import { isProviderLanguage } from '@/lib/provider-languages';

const GEO_ERROR_MESSAGE =
    'Мы не смогли найти этот адрес на карте. Пожалуйста, проверьте правильность написания города и адреса или укажите ближайший крупный ориентир.';

function parseCoordinate(value: FormDataEntryValue | null) {
    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role !== 'ADMIN') {
        try {
            await requireProviderProfile(session.user.id, session.user.email);
        } catch {
            return { success: false, error: 'Unauthorized' };
        }
    }

    const profileId = parseInt(formData.get('profile_id') as string, 10);
    let name = (formData.get('name') as string)?.trim() ?? '';
    const providerTypeRaw = String(formData.get('provider_type') || '').trim();
    const bio = formData.get('bio') as string;
    const phone = formData.get('phone') as string;
    let city = (formData.get('city') as string)?.trim() ?? '';
    let address = (formData.get('address') as string)?.trim() ?? '';
    const cityValidated = String(formData.get('city_validated') || 'false') === 'true';
    const addressLatitude = parseCoordinate(formData.get('address_latitude'));
    const addressLongitude = parseCoordinate(formData.get('address_longitude'));
    const addressValidated = String(formData.get('address_validated') || 'false') === 'true';
    const hasTelegramField = formData.has('telegram_chat_id');
    const telegramChatIdRaw = hasTelegramField ? ((formData.get('telegram_chat_id') as string)?.trim() ?? '') : '';
    const telegramChatId = hasTelegramField ? (telegramChatIdRaw || null) : undefined;
    const studioImagesRaw = formData.get('studioImages');
    const languages = formData
        .getAll('languages')
        .map((value) => String(value).trim())
        .filter(isProviderLanguage);
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
            latitude: true, longitude: true, telegramChatId: true,
        },
    });
    if (!currentProfile) return { success: false, error: 'Профиль не найден.' };

    const providerType =
        providerTypeRaw === 'SALON'
            ? 'SALON'
            : providerTypeRaw === 'INDIVIDUAL'
                ? 'INDIVIDUAL'
                : 'PRIVATE';
    const isSalon = providerType === 'SALON';

    if (!name) name = currentProfile.name ?? '';
    if (!city) city = (currentProfile.city ?? '').trim();
    const bioToSave = (typeof bio === 'string' && bio.trim()) ? bio.trim() : (currentProfile.bio ?? '');

    if (!name || !city) {
        return { success: false, error: 'Имя и город обязательны.' };
    }
    if (!cityValidated) {
        return { success: false, error: 'Выберите город из выпадающего списка.' };
    }
    if (!isSalon) {
        address = '';
        studioImages = [];
    }

    if (isSalon && !address) {
        return { success: false, error: 'Для салона укажите полный адрес.' };
    }

    if (isSalon && (!addressValidated || addressLatitude == null || addressLongitude == null)) {
        return { success: false, error: 'Выберите адрес салона из выпадающего списка.' };
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

        if (isSalon) {
            latitude = addressLatitude;
            longitude = addressLongitude;
        } else if (nameChanged || addressChanged || city !== currentProfile.city) {
            try {
                const coords = await geocodeAddress('', city, '');
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
        if (!isSalon && (latitude == null || longitude == null)) {
            try {
                const coords = await geocodeAddress('', city, '');
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

        const updated = await prisma.$transaction(async (tx) => {
            const profile = await tx.profile.update({
                where: { id: profileId },
                data: {
                    name,
                    slug: newSlug,
                    provider_type: providerType,
                    bio: bioToSave || null,
                    phone: phone || null,
                    ...(telegramChatId !== undefined && { telegramChatId }),
                    city: officialCity,
                    address: address || null,
                    studioImages,
                    latitude,
                    longitude,
                },
                select: { slug: true },
            });

            await tx.$executeRaw`
                UPDATE "Profile"
                SET "languages" = ${languages}
                WHERE "id" = ${profileId}
            `;

            return profile;
        });

        revalidatePath('/dashboard', 'layout');
        revalidatePath(`/salon/${updated.slug}`);

        return { success: true };
    } catch (error: any) {
        console.error('updateProfile error:', error);
        return { success: false, error: 'Ошибка при сохранении профиля.' };
    }
}
