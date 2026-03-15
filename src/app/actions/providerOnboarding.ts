'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { generateUniqueSlug } from '@/lib/generateUniqueSlug';
import { geocodeAddress } from '@/lib/geocode';

interface ProviderOnboardingResult {
    success: boolean;
    error?: string;
    profileId?: number;
}

type WorkLocationPayload = {
    placeName: string;
    address: string;
    zipCode: string;
    city: string;
    hideExactAddress: boolean;
};

const GEO_ERROR_MESSAGE =
    'Мы не смогли найти этот адрес на карте. Пожалуйста, проверьте правильность написания города и адреса или укажите ближайший крупный ориентир.';

export async function createProviderProfile(formData: FormData): Promise<ProviderOnboardingResult> {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
        return { success: false, error: 'Требуется авторизация.' };
    }

    const name = String(formData.get('name') || '').trim();
    let city = String(formData.get('city') || '').trim();
    const providerTypeRaw = String(formData.get('provider_type') || 'PRIVATE').trim();
    let address = String(formData.get('address') || '').trim();
    let bio = String(formData.get('bio') || '').trim();
    const submittedCategoryId = Number(formData.get('category_id'));
    const workLocationsRaw = String(formData.get('work_locations') || '').trim();
    const providerType = providerTypeRaw === 'SALON' ? 'SALON' : 'PRIVATE';

    try {
        const beautyCategory = await prisma.category.findFirst({
            where: { slug: 'beauty' },
            select: { id: true },
        });
        const categoryId = Number.isInteger(submittedCategoryId) ? submittedCategoryId : beautyCategory?.id;

        let workLocations: WorkLocationPayload[] = [];
        if (providerType !== 'SALON' && workLocationsRaw) {
            try {
                const parsed = JSON.parse(workLocationsRaw);
                if (Array.isArray(parsed)) {
                    workLocations = parsed
                        .map((item) => ({
                            placeName: String(item?.placeName || '').trim(),
                            address: String(item?.address || '').trim(),
                            zipCode: String(item?.zipCode || '').trim(),
                            city: String(item?.city || '').trim(),
                            hideExactAddress: Boolean(item?.hideExactAddress),
                        }))
                        .filter((location) =>
                            location.placeName || location.address || location.zipCode || location.city
                        );
                }
            } catch (parseError) {
                console.error('[providerOnboarding] work_locations parse error:', parseError);
                return { success: false, error: 'Некорректный формат мест работы.' };
            }
        }

        if (providerType !== 'SALON' && workLocations.length > 0) {
            const firstLocation = workLocations[0];
            city = firstLocation.city;
            address = firstLocation.address;
        }

        if (!name || !city || !Number.isInteger(categoryId)) {
            return { success: false, error: 'Заполните все обязательные поля.' };
        }
        if (!address) {
            return { success: false, error: 'Укажите полный адрес первого места работы.' };
        }

        const existingByUserId = await prisma.profile.findFirst({
            where: { user_id: session.user.id },
            select: { id: true },
        });
        if (existingByUserId) {
            return { success: true, profileId: existingByUserId.id };
        }

        const existingByEmail = await prisma.profile.findUnique({
            where: { user_email: session.user.email },
            select: { id: true },
        });

        if (existingByEmail) {
            await prisma.profile.update({
                where: { id: existingByEmail.id },
                data: {
                    user_id: session.user.id,
                    is_verified: true,
                },
            });
            return { success: true, profileId: existingByEmail.id };
        }

        // ── Strict geocoding: must succeed BEFORE profile creation ──
        let coords: { lat: number; lng: number };
        try {
            if (providerType !== 'SALON' && workLocations.length > 0) {
                const geocodedLocations = [];
                for (const location of workLocations) {
                    if (!location.placeName || !location.address || !location.zipCode || !location.city) {
                        return { success: false, error: 'Заполните все поля в каждом месте работы.' };
                    }
                    const geo = await geocodeAddress(location.address, location.city, location.zipCode);
                    if (!geo) {
                        return { success: false, error: GEO_ERROR_MESSAGE };
                    }
                    geocodedLocations.push({
                        ...location,
                        city: geo.city || location.city,
                        lat: geo.lat,
                        lng: geo.lng,
                    });
                }

                const firstLocation = geocodedLocations[0];
                city = firstLocation.city;
                address = firstLocation.address;
                coords = { lat: firstLocation.lat, lng: firstLocation.lng };

                bio = `${bio}${bio ? '\n\n' : ''}[workLocations:${JSON.stringify(geocodedLocations)}]`;
            } else {
                const result = await geocodeAddress(address || city, city, '');
                if (!result) {
                    return { success: false, error: GEO_ERROR_MESSAGE };
                }
                city = result.city || city;
                coords = result;
            }
        } catch (geoError) {
            console.error('[providerOnboarding] Geocoding error:', geoError);
            return { success: false, error: GEO_ERROR_MESSAGE };
        }

        const slug = await generateUniqueSlug(name, city);

        const created = await prisma.profile.create({
            data: {
                user_id: session.user.id,
                user_email: session.user.email,
                name,
                slug,
                provider_type: providerType,
                city,
                address: address || null,
                bio: bio || null,
                category_id: categoryId,
                attributes: {},
                image_url: null,
                is_verified: true,
                latitude: coords.lat,
                longitude: coords.lng,
            },
            select: { id: true },
        });

        console.log(`[providerOnboarding] Created profile #${created.id} with coords ${coords.lat}, ${coords.lng}`);

        revalidatePath('/search');
        revalidatePath('/dashboard');
        return { success: true, profileId: created.id };
    } catch (error: any) {
        console.error('createProviderProfile error:', error);
        return { success: false, error: 'Не удалось создать профиль.' };
    }
}
