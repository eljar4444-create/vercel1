import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies BEFORE importing the module under test ──
vi.mock('@/lib/prisma', () => ({
    default: {
        $transaction: vi.fn(),
        profile: { findUnique: vi.fn() },
        booking: { findMany: vi.fn(), create: vi.fn() },
        service: { findUnique: vi.fn() },
    },
}));

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/inngest/client', () => ({
    inngest: { send: vi.fn() },
}));

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { inngest } from '@/inngest/client';
import { createBooking } from '@/app/actions/booking';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);
const mockInngest = vi.mocked(inngest);

const validInput = {
    profileId: 1,
    serviceId: null,
    date: '2026-04-01',
    time: '10:00',
    userName: 'Test User',
    userPhone: '+491234567890',
    serviceDuration: 60,
};

// ──────────────────────────────────────────────────────────
// Suite 3.1 — Input Validation
// ──────────────────────────────────────────────────────────
describe('createBooking — input validation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects unauthenticated users', async () => {
        mockAuth.mockResolvedValue(null as any);
        const result = await createBooking(validInput);
        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
    });

    it('rejects when session has no user id', async () => {
        mockAuth.mockResolvedValue({ user: {} } as any);
        const result = await createBooking(validInput);
        expect(result.success).toBe(false);
    });

    it('rejects when user is banned', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1', isBanned: true } } as any);
        const result = await createBooking(validInput);
        expect(result.success).toBe(false);
        expect(result.error).toContain('заблокирован');
    });

    it('rejects missing date', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
        const result = await createBooking({ ...validInput, date: '' });
        expect(result.success).toBe(false);
    });

    it('rejects missing time', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
        const result = await createBooking({ ...validInput, time: '' });
        expect(result.success).toBe(false);
    });

    it('rejects missing userName', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
        const result = await createBooking({ ...validInput, userName: '' });
        expect(result.success).toBe(false);
    });

    it('rejects missing userPhone', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
        const result = await createBooking({ ...validInput, userPhone: '' });
        expect(result.success).toBe(false);
    });
});

// ──────────────────────────────────────────────────────────
// Suite 3.2 — Slot Availability & Booking Creation
// ──────────────────────────────────────────────────────────
describe('createBooking — slot availability inside transaction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('creates booking when slot is available', async () => {
        const mockBooking = { id: 42 };

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
            const tx = {
                profile: {
                    findUnique: vi.fn().mockResolvedValue({
                        schedule: {
                            days: [{ day: 3, intervals: [{ start: '09:00', end: '18:00' }] }],
                            workingDays: [3],
                            startTime: '09:00',
                            endTime: '18:00',
                        },
                    }),
                },
                booking: {
                    findMany: vi.fn().mockResolvedValue([]),
                    create: vi.fn().mockResolvedValue(mockBooking),
                },
                service: { findUnique: vi.fn() },
            };
            return callback(tx);
        });
        mockInngest.send.mockResolvedValue(undefined as any);

        const result = await createBooking(validInput);
        expect(result.success).toBe(true);
        expect(result.bookingId).toBe(42);
    });

    it('rejects when slot is already taken', async () => {
        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
            const tx = {
                profile: {
                    findUnique: vi.fn().mockResolvedValue({
                        schedule: {
                            days: [{ day: 3, intervals: [{ start: '09:00', end: '18:00' }] }],
                            workingDays: [3],
                            startTime: '09:00',
                            endTime: '18:00',
                        },
                    }),
                },
                booking: {
                    findMany: vi.fn().mockResolvedValue([
                        { time: '10:00', service: { duration_min: 60 } },
                    ]),
                    create: vi.fn(),
                },
                service: { findUnique: vi.fn() },
            };
            return callback(tx);
        });

        const result = await createBooking(validInput);
        expect(result.success).toBe(false);
        expect(result.error).toContain('занято');
    });
});

// ──────────────────────────────────────────────────────────
// Suite 3.3 — slotLock Unique Constraint
// ──────────────────────────────────────────────────────────
describe('createBooking — slotLock protection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('generates correct slotLock format', async () => {
        let capturedData: any = null;

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
            const tx = {
                profile: {
                    findUnique: vi.fn().mockResolvedValue({
                        schedule: {
                            days: [{ day: 3, intervals: [{ start: '09:00', end: '18:00' }] }],
                            workingDays: [3],
                            startTime: '09:00',
                            endTime: '18:00',
                        },
                    }),
                },
                booking: {
                    findMany: vi.fn().mockResolvedValue([]),
                    create: vi.fn().mockImplementation((args: any) => {
                        capturedData = args.data;
                        return { id: 1 };
                    }),
                },
                service: { findUnique: vi.fn() },
            };
            return callback(tx);
        });
        mockInngest.send.mockResolvedValue(undefined as any);

        await createBooking(validInput);

        expect(capturedData.slotLock).toBe('1:none:2026-04-01:10:00');
    });

    it('returns user-friendly error on P2002 unique violation', async () => {
        const prismaError = new Error('Unique constraint violated');
        (prismaError as any).code = 'P2002';

        mockPrisma.$transaction.mockRejectedValue(prismaError);

        const result = await createBooking(validInput);
        expect(result.success).toBe(false);
        expect(result.error).toContain('только что заняли');
    });
});

// ──────────────────────────────────────────────────────────
// Suite 3.4 — Transaction Isolation
// ──────────────────────────────────────────────────────────
describe('createBooking — transaction isolation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('uses Serializable isolation level', async () => {
        mockPrisma.$transaction.mockImplementation(async (callback: any, options: any) => {
            expect(options.isolationLevel).toBe('Serializable');
            const tx = {
                profile: {
                    findUnique: vi.fn().mockResolvedValue({
                        schedule: {
                            days: [{ day: 3, intervals: [{ start: '09:00', end: '18:00' }] }],
                            workingDays: [3],
                            startTime: '09:00',
                            endTime: '18:00',
                        },
                    }),
                },
                booking: {
                    findMany: vi.fn().mockResolvedValue([]),
                    create: vi.fn().mockResolvedValue({ id: 1 }),
                },
                service: { findUnique: vi.fn() },
            };
            return callback(tx);
        });
        mockInngest.send.mockResolvedValue(undefined as any);

        await createBooking(validInput);
        expect(mockPrisma.$transaction).toHaveBeenCalledWith(
            expect.any(Function),
            { isolationLevel: 'Serializable' }
        );
    });
});
