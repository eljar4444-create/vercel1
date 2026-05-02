/**
 * Booking Flow Integration Tests
 *
 * Tests the Init & Hold → Verify & Commit pipeline including:
 *   A. Bot protection (Turnstile rejection)
 *   B. Happy path (full booking + shadow user)
 *   C. Concurrency (soft-lock prevents double-booking)
 *   D. Rate limiting (blocks after limit)
 *
 * These tests mock Prisma + Inngest at the module level and test
 * the actual server action logic end-to-end.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
    default: {
        $transaction: vi.fn(),
        otpVerification: {
            findUnique: vi.fn(),
            count: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        booking: {
            count: vi.fn(),
        },
    },
}));

vi.mock('@/inngest/client', () => ({
    inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/lib/turnstile', () => ({
    verifyTurnstileToken: vi.fn(),
}));

vi.mock('@/lib/otp', () => ({
    generateOtp: vi.fn().mockResolvedValue({
        plaintext: '123456',
        hash: '$2b$10$hashedvalue',
    }),
    verifyOtp: vi.fn(),
    OTP_EXPIRY_MINUTES: 10,
    OTP_MAX_ATTEMPTS: 5,
    OTP_MAX_PER_HOUR: 5,
}));

vi.mock('@/lib/rate-limit', () => ({
    checkOtpRateLimit: vi.fn(),
    checkActiveLockLimit: vi.fn(),
}));

vi.mock('@/lib/phone', () => ({
    validateAndSanitizePhone: vi.fn((p: string) => p.startsWith('+') ? p : null),
}));

vi.mock('@/lib/client/upsert', () => ({
    upsertClientOnBookingCreated: vi.fn().mockResolvedValue(undefined),
}));

// ─── Import SUT after mocks ──────────────────────────────────────────────────

import { initBooking } from '@/app/actions/initBooking';
import { verifyOtpAndCommit } from '@/app/actions/verifyOtpAndCommit';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { verifyOtp } from '@/lib/otp';
import { checkOtpRateLimit, checkActiveLockLimit } from '@/lib/rate-limit';
import prisma from '@/lib/prisma';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validInput = {
    profileId: 1,
    serviceId: 10,
    staffId: null,
    date: '2026-05-11',
    time: '14:00',
    userName: 'Test User',
    userPhone: '+491234567890',
    userEmail: 'test@example.com',
    turnstileToken: 'valid-token',
    serviceDuration: 60,
};

function createTxMock(opts: {
    serviceExists?: boolean;
    profileExists?: boolean;
    slotAvailable?: boolean;
    staffList?: { id: string; schedule: any }[];
} = {}) {
    const {
        serviceExists = true,
        profileExists = true,
        slotAvailable = true,
        staffList = [],
    } = opts;

    const otpId = 'otp-session-id-123';
    const bookingId = 42;

    return vi.fn(async (fn: any) => {
        const tx = {
            service: {
                findUnique: vi.fn().mockResolvedValue(
                    serviceExists ? { duration_min: 60, profile_id: 1 } : null
                ),
            },
            profile: {
                findUnique: vi.fn().mockResolvedValue(
                    profileExists
                        ? { schedule: null, staff: staffList }
                        : null
                ),
            },
            staffAvailability: {
                findMany: vi.fn().mockResolvedValue([]),
            },
            booking: {
                findMany: vi.fn().mockResolvedValue(slotAvailable ? [] : [
                    { time: '14:00', service: { duration_min: 60 } },
                ]),
                create: vi.fn().mockResolvedValue({ id: bookingId }),
                findFirst: vi.fn(),
                update: vi.fn(),
            },
            otpVerification: {
                create: vi.fn().mockResolvedValue({ id: otpId }),
                update: vi.fn().mockResolvedValue({}),
            },
            user: {
                upsert: vi.fn().mockResolvedValue({ id: 'user-shadow-1' }),
            },
            client: {
                upsert: vi.fn().mockResolvedValue({}),
            },
        };
        return fn(tx);
    });
}

function setupHappyPathMocks() {
    (verifyTurnstileToken as Mock).mockResolvedValue(true);
    (checkOtpRateLimit as Mock).mockResolvedValue({ allowed: true, currentCount: 0 });
    (checkActiveLockLimit as Mock).mockResolvedValue(true);
}

// ─── Test Cases ───────────────────────────────────────────────────────────────

describe('Booking Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TEST CASE A: Bot Protection
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    describe('A. Bot Protection (Turnstile)', () => {
        it('rejects submission without a valid Turnstile token', async () => {
            (verifyTurnstileToken as Mock).mockResolvedValue(false);

            const result = await initBooking(validInput);

            expect(result.success).toBe(false);
            expect(result.error).toContain('безопасности');
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it('rejects submission with missing token', async () => {
            (verifyTurnstileToken as Mock).mockResolvedValue(false);

            const result = await initBooking({ ...validInput, turnstileToken: '' });

            expect(result.success).toBe(false);
        });

        it('proceeds when Turnstile passes', async () => {
            setupHappyPathMocks();
            (prisma.$transaction as Mock).mockImplementation(createTxMock());

            const result = await initBooking(validInput);

            expect(verifyTurnstileToken).toHaveBeenCalledWith('valid-token');
            expect(result.success).toBe(true);
        });
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TEST CASE B: Happy Path
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    describe('B. Happy Path (Init → OTP → Shadow User → Commit)', () => {
        it('Step 1: initBooking creates LOCKED booking and returns OTP session', async () => {
            setupHappyPathMocks();
            (prisma.$transaction as Mock).mockImplementation(createTxMock());

            const result = await initBooking(validInput);

            expect(result.success).toBe(true);
            expect(result.otpSessionId).toBeDefined();
            expect(result.expiresAt).toBeDefined();
        });

        it('Step 2: verifyOtpAndCommit with correct code promotes booking', async () => {
            const otpSessionId = 'otp-123';
            const now = new Date();
            const futureDate = new Date(now.getTime() + 10 * 60 * 1000);

            // Mock: find OTP record (valid, not expired, not verified)
            (prisma.otpVerification.findUnique as Mock).mockResolvedValue({
                id: otpSessionId,
                code: '$2b$10$hashed',
                email: 'test@example.com',
                verified: false,
                attempts: 0,
                expiresAt: futureDate,
                bookingId: 42,
            });

            // Mock: OTP code matches
            (verifyOtp as Mock).mockResolvedValue(true);

            // Mock: transaction
            (prisma.$transaction as Mock).mockImplementation(async (fn: any) => {
                const tx = {
                    booking: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: 42,
                            otpSessionId,
                            status: 'LOCKED',
                            profile_id: 1,
                            user_name: 'Test User',
                            user_phone: '+491234567890',
                            user_email: 'test@example.com',
                            lockExpiresAt: futureDate,
                        }),
                        update: vi.fn().mockResolvedValue({ id: 42 }),
                    },
                    user: {
                        upsert: vi.fn().mockResolvedValue({ id: 'shadow-user-1' }),
                    },
                    otpVerification: {
                        update: vi.fn().mockResolvedValue({}),
                    },
                    client: {
                        upsert: vi.fn().mockResolvedValue({}),
                    },
                };
                return fn(tx);
            });

            const result = await verifyOtpAndCommit({
                otpSessionId,
                code: '123456',
            });

            expect(result.success).toBe(true);
            expect(result.bookingId).toBe(42);
            expect(result.userId).toBe('shadow-user-1');
        });

        it('Step 2: rejects incorrect OTP code', async () => {
            const otpSessionId = 'otp-wrong';

            (prisma.otpVerification.findUnique as Mock).mockResolvedValue({
                id: otpSessionId,
                code: '$2b$10$hashed',
                verified: false,
                attempts: 0,
                expiresAt: new Date(Date.now() + 600000),
            });

            (verifyOtp as Mock).mockResolvedValue(false);

            const result = await verifyOtpAndCommit({
                otpSessionId,
                code: '000000',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Неверный код');
            expect(result.attemptsLeft).toBeDefined();
            expect(prisma.otpVerification.update).toHaveBeenCalledWith({
                where: { id: otpSessionId },
                data: { attempts: { increment: 1 } },
            });
        });

        it('Step 2: rejects expired OTP', async () => {
            (prisma.otpVerification.findUnique as Mock).mockResolvedValue({
                id: 'expired-otp',
                code: '$2b$10$hashed',
                verified: false,
                attempts: 0,
                expiresAt: new Date(Date.now() - 1000), // expired
            });

            const result = await verifyOtpAndCommit({
                otpSessionId: 'expired-otp',
                code: '123456',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('истёк');
        });

        it('Step 2: rejects already-used OTP', async () => {
            (prisma.otpVerification.findUnique as Mock).mockResolvedValue({
                id: 'used-otp',
                code: '$2b$10$hashed',
                verified: true, // already used
                attempts: 1,
                expiresAt: new Date(Date.now() + 600000),
            });

            const result = await verifyOtpAndCommit({
                otpSessionId: 'used-otp',
                code: '123456',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('уже был использован');
        });
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TEST CASE C: Concurrency / Soft-Lock
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    describe('C. Concurrency (Soft-Lock)', () => {
        it('first user can lock a slot', async () => {
            setupHappyPathMocks();
            (prisma.$transaction as Mock).mockImplementation(createTxMock({ slotAvailable: true }));

            const result = await initBooking(validInput);

            expect(result.success).toBe(true);
            expect(result.otpSessionId).toBeDefined();
        });

        it('second user is blocked from locking the same slot', async () => {
            setupHappyPathMocks();
            // Slot is no longer available because first user has a LOCKED booking on it
            (prisma.$transaction as Mock).mockImplementation(createTxMock({ slotAvailable: false }));

            const result = await initBooking({
                ...validInput,
                userEmail: 'user2@example.com',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('занято');
        });

        it('rejects when max active locks per email is reached', async () => {
            (verifyTurnstileToken as Mock).mockResolvedValue(true);
            (checkOtpRateLimit as Mock).mockResolvedValue({ allowed: true });
            (checkActiveLockLimit as Mock).mockResolvedValue(false); // limit reached

            const result = await initBooking(validInput);

            expect(result.success).toBe(false);
            expect(result.error).toContain('активные бронирования');
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TEST CASE D: Rate Limiting
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    describe('D. Rate Limiting', () => {
        it('allows OTP requests within rate limit', async () => {
            setupHappyPathMocks();
            (prisma.$transaction as Mock).mockImplementation(createTxMock());

            const result = await initBooking(validInput);

            expect(checkOtpRateLimit).toHaveBeenCalledWith('test@example.com');
            expect(result.success).toBe(true);
        });

        it('blocks 6th OTP request for the same email', async () => {
            (verifyTurnstileToken as Mock).mockResolvedValue(true);
            (checkOtpRateLimit as Mock).mockResolvedValue({
                allowed: false,
                retryAfterSec: 1800,
                currentCount: 5,
            });
            (checkActiveLockLimit as Mock).mockResolvedValue(true);

            const result = await initBooking(validInput);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Слишком много попыток');
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it('blocks after max OTP verification attempts', async () => {
            (prisma.otpVerification.findUnique as Mock).mockResolvedValue({
                id: 'otp-maxed',
                code: '$2b$10$hashed',
                verified: false,
                attempts: 5, // max reached
                expiresAt: new Date(Date.now() + 600000),
            });

            const result = await verifyOtpAndCommit({
                otpSessionId: 'otp-maxed',
                code: '111111',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Слишком много попыток');
            expect(result.attemptsLeft).toBe(0);
        });
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Input Validation Edge Cases
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    describe('Input Validation', () => {
        it('rejects invalid email format', async () => {
            (verifyTurnstileToken as Mock).mockResolvedValue(true);

            const result = await initBooking({
                ...validInput,
                userEmail: 'not-an-email',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('email');
        });

        it('rejects invalid phone format', async () => {
            (verifyTurnstileToken as Mock).mockResolvedValue(true);
            (checkOtpRateLimit as Mock).mockResolvedValue({ allowed: true });
            (checkActiveLockLimit as Mock).mockResolvedValue(true);

            const result = await initBooking({
                ...validInput,
                userPhone: '12345', // no +prefix → fails validation
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('телефон');
        });

        it('rejects missing required fields', async () => {
            (verifyTurnstileToken as Mock).mockResolvedValue(true);

            const result = await initBooking({
                ...validInput,
                userName: '',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('заполните');
        });

        it('rejects OTP with non-6-digit code', async () => {
            const result = await verifyOtpAndCommit({
                otpSessionId: 'abc',
                code: '12345', // only 5 digits
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('6 цифр');
        });

        it('rejects empty OTP code', async () => {
            const result = await verifyOtpAndCommit({
                otpSessionId: 'abc',
                code: '',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('код подтверждения');
        });
    });
});
