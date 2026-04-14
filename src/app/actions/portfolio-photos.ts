'use server';

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { requireProviderProfile } from '@/lib/auth-helpers';
import { savePublicUpload } from '@/lib/server/public-upload';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type UploadResult =
    | { success: true; photos: Array<{ id: string; url: string; position: number }> }
    | { success: false; error: string };

type MutationResult = { success: true } | { success: false; error: string };

export async function uploadServicePhotos(formData: FormData): Promise<UploadResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Требуется авторизация.' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    const serviceIdRaw = formData.get('serviceId');
    const serviceId = typeof serviceIdRaw === 'string' ? parseInt(serviceIdRaw, 10) : NaN;
    if (Number.isNaN(serviceId)) return { success: false, error: 'Некорректный id услуги.' };

    const files = formData.getAll('photos').filter((v): v is File => v instanceof File && v.size > 0);
    if (files.length === 0) return { success: false, error: 'Файлы не выбраны.' };

    for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return { success: false, error: 'Допустимы только JPEG, PNG и WebP.' };
        }
        if (file.size > MAX_FILE_SIZE) {
            return { success: false, error: 'Файл слишком большой (макс. 5 МБ).' };
        }
    }

    try {
        const profile =
            session.user.role === 'ADMIN'
                ? null
                : await requireProviderProfile(session.user.id, session.user.email);

        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: { id: true, profile_id: true },
        });
        if (!service) return { success: false, error: 'Услуга не найдена.' };
        if (profile && service.profile_id !== profile.id) {
            return { success: false, error: 'Недостаточно прав.' };
        }

        const staffIdRaw = formData.get('staffId');
        const rawStaffId =
            typeof staffIdRaw === 'string' && staffIdRaw.trim().length > 0
                ? staffIdRaw.trim()
                : null;

        let validatedStaffId: string | null = null;
        if (rawStaffId) {
            const staff = await prisma.staff.findFirst({
                where: { id: rawStaffId, profileId: service.profile_id },
                select: { id: true },
            });
            if (!staff) {
                return { success: false, error: 'Специалист не принадлежит профилю.' };
            }
            validatedStaffId = staff.id;
        }

        const existing = await prisma.portfolioPhoto.findMany({
            where: { profileId: service.profile_id, serviceId: service.id },
            select: { position: true },
        });
        const maxPos = existing.length === 0 ? -1 : Math.max(...existing.map((p) => p.position));

        const uploaded: Array<{ url: string }> = [];
        for (const file of files) {
            const { url } = await savePublicUpload(file, {
                blobFolder: 'portfolio',
                localFolder: 'uploads/portfolio',
                filenamePrefix: session.user.id,
                fallbackName: 'portfolio-photo.jpg',
            });
            uploaded.push({ url });
        }

        const created = await prisma.$transaction(
            uploaded.map(({ url }, i) =>
                prisma.portfolioPhoto.create({
                    data: {
                        profileId: service.profile_id,
                        serviceId: service.id,
                        staffId: validatedStaffId,
                        url,
                        position: maxPos + 1 + i,
                    },
                    select: { id: true, url: true, position: true },
                })
            )
        );

        revalidatePath('/dashboard', 'layout');
        return { success: true, photos: created };
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { success: false, error: 'Профиль не найден.' };
        }
        console.error('uploadServicePhotos error:', error);
        if (!process.env.BLOB_READ_WRITE_TOKEN?.trim() && process.env.NODE_ENV === 'production') {
            return { success: false, error: 'Хранилище изображений не настроено.' };
        }
        return { success: false, error: 'Ошибка загрузки фото.' };
    }
}

export async function reorderServicePhotos(
    serviceId: number,
    photoIdOrder: string[]
): Promise<MutationResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Требуется авторизация.' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    if (!Array.isArray(photoIdOrder) || photoIdOrder.length === 0) {
        return { success: false, error: 'Пустой список фото.' };
    }
    if (new Set(photoIdOrder).size !== photoIdOrder.length) {
        return { success: false, error: 'Дубликаты в порядке фото.' };
    }
    if (Number.isNaN(serviceId)) return { success: false, error: 'Некорректный id услуги.' };

    try {
        const profile =
            session.user.role === 'ADMIN'
                ? null
                : await requireProviderProfile(session.user.id, session.user.email);

        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: { id: true, profile_id: true },
        });
        if (!service) return { success: false, error: 'Услуга не найдена.' };
        if (profile && service.profile_id !== profile.id) {
            return { success: false, error: 'Недостаточно прав.' };
        }

        const photos = await prisma.portfolioPhoto.findMany({
            where: { serviceId: service.id, profileId: service.profile_id },
            select: { id: true },
        });
        const validIds = new Set(photos.map((p) => p.id));
        if (photoIdOrder.length !== validIds.size) {
            return { success: false, error: 'Неполный список фото.' };
        }
        if (photoIdOrder.some((id) => !validIds.has(id))) {
            return { success: false, error: 'Недопустимый id фото.' };
        }

        await prisma.$transaction(
            photoIdOrder.map((id, position) =>
                prisma.portfolioPhoto.update({
                    where: { id },
                    data: { position },
                })
            )
        );

        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { success: false, error: 'Профиль не найден.' };
        }
        console.error('reorderServicePhotos error:', error);
        return { success: false, error: 'Ошибка изменения порядка.' };
    }
}

export async function reorderStaffServicePhotos(
    serviceId: number,
    staffId: string,
    photoIdOrder: string[]
): Promise<MutationResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Требуется авторизация.' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    if (!Array.isArray(photoIdOrder) || photoIdOrder.length === 0) {
        return { success: false, error: 'Пустой список фото.' };
    }
    if (new Set(photoIdOrder).size !== photoIdOrder.length) {
        return { success: false, error: 'Дубликаты в порядке фото.' };
    }
    if (Number.isNaN(serviceId)) return { success: false, error: 'Некорректный id услуги.' };
    if (!staffId) return { success: false, error: 'staffId обязателен.' };

    try {
        const profile =
            session.user.role === 'ADMIN'
                ? null
                : await requireProviderProfile(session.user.id, session.user.email);

        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: { id: true, profile_id: true },
        });
        if (!service) return { success: false, error: 'Услуга не найдена.' };
        if (profile && service.profile_id !== profile.id) {
            return { success: false, error: 'Недостаточно прав.' };
        }

        // Only consider photos belonging to this staff member
        const staffPhotos = await prisma.portfolioPhoto.findMany({
            where: { serviceId: service.id, profileId: service.profile_id, staffId },
            select: { id: true },
        });
        const validIds = new Set(staffPhotos.map((p) => p.id));
        if (photoIdOrder.length !== validIds.size) {
            return { success: false, error: 'Неполный список фото.' };
        }
        if (photoIdOrder.some((id) => !validIds.has(id))) {
            return { success: false, error: 'Недопустимый id фото.' };
        }

        await prisma.$transaction(
            photoIdOrder.map((id, position) =>
                prisma.portfolioPhoto.update({
                    where: { id },
                    data: { position },
                })
            )
        );

        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { success: false, error: 'Профиль не найден.' };
        }
        console.error('reorderStaffServicePhotos error:', error);
        return { success: false, error: 'Ошибка изменения порядка.' };
    }
}

type ArrivalInfoInput = {
    address: string;
    doorCode?: string;
    bellNote?: string;
    waitingSpot?: string;
};

export async function updateArrivalInfo(
    data: ArrivalInfoInput | null
): Promise<MutationResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Требуется авторизация.' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    try {
        const profile = await requireProviderProfile(session.user.id, session.user.email);

        if (profile.provider_type === 'SALON') {
            return {
                success: false,
                error: 'Информация о прибытии доступна только частным мастерам.',
            };
        }

        let payload: Prisma.InputJsonValue | typeof Prisma.DbNull;

        if (data === null) {
            payload = Prisma.DbNull;
        } else {
            if (typeof data !== 'object') {
                return { success: false, error: 'Некорректный формат данных.' };
            }
            const address = typeof data.address === 'string' ? data.address.trim() : '';
            if (address.length === 0) {
                return { success: false, error: 'Адрес обязателен.' };
            }
            for (const key of ['doorCode', 'bellNote', 'waitingSpot'] as const) {
                const v = (data as Record<string, unknown>)[key];
                if (v !== undefined && typeof v !== 'string') {
                    return { success: false, error: 'Некорректный формат данных.' };
                }
            }
            const sanitized: Record<string, string> = { address };
            if (typeof data.doorCode === 'string' && data.doorCode.trim()) {
                sanitized.doorCode = data.doorCode.trim();
            }
            if (typeof data.bellNote === 'string' && data.bellNote.trim()) {
                sanitized.bellNote = data.bellNote.trim();
            }
            if (typeof data.waitingSpot === 'string' && data.waitingSpot.trim()) {
                sanitized.waitingSpot = data.waitingSpot.trim();
            }
            payload = sanitized;
        }

        await prisma.profile.update({
            where: { id: profile.id },
            data: { arrivalInfo: payload },
        });

        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { success: false, error: 'Профиль не найден.' };
        }
        console.error('updateArrivalInfo error:', error);
        return { success: false, error: 'Ошибка сохранения.' };
    }
}

export async function deletePortfolioPhoto(photoId: string): Promise<MutationResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Требуется авторизация.' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    if (!photoId || typeof photoId !== 'string') {
        return { success: false, error: 'Некорректный id фото.' };
    }

    try {
        const photo = await prisma.portfolioPhoto.findUnique({
            where: { id: photoId },
            select: {
                id: true,
                profile: { select: { user_id: true, user_email: true } },
            },
        });
        if (!photo) return { success: false, error: 'Фото не найдено.' };

        if (session.user.role !== 'ADMIN') {
            const ownsByUserId =
                photo.profile.user_id && photo.profile.user_id === session.user.id;
            const ownsByEmail =
                session.user.email && photo.profile.user_email === session.user.email;
            if (!ownsByUserId && !ownsByEmail) {
                return { success: false, error: 'Недостаточно прав.' };
            }
        }

        await prisma.portfolioPhoto.delete({ where: { id: photoId } });
        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error: any) {
        console.error('deletePortfolioPhoto error:', error);
        return { success: false, error: 'Ошибка удаления фото.' };
    }
}

const MAX_INTERIOR_PHOTOS = 12;

export async function uploadInteriorPhotos(formData: FormData): Promise<UploadResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Требуется авторизация.' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    const files = formData.getAll('photos').filter((v): v is File => v instanceof File && v.size > 0);
    if (files.length === 0) return { success: false, error: 'Файлы не выбраны.' };

    for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return { success: false, error: 'Допустимы только JPEG, PNG и WebP.' };
        }
        if (file.size > MAX_FILE_SIZE) {
            return { success: false, error: 'Файл слишком большой (макс. 5 МБ).' };
        }
    }

    try {
        const profile =
            session.user.role === 'ADMIN'
                ? null
                : await requireProviderProfile(session.user.id, session.user.email);

        if (profile && profile.provider_type !== 'SALON') {
            return { success: false, error: 'Фото интерьера доступны только для салонов.' };
        }

        const profileId = profile
            ? profile.id
            : (() => {
                  const rawId = formData.get('profileId');
                  return typeof rawId === 'string' ? parseInt(rawId, 10) : NaN;
              })();
        if (Number.isNaN(profileId)) return { success: false, error: 'Профиль не найден.' };

        const existing = await prisma.portfolioPhoto.count({
            where: { profileId, serviceId: null, staffId: null },
        });
        if (existing + files.length > MAX_INTERIOR_PHOTOS) {
            return {
                success: false,
                error: `Максимум ${MAX_INTERIOR_PHOTOS} фото интерьера. Сейчас: ${existing}.`,
            };
        }

        const maxPosResult = await prisma.portfolioPhoto.findMany({
            where: { profileId, serviceId: null, staffId: null },
            select: { position: true },
        });
        const maxPos =
            maxPosResult.length === 0 ? -1 : Math.max(...maxPosResult.map((p) => p.position));

        const uploaded: Array<{ url: string }> = [];
        for (const file of files) {
            const { url } = await savePublicUpload(file, {
                blobFolder: 'interior',
                localFolder: 'uploads/interior',
                filenamePrefix: session.user.id,
                fallbackName: 'interior-photo.jpg',
            });
            uploaded.push({ url });
        }

        const created = await prisma.$transaction(
            uploaded.map(({ url }, i) =>
                prisma.portfolioPhoto.create({
                    data: {
                        profileId,
                        serviceId: null,
                        staffId: null,
                        url,
                        position: maxPos + 1 + i,
                    },
                    select: { id: true, url: true, position: true },
                })
            )
        );

        revalidatePath('/dashboard', 'layout');
        return { success: true, photos: created };
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { success: false, error: 'Профиль не найден.' };
        }
        console.error('uploadInteriorPhotos error:', error);
        if (!process.env.BLOB_READ_WRITE_TOKEN?.trim() && process.env.NODE_ENV === 'production') {
            return { success: false, error: 'Хранилище изображений не настроено.' };
        }
        return { success: false, error: 'Ошибка загрузки фото.' };
    }
}

export async function reorderInteriorPhotos(
    photoIdOrder: string[]
): Promise<MutationResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Требуется авторизация.' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    if (!Array.isArray(photoIdOrder) || photoIdOrder.length === 0) {
        return { success: false, error: 'Пустой список фото.' };
    }
    if (new Set(photoIdOrder).size !== photoIdOrder.length) {
        return { success: false, error: 'Дубликаты в порядке фото.' };
    }

    try {
        const profile =
            session.user.role === 'ADMIN'
                ? null
                : await requireProviderProfile(session.user.id, session.user.email);

        const profileId = profile?.id;
        if (!profileId) return { success: false, error: 'Профиль не найден.' };

        const photos = await prisma.portfolioPhoto.findMany({
            where: { profileId, serviceId: null, staffId: null },
            select: { id: true },
        });
        const validIds = new Set(photos.map((p) => p.id));
        if (photoIdOrder.length !== validIds.size) {
            return { success: false, error: 'Неполный список фото.' };
        }
        if (photoIdOrder.some((id) => !validIds.has(id))) {
            return { success: false, error: 'Недопустимый id фото.' };
        }

        await prisma.$transaction(
            photoIdOrder.map((id, position) =>
                prisma.portfolioPhoto.update({
                    where: { id },
                    data: { position },
                })
            )
        );

        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { success: false, error: 'Профиль не найден.' };
        }
        console.error('reorderInteriorPhotos error:', error);
        return { success: false, error: 'Ошибка изменения порядка.' };
    }
}
