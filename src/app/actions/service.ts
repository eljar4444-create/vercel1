'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isBeautyServiceTitle } from '@/lib/constants/services-taxonomy';

function parseImages(rawImages: FormDataEntryValue | null): string[] {
    if (!rawImages || typeof rawImages !== 'string') return [];
    try {
        const parsed = JSON.parse(rawImages);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
            .slice(0, 10);
    } catch {
        return [];
    }
}

export async function createService(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) {
        return { message: 'Unauthorized' };
    }

    try {
        const title = (formData.get('title') as string | null)?.trim() || '';
        const rawPrice = formData.get('price');
        const price = rawPrice ? parseFloat(rawPrice as string) : 0;
        const durationMinRaw = formData.get('duration_min') ?? formData.get('duration');
        const durationMin = durationMinRaw ? parseInt(durationMinRaw as string, 10) : 60;
        const description = (formData.get('description') as string | null)?.trim() || null;
        const images = parseImages(formData.get('images') ?? formData.get('uploadedPhotoUrls'));

        if (!title || !isBeautyServiceTitle(title)) {
            return { message: 'Выберите услугу из справочника.' };
        }
        if (Number.isNaN(price) || Number.isNaN(durationMin)) {
            return { message: 'Цена и длительность заполнены некорректно.' };
        }

        // Find Profile
        const profile = await prisma.profile.findUnique({ where: { user_email: session.user.email } });

        if (!profile) {
            return { message: 'Профиль не найден. Пожалуйста, заполните профиль.' };
        }

        await prisma.service.create({
            data: {
                title,
                description,
                images,
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
        const title = (formData.get('title') as string | null)?.trim() || '';
        const rawPrice = formData.get('price');
        const price = rawPrice ? parseFloat(rawPrice as string) : 0;
        const durationMinRaw = formData.get('duration_min') ?? formData.get('duration');
        const durationMin = durationMinRaw ? parseInt(durationMinRaw as string, 10) : 60;
        const description = (formData.get('description') as string | null)?.trim() || null;
        const images = parseImages(formData.get('images') ?? formData.get('uploadedPhotoUrls'));

        if (!title || !isBeautyServiceTitle(title)) {
            return { message: 'Выберите услугу из справочника.' };
        }
        if (Number.isNaN(price) || Number.isNaN(durationMin)) {
            return { message: 'Цена и длительность заполнены некорректно.' };
        }

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
                title,
                description,
                images,
                price,
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
