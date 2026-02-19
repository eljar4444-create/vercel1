'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

function isAdminKeyValid(key: FormDataEntryValue | null) {
    const expectedKey = process.env.ADMIN_PANEL_KEY;
    return typeof key === 'string' && Boolean(expectedKey) && key === expectedKey;
}

function parseProfileId(formData: FormData) {
    const profileId = Number(formData.get('profile_id'));
    if (!Number.isInteger(profileId)) {
        throw new Error('Некорректный ID заявки');
    }
    return profileId;
}

export async function approveMaster(formData: FormData) {
    const key = formData.get('admin_key');
    const profileId = parseProfileId(formData);

    if (!isAdminKeyValid(key)) {
        throw new Error('Доступ запрещен');
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
    const profileId = parseProfileId(formData);

    if (!isAdminKeyValid(key)) {
        throw new Error('Доступ запрещен');
    }

    await prisma.$transaction([
        prisma.booking.deleteMany({ where: { profile_id: profileId } }),
        prisma.service.deleteMany({ where: { profile_id: profileId } }),
        prisma.profile.delete({ where: { id: profileId } }),
    ]);

    revalidatePath('/admin');
    revalidatePath('/search');
}
