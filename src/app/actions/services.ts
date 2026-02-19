'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function addService(formData: FormData) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    const profileId = parseInt(formData.get('profile_id') as string, 10);
    const title = formData.get('title') as string;
    const price = parseFloat(formData.get('price') as string);
    const duration = parseInt(formData.get('duration') as string, 10);

    if (!title || isNaN(price) || isNaN(duration) || isNaN(profileId)) {
        return { success: false, error: 'Заполните все поля корректно.' };
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
