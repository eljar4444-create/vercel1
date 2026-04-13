import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    default: {
        booking: { findUnique: vi.fn() },
    },
}));

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { GET } from '@/app/api/bookings/[id]/arrival/route';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

function req() { return {} as any; }

describe('GET /api/bookings/[id]/arrival', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 401 when unauthenticated', async () => {
        mockAuth.mockResolvedValue(null);
        const res = await GET(req(), { params: { id: '1' } });
        expect(res.status).toBe(401);
    });

    it('returns 400 for non-numeric booking id', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'u1' } } as any);
        const res = await GET(req(), { params: { id: 'abc' } });
        expect(res.status).toBe(400);
    });

    it('returns 404 when booking not found', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'u1' } } as any);
        mockPrisma.booking.findUnique.mockResolvedValue(null);
        const res = await GET(req(), { params: { id: '1' } });
        expect(res.status).toBe(404);
    });

    it('returns 403 when caller is not the booking client', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'u1' } } as any);
        mockPrisma.booking.findUnique.mockResolvedValue({
            id: 1,
            user_id: 'different-user',
            status: 'confirmed',
            profile: { provider_type: 'PRIVATE', arrivalInfo: { address: 'X' } },
        } as any);
        const res = await GET(req(), { params: { id: '1' } });
        expect(res.status).toBe(403);
    });

    it('returns 403 when booking is not confirmed', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'u1' } } as any);
        mockPrisma.booking.findUnique.mockResolvedValue({
            id: 1,
            user_id: 'u1',
            status: 'pending',
            profile: { provider_type: 'PRIVATE', arrivalInfo: { address: 'X' } },
        } as any);
        const res = await GET(req(), { params: { id: '1' } });
        expect(res.status).toBe(403);
    });

    it('returns 403 when provider is SALON', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'u1' } } as any);
        mockPrisma.booking.findUnique.mockResolvedValue({
            id: 1,
            user_id: 'u1',
            status: 'confirmed',
            profile: { provider_type: 'SALON', arrivalInfo: { address: 'X' } },
        } as any);
        const res = await GET(req(), { params: { id: '1' } });
        expect(res.status).toBe(403);
    });

    it('returns arrivalInfo when all three gates pass', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'u1' } } as any);
        const arrivalInfo = { address: 'Hauptstr 1', doorCode: '1234' };
        mockPrisma.booking.findUnique.mockResolvedValue({
            id: 1,
            user_id: 'u1',
            status: 'confirmed',
            profile: { provider_type: 'PRIVATE', arrivalInfo },
        } as any);
        const res = await GET(req(), { params: { id: '1' } });
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json.arrivalInfo).toEqual(arrivalInfo);
    });

    it('returns null arrivalInfo when field is null but gates pass', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'u1' } } as any);
        mockPrisma.booking.findUnique.mockResolvedValue({
            id: 1,
            user_id: 'u1',
            status: 'confirmed',
            profile: { provider_type: 'PRIVATE', arrivalInfo: null },
        } as any);
        const res = await GET(req(), { params: { id: '1' } });
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json.arrivalInfo).toBeNull();
    });
});
