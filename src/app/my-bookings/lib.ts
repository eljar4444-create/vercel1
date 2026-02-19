import prisma from '@/lib/prisma';

export function buildBookingDateTime(date: Date, time: string) {
    const [h, m] = time.split(':').map((v) => Number(v));
    const dt = new Date(date);
    dt.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
    return dt;
}

export function normalizePhone(phone: string) {
    return phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
}

function getLastDigits(phone: string, count = 4) {
    const digits = phone.replace(/\D/g, '');
    return digits.slice(-count);
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

export async function findLegacyBookingsByPhone(phoneInput: string) {
    const normalized = normalizePhone(phoneInput);
    const last4 = getLastDigits(normalized);

    if (normalized.length < 6 || last4.length < 4) {
        return [];
    }

    const candidates = await prisma.booking.findMany({
        where: {
            user_id: null,
            OR: [
                { user_phone: phoneInput.trim() },
                { user_phone: normalized },
                { user_phone: { contains: last4 } },
            ],
        },
        select: { id: true, user_phone: true },
        take: 300,
    });

    return candidates.filter((booking) => normalizePhone(booking.user_phone) === normalized);
}
