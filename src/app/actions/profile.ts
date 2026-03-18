'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { savePublicUpload } from '@/lib/server/public-upload';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function updateBasicInfo(formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const name = (formData.get('name') as string | null)?.trim() ?? '';
    const bio = (formData.get('bio') as string | null)?.trim() ?? '';

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: name || null,
            bio: bio || null,
        },
    });

    revalidatePath('/dashboard');
    revalidatePath('/account/settings');

    return { success: true };
}

export async function uploadProfilePhoto(formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Требуется авторизация.' };
    }

    const file = formData.get('photo') as File | null;

    if (!file || !file.size) {
        return { success: false, error: 'Файл не выбран.' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return { success: false, error: 'Допустимы только JPEG, PNG и WebP.' };
    }

    if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Файл слишком большой (макс. 5 МБ).' };
    }

    try {
        const upload = await savePublicUpload(file, {
            blobFolder: 'user-avatars',
            localFolder: 'uploads/user-avatars',
            filenamePrefix: session.user.id,
            fallbackName: 'avatar.jpg',
        });

        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: upload.url },
        });

        revalidatePath('/dashboard');
        revalidatePath('/account/settings');

        return { success: true, imageUrl: upload.url };
    } catch (error) {
        console.error('uploadProfilePhoto error:', error);

        if (!process.env.BLOB_READ_WRITE_TOKEN?.trim() && process.env.NODE_ENV === 'production') {
            return { success: false, error: 'Хранилище изображений не настроено. Укажите BLOB_READ_WRITE_TOKEN.' };
        }

        return { success: false, error: 'Не удалось загрузить файл.' };
    }
}
