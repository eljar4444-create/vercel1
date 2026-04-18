'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { savePublicUpload } from '@/lib/server/public-upload';
import { verifySalonAccess } from '@/app/actions/staff';

export async function uploadStaffAvatar(formData: FormData) {
    const file = formData.get('file') as File;
    const staffId = formData.get('staff_id') as string;

    if (!file || !file.size || !staffId) {
        return { success: false, error: 'Файл не выбран или неверный ID мастера.' };
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
        const profileId = await verifySalonAccess();
        const staff = await prisma.staff.findFirst({
            where: { id: staffId, profileId },
            include: { profile: { select: { slug: true } } }
        });

        if (!staff) {
            return { success: false, error: 'Доступ запрещен или мастер не найден.' };
        }

        const { url } = await savePublicUpload(file, {
            blobFolder: 'staff-avatars',
            localFolder: 'uploads/staff-avatars',
            filenamePrefix: String(staffId),
            fallbackName: 'avatar.jpg',
        });

        await prisma.staff.update({
            where: { id: staffId },
            data: { avatarUrl: url },
        });

        revalidatePath('/dashboard', 'layout');
        if (staff.profile.slug) {
            revalidatePath(`/salon/${staff.profile.slug}`);
        }

        return { success: true, url };
    } catch (error: any) {
        console.error('uploadStaffAvatar error:', error);

        if (process.env.NODE_ENV !== 'production') {
            return { success: false, error: `Ошибка: ${error.message || error}` };
        }

        if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
            return { success: false, error: 'Хранилище не настроено. Укажите BLOB_READ_WRITE_TOKEN.' };
        }

        return { success: false, error: 'Ошибка при загрузке файла.' };
    }
}
