import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ profileId: null }, { status: 401 });
    }

    if (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN') {
        return NextResponse.json({ profileId: null }, { status: 200 });
    }

    const profile = await prisma.profile.findFirst({
        where: {
            OR: [
                { user_id: session.user.id },
                ...(session.user.email ? [{ user_email: session.user.email }] : []),
            ],
        },
        select: { id: true, slug: true, user_id: true },
    });

    if (!profile) {
        return NextResponse.json({ profileId: null }, { status: 200 });
    }

    // Auto-link legacy profiles for stable future routing.
    if (!profile.user_id) {
        await prisma.profile.update({
            where: { id: profile.id },
            data: { user_id: session.user.id },
        });
    }

    return NextResponse.json({ profileId: profile.id, profileSlug: profile.slug }, { status: 200 });
}
