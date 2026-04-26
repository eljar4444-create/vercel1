import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ profileId: null, profileSlug: null, profileStatus: null }, { status: 401 });
    }

    const profile = await prisma.profile.findFirst({
        where: { user_id: session.user.id },
        select: { id: true, slug: true, status: true },
    });

    if (!profile) {
        return NextResponse.json({ profileId: null, profileSlug: null, profileStatus: null }, { status: 200 });
    }

    return NextResponse.json(
        { profileId: profile.id, profileSlug: profile.slug, profileStatus: profile.status },
        { status: 200 }
    );
}
