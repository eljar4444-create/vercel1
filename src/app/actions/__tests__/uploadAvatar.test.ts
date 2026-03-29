import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    default: {
        profile: { findUnique: vi.fn(), update: vi.fn() }
    }
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/server/public-upload', () => ({
    savePublicUpload: vi.fn().mockResolvedValue({ url: 'http://example.com/avatar.jpg' })
}));

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { uploadAvatar } from '@/app/actions/uploadAvatar';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe('uploadAvatar actions — Attack Mitigation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects upload when profile does not belong to user (neither id nor email)', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-A', email: 'userA@example.com', role: 'USER', isBanned: false } } as any);
        mockPrisma.profile.findUnique.mockResolvedValue({ 
            id: 1, user_id: 'user-B', user_email: 'userB@example.com' 
        } as any);

        const formData = new FormData();
        formData.append('profile_id', '1');
        const file = new File([''], 'test.png', { type: 'image/png' });
        Object.defineProperty(file, 'size', { value: 1024 });
        formData.append('file', file);

        const result = await uploadAvatar(formData);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Ошибка при загрузке файла.');
    });

    it('allows upload when profile matches user_email but not user_id', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-A', email: 'userA@example.com', role: 'USER', isBanned: false } } as any);
        mockPrisma.profile.findUnique.mockResolvedValue({ 
            id: 1, user_id: null, user_email: 'userA@example.com', slug: 'test'
        } as any);
        mockPrisma.profile.update.mockResolvedValue({ slug: 'test' } as any);

        const formData = new FormData();
        formData.append('profile_id', '1');
        const file = new File([''], 'test.png', { type: 'image/png' });
        Object.defineProperty(file, 'size', { value: 1024 });
        formData.append('file', file);

        const result = await uploadAvatar(formData);
        expect(result.success).toBe(true);
        expect(result.url).toBe('http://example.com/avatar.jpg');
    });
});
