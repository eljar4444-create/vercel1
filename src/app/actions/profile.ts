'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';

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
        throw new Error('Unauthorized');
    }

    const file = formData.get('photo') as File | null;

    if (!file || !file.size) {
        throw new Error('No file uploaded');
    }

    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const filename = `user-avatar-${session.user.id}-${Date.now()}-${safeName}`;

    const blob = await put(filename, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    await prisma.user.update({
        where: { id: session.user.id },
        data: { image: blob.url },
    });

    revalidatePath('/dashboard');
    revalidatePath('/account/settings');

    return { success: true, imageUrl: blob.url };
}
