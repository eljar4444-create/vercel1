'use server';

import { put } from '@vercel/blob';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function uploadAvatar(formData: FormData) {
    const file = formData.get('file') as File;
    const profileId = parseInt(formData.get('profile_id') as string, 10);

    if (!file || !file.size || isNaN(profileId)) {
        return { success: false, error: 'Файл не выбран.' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'Допустимы только JPEG, PNG, WebP.' };
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Файл слишком большой (макс. 5 МБ).' };
    }

    try {
        const blob = await put(`avatars/${profileId}-${Date.now()}.${file.name.split('.').pop()}`, file, {
            access: 'public',
        });

        await prisma.profile.update({
            where: { id: profileId },
            data: { image_url: blob.url },
        });

        revalidatePath('/dashboard', 'layout');
        revalidatePath(`/profile/${profileId}`);

        return { success: true, url: blob.url };
    } catch (error: any) {
        console.error('uploadAvatar error:', error);
        return { success: false, error: 'Ошибка при загрузке файла.' };
    }
}
