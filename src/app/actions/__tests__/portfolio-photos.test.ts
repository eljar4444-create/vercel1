import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    default: {
        service: { findUnique: vi.fn() },
        portfolioPhoto: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        staff: { findFirst: vi.fn() },
        $transaction: vi.fn(),
    },
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth-helpers', () => ({
    requireProviderProfile: vi.fn(),
}));
vi.mock('@/lib/server/public-upload', () => ({
    savePublicUpload: vi.fn().mockResolvedValue({ url: 'http://example.com/photo.jpg' }),
}));

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { requireProviderProfile } from '@/lib/auth-helpers';
import {
    uploadServicePhotos,
    reorderServicePhotos,
    deletePortfolioPhoto,
} from '@/app/actions/portfolio-photos';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);
const mockRequireProfile = vi.mocked(requireProviderProfile);

function makeFile(type = 'image/jpeg', size = 1024): File {
    const file = new File(['x'], 'photo.jpg', { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
}

function ownerSession() {
    return {
        user: { id: 'user-A', email: 'userA@example.com', role: 'USER', isBanned: false },
    } as any;
}

describe('uploadServicePhotos', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects unauthenticated requests', async () => {
        mockAuth.mockResolvedValue(null);
        const fd = new FormData();
        fd.append('serviceId', '1');
        fd.append('photos', makeFile());
        const result = await uploadServicePhotos(fd);
        expect(result).toEqual({ success: false, error: 'Требуется авторизация.' });
    });

    it('rejects banned users', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'u', email: 'e', role: 'USER', isBanned: true } } as any);
        const fd = new FormData();
        fd.append('serviceId', '1');
        fd.append('photos', makeFile());
        const result = await uploadServicePhotos(fd);
        expect(result).toEqual({ success: false, error: 'Ваш аккаунт заблокирован.' });
    });

    it('rejects non-JPEG/PNG/WebP MIME types', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        const fd = new FormData();
        fd.append('serviceId', '1');
        fd.append('photos', makeFile('image/gif'));
        const result = await uploadServicePhotos(fd);
        expect(result).toEqual({ success: false, error: 'Допустимы только JPEG, PNG и WebP.' });
    });

    it('rejects files over 5MB', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        const fd = new FormData();
        fd.append('serviceId', '1');
        fd.append('photos', makeFile('image/jpeg', 6 * 1024 * 1024));
        const result = await uploadServicePhotos(fd);
        expect(result).toEqual({ success: false, error: 'Файл слишком большой (макс. 5 МБ).' });
    });

    it('rejects upload targeted at another owner’s service', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue({ id: 1 } as any);
        mockPrisma.service.findUnique.mockResolvedValue({ id: 10, profile_id: 999 } as any);

        const fd = new FormData();
        fd.append('serviceId', '10');
        fd.append('photos', makeFile());
        const result = await uploadServicePhotos(fd);
        expect(result).toEqual({ success: false, error: 'Недостаточно прав.' });
    });

    it('creates photos with correct positions starting from maxPos + 1', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue({ id: 1 } as any);
        mockPrisma.service.findUnique.mockResolvedValue({ id: 10, profile_id: 1 } as any);
        mockPrisma.portfolioPhoto.findMany.mockResolvedValue([
            { position: 0 },
            { position: 1 },
        ] as any);
        mockPrisma.$transaction.mockResolvedValue([
            { id: 'p1', url: 'http://example.com/photo.jpg', position: 2 },
            { id: 'p2', url: 'http://example.com/photo.jpg', position: 3 },
        ] as any);

        const fd = new FormData();
        fd.append('serviceId', '10');
        fd.append('photos', makeFile());
        fd.append('photos', makeFile());
        const result = await uploadServicePhotos(fd);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.photos).toHaveLength(2);
            expect(result.photos[0].position).toBe(2);
            expect(result.photos[1].position).toBe(3);
        }
    });

    it('first upload for a service with no photos gets position 0 (cover)', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue({ id: 1 } as any);
        mockPrisma.service.findUnique.mockResolvedValue({ id: 10, profile_id: 1 } as any);
        mockPrisma.portfolioPhoto.findMany.mockResolvedValue([] as any);
        mockPrisma.$transaction.mockResolvedValue([
            { id: 'p1', url: 'http://example.com/photo.jpg', position: 0 },
        ] as any);

        const fd = new FormData();
        fd.append('serviceId', '10');
        fd.append('photos', makeFile());
        const result = await uploadServicePhotos(fd);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.photos[0].position).toBe(0);
        }
    });

    it('attaches staffId to created photos when staff belongs to profile', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue({ id: 1 } as any);
        mockPrisma.service.findUnique.mockResolvedValue({ id: 10, profile_id: 1 } as any);
        mockPrisma.staff.findFirst.mockResolvedValue({ id: 'staff-a' } as any);
        mockPrisma.portfolioPhoto.findMany.mockResolvedValue([] as any);
        mockPrisma.$transaction.mockResolvedValue([
            { id: 'p1', url: 'http://example.com/photo.jpg', position: 0 },
        ] as any);

        const fd = new FormData();
        fd.append('serviceId', '10');
        fd.append('staffId', 'staff-a');
        fd.append('photos', makeFile());
        const result = await uploadServicePhotos(fd);

        expect(result.success).toBe(true);
        expect(mockPrisma.staff.findFirst).toHaveBeenCalledWith({
            where: { id: 'staff-a', profileId: 1 },
            select: { id: true },
        });
        const createArgs = (mockPrisma.portfolioPhoto.create as any).mock.calls[0]?.[0];
        expect(createArgs?.data?.staffId).toBe('staff-a');
    });

    it('rejects staffId belonging to a different profile', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue({ id: 1 } as any);
        mockPrisma.service.findUnique.mockResolvedValue({ id: 10, profile_id: 1 } as any);
        mockPrisma.staff.findFirst.mockResolvedValue(null);

        const fd = new FormData();
        fd.append('serviceId', '10');
        fd.append('staffId', 'staff-from-other-profile');
        fd.append('photos', makeFile());
        const result = await uploadServicePhotos(fd);

        expect(result).toEqual({
            success: false,
            error: 'Специалист не принадлежит профилю.',
        });
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('ignores empty-string staffId (treats as absent)', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue({ id: 1 } as any);
        mockPrisma.service.findUnique.mockResolvedValue({ id: 10, profile_id: 1 } as any);
        mockPrisma.portfolioPhoto.findMany.mockResolvedValue([] as any);
        mockPrisma.$transaction.mockResolvedValue([
            { id: 'p1', url: 'http://example.com/photo.jpg', position: 0 },
        ] as any);

        const fd = new FormData();
        fd.append('serviceId', '10');
        fd.append('staffId', '   ');
        fd.append('photos', makeFile());
        const result = await uploadServicePhotos(fd);

        expect(result.success).toBe(true);
        expect(mockPrisma.staff.findFirst).not.toHaveBeenCalled();
        const createArgs = (mockPrisma.portfolioPhoto.create as any).mock.calls[0]?.[0];
        expect(createArgs?.data?.staffId).toBeNull();
    });

    it('preserves existing behavior when staffId is absent (staffId null)', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue({ id: 1 } as any);
        mockPrisma.service.findUnique.mockResolvedValue({ id: 10, profile_id: 1 } as any);
        mockPrisma.portfolioPhoto.findMany.mockResolvedValue([] as any);
        mockPrisma.$transaction.mockResolvedValue([
            { id: 'p1', url: 'http://example.com/photo.jpg', position: 0 },
        ] as any);

        const fd = new FormData();
        fd.append('serviceId', '10');
        fd.append('photos', makeFile());
        const result = await uploadServicePhotos(fd);

        expect(result.success).toBe(true);
        expect(mockPrisma.staff.findFirst).not.toHaveBeenCalled();
        const createArgs = (mockPrisma.portfolioPhoto.create as any).mock.calls[0]?.[0];
        expect(createArgs?.data?.staffId).toBeNull();
    });
});

describe('reorderServicePhotos', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rejects empty array', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        const result = await reorderServicePhotos(10, []);
        expect(result).toEqual({ success: false, error: 'Пустой список фото.' });
    });

    it('rejects duplicate IDs', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        const result = await reorderServicePhotos(10, ['p1', 'p1']);
        expect(result).toEqual({ success: false, error: 'Дубликаты в порядке фото.' });
    });

    it('rejects reorder on another owner’s service', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue({ id: 1 } as any);
        mockPrisma.service.findUnique.mockResolvedValue({ id: 10, profile_id: 999 } as any);
        const result = await reorderServicePhotos(10, ['p1']);
        expect(result).toEqual({ success: false, error: 'Недостаточно прав.' });
    });

    it('rejects incomplete list (missing photo IDs)', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue({ id: 1 } as any);
        mockPrisma.service.findUnique.mockResolvedValue({ id: 10, profile_id: 1 } as any);
        mockPrisma.portfolioPhoto.findMany.mockResolvedValue([
            { id: 'p1' }, { id: 'p2' }, { id: 'p3' },
        ] as any);
        const result = await reorderServicePhotos(10, ['p1', 'p2']);
        expect(result).toEqual({ success: false, error: 'Неполный список фото.' });
    });

    it('reorders successfully', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue({ id: 1 } as any);
        mockPrisma.service.findUnique.mockResolvedValue({ id: 10, profile_id: 1 } as any);
        mockPrisma.portfolioPhoto.findMany.mockResolvedValue([
            { id: 'p1' }, { id: 'p2' },
        ] as any);
        mockPrisma.$transaction.mockResolvedValue([] as any);
        const result = await reorderServicePhotos(10, ['p2', 'p1']);
        expect(result).toEqual({ success: true });
    });
});

describe('deletePortfolioPhoto', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rejects unauthorized user (neither id nor email match)', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-A', email: 'a@e.com', role: 'USER', isBanned: false } } as any);
        mockPrisma.portfolioPhoto.findUnique.mockResolvedValue({
            id: 'p1',
            profile: { user_id: 'user-B', user_email: 'b@e.com' },
        } as any);
        const result = await deletePortfolioPhoto('p1');
        expect(result).toEqual({ success: false, error: 'Недостаточно прав.' });
    });

    it('allows owner by user_id', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockPrisma.portfolioPhoto.findUnique.mockResolvedValue({
            id: 'p1',
            profile: { user_id: 'user-A', user_email: 'other@e.com' },
        } as any);
        mockPrisma.portfolioPhoto.delete.mockResolvedValue({ id: 'p1' } as any);
        const result = await deletePortfolioPhoto('p1');
        expect(result).toEqual({ success: true });
    });

    it('allows owner by email when user_id is null', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockPrisma.portfolioPhoto.findUnique.mockResolvedValue({
            id: 'p1',
            profile: { user_id: null, user_email: 'userA@example.com' },
        } as any);
        mockPrisma.portfolioPhoto.delete.mockResolvedValue({ id: 'p1' } as any);
        const result = await deletePortfolioPhoto('p1');
        expect(result).toEqual({ success: true });
    });

    it('allows admin to delete any photo', async () => {
        mockAuth.mockResolvedValue({
            user: { id: 'admin-1', email: 'admin@e.com', role: 'ADMIN', isBanned: false },
        } as any);
        mockPrisma.portfolioPhoto.findUnique.mockResolvedValue({
            id: 'p1',
            profile: { user_id: 'other', user_email: 'other@e.com' },
        } as any);
        mockPrisma.portfolioPhoto.delete.mockResolvedValue({ id: 'p1' } as any);
        const result = await deletePortfolioPhoto('p1');
        expect(result).toEqual({ success: true });
    });

    it('returns 404-equivalent error when photo not found', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockPrisma.portfolioPhoto.findUnique.mockResolvedValue(null);
        const result = await deletePortfolioPhoto('nonexistent');
        expect(result).toEqual({ success: false, error: 'Фото не найдено.' });
    });
});
