'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
    const profileId = parseInt(formData.get('profile_id') as string, 10);
    const name = formData.get('name') as string;
    const bio = formData.get('bio') as string;
    const phone = formData.get('phone') as string;
    const city = formData.get('city') as string;
    const address = formData.get('address') as string;

    if (isNaN(profileId) || !name || !city) {
        return { success: false, error: 'Имя и город обязательны.' };
    }

    try {
        await prisma.profile.update({
            where: { id: profileId },
            data: {
                name,
                bio: bio || null,
                phone: phone || null,
                city,
                address: address || null,
            },
        });

        revalidatePath('/dashboard', 'layout');
        revalidatePath(`/profile/${profileId}`);

        return { success: true };
    } catch (error: any) {
        console.error('updateProfile error:', error);
        return { success: false, error: 'Ошибка при сохранении профиля.' };
    }
}
