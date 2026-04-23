'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { requireProviderProfile } from '@/lib/auth-helpers';
import { savePublicUpload } from '@/lib/server/public-upload';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

type CoverResult =
    | { success: true; url: string }
    | { success: false; error: string };

type MutationResult = { success: true } | { success: false; error: string };

/**
 * Upload a cover photo for any profile type (salon or master).
 * Mirrors the Interior Photos pattern: saves to DB immediately on upload.
 * The URL is stored as gallery[0] on the Profile record.
 */
export async function uploadCoverPhoto(formData: FormData): Promise<CoverResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Требуется авторизация.' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    const file = formData.get('photo');
    if (!(file instanceof File) || file.size === 0) {
        return { success: false, error: 'Файл не выбран.' };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { success: false, error: 'Допустимы только JPEG, PNG и WebP.' };
    }
    if (file.size > MAX_FILE_SIZE) {
        return { success: false, error: 'Файл слишком большой (макс. 5 МБ).' };
    }

    try {
        const profile = session.user.role === 'ADMIN'
            ? null
            : await requireProviderProfile(session.user.id, session.user.email);

        const profileId = profile
            ? profile.id
            : (() => {
                  const rawId = formData.get('profileId');
                  return typeof rawId === 'string' ? parseInt(rawId, 10) : NaN;
              })();
        if (Number.isNaN(profileId)) return { success: false, error: 'Профиль не найден.' };

        // Upload file to storage
        const { url } = await savePublicUpload(file, {
            blobFolder: 'covers',
            localFolder: 'uploads/covers',
            filenamePrefix: session.user.id,
            fallbackName: 'cover-photo.jpg',
        });

        // Write to gallery[0] — keep existing gallery items after
        const currentProfile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: { gallery: true, slug: true },
        });
        if (!currentProfile) return { success: false, error: 'Профиль не найден.' };

        const existingGallery = (currentProfile.gallery ?? []).filter(
            (item): item is string => typeof item === 'string' && item.trim().length > 0,
        );
        const nextGallery = [url, ...existingGallery.filter((item) => item !== url)];

        await prisma.profile.update({
            where: { id: profileId },
            data: { gallery: nextGallery },
        });

        revalidatePath('/dashboard', 'layout');
        revalidatePath(`/salon/${currentProfile.slug}`);

        return { success: true, url };
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { success: false, error: 'Профиль не найден.' };
        }
        console.error('uploadCoverPhoto error:', error);
        if (!process.env.BLOB_READ_WRITE_TOKEN?.trim() && process.env.NODE_ENV === 'production') {
            return { success: false, error: 'Хранилище изображений не настроено.' };
        }
        return { success: false, error: 'Ошибка загрузки обложки.' };
    }
}

/**
 * Remove the cover photo (gallery[0]) from the profile.
 */
export async function deleteCoverPhoto(): Promise<MutationResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Требуется авторизация.' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    try {
        const profile = await requireProviderProfile(session.user.id, session.user.email);

        const currentProfile = await prisma.profile.findUnique({
            where: { id: profile.id },
            select: { gallery: true, slug: true },
        });
        if (!currentProfile) return { success: false, error: 'Профиль не найден.' };

        const existingGallery = (currentProfile.gallery ?? []).filter(
            (item): item is string => typeof item === 'string' && item.trim().length > 0,
        );

        // Remove gallery[0] (the cover)
        const nextGallery = existingGallery.slice(1);

        await prisma.profile.update({
            where: { id: profile.id },
            data: { gallery: nextGallery },
        });

        revalidatePath('/dashboard', 'layout');
        revalidatePath(`/salon/${currentProfile.slug}`);

        return { success: true };
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { success: false, error: 'Профиль не найден.' };
        }
        console.error('deleteCoverPhoto error:', error);
        return { success: false, error: 'Ошибка удаления обложки.' };
    }
}
