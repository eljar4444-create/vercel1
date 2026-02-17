import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Clock, Users, CheckCircle, XCircle, Inbox, ArrowLeft } from 'lucide-react';
import { BookingRow } from '@/components/dashboard/BookingRow';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
    params,
}: {
    params: { id: string };
}) {
    const profileId = parseInt(params.id, 10);
    if (isNaN(profileId)) notFound();

    // ─── Fetch master profile ───────────────────────────────────────
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { id: true, name: true, image_url: true },
    });

    if (!profile) notFound();

    // ─── Fetch bookings ─────────────────────────────────────────────
    const bookings = await prisma.booking.findMany({
        where: { profile_id: profileId },
        include: {
            service: {
                select: { id: true, title: true, price: true },
            },
        },
        orderBy: { date: 'desc' },
    });

    // ─── Stats ──────────────────────────────────────────────────────
    const totalBookings = bookings.length;
    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

    // ─── Serialize for client ───────────────────────────────────────
    const serializedBookings = bookings.map(b => ({
        id: b.id,
        date: b.date.toISOString(),
        time: b.time,
        user_name: b.user_name,
        user_phone: b.user_phone,
        status: b.status,
        created_at: b.created_at.toISOString(),
        service: b.service
            ? { id: b.service.id, title: b.service.title, price: `€${Number(b.service.price).toFixed(0)}` }
            : null,
    }));

    return (
        <div className="min-h-screen bg-gray-50/80">
            {/* ═══════════════════════════════════════════════════════ */}
            {/* HEADER                                                 */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 max-w-6xl py-8">
                    {/* Back link */}
                    <Link
                        href={`/profile/${profileId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Мой профиль
                    </Link>

                    {/* Title row */}
                    <div className="flex items-center gap-4">
                        {profile.image_url ? (
                            <img
                                src={profile.image_url}
                                alt={profile.name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-400">
                                {profile.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Привет, {profile.name.split(' ')[0]} 👋
                            </h1>
                            <p className="text-sm text-gray-400">Личный кабинет мастера</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* STATS CARDS                                            */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="container mx-auto px-4 max-w-6xl py-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <CalendarDays className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{totalBookings}</div>
                        <div className="text-sm text-gray-400">Всего заявок</div>
                    </div>

                    {/* Pending */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
                        <div className="text-sm text-gray-400">Ожидают подтверждения</div>
                    </div>

                    {/* Confirmed */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{confirmedCount}</div>
                        <div className="text-sm text-gray-400">Подтверждены</div>
                    </div>

                    {/* Cancelled */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-500" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{cancelledCount}</div>
                        <div className="text-sm text-gray-400">Отменены</div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* BOOKINGS LIST                                          */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="container mx-auto px-4 max-w-6xl pb-16">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Входящие записи</h2>
                    <span className="text-sm text-gray-400">{totalBookings} записей</span>
                </div>

                {serializedBookings.length > 0 ? (
                    <div className="space-y-3">
                        {serializedBookings.map((booking) => (
                            <BookingRow key={booking.id} booking={booking} />
                        ))}
                    </div>
                ) : (
                    /* ── Empty State ── */
                    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Inbox className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            У вас пока нет записей
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            Когда клиенты начнут бронировать ваши услуги, их заявки появятся здесь.
                        </p>
                        <Link
                            href={`/profile/${profileId}`}
                            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
                        >
                            Посмотреть профиль
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
