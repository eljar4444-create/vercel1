import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProfileClient } from '@/components/ProfileClient';
import { parseSchedule, timeToMinutes, minutesToTime } from '@/lib/scheduling';

export const dynamic = 'force-dynamic';

export default async function ProfileDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const profileId = parseInt(params.id, 10);
    if (isNaN(profileId)) notFound();
    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeStart.getDate() + 14);

    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: {
            category: true,
            services: true,
            schedule: true,
            bookings: {
                where: {
                    status: { in: ['pending', 'confirmed'] },
                    date: {
                        gte: rangeStart,
                        lt: rangeEnd,
                    },
                },
                select: {
                    date: true,
                    time: true,
                    service: {
                        select: { duration_min: true },
                    },
                },
            },
        },
    });

    if (!profile) notFound();

    const normalizeDuration = (duration?: number) => {
        if (!duration || !Number.isFinite(duration)) return 60;
        return Math.max(15, Math.min(240, Math.floor(duration)));
    };

    const getNextAvailableSlot = () => {
        const schedule = parseSchedule(profile.schedule);
        const baseDuration = normalizeDuration(
            profile.services.length
                ? Math.min(...profile.services.map((service) => service.duration_min))
                : 60
        );
        for (let offset = 0; offset < 14; offset += 1) {
            const date = new Date(now);
            date.setHours(0, 0, 0, 0);
            date.setDate(now.getDate() + offset);

            const weekday = date.getDay();
            if (!schedule.workingDays.includes(weekday)) continue;

            const dateKey = date.toISOString().slice(0, 10);
            const dayBookings = profile.bookings.filter(
                (booking) => booking.date.toISOString().slice(0, 10) === dateKey
            );

            const workStartMin = timeToMinutes(schedule.startTime);
            const workEndMin = timeToMinutes(schedule.endTime);
            if (workEndMin <= workStartMin) continue;

            const busyIntervals = dayBookings.map((booking) => {
                const start = timeToMinutes(booking.time);
                const end = start + normalizeDuration(booking.service?.duration_min ?? baseDuration);
                return { start, end };
            });

            for (let slotStart = workStartMin; slotStart + baseDuration <= workEndMin; slotStart += baseDuration) {
                const slotEnd = slotStart + baseDuration;
                const overlaps = busyIntervals.some((busy) => slotStart < busy.end && slotEnd > busy.start);
                if (overlaps) continue;

                const time = minutesToTime(slotStart);
                const isToday = offset === 0;
                const isTomorrow = offset === 1;

                if (isToday) return `Сегодня в ${time}`;
                if (isTomorrow) return `Завтра в ${time}`;

                const dateLabel = new Intl.DateTimeFormat('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                }).format(date);
                return `${dateLabel} в ${time}`;
            }
        }

        return null;
    };

    const nextAvailableLabel = getNextAvailableSlot();

    // Serialize for client component (Decimal → string, Date → string)
    const serialized = {
        id: profile.id,
        name: profile.name,
        city: profile.city,
        address: profile.address,
        image_url: profile.image_url,
        bio: profile.bio,
        phone: profile.phone,
        is_verified: profile.is_verified,
        created_at: profile.created_at.toISOString(),
        attributes: profile.attributes,
        category: profile.category
            ? { id: profile.category.id, name: profile.category.name, slug: profile.category.slug }
            : null,
        services: profile.services.map(s => ({
            id: s.id,
            title: s.title,
            price: s.price.toString(),
            duration_min: s.duration_min,
        })),
    };

    return <ProfileClient profile={serialized} nextAvailableLabel={nextAvailableLabel} />;
}
