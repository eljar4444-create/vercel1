'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function disconnectTelegram(profileId: number) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    const id = Number(profileId);
    if (!Number.isInteger(id)) {
        return { success: false, error: 'Некорректный профиль.' };
    }

    const profile = await prisma.profile.findUnique({
        where: { id },
        select: { user_id: true, user_email: true, slug: true },
    });

    if (!profile) {
        return { success: false, error: 'Профиль не найден.' };
    }

    if (session.user.role !== 'ADMIN') {
        const owns =
            (profile.user_id && profile.user_id === session.user.id) ||
            (session.user.email && profile.user_email === session.user.email);
        if (!owns) {
            return { success: false, error: 'Недостаточно прав.' };
        }
    }

    await prisma.profile.update({
        where: { id },
        data: { telegramChatId: null },
    });

    revalidatePath('/dashboard', 'layout');
    revalidatePath(`/salon/${profile.slug}`);
    return { success: true };
}
