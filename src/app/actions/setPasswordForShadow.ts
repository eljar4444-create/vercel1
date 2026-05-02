'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

interface SetPasswordInput {
    userId: string;
    otpSessionId: string;
    password: string;
}

interface SetPasswordResult {
    success: boolean;
    error?: string;
}

/**
 * Optional password set for shadow users after successful OTP booking.
 * Only allowed if:
 *  - The OTP session is verified
 *  - The user is a shadow account
 *  - The user doesn't already have a password
 */
export async function setPasswordForShadow(input: SetPasswordInput): Promise<SetPasswordResult> {
    const { userId, otpSessionId, password } = input;

    if (!userId || !otpSessionId || !password) {
        return { success: false, error: 'Все поля обязательны.' };
    }

    if (password.length < 8) {
        return { success: false, error: 'Пароль должен содержать минимум 8 символов.' };
    }

    try {
        // Verify the OTP session belongs to this user and was verified
        const otpRecord = await prisma.otpVerification.findUnique({
            where: { id: otpSessionId },
        });

        if (!otpRecord || !otpRecord.verified) {
            return { success: false, error: 'Сессия не найдена или не подтверждена.' };
        }

        // Find the user and verify they're a shadow account
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, error: 'Пользователь не найден.' };
        }

        if (!user.isShadow) {
            return { success: false, error: 'Аккаунт уже активирован.' };
        }

        if (user.password) {
            return { success: false, error: 'Пароль уже установлен.' };
        }

        // Hash and save the password, upgrade from shadow
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                isShadow: false,
            },
        });

        return { success: true };
    } catch (error: any) {
        console.error('[setPasswordForShadow] Error:', error);
        return { success: false, error: 'Ошибка при сохранении пароля.' };
    }
}
