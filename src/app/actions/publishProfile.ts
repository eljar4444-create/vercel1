'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function verifyAndPublishProfile() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Не авторизован' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    try {
        const profile = await prisma.profile.findFirst({
            where: { user_id: session.user.id },
            include: { services: true }
        });

        if (!profile) return { success: false, error: 'Профиль не найден' };

        if (!profile.onboardingCompleted) {
            return { success: false, error: 'Необходимо завершить юридическую (DAC7) настройку.' };
        }

        if (!profile.image_url) {
            return { success: false, error: 'Для публичного каталога необходимо загрузить фото профиля.' };
        }

        const validServices = profile.services.filter(s => s.price.toNumber() >= 0 && s.duration_min > 0);
        if (validServices.length === 0) {
            return { success: false, error: 'Для публичного каталога необходимо добавить хотя бы одну активную услугу с ценой/длительностью.' };
        }

        await prisma.profile.update({
            where: { id: profile.id },
            data: { status: 'PENDING_REVIEW' }
        });

        revalidatePath('/dashboard');
        revalidatePath('/search');

        return { success: true };
    } catch (e: any) {
        console.error('Error publishing profile:', e);
        return { success: false, error: 'Внутренняя ошибка сервера.' };
    }
}

export async function unpublishProfile() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Не авторизован' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    try {
        const profile = await prisma.profile.findFirst({
            where: { user_id: session.user.id }
        });

        if (!profile) return { success: false, error: 'Профиль не найден' };

        await prisma.profile.update({
            where: { id: profile.id },
            data: { status: 'PENDING_REVIEW' }
        });

        revalidatePath('/dashboard');
        revalidatePath('/search');

        return { success: true };
    } catch (e: any) {
        return { success: false, error: 'Внутренняя ошибка сервера.' };
    }
}
