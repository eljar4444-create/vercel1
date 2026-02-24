'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ProviderType } from '@prisma/client';

/**
 * Завершает онбординг провайдера: сохраняет бизнес-данные
 * и перенаправляет в дашборд.
 */
export async function completeProviderOnboarding(formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Не авторизован' };
    }

    const userId = session.user.id;

    const companyName = formData.get('companyName') as string | null;
    const address = formData.get('address') as string | null;
    const city = formData.get('city') as string | null;
    const zipCode = formData.get('zipCode') as string | null;
    const taxId = formData.get('taxId') as string | null;
    const isKleinunternehmer = formData.get('isKleinunternehmer') === 'on';
    const providerTypeRaw = formData.get('providerType') as string | null;

    // Validate required fields
    if (!address || !city || !zipCode) {
        return { success: false, error: 'Заполните адрес, город и почтовый индекс' };
    }

    // Map providerType to enum
    let providerType: ProviderType = 'PRIVATE';
    if (providerTypeRaw === 'SALON') providerType = 'SALON';
    else if (providerTypeRaw === 'INDIVIDUAL') providerType = 'INDIVIDUAL';

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                providerType,
                companyName: providerType === 'SALON' ? companyName : null,
                isKleinunternehmer: providerType !== 'SALON' ? isKleinunternehmer : false,
                taxId: providerType === 'SALON' ? taxId : null,
                address,
                city,
                zipCode,
                onboardingCompleted: true,
            },
        });

        revalidatePath('/');
    } catch (error) {
        console.error('completeProviderOnboarding error:', error);
        return { success: false, error: 'Ошибка сохранения данных. Попробуйте позже.' };
    }

    // Redirect after successful update (must be outside try/catch)
    redirect('/provider/onboarding');
}
