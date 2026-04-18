import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
    default: {
        $transaction: vi.fn(),
        profile: { findUnique: vi.fn() },
        booking: { findMany: vi.fn(), create: vi.fn() },
        service: { findUnique: vi.fn() },
        staffAvailability: { findMany: vi.fn().mockResolvedValue([]) },
    },
}));

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/inngest/client', () => ({ inngest: { send: vi.fn() } }));
vi.mock('@/lib/requireNotBanned', () => ({ checkBanned: vi.fn(() => null) }));

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { createBooking } from '@/app/actions/booking';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe('createBooking — Multi-Staff B2B Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    const validInput = {
        profileId: 1,
        date: '2026-04-01', // Wed
        time: '14:00',
        userName: 'Client',
        userPhone: '+123456',
        serviceDuration: 60,
    };

    const mockProfileWithStaff = {
        id: 1,
        schedule: { days: [{ day: 3, intervals: [{ start: '09:00', end: '18:00' }] }] },
        staff: [
            { id: 'staff-a', schedule: null },
            { id: 'staff-b', schedule: null }
        ]
    };

    it('assigns Any Master automatically to the first available staff', async () => {
        let capturedData: any = null;

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
             const tx = {
                 profile: { findUnique: vi.fn().mockResolvedValue(mockProfileWithStaff) },
                 // Staff A is busy at 14:00, but Staff B is free!
                 booking: {
                     findMany: vi.fn().mockImplementation((query) => {
                         if (query.where?.staff_id === 'staff-a') {
                             return [{ time: '14:00', staff_id: 'staff-a', service: { duration_min: 60 } }];
                         }
                         return [];
                     }),
                     create: vi.fn().mockImplementation((args) => {
                         capturedData = args.data;
                         return { id: 2 };
                     })
                 },
                 service: { findUnique: vi.fn() },
                 staffAvailability: { findMany: vi.fn().mockResolvedValue([]) },
             };
             return callback(tx);
        });

        const result = await createBooking(validInput);
        expect(result.success).toBe(true);

        // It should have dynamically selected staff-b because staff-a was occupied in the mock
        expect(capturedData.staff_id).toBe('staff-b');
        expect(capturedData.slotLock).toBe('1:staff-b:2026-04-01:14:00');
    });

    it('creates concurrent bookings if explicitly mapped to different staff members', async () => {
        let capturedData1: any = null;

        // Booking specifically for Staff A
        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
             const tx = {
                 profile: { findUnique: vi.fn().mockResolvedValue(mockProfileWithStaff) },
                 booking: {
                     findMany: vi.fn().mockResolvedValue([]),
                     create: vi.fn().mockImplementation((args) => {
                         capturedData1 = args.data;
                         return { id: 3 };
                     })
                 },
                 staffAvailability: { findMany: vi.fn().mockResolvedValue([]) },
             };
             return callback(tx);
        });

        const result1 = await createBooking({ ...validInput, staffId: 'staff-a' });
        expect(result1.success).toBe(true);
        expect(capturedData1.slotLock).toBe('1:staff-a:2026-04-01:14:00');
    });

    it('rejects Any Master if ALL staff are strictly booked', async () => {
        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
             const tx = {
                 profile: { findUnique: vi.fn().mockResolvedValue(mockProfileWithStaff) },
                 // Both A and B are occupied at 14:00
                 booking: {
                     findMany: vi.fn().mockImplementation((query) => {
                         if (query.where?.staff_id === 'staff-a') {
                             return [{ time: '14:00', staff_id: 'staff-a', service: { duration_min: 60 } }];
                         }
                         if (query.where?.staff_id === 'staff-b') {
                             return [{ time: '14:00', staff_id: 'staff-b', service: { duration_min: 60 } }];
                         }
                         return [];
                     }),
                     create: vi.fn()
                 },
                 staffAvailability: { findMany: vi.fn().mockResolvedValue([]) },
             };
             return callback(tx);
        });

        const result = await createBooking(validInput);
        expect(result.success).toBe(false);
        expect(result.error).toContain('уже занято у всех мастеров');
    });

    it('rejects booking when chosen staff is marked not-working via StaffAvailability', async () => {
        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
            const tx = {
                profile: { findUnique: vi.fn().mockResolvedValue(mockProfileWithStaff) },
                booking: {
                    findMany: vi.fn().mockResolvedValue([]),
                    create: vi.fn(),
                },
                staffAvailability: {
                    findMany: vi.fn().mockResolvedValue([
                        // Wed (dayOfWeek 3): staff-a is off even though salon is open.
                        { staffId: 'staff-a', dayOfWeek: 3, isWorking: false, startTime: '10:00', endTime: '18:00' },
                    ]),
                },
            };
            return callback(tx);
        });

        const result = await createBooking({ ...validInput, staffId: 'staff-a' });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Мастер не работает');
    });

    it('rejects booking outside an individual staff’s narrow StaffAvailability window', async () => {
        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
            const tx = {
                profile: { findUnique: vi.fn().mockResolvedValue(mockProfileWithStaff) },
                booking: {
                    findMany: vi.fn().mockResolvedValue([]),
                    create: vi.fn(),
                },
                staffAvailability: {
                    findMany: vi.fn().mockResolvedValue([
                        // staff-a only works 15:00–18:00 on Wed; 14:00 must be rejected.
                        { staffId: 'staff-a', dayOfWeek: 3, isWorking: true, startTime: '15:00', endTime: '18:00' },
                    ]),
                },
            };
            return callback(tx);
        });

        const result = await createBooking({ ...validInput, staffId: 'staff-a' });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Выбранное время недоступно');
    });

    it('routes Any Master to the staff whose StaffAvailability window covers the requested time', async () => {
        let capturedData: any = null;

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
            const tx = {
                profile: { findUnique: vi.fn().mockResolvedValue(mockProfileWithStaff) },
                booking: {
                    findMany: vi.fn().mockResolvedValue([]),
                    create: vi.fn().mockImplementation((args) => {
                        capturedData = args.data;
                        return { id: 4 };
                    }),
                },
                staffAvailability: {
                    findMany: vi.fn().mockResolvedValue([
                        // staff-a only 16:00–18:00 Wed. staff-b has no override -> salon 09:00–18:00 applies.
                        { staffId: 'staff-a', dayOfWeek: 3, isWorking: true, startTime: '16:00', endTime: '18:00' },
                    ]),
                },
            };
            return callback(tx);
        });

        const result = await createBooking(validInput); // 14:00
        expect(result.success).toBe(true);
        expect(capturedData.staff_id).toBe('staff-b');
        expect(capturedData.slotLock).toBe('1:staff-b:2026-04-01:14:00');
    });
});
