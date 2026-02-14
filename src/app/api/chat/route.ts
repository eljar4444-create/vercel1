import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const chats = await prisma.chat.findMany({
            where: {
                participants: {
                    some: {
                        userId: session.user.id
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: true
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        const requests = chats.map(chat => {
            const otherParticipant = chat.participants.find(p => p.userId !== session.user?.id)?.user;
            const lastMessage = chat.messages[0];

            return {
                id: chat.id,
                serviceTitle: 'Услуга', // Chat model doesn't link to service directly yet in schema, using placeholder
                lastMessage: lastMessage?.content || 'Нет сообщений',
                updatedAt: chat.updatedAt.toISOString(),
                interlocutor: {
                    name: otherParticipant?.name || 'Unknown',
                    image: otherParticipant?.image || null,
                    email: otherParticipant?.email || null
                }
            };
        });

        return NextResponse.json({ requests });
    } catch (error) {
        console.error('[CHATS_GET]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
