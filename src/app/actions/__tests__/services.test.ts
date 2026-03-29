import { describe, it, expect, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ default: {} }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@/auth';
import { addService, updateService, deleteService } from '@/app/actions/services';

const mockAuth = vi.mocked(auth);

describe('services actions — banned user enforcement', () => {
    it('rejects banned providers on addService', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1', isBanned: true } } as any);
        const result = await addService(new FormData());
        expect(result).toEqual({ success: false, error: 'Ваш аккаунт заблокирован.' });
    });

    it('rejects banned providers on updateService', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1', isBanned: true } } as any);
        const result = await updateService('1', null, new FormData());
        expect(result).toEqual({ message: 'Ваш аккаунт заблокирован.' });
    });

    it('rejects banned providers on deleteService', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1', isBanned: true } } as any);
        const result = await deleteService(1);
        expect(result).toEqual({ success: false, error: 'Ваш аккаунт заблокирован.' });
    });
});
