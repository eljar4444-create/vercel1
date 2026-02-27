'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/** Get profile IDs that the current client has favorited. */
export async function getFavoriteProfileIds(): Promise<number[]> {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'CLIENT' && session.user.role !== 'ADMIN')) {
        return [];
    }
    const rows = await prisma.favorite.findMany({
        where: { clientId: session.user.id },
        select: { providerProfileId: true },
    });
    return rows.map((r) => r.providerProfileId);
}

/** Add or remove a provider from the current client's favorites. Returns new state: true = favorited, false = not. */
export async function toggleFavorite(providerProfileId: number): Promise<{ success: boolean; isFavorited: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, isFavorited: false, error: 'Войдите в аккаунт' };
    }
    if (session.user.role !== 'CLIENT' && session.user.role !== 'ADMIN') {
        return { success: false, isFavorited: false, error: 'Доступно только клиентам' };
    }
    const profileId = Number(providerProfileId);
    if (!Number.isInteger(profileId)) {
        return { success: false, isFavorited: false, error: 'Некорректный профиль' };
    }
    try {
        const existing = await prisma.favorite.findUnique({
            where: {
                clientId_providerProfileId: { clientId: session.user.id, providerProfileId: profileId },
            },
        });
        if (existing) {
            await prisma.favorite.delete({ where: { id: existing.id } });
            revalidatePath('/dashboard');
            revalidatePath('/search');
            return { success: true, isFavorited: false };
        }
        await prisma.favorite.create({
            data: {
                clientId: session.user.id,
                providerProfileId: profileId,
            },
        });
        revalidatePath('/dashboard');
        revalidatePath('/search');
        return { success: true, isFavorited: true };
    } catch (e) {
        console.error('toggleFavorite error:', e);
        return { success: false, isFavorited: false, error: 'Не удалось обновить избранное' };
    }
}
