'use server';

import { put } from '@vercel/blob';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function uploadAvatar(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

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
        const profile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: { id: true, user_id: true, slug: true },
        });

        if (!profile) {
            return { success: false, error: 'Профиль не найден.' };
        }

        if (session.user.role !== 'ADMIN' && profile.user_id !== session.user.id) {
            throw new Error('Forbidden');
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '') || 'avatar.jpg';
        const filename = `avatars/${profileId}-${Date.now()}-${safeName}`;

        const { url } = await put(filename, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        const updatedProfile = await prisma.profile.update({
            where: { id: profileId },
            data: { image_url: url },
            select: { slug: true },
        });

        revalidatePath('/dashboard', 'layout');
        if (updatedProfile.slug) {
            revalidatePath(`/salon/${updatedProfile.slug}`);
        }

        return { success: true, url };
    } catch (error: any) {
        console.error('uploadAvatar error:', error);
        return { success: false, error: 'Ошибка при загрузке файла.' };
    }
}
