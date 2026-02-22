import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { findBookingsByUserId, buildBookingDateTime } from './lib';
import { MyBookingsView, type BookingItem } from '@/components/client/MyBookingsView';

export const dynamic = 'force-dynamic';

export default async function MyBookingsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/auth/login');
    }

    if (session.user.role !== 'CLIENT' && session.user.role !== 'ADMIN') {
        redirect('/');
    }

    const bookings = await findBookingsByUserId(session.user.id);
    const now = Date.now();

    const decorated: BookingItem[] = bookings.map((booking) => {
        const dateTime = buildBookingDateTime(booking.date, booking.time);
        const isFuture = dateTime.getTime() >= now;
        const isCancellable = isFuture && booking.status !== 'cancelled';
        const price = booking.service ? `€${Number(booking.service.price).toFixed(0)}` : '';

        return {
            id: booking.id,
            date: booking.date.toISOString(),
            time: booking.time,
            status: booking.status,
            user_name: booking.user_name,
            price,
            isFuture,
            isCancellable,
            profile: {
                id: booking.profile.id,
                name: booking.profile.name,
                city: booking.profile.city,
                image_url: booking.profile.image_url,
            },
            service: booking.service
                ? { id: booking.service.id, title: booking.service.title, price: Number(booking.service.price) }
                : null,
        };
    });

    const upcoming = decorated
        .filter((b) => b.isFuture && b.status !== 'cancelled')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const history = decorated
        .filter((b) => !b.isFuture || b.status === 'cancelled')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <section className="min-h-screen bg-gray-50 pb-12 pt-24">
            <div className="mx-auto w-full max-w-3xl px-4">
                <MyBookingsView upcoming={upcoming} history={history} />
            </div>
        </section>
    );
}
