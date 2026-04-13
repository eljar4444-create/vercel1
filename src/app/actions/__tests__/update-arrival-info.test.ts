import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth-helpers', () => ({
    requireProviderProfile: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
    default: {
        profile: { update: vi.fn() },
    },
}));
vi.mock('@/lib/server/public-upload', () => ({
    savePublicUpload: vi.fn(),
}));
vi.mock('@prisma/client', () => ({
    Prisma: { DbNull: Symbol('DbNull') },
}));

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { requireProviderProfile } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';
import { updateArrivalInfo } from '@/app/actions/portfolio-photos';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);
const mockRequireProfile = vi.mocked(requireProviderProfile);

function ownerSession() {
    return {
        user: { id: 'user-A', email: 'userA@example.com', role: 'USER', isBanned: false },
    } as any;
}

function privateMasterProfile() {
    return { id: 1, provider_type: 'PRIVATE' } as any;
}

function salonProfile() {
    return { id: 2, provider_type: 'SALON' } as any;
}

describe('updateArrivalInfo', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rejects unauthenticated requests', async () => {
        mockAuth.mockResolvedValue(null);
        const result = await updateArrivalInfo({ address: 'X' });
        expect(result).toEqual({ success: false, error: 'Требуется авторизация.' });
    });

    it('rejects banned users', async () => {
        mockAuth.mockResolvedValue({
            user: { id: 'u', email: 'e', role: 'USER', isBanned: true },
        } as any);
        const result = await updateArrivalInfo({ address: 'X' });
        expect(result).toEqual({ success: false, error: 'Ваш аккаунт заблокирован.' });
    });

    it('rejects when profile not found (non-owner)', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockRejectedValue(new Error('PROFILE_NOT_FOUND'));
        const result = await updateArrivalInfo({ address: 'X' });
        expect(result).toEqual({ success: false, error: 'Профиль не найден.' });
    });

    it('rejects Salon profiles', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue(salonProfile());
        const result = await updateArrivalInfo({ address: 'Hauptstr 1' });
        expect(result).toEqual({
            success: false,
            error: 'Информация о прибытии доступна только частным мастерам.',
        });
        expect(mockPrisma.profile.update).not.toHaveBeenCalled();
    });

    it('rejects missing/empty address', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue(privateMasterProfile());
        const result = await updateArrivalInfo({ address: '   ' });
        expect(result).toEqual({ success: false, error: 'Адрес обязателен.' });
        expect(mockPrisma.profile.update).not.toHaveBeenCalled();
    });

    it('rejects non-string optional fields', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue(privateMasterProfile());
        const result = await updateArrivalInfo({
            address: 'Hauptstr 1',
            doorCode: 1234 as any,
        });
        expect(result).toEqual({ success: false, error: 'Некорректный формат данных.' });
    });

    it('persists valid arrival info with full shape', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue(privateMasterProfile());
        mockPrisma.profile.update.mockResolvedValue({ id: 1 } as any);

        const result = await updateArrivalInfo({
            address: ' Hauptstr 1 ',
            doorCode: ' 1234 ',
            bellNote: 'Ring twice',
            waitingSpot: 'At the cafe',
        });

        expect(result).toEqual({ success: true });
        expect(mockPrisma.profile.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: {
                arrivalInfo: {
                    address: 'Hauptstr 1',
                    doorCode: '1234',
                    bellNote: 'Ring twice',
                    waitingSpot: 'At the cafe',
                },
            },
        });
    });

    it('strips unknown keys (JSON pollution guard)', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue(privateMasterProfile());
        mockPrisma.profile.update.mockResolvedValue({ id: 1 } as any);

        await updateArrivalInfo({
            address: 'Hauptstr 1',
            hackField: 'evil',
            __proto__: { foo: 'bar' },
        } as any);

        expect(mockPrisma.profile.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { arrivalInfo: { address: 'Hauptstr 1' } },
        });
    });

    it('drops empty optional fields', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue(privateMasterProfile());
        mockPrisma.profile.update.mockResolvedValue({ id: 1 } as any);

        await updateArrivalInfo({
            address: 'Hauptstr 1',
            doorCode: '   ',
            bellNote: '',
        });

        expect(mockPrisma.profile.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { arrivalInfo: { address: 'Hauptstr 1' } },
        });
    });

    it('clears arrival info when data is null (Prisma.DbNull)', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue(privateMasterProfile());
        mockPrisma.profile.update.mockResolvedValue({ id: 1 } as any);

        const result = await updateArrivalInfo(null);

        expect(result).toEqual({ success: true });
        expect(mockPrisma.profile.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { arrivalInfo: Prisma.DbNull },
        });
    });

    it('rejects non-object data shape', async () => {
        mockAuth.mockResolvedValue(ownerSession());
        mockRequireProfile.mockResolvedValue(privateMasterProfile());

        const result = await updateArrivalInfo('nope' as any);
        expect(result).toEqual({ success: false, error: 'Некорректный формат данных.' });
    });
});
