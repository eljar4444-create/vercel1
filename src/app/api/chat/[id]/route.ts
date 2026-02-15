import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Chat models (Chat, ChatParticipant, Message) are not yet in the Prisma schema.
// Returning stub responses until they are added.

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        return NextResponse.json({ messages: [] });
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
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        return new NextResponse("Chat not implemented yet", { status: 501 });
    } catch (error) {
        console.error('[CHAT_POST]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
