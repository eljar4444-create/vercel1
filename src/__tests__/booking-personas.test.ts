/**
 * German User Persona Tests — Booking Flow
 *
 * Simulates 12 realistic users from across Germany attempting bookings.
 * Each persona tests a distinct edge case or scenario through the
 * initBooking → verifyOtpAndCommit pipeline.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
    default: {
        $transaction: vi.fn(),
        otpVerification: { findUnique: vi.fn(), update: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
        booking: { count: vi.fn() },
    },
}));
vi.mock('@/inngest/client', () => ({ inngest: { send: vi.fn().mockResolvedValue(undefined) } }));
vi.mock('@/lib/turnstile', () => ({ verifyTurnstileToken: vi.fn() }));
vi.mock('@/lib/otp', () => ({
    generateOtp: vi.fn().mockResolvedValue({ plaintext: '482917', hash: '$2b$hashed' }),
    verifyOtp: vi.fn(),
    OTP_EXPIRY_MINUTES: 10,
    OTP_MAX_ATTEMPTS: 5,
    OTP_MAX_PER_HOUR: 5,
}));
vi.mock('@/lib/rate-limit', () => ({ checkOtpRateLimit: vi.fn(), checkActiveLockLimit: vi.fn() }));
vi.mock('@/lib/phone', () => ({
    validateAndSanitizePhone: vi.fn((p: string) => {
        const sanitized = p.replace(/[\s\-().]/g, '').trim();
        return /^\+[1-9]\d{6,14}$/.test(sanitized) ? sanitized : null;
    }),
}));
vi.mock('@/lib/client/upsert', () => ({ upsertClientOnBookingCreated: vi.fn().mockResolvedValue(undefined) }));

import { initBooking } from '@/app/actions/initBooking';
import { verifyOtpAndCommit } from '@/app/actions/verifyOtpAndCommit';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { verifyOtp } from '@/lib/otp';
import { checkOtpRateLimit, checkActiveLockLimit } from '@/lib/rate-limit';
import prisma from '@/lib/prisma';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Persona {
    name: string;
    city: string;
    phone: string;
    email: string;
}

const PERSONAS: Record<string, Persona> = {
    berlin:    { name: 'Anna Müller',       city: 'Berlin',    phone: '+4930123456789', email: 'anna.mueller@gmail.com' },
    munich:    { name: 'Maximilian Huber',  city: 'München',   phone: '+4989765432101', email: 'max.huber@web.de' },
    hamburg:   { name: 'Лена Петрова',      city: 'Hamburg',   phone: '+4940112233445', email: 'lena.petrova@mail.ru' },
    cologne:   { name: 'Fatima Al-Rashid',  city: 'Köln',      phone: '+4922198765432', email: 'fatima.rashid@outlook.de' },
    frankfurt: { name: 'Chen Wei',          city: 'Frankfurt', phone: '+4969445566778', email: 'chen.wei@icloud.com' },
    stuttgart: { name: 'Olga Schneider',    city: 'Stuttgart', phone: '+4971133445566', email: 'olga.schneider@gmx.de' },
    dusseldorf:{ name: 'Дмитрий Козлов',    city: 'Düsseldorf',phone: '+4921177889900', email: 'dmitry.kozlov@yandex.com' },
    dresden:   { name: 'Sophie Wagner',     city: 'Dresden',   phone: '+4935122334455', email: 'sophie.w@t-online.de' },
    leipzig:   { name: 'Mohammad Yilmaz',   city: 'Leipzig',   phone: '+4934166778899', email: 'mo.yilmaz@hotmail.de' },
    nuremberg: { name: 'Isabella Rossi',    city: 'Nürnberg',  phone: '+4991155667788', email: 'isabella.rossi@libero.it' },
    freiburg:  { name: 'Marie Dubois',      city: 'Freiburg',  phone: '+4976144556677', email: 'marie.dubois@free.fr' },
    dortmund:  { name: 'Andrei Volkov',     city: 'Dortmund',  phone: '+4923133445566', email: 'andrei.volkov@ukr.net' },
};

function makeInput(p: Persona, overrides: Record<string, any> = {}) {
    return {
        profileId: 1, serviceId: 10, staffId: null,
        date: '2026-05-11', time: '14:00',
        userName: p.name, userPhone: p.phone, userEmail: p.email,
        turnstileToken: 'cf-turnstile-ok', serviceDuration: 60,
        ...overrides,
    };
}

function createTxMock(opts: { slotAvailable?: boolean; profileExists?: boolean; serviceExists?: boolean; serviceDuration?: number } = {}) {
    const { slotAvailable = true, profileExists = true, serviceExists = true, serviceDuration = 60 } = opts;
    return vi.fn(async (fn: any) => fn({
        service:  { findUnique: vi.fn().mockResolvedValue(serviceExists ? { duration_min: serviceDuration, profile_id: 1 } : null) },
        profile:  { findUnique: vi.fn().mockResolvedValue(profileExists ? { schedule: null, staff: [] } : null) },
        staffAvailability: { findMany: vi.fn().mockResolvedValue([]) },
        booking:  {
            findMany: vi.fn().mockResolvedValue(slotAvailable ? [] : [{ time: '14:00', service: { duration_min: 60 } }]),
            create: vi.fn().mockResolvedValue({ id: 100 }),
            findFirst: vi.fn(), update: vi.fn(),
        },
        otpVerification: { create: vi.fn().mockResolvedValue({ id: 'otp-sess-1' }), update: vi.fn().mockResolvedValue({}) },
        user:   { upsert: vi.fn().mockResolvedValue({ id: 'shadow-u-1' }) },
        client: { upsert: vi.fn().mockResolvedValue({}) },
    }));
}

function setupOk() {
    (verifyTurnstileToken as Mock).mockResolvedValue(true);
    (checkOtpRateLimit as Mock).mockResolvedValue({ allowed: true, currentCount: 0 });
    (checkActiveLockLimit as Mock).mockResolvedValue(true);
    (prisma.$transaction as Mock).mockImplementation(createTxMock());
}

function setupOtpRecord(id: string, overrides: Record<string, any> = {}) {
    (prisma.otpVerification.findUnique as Mock).mockResolvedValue({
        id, code: '$2b$hashed', email: 'test@test.com',
        verified: false, attempts: 0,
        expiresAt: new Date(Date.now() + 600_000),
        ...overrides,
    });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('German Persona Booking Simulations', () => {
    beforeEach(() => vi.clearAllMocks());

    // 1. Berlin — standard happy path
    it('1. Anna from Berlin books a haircut successfully', async () => {
        setupOk();
        const res = await initBooking(makeInput(PERSONAS.berlin));
        expect(res.success).toBe(true);
        expect(res.otpSessionId).toBeDefined();
    });

    // 2. Munich — full Init→OTP→Commit cycle
    it('2. Maximilian from München completes full OTP verification', async () => {
        setupOk();
        const init = await initBooking(makeInput(PERSONAS.munich));
        expect(init.success).toBe(true);

        // Now verify OTP
        setupOtpRecord('otp-max', { email: PERSONAS.munich.email });
        (verifyOtp as Mock).mockResolvedValue(true);
        (prisma.$transaction as Mock).mockImplementation(async (fn: any) => fn({
            booking: {
                findFirst: vi.fn().mockResolvedValue({
                    id: 100, otpSessionId: 'otp-max', status: 'LOCKED',
                    profile_id: 1, user_name: PERSONAS.munich.name,
                    user_phone: PERSONAS.munich.phone, user_email: PERSONAS.munich.email,
                    lockExpiresAt: new Date(Date.now() + 600_000),
                }),
                update: vi.fn().mockResolvedValue({ id: 100 }),
            },
            user: { upsert: vi.fn().mockResolvedValue({ id: 'shadow-max' }) },
            otpVerification: { update: vi.fn().mockResolvedValue({}) },
            client: { upsert: vi.fn().mockResolvedValue({}) },
        }));

        const verify = await verifyOtpAndCommit({ otpSessionId: 'otp-max', code: '482917' });
        expect(verify.success).toBe(true);
        expect(verify.userId).toBe('shadow-max');
    });

    // 3. Hamburg — Russian-speaking user, Cyrillic name
    it('3. Лена from Hamburg books with Cyrillic name', async () => {
        setupOk();
        const res = await initBooking(makeInput(PERSONAS.hamburg));
        expect(res.success).toBe(true);
        expect(res.otpSessionId).toBeDefined();
    });

    // 4. Cologne — bot attempt (no Turnstile)
    it('4. Fatima from Köln is blocked by bot protection', async () => {
        (verifyTurnstileToken as Mock).mockResolvedValue(false);
        const res = await initBooking(makeInput(PERSONAS.cologne));
        expect(res.success).toBe(false);
        expect(res.error).toContain('безопасности');
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    // 5. Frankfurt — enters wrong OTP 3 times
    it('5. Chen from Frankfurt enters wrong OTP codes', async () => {
        setupOtpRecord('otp-chen', { email: PERSONAS.frankfurt.email, attempts: 0 });
        (verifyOtp as Mock).mockResolvedValue(false);

        const r1 = await verifyOtpAndCommit({ otpSessionId: 'otp-chen', code: '111111' });
        expect(r1.success).toBe(false);
        expect(r1.attemptsLeft).toBeGreaterThan(0);

        // Simulate 2nd attempt (server incremented attempts)
        setupOtpRecord('otp-chen', { attempts: 1 });
        const r2 = await verifyOtpAndCommit({ otpSessionId: 'otp-chen', code: '222222' });
        expect(r2.success).toBe(false);

        // 3rd attempt
        setupOtpRecord('otp-chen', { attempts: 2 });
        const r3 = await verifyOtpAndCommit({ otpSessionId: 'otp-chen', code: '333333' });
        expect(r3.success).toBe(false);
        expect(r3.attemptsLeft).toBe(2); // 5 max - 2 current - 1 = 2
    });

    // 6. Stuttgart — slot already taken by someone else
    it('6. Olga from Stuttgart finds her slot already locked', async () => {
        (verifyTurnstileToken as Mock).mockResolvedValue(true);
        (checkOtpRateLimit as Mock).mockResolvedValue({ allowed: true });
        (checkActiveLockLimit as Mock).mockResolvedValue(true);
        (prisma.$transaction as Mock).mockImplementation(createTxMock({ slotAvailable: false }));

        const res = await initBooking(makeInput(PERSONAS.stuttgart));
        expect(res.success).toBe(false);
        expect(res.error).toContain('занято');
    });

    // 7. Düsseldorf — rate limited after too many OTP requests
    it('7. Дмитрий from Düsseldorf is rate-limited', async () => {
        (verifyTurnstileToken as Mock).mockResolvedValue(true);
        (checkOtpRateLimit as Mock).mockResolvedValue({ allowed: false, retryAfterSec: 1200 });
        (checkActiveLockLimit as Mock).mockResolvedValue(true);

        const res = await initBooking(makeInput(PERSONAS.dusseldorf));
        expect(res.success).toBe(false);
        expect(res.error).toContain('Слишком много попыток');
    });

    // 8. Dresden — enters phone without + prefix (local format)
    it('8. Sophie from Dresden enters local phone format 0351-223-344-55', async () => {
        (verifyTurnstileToken as Mock).mockResolvedValue(true);
        (checkOtpRateLimit as Mock).mockResolvedValue({ allowed: true });
        (checkActiveLockLimit as Mock).mockResolvedValue(true);

        const res = await initBooking(makeInput(PERSONAS.dresden, { userPhone: '0351-223-344-55' }));
        expect(res.success).toBe(false);
        expect(res.error).toContain('телефон');
    });

    // 9. Leipzig — already has 2 active locks (multi-booking abuse)
    it('9. Mohammad from Leipzig blocked by active lock limit', async () => {
        (verifyTurnstileToken as Mock).mockResolvedValue(true);
        (checkOtpRateLimit as Mock).mockResolvedValue({ allowed: true });
        (checkActiveLockLimit as Mock).mockResolvedValue(false);

        const res = await initBooking(makeInput(PERSONAS.leipzig));
        expect(res.success).toBe(false);
        expect(res.error).toContain('активные бронирования');
    });

    // 10. Nuremberg — expired OTP (took too long to check email)
    it('10. Isabella from Nürnberg submits expired OTP', async () => {
        setupOtpRecord('otp-isabella', {
            email: PERSONAS.nuremberg.email,
            expiresAt: new Date(Date.now() - 60_000), // expired 1 min ago
        });

        const res = await verifyOtpAndCommit({ otpSessionId: 'otp-isabella', code: '482917' });
        expect(res.success).toBe(false);
        expect(res.error).toContain('истёк');
    });

    // 11. Freiburg — books different service on different day
    it('11. Marie from Freiburg books a manicure on a Wednesday', async () => {
        (verifyTurnstileToken as Mock).mockResolvedValue(true);
        (checkOtpRateLimit as Mock).mockResolvedValue({ allowed: true, currentCount: 0 });
        (checkActiveLockLimit as Mock).mockResolvedValue(true);
        (prisma.$transaction as Mock).mockImplementation(createTxMock({ serviceDuration: 45 }));

        const res = await initBooking(makeInput(PERSONAS.freiburg, {
            serviceId: 25, date: '2026-05-13', time: '10:45', serviceDuration: 45,
        }));
        expect(res.success).toBe(true);
        expect(res.otpSessionId).toBeDefined();
    });

    // 12. Dortmund — tries to reuse an already-verified OTP
    it('12. Andrei from Dortmund tries to reuse a spent OTP', async () => {
        setupOtpRecord('otp-andrei', {
            email: PERSONAS.dortmund.email,
            verified: true, // already used
        });

        const res = await verifyOtpAndCommit({ otpSessionId: 'otp-andrei', code: '482917' });
        expect(res.success).toBe(false);
        expect(res.error).toContain('уже был использован');
    });
});
