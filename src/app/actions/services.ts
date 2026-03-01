'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { isBeautyServiceTitle } from '@/lib/constants/services-taxonomy';

export async function addService(formData: FormData) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    const profileId = parseInt(formData.get('profile_id') as string, 10);
    const title = formData.get('title') as string;
    const priceRaw = formData.get('price') as string;
    const durationRaw = formData.get('duration') as string;
    const price = priceRaw !== '' && priceRaw != null ? parseFloat(priceRaw) : 0;
    const duration = durationRaw !== '' && durationRaw != null ? parseInt(durationRaw, 10) : 0;
    const description = (formData.get('description') as string | null)?.trim() || null;
    const rawImages = formData.get('images') as string | null;
    let images: string[] = [];

    if (!title || isNaN(profileId)) {
        return { success: false, error: 'Укажите услугу и профиль.' };
    }
    if (price < 0 || duration < 0 || (priceRaw != null && priceRaw !== '' && isNaN(price)) || (durationRaw != null && durationRaw !== '' && isNaN(duration))) {
        return { success: false, error: 'Цена и длительность должны быть неотрицательными числами.' };
    }
    if (!isBeautyServiceTitle(title)) {
        return { success: false, error: 'Можно выбрать только услугу из справочника.' };
    }
    if (rawImages) {
        try {
            const parsed = JSON.parse(rawImages);
            if (Array.isArray(parsed)) {
                images = parsed.filter((value): value is string => typeof value === 'string' && value.length > 0);
            }
        } catch {
            return { success: false, error: 'Некорректный формат изображений.' };
        }
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

        await prisma.service.create({
            data: {
                profile_id: profileId,
                title,
                description,
                images,
                price,
                duration_min: duration,
            },
        });

        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error: any) {
        console.error('addService error:', error);
        return { success: false, error: 'Ошибка при добавлении услуги.' };
    }
}

export async function deleteService(serviceId: number) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        if (session.user.role !== 'ADMIN') {
            const service = await prisma.service.findUnique({
                where: { id: serviceId },
                select: {
                    id: true,
                    profile: {
                        select: { user_id: true, user_email: true },
                    },
                },
            });

            if (!service) return { success: false, error: 'Услуга не найдена.' };
            const ownsByUserId = service.profile.user_id && service.profile.user_id === session.user.id;
            const ownsByEmail = session.user.email && service.profile.user_email === session.user.email;
            if (!ownsByUserId && !ownsByEmail) {
                return { success: false, error: 'Недостаточно прав.' };
            }
        }

        await prisma.service.delete({
            where: { id: serviceId },
        });

        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error: any) {
        console.error('deleteService error:', error);
        return { success: false, error: 'Ошибка при удалении услуги.' };
    }
}
