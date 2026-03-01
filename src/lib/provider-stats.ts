import prisma from '@/lib/prisma';
import { format, startOfDay, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

function formatDayLabel(d: Date): string {
    try {
        return format(d, 'd MMM', { locale: ru });
    } catch {
        return format(d, 'd MMM');
    }
}

export type ProviderStats = {
    totalRevenue: number;
    completedBookings: number;
    canceledBookings: number;
    uniqueClients: number;
};

/**
 * Агрегирует статистику по записям (Booking) мастера для дашборда аналитики.
 * totalRevenue — сумма стоимости услуг по завершённым визитам (status === 'completed').
 * Уникальные клиенты считаются по user_id (без null).
 */
export async function getProviderStats(providerId: number): Promise<ProviderStats> {
    const [completedBookings, canceledBookings, completedForRevenue, uniqueClientsResult] = await Promise.all([
        prisma.booking.count({
            where: { profile_id: providerId, status: 'completed' },
        }),
        prisma.booking.count({
            where: { profile_id: providerId, status: 'cancelled' },
        }),
        prisma.booking.findMany({
            where: { profile_id: providerId, status: 'completed' },
            select: { service_id: true, service: { select: { price: true } } },
        }),
        prisma.booking.groupBy({
            by: ['user_id'],
            where: {
                profile_id: providerId,
                user_id: { not: null },
            },
        }),
    ]);

    const totalRevenue = completedForRevenue.reduce((sum, b) => {
        const price = b.service?.price != null ? Number(b.service.price) : 0;
        return sum + price;
    }, 0);

    return {
        totalRevenue,
        completedBookings,
        canceledBookings,
        uniqueClients: uniqueClientsResult.length,
    };
}

export type TopServiceRow = {
    serviceId: number;
    serviceTitle: string;
    visitCount: number;
    revenue: number;
};

/**
 * Топ услуг по завершённым визитам: название, количество визитов, принесённый доход.
 * Группировка по service_id, только status === 'completed'.
 */
export async function getTopServices(providerId: number): Promise<TopServiceRow[]> {
    const completed = await prisma.booking.findMany({
        where: { profile_id: providerId, status: 'completed' },
        select: { service_id: true, service: { select: { id: true, title: true, price: true } } },
    });

    const byService = new Map<number, { title: string; count: number; revenue: number }>();

    for (const b of completed) {
        const id = b.service_id ?? 0;
        const title = b.service?.title ?? 'Без услуги';
        const price = b.service?.price != null ? Number(b.service.price) : 0;
        const prev = byService.get(id);
        if (prev) {
            prev.count += 1;
            prev.revenue += price;
        } else {
            byService.set(id, { title, count: 1, revenue: price });
        }
    }

    return Array.from(byService.entries())
        .map(([serviceId, { title, count, revenue }]) => ({
            serviceId,
            serviceTitle: title,
            visitCount: count,
            revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue);
}

export type RevenueByDayPoint = {
    date: string;   // ISO YYYY-MM-DD для сортировки/ключей
    dateLabel: string; // "25 Фев", "1 Мар" для подписи оси
    revenue: number;
};

/**
 * Доход по дням за последние N дней (по завершённым визитам).
 * Возвращает массив по одному пункту на день, с 0 для дней без записей.
 */
export async function getRevenueByDay(providerId: number, days: number = 14): Promise<RevenueByDayPoint[]> {
    const end = startOfDay(new Date());
    const start = subDays(end, days - 1);

    const completed = await prisma.booking.findMany({
        where: {
            profile_id: providerId,
            status: 'completed',
            date: { gte: start, lte: end },
        },
        select: { date: true, service: { select: { price: true } } },
    });

    const byDay = new Map<string, number>();
    for (const b of completed) {
        const dayKey = format(startOfDay(b.date), 'yyyy-MM-dd');
        const price = b.service?.price != null ? Number(b.service.price) : 0;
        byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + price);
    }

    const points: RevenueByDayPoint[] = [];
    for (let i = 0; i < days; i++) {
        const d = subDays(end, days - 1 - i);
        const dateKey = format(d, 'yyyy-MM-dd');
        points.push({
            date: dateKey,
            dateLabel: formatDayLabel(d),
            revenue: byDay.get(dateKey) ?? 0,
        });
    }
    return points;
}
