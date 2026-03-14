'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

type CompleteOnboardingResult = {
    success: boolean;
    error?: string;
};

export async function completeOnboarding(userId?: string): Promise<CompleteOnboardingResult> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    const targetUserId = userId && userId === session.user.id ? userId : session.user.id;

    try {
        await prisma.user.update({
            where: { id: targetUserId },
            data: { onboardingCompleted: true },
        });
        return { success: true };
    } catch (error) {
        console.error('completeOnboarding error:', error);
        return { success: false, error: 'Не удалось обновить статус онбординга.' };
    }
}
