'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

type ChatRole = 'CLIENT' | 'PROVIDER' | 'ADMIN';

function roleOrNull(role?: string): ChatRole | null {
    if (role === 'CLIENT' || role === 'PROVIDER' || role === 'ADMIN') return role;
    return null;
}

function providerOwnershipFilter(userId: string, email?: string | null) {
    return {
        OR: [
            { user_id: userId },
            ...(email ? [{ user_email: email }] : []),
        ],
    };
}

async function getAuthorizedUser() {
    const session = await auth();
    const userId = session?.user?.id;
    const role = roleOrNull(session?.user?.role);

    if (!userId || !role) {
        return null;
    }

    return {
        userId,
        role,
        email: session?.user?.email ?? null,
    };
}

async function hasConversationAccess(conversationId: string, userId: string, role: ChatRole, email?: string | null) {
    if (role === 'ADMIN') return true;

    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: {
            clientUserId: true,
            providerProfile: {
                select: { user_id: true, user_email: true },
            },
        },
    });

    if (!conversation) return false;
    if (role === 'CLIENT') return conversation.clientUserId === userId;

    const ownsById = conversation.providerProfile.user_id === userId;
    const ownsByEmail = Boolean(email) && conversation.providerProfile.user_email === email;
    return ownsById || ownsByEmail;
}

export async function startConversationWithProvider(providerProfileId: number) {
    const user = await getAuthorizedUser();
    if (!user) return { success: false, error: 'Требуется вход в аккаунт' };

    if (user.role !== 'CLIENT' && user.role !== 'ADMIN') {
        return { success: false, error: 'Чат с мастером доступен клиентам' };
    }

    const profile = await prisma.profile.findUnique({
        where: { id: providerProfileId },
        select: { id: true },
    });
    if (!profile) return { success: false, error: 'Профиль мастера не найден' };

    const conversation = await prisma.conversation.upsert({
        where: {
            clientUserId_providerProfileId: {
                clientUserId: user.userId,
                providerProfileId,
            },
        },
        create: {
            clientUserId: user.userId,
            providerProfileId,
        },
        update: {},
        select: { id: true },
    });

    revalidatePath('/chat');
    return { success: true, conversationId: conversation.id };
}

export async function getMyConversations() {
    const user = await getAuthorizedUser();
    if (!user) return { success: false, conversations: [] as any[] };

    const where =
        user.role === 'CLIENT'
            ? { clientUserId: user.userId }
            : user.role === 'PROVIDER'
                ? { providerProfile: providerOwnershipFilter(user.userId, user.email) }
                : {};

    const conversations = await prisma.conversation.findMany({
        where,
        include: {
            clientUser: {
                select: { id: true, name: true, image: true, email: true },
            },
            providerProfile: {
                select: { id: true, name: true, image_url: true, city: true, user_email: true },
            },
            messages: {
                select: { id: true, content: true, createdAt: true, senderUserId: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { updatedAt: 'desc' },
    });

    return {
        success: true,
        conversations: conversations.map((conversation) => ({
            id: conversation.id,
            updatedAt: conversation.updatedAt.toISOString(),
            lastMessage: conversation.messages[0]?.content || 'Диалог создан',
            lastMessageAt: conversation.messages[0]?.createdAt?.toISOString() || conversation.updatedAt.toISOString(),
            interlocutor:
                user.role === 'CLIENT'
                    ? {
                        name: conversation.providerProfile.name,
                        image: conversation.providerProfile.image_url,
                        subtitle: conversation.providerProfile.city,
                    }
                    : {
                        name: conversation.clientUser.name || conversation.clientUser.email || 'Клиент',
                        image: conversation.clientUser.image,
                        subtitle: conversation.clientUser.email,
                    },
        })),
    };
}

export async function getConversationMessages(conversationId: string) {
    const user = await getAuthorizedUser();
    if (!user) return { success: false, messages: [] as any[] };

    const allowed = await hasConversationAccess(conversationId, user.userId, user.role, user.email);
    if (!allowed) return { success: false, messages: [] as any[] };

    const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
            senderUser: { select: { id: true, name: true, image: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 300,
    });

    await prisma.message.updateMany({
        where: {
            conversationId,
            senderUserId: { not: user.userId },
            isRead: false,
        },
        data: { isRead: true },
    });

    return {
        success: true,
        messages: messages.map((message) => ({
            id: message.id,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
            senderId: message.senderUserId,
            isRead: message.isRead,
            sender: {
                id: message.senderUser.id,
                name: message.senderUser.name,
                image: message.senderUser.image,
                email: message.senderUser.email,
            },
        })),
    };
}

export async function sendMessage(formData: FormData): Promise<void> {
    const user = await getAuthorizedUser();
    if (!user) return;

    const conversationId = String(formData.get('conversationId') || '');
    const content = String(formData.get('content') || '').trim();
    if (!conversationId || !content) return;

    const allowed = await hasConversationAccess(conversationId, user.userId, user.role, user.email);
    if (!allowed) return;

    await prisma.message.create({
        data: {
            conversationId,
            senderUserId: user.userId,
            content,
        },
    });

    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
    });

    revalidatePath('/chat');
    revalidatePath(`/chat/${conversationId}`);
}
