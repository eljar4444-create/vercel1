'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function submitLegalSetup(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Необходима авторизация' };

    const profileId = formData.get('profileId') as string;
    const legalEntityType = formData.get('legalEntityType') as string;
    const legalName = formData.get('legalName') as string;
    const taxId = formData.get('taxId') as string;
    const vatId = formData.get('vatId') as string || null;

    if (!legalName || !taxId) {
        return { success: false, error: 'Заполните обязательные поля: Имя и Налоговый номер' };
    }

    if (legalName.length < 3) {
        return { success: false, error: 'Юридическое имя должно содержать минимум 3 символа' };
    }

    try {
        await prisma.profile.update({
            where: { 
                id: Number(profileId), 
                user_id: session.user.id 
            },
            data: {
                legalEntityType,
                legalName,
                taxId,
                vatId,
                onboardingCompleted: true, // Officially unblocks the dashboard
                status: 'PENDING_REVIEW' // Hides profile from global search until manual verification
            }
        });

        // Toggle the global user flag which controls NextAuth JWT middleware
        await prisma.user.update({
            where: { id: session.user.id },
            data: { onboardingCompleted: true }
        });

        return { success: true };
    } catch (e: any) {
        console.error('Error submitting DAC7:', e);
        return { success: false, error: 'Ошибка сохранения в базу данных. Попробуйте еще раз.' };
    }
}
