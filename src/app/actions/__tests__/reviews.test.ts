import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    default: {
        booking: { findUnique: vi.fn() },
        review: { findUnique: vi.fn(), create: vi.fn() }
    }
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { submitReview } from '@/app/actions/reviews';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe('submitReview actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects unauthenticated users', async () => {
        mockAuth.mockResolvedValue(null);
        const result = await submitReview(new FormData());
        expect(result.success).toBe(false);
    });

    it('rejects banned users', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1', isBanned: true } } as any);
        const result = await submitReview(new FormData());
        expect(result.success).toBe(false);
        expect(result.error).toContain('заблокирован');
    });

    it('rejects invalid rating constraints', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'client-1', isBanned: false } } as any);
        
        const formData = new FormData();
        formData.append('bookingId', '1');
        formData.append('rating', '6');

        const result = await submitReview(formData);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Некорректные');
    });

    it('rejects if the booking does not belong to the user', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'client-2', isBanned: false } } as any);
        mockPrisma.booking.findUnique.mockResolvedValue({ user_id: 'client-1' } as any);

        const formData = new FormData();
        formData.append('bookingId', '1');
        formData.append('rating', '5');

        const result = await submitReview(formData);
        expect(result.success).toBe(false);
        expect(result.error).toContain('чужую');
    });

    it('accepts valid review and creates it in the database', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'client-1', isBanned: false } } as any);
        mockPrisma.booking.findUnique.mockResolvedValue({ 
            id: 1, 
            user_id: 'client-1', 
            status: 'confirmed', 
            profile_id: 10,
            profile: { slug: 'test-slug' } 
        } as any);
        mockPrisma.review.findUnique.mockResolvedValue(null);

        const formData = new FormData();
        formData.append('bookingId', '1');
        formData.append('rating', '5');
        formData.append('comment', 'Amazing!');

        await submitReview(formData);

        expect(mockPrisma.review.create).toHaveBeenCalledWith({
            data: {
                profileId: 10,
                clientId: 'client-1',
                bookingId: 1,
                rating: 5,
                comment: 'Amazing!',
            }
        });
    });
});
