import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { DashboardView } from '@/components/client/DashboardView';

export const dynamic = 'force-dynamic';

function buildBookingDateTime(date: Date, time: string) {
    const [h, m] = time.split(':').map((v) => Number(v));
    const dt = new Date(date);
    dt.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
    return dt;
}

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/auth/login');
    }

    const isClient = session.user.role === 'CLIENT' || session.user.role === 'ADMIN';

    if (!isClient) {
        const providerProfile = await prisma.profile.findFirst({
            where: {
                OR: [
                    { user_id: session.user.id },
                    ...(session.user.email ? [{ user_email: session.user.email }] : []),
                ],
            },
            select: { id: true },
        });

        if (providerProfile) {
            redirect(`/dashboard/${providerProfile.id}`);
        }
        redirect('/provider/onboarding');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) {
        return <div>User not found</div>;
    }

    const rawBookings = await prisma.booking.findMany({
        where: { user_id: session.user.id },
        include: {
            profile: {
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    city: true,
                    address: true,
                    image_url: true,
                    phone: true,
                    category: {
                        select: { name: true, icon: true }
                    }
                }
            },
            service: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                    duration_min: true
                }
            }
        },
        orderBy: [{ date: 'desc' }, { time: 'desc' }],
        take: 200,
    });

    const now = Date.now();
    const bookings = rawBookings.map((booking) => {
        const dateTime = buildBookingDateTime(booking.date, booking.time);
        const isFuture = dateTime.getTime() >= now;
        const isCancellable = isFuture && booking.status !== 'cancelled';

        return {
            id: booking.id,
            date: booking.date.toISOString(),
            time: booking.time,
            status: booking.status,
            isFuture,
            isCancellable,
            profile: booking.profile,
            service: booking.service ? {
                ...booking.service,
                price: Number(booking.service.price)
            } : null,
        };
    });

    const upcoming = bookings
        .filter((b) => b.isFuture && b.status !== 'cancelled')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const history = bookings
        .filter((b) => !b.isFuture || b.status === 'cancelled')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalBookings = rawBookings.length;

    const categoryCounts: Record<string, number> = {};
    for (const b of rawBookings) {
        if (b.profile.category) {
            categoryCounts[b.profile.category.name] = (categoryCounts[b.profile.category.name] || 0) + 1;
        }
    }
    let favoriteCategory = null;
    let maxCount = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
        if (count > maxCount) {
            maxCount = count;
            favoriteCategory = cat;
        }
    }

    const recommendedCategories = rawBookings.length === 0 ? await prisma.category.findMany({
        take: 6,
        select: { id: true, name: true, slug: true, icon: true }
    }) : [];

    const favoriteProfiles = await prisma.favorite.findMany({
        where: { clientId: session.user.id },
        include: {
            provider: {
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    city: true,
                    image_url: true,
                },
            },
        },
    }).then((rows) =>
        rows.map((r) => ({
            id: r.provider.id,
            slug: r.provider.slug,
            name: r.provider.name,
            city: r.provider.city,
            image_url: r.provider.image_url,
        }))
    );

    return (
        <section className="min-h-screen bg-gray-50 pb-12 pt-24">
            <div className="mx-auto w-full max-w-6xl px-4 lg:px-8">
                <DashboardView
                    user={user}
                    upcoming={upcoming}
                    history={history}
                    stats={{ totalBookings, favoriteCategory }}
                    recommendedCategories={recommendedCategories}
                    favoriteProfiles={favoriteProfiles}
                />
            </div>
        </section>
    );
}
