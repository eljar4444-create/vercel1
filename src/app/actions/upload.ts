'use server';

import { auth } from '@/auth';
import { put } from '@vercel/blob';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function uploadServicePhoto(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const file = formData.get('photo') as File;
    if (!file) {
        throw new Error('No file uploaded');
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type');
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '') || 'service-photo.jpg';
    const filename = `services/${session.user.id}-${Date.now()}-${safeName}`;

    try {
        const { url } = await put(filename, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        return { success: true, imageUrl: url };
    } catch (e) {
        console.error('Error uploading to blob:', e);
        throw new Error('Failed to upload file');
    }
}
