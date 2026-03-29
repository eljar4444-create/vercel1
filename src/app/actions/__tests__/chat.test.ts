import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
    default: {
        profile: { findUnique: vi.fn() },
        conversation: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
        message: { create: vi.fn() },
    },
}));

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { startConversationWithProvider, sendMessage } from '@/app/actions/chat';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe('chat actions — banned user enforcement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects banned users when starting a conversation', async () => {
        mockAuth.mockResolvedValue({ 
            user: { id: 'user-1', role: 'USER', isBanned: true } 
        } as any);

        const result = await startConversationWithProvider(1);
        expect(result).toEqual({ success: false, error: 'Ваш аккаунт заблокирован.' });
    });

    it('rejects banned users from sending messages', async () => {
        mockAuth.mockResolvedValue({ 
            user: { id: 'user-1', role: 'USER', isBanned: true } 
        } as any);

        const formData = new FormData();
        formData.append('conversationId', 'conv-1');
        formData.append('content', 'Hello!');

        await sendMessage(formData);

        expect(mockPrisma.message.create).not.toHaveBeenCalled();
    });
});

describe('chat actions — boundaries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('slices message content to 5000 characters', async () => {
        mockAuth.mockResolvedValue({ 
            user: { id: 'user-1', role: 'USER', isBanned: false } 
        } as any);

        mockPrisma.conversation.findUnique.mockResolvedValue({
            clientUserId: 'user-1',
            providerProfile: { user_id: 'provider-1', user_email: null }
        } as any);

        const longContent = 'A'.repeat(6000);
        const expectedContent = 'A'.repeat(5000);

        const formData = new FormData();
        formData.append('conversationId', 'conv-1');
        formData.append('content', longContent);

        await sendMessage(formData);

        expect(mockPrisma.message.create).toHaveBeenCalledWith({
            data: {
                conversationId: 'conv-1',
                senderUserId: 'user-1',
                content: expectedContent,
            }
        });
    });
});
