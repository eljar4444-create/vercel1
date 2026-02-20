'use server';

import prisma from '@/lib/prisma';

interface RegisterProResult {
    success: boolean;
    error?: string;
}

export async function registerPro(formData: FormData): Promise<RegisterProResult> {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const city = formData.get('city') as string;
    const categoryId = parseInt(formData.get('category_id') as string, 10);

    // ─── Validation ─────────────────────────────────────────────────
    if (!name || !email || !city || isNaN(categoryId)) {
        return { success: false, error: 'Пожалуйста, заполните все поля.' };
    }

    try {
        // Check if email is already taken
        const existing = await prisma.profile.findUnique({
            where: { user_email: email },
        });

        if (existing) {
            return { success: false, error: 'Этот email уже зарегистрирован.' };
        }

        await prisma.profile.create({
            data: {
                name,
                user_email: email,
                city,
                category_id: categoryId,
                attributes: {},
                image_url: null,
                is_verified: true,
            },
        });

        return { success: true };
    } catch (error: any) {
        console.error('registerPro error:', error);
        return { success: false, error: 'Произошла ошибка. Попробуйте позже.' };
    }
}
