'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createService(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) {
        return { message: 'Unauthorized' };
    }

    try {
        const title = formData.get('title') as string;
        const rawPrice = formData.get('price');
        const price = rawPrice ? parseFloat(rawPrice as string) : 0;
        const durationMin = formData.get('duration_min') ? parseInt(formData.get('duration_min') as string) : 60;

        if (!title || title.trim().length < 2) return { message: 'Название услуги обязательно' };

        // Find Profile
        const profile = await prisma.profile.findUnique({ where: { user_email: session.user.email } });

        if (!profile) {
            return { message: 'Профиль не найден. Пожалуйста, заполните профиль.' };
        }

        await prisma.service.create({
            data: {
                title: title.trim(),
                price,
                duration_min: durationMin,
                profile_id: profile.id,
            }
        });

        revalidatePath('/provider/profile');
        redirect('/provider/profile');

    } catch (e: any) {
        if (e.message === 'NEXT_REDIRECT' || e.digest?.includes('NEXT_REDIRECT')) throw e;
        console.error("Create Service Error:", e);
        return { message: e.message || 'Ошибка создания услуги' };
    }
}

export async function updateService(serviceId: string, prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) {
        return { message: 'Unauthorized' };
    }

    try {
        const title = formData.get('title') as string;
        const rawPrice = formData.get('price');
        const price = rawPrice ? parseFloat(rawPrice as string) : 0;
        const durationMin = formData.get('duration_min') ? parseInt(formData.get('duration_min') as string) : 60;

        // Find Profile
        const profile = await prisma.profile.findUnique({ where: { user_email: session.user.email } });
        if (!profile) return { message: 'Профиль не найден' };

        const serviceIdInt = parseInt(serviceId);

        const service = await prisma.service.findUnique({
            where: { id: serviceIdInt },
        });

        if (!service || service.profile_id !== profile.id) {
            return { message: 'Unauthorized or Service not found' };
        }

        await prisma.service.update({
            where: { id: serviceIdInt },
            data: {
                title: title || service.title,
                price: price || 0,
                duration_min: durationMin,
            }
        });

        revalidatePath('/provider/profile');
        revalidatePath(`/services/${serviceId}`);
        redirect('/provider/profile');

    } catch (e: any) {
        if (e.message === 'NEXT_REDIRECT' || e.digest?.includes('NEXT_REDIRECT')) throw e;
        console.error("Update Service Error:", e);
        return { message: e.message || 'Ошибка обновления услуги' };
    }
}
