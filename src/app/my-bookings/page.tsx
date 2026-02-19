import Link from 'next/link';
import {
    CalendarClock,
    Clock3,
    UserRound,
    Scissors,
    Phone,
    CircleCheck,
    CircleX,
    History,
    Sparkles,
    LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CancelBookingForm } from '@/components/client/CancelBookingForm';
import { LinkLegacyBookingsForm } from '@/components/client/LinkLegacyBookingsForm';
import { logoutClientPortal } from './actions';
import { findBookingsByUserId, buildBookingDateTime } from './lib';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

function getStatusMeta(status: string) {
    if (status === 'confirmed') {
        return {
            label: 'Подтверждена',
            className: 'bg-green-50 text-green-700 border-green-200',
        };
    }
    if (status === 'cancelled') {
        return {
            label: 'Отменена',
            className: 'bg-red-50 text-red-700 border-red-200',
        };
    }
    return {
        label: 'Ожидает',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
    };
}

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

    const decorated = bookings.map((booking) => {
        const dateTime = buildBookingDateTime(booking.date, booking.time);
        const isFuture = dateTime.getTime() >= now;
        const isCancellable = isFuture && booking.status !== 'cancelled';
        const price = booking.service ? `€${Number(booking.service.price).toFixed(0)}` : 'По договоренности';

        return {
            ...booking,
            dateTime,
            isFuture,
            isCancellable,
            price,
        };
    });

    const upcoming = decorated
        .filter((b) => b.isFuture && b.status !== 'cancelled')
        .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    const history = decorated
        .filter((b) => !b.isFuture || b.status === 'cancelled')
        .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());

    return (
        <section className="min-h-screen bg-gray-50 px-4 py-5">
            <div className="mx-auto w-full max-w-3xl">
                <div className="rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-5 text-white shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-300">Client Portal</p>
                            <h1 className="mt-2 text-2xl font-extrabold">Мои записи</h1>
                            <p className="mt-1 text-sm text-gray-300">
                                Аккаунт: <span className="font-mono">{session.user.email}</span>
                            </p>
                        </div>
                        <form action={logoutClientPortal}>
                            <Button variant="outline" className="h-9 border-white/30 bg-white/10 text-white hover:bg-white/20">
                                <LogOut className="mr-1 h-4 w-4" />
                                Выйти
                            </Button>
                        </form>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-white/10 px-3 py-2">
                            <p className="text-[11px] text-gray-300">Предстоящие</p>
                            <p className="text-xl font-bold text-white">{upcoming.length}</p>
                        </div>
                        <div className="rounded-xl bg-white/10 px-3 py-2">
                            <p className="text-[11px] text-gray-300">История</p>
                            <p className="text-xl font-bold text-white">{history.length}</p>
                        </div>
                        <div className="rounded-xl bg-white/10 px-3 py-2">
                            <p className="text-[11px] text-gray-300">Всего</p>
                            <p className="text-xl font-bold text-[#fc0]">{bookings.length}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-6">
                    {bookings.length === 0 && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                                <CalendarClock className="h-7 w-7 text-gray-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Пока нет записей</h2>
                            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                                Когда вы выберете мастера и забронируете время, ваши визиты появятся здесь.
                            </p>
                            <Button asChild className="mt-5 bg-gray-900 text-white hover:bg-gray-800">
                                <Link href="/search">Найти мастера</Link>
                            </Button>
                        </div>
                    )}

                    <LinkLegacyBookingsForm />

                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <CalendarClock className="h-5 w-5 text-gray-700" />
                            <h2 className="text-lg font-bold text-gray-900">Предстоящие записи</h2>
                        </div>

                        {upcoming.length === 0 ? (
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">
                                Пока нет будущих визитов. Когда вы снова запишетесь, карточка появится здесь.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcoming.map((booking) => {
                                    const statusMeta = getStatusMeta(booking.status);
                                    return (
                                        <article key={booking.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-base font-semibold text-gray-900">{booking.profile.name}</p>
                                                    <p className="text-xs text-gray-500">{booking.profile.city}</p>
                                                </div>
                                                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                                                    {statusMeta.label}
                                                </span>
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700">
                                                <p className="flex items-center gap-2">
                                                    <Clock3 className="h-4 w-4 text-gray-400" />
                                                    {formatDate(booking.date)} в {booking.time}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <Scissors className="h-4 w-4 text-gray-400" />
                                                    {booking.service?.title || 'Услуга уточняется'} • {booking.price}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <UserRound className="h-4 w-4 text-gray-400" />
                                                    Клиент: {booking.user_name}
                                                </p>
                                            </div>

                                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                                <Button asChild className="h-9 bg-gray-900 text-white hover:bg-gray-800">
                                                    <Link href={`/profile/${booking.profile.id}`}>Записаться снова</Link>
                                                </Button>
                                                {booking.isCancellable && (
                                                    <CancelBookingForm bookingId={booking.id} />
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <History className="h-5 w-5 text-gray-700" />
                            <h2 className="text-lg font-bold text-gray-900">История посещений</h2>
                        </div>

                        {history.length === 0 ? (
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">
                                История пока пустая.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map((booking) => {
                                    const statusMeta = getStatusMeta(booking.status);
                                    return (
                                        <article key={booking.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-base font-semibold text-gray-900">{booking.profile.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDate(booking.date)} в {booking.time}
                                                    </p>
                                                </div>
                                                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                                                    {statusMeta.label}
                                                </span>
                                            </div>

                                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                                <span className="rounded-full bg-gray-100 px-2 py-1">
                                                    {booking.service?.title || 'Без услуги'}
                                                </span>
                                                <span className="rounded-full bg-gray-100 px-2 py-1">{booking.price}</span>
                                                <span className="rounded-full bg-gray-100 px-2 py-1">{booking.profile.city}</span>
                                            </div>

                                            <div className="mt-3">
                                                <Button asChild variant="outline" className="h-8">
                                                    <Link href={`/profile/${booking.profile.id}`}>
                                                        <Sparkles className="mr-1 h-3.5 w-3.5" />
                                                        Найти мастера снова
                                                    </Link>
                                                </Button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <p className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="h-3.5 w-3.5" />
                    Доступ к кабинету привязан к авторизованной учетной записи клиента.
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <CircleCheck className="h-3.5 w-3.5 text-green-600" />
                    <CircleX className="h-3.5 w-3.5 text-red-600" />
                    Предстоящие записи можно отменить до времени визита.
                </p>
            </div>
        </section>
    );
}
