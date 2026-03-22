'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { isBeautyServiceTitle } from '@/lib/constants/services-taxonomy';
import { requireProviderProfile } from '@/lib/auth-helpers';

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

function serializeService(service: {
    id: number;
    title: string;
    description: string | null;
    images: string[];
    price: { toString(): string } | number | string;
    duration_min: number;
}) {
    return {
        id: service.id,
        title: service.title,
        description: service.description,
        images: service.images,
        price: service.price.toString(),
        duration_min: service.duration_min,
    };
}

export async function createService(prevState: any, formData: FormData) {
    void prevState;

    const session = await auth();
    if (!session?.user?.id) {
        return { message: 'Unauthorized' };
    }

    try {
        const profile = await requireProviderProfile(session.user.id, session.user.email);
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

        await prisma.service.create({
            data: {
                title,
                description,
                images,
                price,
                duration_min: durationMin,
                profile_id: profile.id,
            },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard', 'layout');
        redirect('/dashboard?section=services');
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { message: 'Профиль не найден. Пожалуйста, заполните профиль.' };
        }
        if (error?.message === 'NEXT_REDIRECT' || error?.digest?.includes('NEXT_REDIRECT')) {
            throw error;
        }

        console.error('createService error:', error);
        return { message: error?.message || 'Ошибка создания услуги' };
    }
}

export async function updateService(serviceId: string, prevState: any, formData: FormData) {
    void prevState;

    const session = await auth();
    if (!session?.user?.id) {
        return { message: 'Unauthorized' };
    }

    try {
        const profile = await requireProviderProfile(session.user.id, session.user.email);
        const serviceIdInt = parseInt(serviceId, 10);
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
        if (Number.isNaN(serviceIdInt)) {
            return { message: 'Некорректный идентификатор услуги.' };
        }

        const service = await prisma.service.findUnique({
            where: { id: serviceIdInt },
            select: { id: true, profile_id: true },
        });

        if (!service || service.profile_id !== profile.id) {
            return { message: 'Unauthorized or Service not found' };
        }

        const shouldRedirect = formData.get('redirect_on_success') !== 'false';

        const updatedService = await prisma.service.update({
            where: { id: serviceIdInt },
            data: {
                title,
                description,
                images,
                price,
                duration_min: durationMin,
            },
        });

        revalidatePath('/dashboard');
        revalidatePath(`/services/${serviceId}`);
        revalidatePath('/dashboard', 'layout');

        if (shouldRedirect) {
            redirect('/dashboard?section=services');
        }

        return { success: true, service: serializeService(updatedService) };
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { message: 'Профиль не найден' };
        }
        if (error?.message === 'NEXT_REDIRECT' || error?.digest?.includes('NEXT_REDIRECT')) {
            throw error;
        }

        console.error('updateService error:', error);
        return { message: error?.message || 'Ошибка обновления услуги' };
    }
}

export async function addService(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role !== 'ADMIN') {
        try {
            await requireProviderProfile(session.user.id, session.user.email);
        } catch {
            return { success: false, error: 'Unauthorized' };
        }
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
            images = parseImages(rawImages);
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

        const createdService = await prisma.service.create({
            data: {
                profile_id: profileId,
                title,
                description,
                images,
                price,
                duration_min: duration,
            },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard', 'layout');
        return { success: true, service: serializeService(createdService) };
    } catch (error: any) {
        console.error('addService error:', error);
        return { success: false, error: 'Ошибка при добавлении услуги.' };
    }
}

export async function deleteService(serviceId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role !== 'ADMIN') {
        try {
            await requireProviderProfile(session.user.id, session.user.email);
        } catch {
            return { success: false, error: 'Unauthorized' };
        }
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
