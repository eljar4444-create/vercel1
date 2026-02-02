import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { requestId: string } }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { requestId } = params;

    try {
        const messages = await prisma.chatMessage.findMany({
            where: { requestId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        const request = await prisma.request.findUnique({
            where: { id: requestId },
            select: {
                message: true,
                createdAt: true,
                clientId: true,
                client: {
                    select: { id: true, name: true, image: true }
                }
            }
        })

        let allMessages = [...messages];

        // Include the initial request message as the first message
        if (request && request.message) {
            const initialMessage = {
                id: `initial-${requestId}`,
                content: request.message,
                senderId: request.clientId,
                requestId: requestId,
                createdAt: request.createdAt,
                sender: request.client
            };
            allMessages = [initialMessage, ...messages];
        }

        return NextResponse.json({ messages: allMessages });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { requestId: string } }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { requestId } = params;
    const { content } = await req.json();

    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    try {
        const message = await prisma.chatMessage.create({
            data: {
                content,
                requestId,
                senderId: session.user.id
            }
        });

        // Update request timestamp for sorting
        await prisma.request.update({
            where: { id: requestId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({ message });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
