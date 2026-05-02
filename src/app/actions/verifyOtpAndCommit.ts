'use server';

import prisma from '@/lib/prisma';
import { verifyOtp, OTP_MAX_ATTEMPTS } from '@/lib/otp';
import { upsertClientOnBookingCreated } from '@/lib/client/upsert';
import { inngest } from '@/inngest/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerifyOtpInput {
    otpSessionId: string;
    code: string;
}

interface VerifyOtpResult {
    success: boolean;
    bookingId?: number;
    userId?: string;
    error?: string;
    attemptsLeft?: number;
}

// ─── Main Action ──────────────────────────────────────────────────────────────

export async function verifyOtpAndCommit(input: VerifyOtpInput): Promise<VerifyOtpResult> {
    const { otpSessionId, code } = input;

    if (!otpSessionId || !code?.trim()) {
        return { success: false, error: 'Введите код подтверждения.' };
    }

    const sanitizedCode = code.trim();
    if (!/^\d{6}$/.test(sanitizedCode)) {
        return { success: false, error: 'Код должен содержать 6 цифр.' };
    }

    try {
        // 1. Find the OTP record
        const otpRecord = await prisma.otpVerification.findUnique({
            where: { id: otpSessionId },
        });

        if (!otpRecord) {
            return { success: false, error: 'Сессия не найдена. Запросите новый код.' };
        }

        if (otpRecord.verified) {
            return { success: false, error: 'Этот код уже был использован.' };
        }

        if (otpRecord.expiresAt < new Date()) {
            return { success: false, error: 'Код истёк. Запросите новый код.' };
        }

        if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
            return { success: false, error: 'Слишком много попыток. Запросите новый код.', attemptsLeft: 0 };
        }

        // 2. Verify the OTP code
        const isValid = await verifyOtp(sanitizedCode, otpRecord.code);

        if (!isValid) {
            // Increment attempts
            await prisma.otpVerification.update({
                where: { id: otpSessionId },
                data: { attempts: { increment: 1 } },
            });

            const attemptsLeft = OTP_MAX_ATTEMPTS - otpRecord.attempts - 1;
            return {
                success: false,
                error: attemptsLeft > 0
                    ? `Неверный код. Осталось попыток: ${attemptsLeft}`
                    : 'Слишком много попыток. Запросите новый код.',
                attemptsLeft: Math.max(attemptsLeft, 0),
            };
        }

        // 3. Valid OTP — commit everything in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Find the LOCKED booking linked to this OTP session
            const booking = await tx.booking.findFirst({
                where: {
                    otpSessionId,
                    status: 'LOCKED',
                },
            });

            if (!booking) {
                throw new Error('Бронирование не найдено или время резервирования истекло. Попробуйте заново.');
            }

            // Check if the lock has expired
            if (booking.lockExpiresAt && booking.lockExpiresAt < new Date()) {
                throw new Error('Время резервирования истекло. Пожалуйста, начните заново.');
            }

            // Shadow User Upsert — find or create
            const user = await tx.user.upsert({
                where: { email: booking.user_email! },
                create: {
                    email: booking.user_email!,
                    name: booking.user_name,
                    phone: booking.user_phone,
                    isShadow: true,
                    emailVerified: new Date(),
                },
                update: {
                    // Only update phone if the existing user doesn't have one
                    ...(booking.user_phone ? { phone: booking.user_phone } : {}),
                    // Don't overwrite name for existing full users
                },
            });

            // Promote booking: LOCKED → PENDING
            const updatedBooking = await tx.booking.update({
                where: { id: booking.id },
                data: {
                    status: 'PENDING',
                    user_id: user.id,
                    lockExpiresAt: null,
                },
            });

            // Mark OTP as verified (prevent replay)
            await tx.otpVerification.update({
                where: { id: otpSessionId },
                data: { verified: true },
            });

            // Upsert client record for provider CRM
            await upsertClientOnBookingCreated(tx, {
                profileId: booking.profile_id,
                name: booking.user_name,
                phone: booking.user_phone,
            });

            return { bookingId: updatedBooking.id, userId: user.id };
        }, {
            isolationLevel: 'Serializable',
        });

        // 4. Dispatch notifications (async, non-blocking)
        try {
            await Promise.allSettled([
                inngest.send({
                    name: 'booking/created',
                    data: { bookingId: result.bookingId },
                }),
                inngest.send({
                    name: 'booking.completed.review_request',
                    data: { bookingId: result.bookingId },
                }),
            ]);
        } catch (inngestError) {
            console.error('[verifyOtpAndCommit] Inngest dispatch failed (non-fatal):', inngestError);
        }

        return {
            success: true,
            bookingId: result.bookingId,
            userId: result.userId,
        };
    } catch (error: any) {
        console.error('[verifyOtpAndCommit] Error:', error);
        return { success: false, error: error.message || 'Ошибка при подтверждении бронирования.' };
    }
}
