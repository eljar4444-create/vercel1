import { describe, it, expect, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ default: {} }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth-helpers', () => ({ requireProviderProfile: vi.fn() }));

import { auth } from '@/auth';
import { updateProfile } from '@/app/actions/updateProfile';

const mockAuth = vi.mocked(auth);

describe('updateProfile — banned user enforcement', () => {
    it('rejects banned providers', async () => {
        mockAuth.mockResolvedValue({ 
            user: { id: 'user-1', role: 'USER', isBanned: true } 
        } as any);

        const formData = new FormData();
        formData.append('profile_id', '1');
        formData.append('name', 'banned name');

        const result = await updateProfile(formData);
        expect(result).toEqual({ success: false, error: 'Ваш аккаунт заблокирован.' });
    });
});
