import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    default: {
        profile: { findUnique: vi.fn(), update: vi.fn() }
    }
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/requireNotBanned', () => ({
    checkBanned: vi.fn((session) => session?.user?.isBanned ? { error: 'Ваш аккаунт заблокирован' } : null)
}));

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { approveMaster } from '@/app/admin/actions';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe('Admin actions - approveMaster', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects non-ADMIN roles', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'USER', isBanned: false } } as any);
        const formData = new FormData();
        formData.append('profile_id', '1');

        await expect(approveMaster(formData)).rejects.toThrow('Доступ запрещен');
    });

    it('rejects BANNED admin users', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'ADMIN', isBanned: true } } as any);
        const formData = new FormData();
        formData.append('profile_id', '1');

        await expect(approveMaster(formData)).rejects.toThrow('заблокирован');
    });

    it('fails if profile does not exist', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'ADMIN', isBanned: false } } as any);
        mockPrisma.profile.findUnique.mockResolvedValue(null);
        const formData = new FormData();
        formData.append('profile_id', '1');

        await expect(approveMaster(formData)).rejects.toThrow('Профиль не найден');
    });

    it('fails if profile status is DRAFT (State Machine)', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'ADMIN', isBanned: false } } as any);
        mockPrisma.profile.findUnique.mockResolvedValue({ id: 1, status: 'DRAFT' } as any);
        const formData = new FormData();
        formData.append('profile_id', '1');

        await expect(approveMaster(formData)).rejects.toThrow('Профиль не находится в статусе');
    });

    it('fails if profile status is SUSPENDED (State Machine)', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'ADMIN', isBanned: false } } as any);
        mockPrisma.profile.findUnique.mockResolvedValue({ id: 2, status: 'SUSPENDED' } as any);
        const formData = new FormData();
        formData.append('profile_id', '2');

        await expect(approveMaster(formData)).rejects.toThrow('статусе ожидания проверки');
    });

    it('successfully advances PENDING_REVIEW to PUBLISHED and sets is_verified to true', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'ADMIN', isBanned: false } } as any);
        mockPrisma.profile.findUnique.mockResolvedValue({ id: 3, status: 'PENDING_REVIEW' } as any);
        mockPrisma.profile.update.mockResolvedValue({ id: 3, status: 'PUBLISHED', slug: 'test' } as any);
        
        const formData = new FormData();
        formData.append('profile_id', '3');

        const result = await approveMaster(formData);
        
        expect(result.ok).toBe(true);
        expect(result.status).toBe('PUBLISHED');
        expect(mockPrisma.profile.update).toHaveBeenCalledWith({
            where: { id: 3 },
            data: { is_verified: true, status: 'PUBLISHED' },
            select: { slug: true, status: true }
        });
    });
});
