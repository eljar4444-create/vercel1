import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Chat models (Chat, ChatParticipant, Message) are not yet in the Prisma schema.
// Returning empty results until they are added.

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        return NextResponse.json({ requests: [] });
    } catch (error) {
        console.error('[CHATS_GET]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
