'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addService(formData: FormData) {
    const profileId = parseInt(formData.get('profile_id') as string, 10);
    const title = formData.get('title') as string;
    const price = parseFloat(formData.get('price') as string);
    const duration = parseInt(formData.get('duration') as string, 10);

    if (!title || isNaN(price) || isNaN(duration) || isNaN(profileId)) {
        return { success: false, error: 'Заполните все поля корректно.' };
    }

    try {
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
    try {
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
