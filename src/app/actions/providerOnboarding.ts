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

const GEO_ERROR_MESSAGE =
    'Мы не смогли найти этот адрес на карте. Пожалуйста, проверьте правильность написания города и адреса или укажите ближайший крупный ориентир.';

export async function createProviderProfile(formData: FormData): Promise<ProviderOnboardingResult> {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
        return { success: false, error: 'Требуется авторизация.' };
    }

    if (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN') {
        return { success: false, error: 'Недостаточно прав.' };
    }

    const name = String(formData.get('name') || '').trim();
    const city = String(formData.get('city') || '').trim();
    const providerTypeRaw = String(formData.get('provider_type') || 'PRIVATE').trim();
    const address = String(formData.get('address') || '').trim();
    const bio = String(formData.get('bio') || '').trim();
    const submittedCategoryId = Number(formData.get('category_id'));
    const providerType = providerTypeRaw === 'SALON' ? 'SALON' : 'PRIVATE';

    try {
        const beautyCategory = await prisma.category.findFirst({
            where: { slug: 'beauty' },
            select: { id: true },
        });
        const categoryId = beautyCategory?.id ?? submittedCategoryId;

        if (!name || !city || !Number.isInteger(categoryId)) {
            return { success: false, error: 'Заполните все обязательные поля.' };
        }
        if (providerType === 'SALON' && !address) {
            return { success: false, error: 'Для салона укажите полный адрес.' };
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
            const fullAddress = address || city;
            const result = await geocodeAddress(fullAddress, city, '');
            if (!result) {
                return { success: false, error: GEO_ERROR_MESSAGE };
            }
            coords = result;
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
                address: providerType === 'SALON' ? address : null,
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
