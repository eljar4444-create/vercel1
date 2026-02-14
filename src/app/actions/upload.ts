'use server';

import { auth } from '@/auth';
import { put } from '@vercel/blob';

export async function uploadServicePhoto(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const file = formData.get('photo') as File;
    if (!file) {
        throw new Error('No file uploaded');
    }

    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
    }

    const filename = `service-${session.user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

    try {
        const blob = await put(filename, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        return { success: true, imageUrl: blob.url };
    } catch (e) {
        console.error('Error uploading to blob:', e);
        throw new Error('Failed to upload file');
    }
}
