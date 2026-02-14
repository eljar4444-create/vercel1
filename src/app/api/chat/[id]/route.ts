import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const chat = await prisma.chat.findUnique({
            where: {
                id: params.id
            },
            include: {
                messages: {
                    include: {
                        sender: true
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!chat) {
            return new NextResponse("Chat not found", { status: 404 });
        }

        // Verify participant
        const isParticipant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: chat.id,
                    userId: session.user.id
                }
            }
        });

        if (!isParticipant) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        return NextResponse.json({ messages: chat.messages });
    } catch (error) {
        console.error('[CHAT_GET]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        const { content } = await req.json();

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!content) {
            return new NextResponse("Content missing", { status: 400 });
        }

        const chat = await prisma.chat.findUnique({
            where: { id: params.id },
            include: { participants: true }
        });

        if (!chat) {
            return new NextResponse("Chat not found", { status: 404 });
        }

        // Verify participant
        const isParticipant = chat.participants.some(p => p.userId === session.user?.id);
        if (!isParticipant) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const message = await prisma.message.create({
            data: {
                content,
                chatId: params.id,
                senderId: session.user.id
            },
            include: {
                sender: true
            }
        });

        await prisma.chat.update({
            where: { id: params.id },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error('[CHAT_POST]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
