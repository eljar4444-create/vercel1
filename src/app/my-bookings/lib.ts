import prisma from '@/lib/prisma';

export function buildBookingDateTime(date: Date, time: string) {
    const [h, m] = time.split(':').map((v) => Number(v));
    const dt = new Date(date);
    dt.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
    return dt;
}

export async function findBookingsByUserId(userId: string) {
    return prisma.booking.findMany({
        where: { user_id: userId },
        include: {
            profile: {
                select: { id: true, name: true, city: true },
            },
            service: {
                select: { id: true, title: true, price: true },
            },
        },
        orderBy: [{ date: 'desc' }, { time: 'desc' }],
        take: 200,
    });
}
