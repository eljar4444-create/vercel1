import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

const ReplySchema = z.object({
    replyText: z.string().trim().min(1, 'Ответ не может быть пустым').max(2000),
});

async function getOwnedReview(reviewId: string, userId: string) {
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: {
            id: true,
            profile: { select: { id: true, user_id: true } },
        },
    });
    if (!review) return null;

    const ownsByUserId = review.profile.user_id && review.profile.user_id === userId;
    if (!ownsByUserId) return 'forbidden' as const;

    return review;
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } },
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.isBanned) {
        return NextResponse.json({ error: 'Ваш аккаунт заблокирован.' }, { status: 403 });
    }

    const owned = await getOwnedReview(params.id, session.user.id);
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (owned === 'forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 });
    }

    const parsed = ReplySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? 'Некорректные данные' },
            { status: 400 },
        );
    }

    const updated = await prisma.review.update({
        where: { id: params.id },
        data: {
            replyText: parsed.data.replyText,
            repliedAt: new Date(),
        },
        select: { id: true, replyText: true, repliedAt: true },
    });

    return NextResponse.json({
        success: true,
        review: {
            id: updated.id,
            replyText: updated.replyText,
            repliedAt: updated.repliedAt?.toISOString() ?? null,
        },
    });
}

export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } },
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const owned = await getOwnedReview(params.id, session.user.id);
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (owned === 'forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.review.update({
        where: { id: params.id },
        data: { replyText: null, repliedAt: null },
    });

    return NextResponse.json({ success: true });
}
