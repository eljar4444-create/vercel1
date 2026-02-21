'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

interface ProviderOnboardingResult {
    success: boolean;
    error?: string;
    profileId?: number;
}

export async function createProviderProfile(formData: FormData): Promise<ProviderOnboardingResult> {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
        return { success: false, error: 'Требуется авторизация.' };
    }

    if (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN') {
        return { success: false, error: 'Недостаточно прав.' };
    }

    const name = String(formData.get('name') || '').trim();
    const city = String(formData.get('city') || '').trim();
    const submittedCategoryId = Number(formData.get('category_id'));

    try {
        const beautyCategory = await prisma.category.findFirst({
            where: { slug: 'beauty' },
            select: { id: true },
        });
        const categoryId = beautyCategory?.id ?? submittedCategoryId;

        if (!name || !city || !Number.isInteger(categoryId)) {
            return { success: false, error: 'Заполните все обязательные поля.' };
        }

        const existingByUserId = await prisma.profile.findFirst({
            where: { user_id: session.user.id },
            select: { id: true },
        });
        if (existingByUserId) {
            return { success: true, profileId: existingByUserId.id };
        }

        const existingByEmail = await prisma.profile.findUnique({
            where: { user_email: session.user.email },
            select: { id: true },
        });

        if (existingByEmail) {
            await prisma.profile.update({
                where: { id: existingByEmail.id },
                data: {
                    user_id: session.user.id,
                    is_verified: true,
                },
            });
            return { success: true, profileId: existingByEmail.id };
        }

        const created = await prisma.profile.create({
            data: {
                user_id: session.user.id,
                user_email: session.user.email,
                name,
                city,
                category_id: categoryId,
                attributes: {},
                image_url: null,
                is_verified: true,
            },
            select: { id: true },
        });

        revalidatePath('/search');
        revalidatePath('/account');
        return { success: true, profileId: created.id };
    } catch (error: any) {
        console.error('createProviderProfile error:', error);
        return { success: false, error: 'Не удалось создать профиль.' };
    }
}
