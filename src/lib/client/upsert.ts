import type { Prisma, PrismaClient } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;

export function normalizePhone(phone: string): string {
    return phone.replace(/[\s()\-]/g, '').trim();
}

/**
 * Called when a new booking is created (manual or online).
 * Creates the Client row if it doesn't exist, increments totalBookings.
 * Does NOT touch totalSpent / lastVisit / noShows — those move on status transitions.
 */
export async function upsertClientOnBookingCreated(
    db: Db,
    params: { profileId: number; name: string; phone: string },
): Promise<void> {
    const phone = normalizePhone(params.phone);
    if (!phone) return;

    await db.client.upsert({
        where: { profileId_phone: { profileId: params.profileId, phone } },
        create: {
            profileId: params.profileId,
            name: params.name,
            phone,
            totalBookings: 1,
        },
        update: {
            totalBookings: { increment: 1 },
            name: params.name,
        },
    });
}

/**
 * Called when a booking transitions to COMPLETED.
 * Adds spend and updates lastVisit.
 */
export async function recordClientVisit(
    db: Db,
    params: {
        profileId: number;
        phone: string;
        amount: Prisma.Decimal | number | string;
        visitDate: Date;
    },
): Promise<void> {
    const phone = normalizePhone(params.phone);
    if (!phone) return;

    await db.client.updateMany({
        where: { profileId: params.profileId, phone },
        data: {
            totalSpent: { increment: params.amount as any },
            lastVisit: params.visitDate,
        },
    });
}

/**
 * Called when a booking transitions to NO_SHOW.
 */
export async function recordClientNoShow(
    db: Db,
    params: { profileId: number; phone: string },
): Promise<void> {
    const phone = normalizePhone(params.phone);
    if (!phone) return;

    await db.client.updateMany({
        where: { profileId: params.profileId, phone },
        data: { noShows: { increment: 1 } },
    });
}
