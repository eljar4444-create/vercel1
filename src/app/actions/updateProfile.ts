'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

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
        if (session.user.role !== 'ADMIN') {
            const profile = await prisma.profile.findUnique({
                where: { id: profileId },
                select: { user_id: true, user_email: true },
            });
            if (!profile) return { success: false, error: 'Профиль не найден.' };

            const ownsByUserId = profile.user_id && profile.user_id === session.user.id;
            const ownsByEmail = session.user.email && profile.user_email === session.user.email;
            if (!ownsByUserId && !ownsByEmail) {
                return { success: false, error: 'Недостаточно прав.' };
            }
        }

        await prisma.profile.update({
            where: { id: profileId },
            data: {
                name,
                provider_type: providerType,
                bio: bio || null,
                phone: phone || null,
                city,
                address: providerType === 'SALON' ? address || null : null,
                studioImages,
            },
        });

        revalidatePath('/dashboard', 'layout');
        revalidatePath(`/profile/${profileId}`);

        return { success: true };
    } catch (error: any) {
        console.error('updateProfile error:', error);
        return { success: false, error: 'Ошибка при сохранении профиля.' };
    }
}
