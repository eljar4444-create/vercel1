'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ProviderType } from '@prisma/client';
import { geocodeAddress } from '@/lib/geocode';
import { generateUniqueProfileSlug } from '@/lib/slugify';

/**
 * Завершает онбординг провайдера: сохраняет бизнес-данные
 * и перенаправляет в дашборд.
 */
export async function completeProviderOnboarding(formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Не авторизован' };
    }

    const userId = session.user.id;

    const companyName = formData.get('companyName') as string | null;
    const address = formData.get('address') as string | null;
    const city = formData.get('city') as string | null;
    const zipCode = formData.get('zipCode') as string | null;
    const taxId = formData.get('taxId') as string | null;
    const isKleinunternehmer = formData.get('isKleinunternehmer') === 'on';
    const providerTypeRaw = formData.get('providerType') as string | null;

    // Validate required fields
    if (!address || !city || !zipCode) {
        return { success: false, error: 'Заполните адрес, город и почтовый индекс' };
    }

    // Map providerType to enum
    let providerType: ProviderType = 'PRIVATE';
    if (providerTypeRaw === 'SALON') providerType = 'SALON';
    else if (providerTypeRaw === 'INDIVIDUAL') providerType = 'INDIVIDUAL';

    try {
        // ── Strict geocoding: must succeed BEFORE saving ──
        let coords: { lat: number; lng: number, city?: string };
        try {
            const result = await geocodeAddress(address, city, zipCode);
            if (!result) {
                return { success: false, error: 'Мы не смогли найти этот адрес на карте. Проверьте правильность написания или укажите ближайший крупный ориентир.' };
            }
            coords = result;
        } catch (geoError) {
            console.error('[onboarding] Geocoding error:', geoError);
            return { success: false, error: 'Мы не смогли найти этот адрес на карте. Проверьте правильность написания или укажите ближайший крупный ориентир.' };
        }

        const officialCity = coords.city || city;

        await prisma.user.update({
            where: { id: userId },
            data: {
                providerType,
                companyName: providerType === 'SALON' ? companyName : null,
                isKleinunternehmer: providerType !== 'SALON' ? isKleinunternehmer : false,
                taxId: providerType === 'SALON' ? taxId : null,
                address,
                city: officialCity,
                zipCode,
                onboardingCompleted: true,
            },
        });

        // ── Genereta slug for the profile (if name exists, else fallback to session name) ──
        const profileName = providerType === 'SALON' && companyName ? companyName : (session.user.name || 'Master');
        const slug = await generateUniqueProfileSlug(profileName, officialCity);

        // Save coordinates to Profile (if it exists already)
        await prisma.profile.updateMany({
            where: { user_id: userId },
            data: {
                city: officialCity,
                slug: slug,
                latitude: coords.lat,
                longitude: coords.lng,
            },
        });
        console.log(`[onboarding] Geocoded ${officialCity}: ${coords.lat}, ${coords.lng} - slug: ${slug}`);

        revalidatePath('/');
    } catch (error) {
        console.error('completeProviderOnboarding error:', error);
        return { success: false, error: 'Ошибка сохранения данных. Попробуйте позже.' };
    }

    // Redirect after successful update (must be outside try/catch)
    redirect('/provider/onboarding');
}
