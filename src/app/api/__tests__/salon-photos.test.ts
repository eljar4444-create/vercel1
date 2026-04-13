import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
    default: {
        profile: { findFirst: vi.fn() },
        portfolioPhoto: { findMany: vi.fn() },
        staff: { findFirst: vi.fn() },
        $queryRaw: vi.fn(),
    },
}));

import prisma from '@/lib/prisma';
import { GET } from '@/app/api/salon/[slug]/photos/route';

const mockPrisma = vi.mocked(prisma);

function makeRequest(url: string): any {
    return { url } as any;
}

describe('GET /api/salon/[slug]/photos', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 404 when profile is not published (visibility gate)', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue(null);
        const res = await GET(makeRequest('http://x/api/salon/draft-profile/photos'), {
            params: { slug: 'draft-profile' },
        });
        expect(res.status).toBe(404);
    });

    it('returns craft wall photos when no filter is provided', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({ id: 1 } as any);
        mockPrisma.$queryRaw.mockResolvedValue([
            { id: 'p1', url: 'u1', serviceId: 10, staffId: null, position: 0 },
            { id: 'p2', url: 'u2', serviceId: null, staffId: null, position: 0 },
        ] as any);
        const res = await GET(makeRequest('http://x/api/salon/published/photos'), {
            params: { slug: 'published' },
        });
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json.photos).toHaveLength(2);
        expect(json.nextCursor).toBeNull();
    });

    it('rejects invalid limit param', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({ id: 1 } as any);
        const res = await GET(makeRequest('http://x/api/salon/p/photos?limit=-5'), {
            params: { slug: 'p' },
        });
        expect(res.status).toBe(400);
    });

    it('rejects non-numeric serviceId', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({ id: 1 } as any);
        const res = await GET(makeRequest('http://x/api/salon/p/photos?serviceId=abc'), {
            params: { slug: 'p' },
        });
        expect(res.status).toBe(400);
    });

    it('returns service photos ordered by position', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({ id: 1 } as any);
        mockPrisma.portfolioPhoto.findMany.mockResolvedValue([
            { id: 'p1', url: 'u1', serviceId: 10, staffId: null, position: 0 },
            { id: 'p2', url: 'u2', serviceId: 10, staffId: null, position: 1 },
        ] as any);
        const res = await GET(makeRequest('http://x/api/salon/p/photos?serviceId=10'), {
            params: { slug: 'p' },
        });
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json.photos).toHaveLength(2);
        expect(mockPrisma.portfolioPhoto.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ orderBy: { position: 'asc' } })
        );
    });

    it('returns 404 when staffId does not belong to profile', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({ id: 1 } as any);
        mockPrisma.staff.findFirst.mockResolvedValue(null);
        const res = await GET(makeRequest('http://x/api/salon/p/photos?staffId=staff-z'), {
            params: { slug: 'p' },
        });
        expect(res.status).toBe(404);
    });

    it('returns staff photos when staff belongs to profile', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({ id: 1 } as any);
        mockPrisma.staff.findFirst.mockResolvedValue({ id: 'staff-a' } as any);
        mockPrisma.portfolioPhoto.findMany.mockResolvedValue([
            { id: 'p1', url: 'u1', serviceId: 10, staffId: 'staff-a', position: 0 },
        ] as any);
        const res = await GET(makeRequest('http://x/api/salon/p/photos?staffId=staff-a'), {
            params: { slug: 'p' },
        });
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json.photos).toHaveLength(1);
    });
});
