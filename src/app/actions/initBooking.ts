'use server';

import prisma from '@/lib/prisma';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { generateOtp, OTP_EXPIRY_MINUTES } from '@/lib/otp';
import { checkOtpRateLimit, checkActiveLockLimit } from '@/lib/rate-limit';
import { validateAndSanitizePhone } from '@/lib/phone';
import { inngest } from '@/inngest/client';
import { normalizeDuration } from '@/lib/booking/slots';
import {
    getDayIntervals,
    parseSchedule,
    weekdayFromDateString,
    type TimeInterval,
} from '@/lib/scheduling';
import { calculateSlots } from '@/lib/booking/slots';
import type { Prisma } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InitBookingInput {
    profileId: number;
    serviceId: number | null;
    staffId: string | null;
    date: string;
    time: string;
    userName: string;
    userPhone: string;
    userEmail: string;
    turnstileToken: string;
    serviceDuration?: number;
}

interface InitBookingResult {
    success: boolean;
    otpSessionId?: string;
    expiresAt?: string;
    error?: string;
}

// ─── Reused availability helpers (mirrored from booking.ts) ───────────────────

type StaffAvailMap = Map<string, { isWorking: boolean; startTime: string; endTime: string }>;
const availKey = (staffId: string, dayOfWeek: number) => `${staffId}:${dayOfWeek}`;

async function loadStaffAvailability(
    db: Prisma.TransactionClient | typeof prisma,
    staffIds: string[]
): Promise<StaffAvailMap> {
    const map: StaffAvailMap = new Map();
    if (staffIds.length === 0) return map;
    const rows = await db.staffAvailability.findMany({
        where: { staffId: { in: staffIds } },
        select: { staffId: true, dayOfWeek: true, isWorking: true, startTime: true, endTime: true },
    });
    for (const r of rows) {
        map.set(availKey(r.staffId, r.dayOfWeek), {
            isWorking: r.isWorking,
            startTime: r.startTime,
            endTime: r.endTime,
        });
    }
    return map;
}

function resolveWorkIntervals(
    staffId: string | null,
    weekday: number,
    availMap: StaffAvailMap,
    legacyStaffSchedule: Prisma.JsonValue | null | undefined,
    salonSchedule: Prisma.JsonValue | null | undefined
): TimeInterval[] {
    if (staffId) {
        const override = availMap.get(availKey(staffId, weekday));
        if (override) {
            if (!override.isWorking) return [];
            if (override.startTime >= override.endTime) return [];
            return [{ start: override.startTime, end: override.endTime }];
        }
    }
    return getDayIntervals(parseSchedule(legacyStaffSchedule ?? salonSchedule ?? null), weekday);
}

async function fetchSingleEntitySlots(
    db: Prisma.TransactionClient | typeof prisma,
    profileId: number,
    date: string,
    serviceDuration: number,
    workIntervals: TimeInterval[],
    staffId: string | null
) {
    if (workIntervals.length === 0) return [];

    const busyWhere: any = {
        profile_id: profileId,
        date: new Date(date),
        status: { in: ['LOCKED', 'PENDING', 'CONFIRMED'] },
    };

    if (staffId) {
        busyWhere.staff_id = staffId;
    } else {
        busyWhere.staff_id = null;
    }

    const busyBookings = await db.booking.findMany({
        where: busyWhere,
        select: {
            time: true,
            service: { select: { duration_min: true } },
        },
    });

    return calculateSlots(workIntervals, normalizeDuration(serviceDuration), busyBookings);
}

// ─── Main Action ──────────────────────────────────────────────────────────────

export async function initBooking(input: InitBookingInput): Promise<InitBookingResult> {
    // 1. Validate Turnstile
    const turnstileValid = await verifyTurnstileToken(input.turnstileToken);
    if (!turnstileValid) {
        return { success: false, error: 'Проверка безопасности не пройдена. Обновите страницу и попробуйте снова.' };
    }

    // 2. Validate inputs
    const profileId = Number(input.profileId);
    const serviceId = input.serviceId ? Number(input.serviceId) : null;
    const email = input.userEmail?.toLowerCase().trim();
    const phone = validateAndSanitizePhone(input.userPhone);

    if (!Number.isInteger(profileId) || !input.date || !input.time || !input.userName?.trim()) {
        return { success: false, error: 'Пожалуйста, заполните все поля.' };
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: 'Укажите корректный email.' };
    }

    if (!phone) {
        return { success: false, error: 'Укажите телефон в формате +49XXXXXXXXXX.' };
    }

    // 3. Check rate limit
    const rateCheck = await checkOtpRateLimit(email);
    if (!rateCheck.allowed) {
        return {
            success: false,
            error: `Слишком много попыток. Повторите через ${Math.ceil((rateCheck.retryAfterSec || 60) / 60)} мин.`,
        };
    }

    // 4. Check active lock limit
    const lockAllowed = await checkActiveLockLimit(email);
    if (!lockAllowed) {
        return {
            success: false,
            error: 'У вас уже есть активные бронирования, ожидающие подтверждения. Завершите их или подождите.',
        };
    }

    const serviceDuration = normalizeDuration(input.serviceDuration);

    try {
        // 5. Transaction: verify availability + create lock + generate OTP
        const result = await prisma.$transaction(async (tx) => {
            let duration = serviceDuration;

            if (serviceId) {
                const service = await tx.service.findUnique({
                    where: { id: serviceId },
                    select: { duration_min: true, profile_id: true },
                });
                if (!service || service.profile_id !== profileId) {
                    throw new Error('Услуга не найдена');
                }
                duration = normalizeDuration(service.duration_min);
            }

            // Resolve staff assignment
            let assignedStaffId = input.staffId || null;

            const profile = await tx.profile.findUnique({
                where: { id: profileId },
                select: { schedule: true, staff: { select: { id: true, schedule: true } } },
            });

            if (!profile) {
                throw new Error('Профиль не найден');
            }

            const staffIds = profile.staff.map(s => s.id);
            const availMap = await loadStaffAvailability(tx, staffIds);
            const weekday = weekdayFromDateString(input.date);

            if (!assignedStaffId) {
                let foundStaff: string | null = null;
                if (profile.staff.length > 0) {
                    for (const st of profile.staff) {
                        const intervals = resolveWorkIntervals(st.id, weekday, availMap, st.schedule, profile.schedule);
                        const slots = await fetchSingleEntitySlots(tx, profileId, input.date, duration, intervals, st.id);
                        if (slots.includes(input.time)) {
                            foundStaff = st.id;
                            break;
                        }
                    }
                }

                if (!foundStaff) {
                    const intervals = resolveWorkIntervals(null, weekday, availMap, null, profile.schedule);
                    const slots = await fetchSingleEntitySlots(tx, profileId, input.date, duration, intervals, null);
                    if (!slots.includes(input.time)) {
                        throw new Error('Выбранное время уже занято. Обновите слоты и выберите другое время.');
                    }
                    assignedStaffId = null;
                } else {
                    assignedStaffId = foundStaff;
                }
            } else {
                const staff = profile.staff.find(s => s.id === assignedStaffId);
                if (!staff) throw new Error('Мастер не найден.');
                const intervals = resolveWorkIntervals(staff.id, weekday, availMap, staff.schedule, profile.schedule);
                if (intervals.length === 0) throw new Error('Мастер не работает в выбранный день.');
                const slots = await fetchSingleEntitySlots(tx, profileId, input.date, duration, intervals, assignedStaffId);
                if (!slots.includes(input.time)) throw new Error('Выбранное время недоступно у этого мастера.');
            }

            const slotLock = `${profileId}::${assignedStaffId || 'solo'}::${input.date}::${input.time}`;
            const lockExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

            // Generate OTP
            const { plaintext, hash } = await generateOtp();

            // Create OTP record first (to get the session ID)
            const otpRecord = await tx.otpVerification.create({
                data: {
                    email,
                    code: hash,
                    expiresAt: lockExpiresAt,
                },
            });

            // Create LOCKED booking
            const booking = await tx.booking.create({
                data: {
                    profile_id: profileId,
                    service_id: serviceId,
                    staff_id: assignedStaffId,
                    date: new Date(input.date),
                    time: input.time,
                    user_name: input.userName.trim(),
                    user_phone: phone,
                    user_email: email,
                    status: 'LOCKED',
                    slotLock,
                    lockExpiresAt,
                    otpSessionId: otpRecord.id,
                },
            });

            // Update OTP record with booking ID
            await tx.otpVerification.update({
                where: { id: otpRecord.id },
                data: { bookingId: booking.id },
            });

            return {
                otpSessionId: otpRecord.id,
                expiresAt: lockExpiresAt.toISOString(),
                otpPlaintext: plaintext,
                bookingId: booking.id,
            };
        }, {
            isolationLevel: 'Serializable',
        });

        // 6. Dispatch OTP email via Inngest (async, non-blocking)
        try {
            await inngest.send({
                name: 'otp/send',
                data: {
                    email,
                    code: result.otpPlaintext,
                    otpSessionId: result.otpSessionId,
                },
            });
        } catch (inngestError) {
            console.error('[initBooking] Inngest OTP send failed (non-fatal):', inngestError);
        }

        return {
            success: true,
            otpSessionId: result.otpSessionId,
            expiresAt: result.expiresAt,
        };
    } catch (error: any) {
        console.error('[initBooking] Error:', error);
        if (error.code === 'P2002') {
            return { success: false, error: 'Это время только что было забронировано другим клиентом.' };
        }
        return { success: false, error: error.message || 'Ошибка при создании бронирования.' };
    }
}
