'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

function isAdminKeyValid(key: FormDataEntryValue | null) {
    const expectedKey = process.env.ADMIN_PANEL_KEY;
    return Boolean(expectedKey) && key === expectedKey;
}

export async function approveMaster(formData: FormData) {
    const key = formData.get('admin_key');
    const profileId = Number(formData.get('profile_id'));

    if (!isAdminKeyValid(key)) {
        throw new Error('Доступ запрещен');
    }

    if (!Number.isInteger(profileId)) {
        throw new Error('Некорректный ID заявки');
    }

    await prisma.profile.update({
        where: { id: profileId },
        data: { is_verified: true },
    });

    revalidatePath('/admin');
    revalidatePath('/search');
}

export async function rejectMaster(formData: FormData) {
    const key = formData.get('admin_key');
    const profileId = Number(formData.get('profile_id'));

    if (!isAdminKeyValid(key)) {
        throw new Error('Доступ запрещен');
    }

    if (!Number.isInteger(profileId)) {
        throw new Error('Некорректный ID заявки');
    }

    await prisma.$transaction([
        prisma.booking.deleteMany({ where: { profile_id: profileId } }),
        prisma.service.deleteMany({ where: { profile_id: profileId } }),
        prisma.profile.delete({ where: { id: profileId } }),
    ]);

    revalidatePath('/admin');
    revalidatePath('/search');
}
