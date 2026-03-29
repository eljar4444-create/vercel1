import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    default: {
        booking: { updateMany: vi.fn(), findMany: vi.fn() }
    }
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { linkLegacyBookingsState } from '@/app/my-bookings/actions';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe('myBookings actions — Attack Mitigation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('blocks attempting to link more than 20 bookings', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'limit-user', isBanned: false } } as any);

        // Mock 21 bookings
        const mockBookings = Array.from({ length: 21 }).map((_, i) => ({
            id: i,
            user_phone: '+491761234567',
        }));
        
        mockPrisma.booking.findMany.mockResolvedValue(mockBookings as any);

        const formData = new FormData();
        formData.append('phone', '+491761234567');

        const result = await linkLegacyBookingsState(null, formData);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Слишком много записей');
        expect(result.linked).toBe(0);
    });

    it('enforces rate limits on linking attempts (max 5 per hour)', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'ratelimit-user', isBanned: false } } as any);
        mockPrisma.booking.findMany.mockResolvedValue([]);

        const formData = new FormData();
        formData.append('phone', '+491760000000'); // random phone

        // Execute 5 allowed attempts
        for (let i = 0; i < 5; i++) {
            const res = await linkLegacyBookingsState(null, formData);
            expect(res.error).toBe('Не найдено старых записей для привязки.');
        }

        // 6th attempt should hit rate limit
        const result = await linkLegacyBookingsState(null, formData);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Слишком много попыток');
    });
});
