'use server';

import { auth } from '@/auth';
import { savePublicUpload } from '@/lib/server/public-upload';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function uploadServicePhoto(formData: FormData) {
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
        const { url } = await savePublicUpload(file, {
            blobFolder: 'services',
            localFolder: 'uploads/services',
            filenamePrefix: session.user.id,
            fallbackName: 'service-photo.jpg',
        });

        return { success: true, imageUrl: url };
    } catch (error) {
        console.error('uploadServicePhoto error:', error);

        if (!process.env.BLOB_READ_WRITE_TOKEN?.trim() && process.env.NODE_ENV === 'production') {
            return { success: false, error: 'Хранилище изображений не настроено. Укажите BLOB_READ_WRITE_TOKEN.' };
        }

        return { success: false, error: 'Не удалось загрузить файл.' };
    }
}
