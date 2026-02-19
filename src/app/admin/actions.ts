'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

function parseProfileId(formData: FormData) {
    const profileId = Number(formData.get('profile_id'));
    if (!Number.isInteger(profileId)) {
        throw new Error('Некорректный ID заявки');
    }
    return profileId;
}

export async function approveMaster(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен');
    }

    const profileId = parseProfileId(formData);

    await prisma.profile.update({
        where: { id: profileId },
        data: { is_verified: true },
    });

    revalidatePath('/admin');
    revalidatePath('/search');
}

export async function rejectMaster(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен');
    }

    const profileId = parseProfileId(formData);

    await prisma.$transaction([
        prisma.booking.deleteMany({ where: { profile_id: profileId } }),
        prisma.service.deleteMany({ where: { profile_id: profileId } }),
        prisma.profile.delete({ where: { id: profileId } }),
    ]);

    revalidatePath('/admin');
    revalidatePath('/search');
}
