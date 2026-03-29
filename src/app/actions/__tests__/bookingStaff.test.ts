import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
    default: {
        $transaction: vi.fn(),
        profile: { findUnique: vi.fn() },
        booking: { findMany: vi.fn(), create: vi.fn() },
        service: { findUnique: vi.fn() },
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
                 service: { findUnique: vi.fn() }
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
             };
             return callback(tx);
        });

        const result = await createBooking(validInput);
        expect(result.success).toBe(false);
        expect(result.error).toContain('уже занято у всех мастеров');
    });
});
