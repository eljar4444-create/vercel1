import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    CalendarDays, Clock, Users, CheckCircle, XCircle,
    Inbox, ArrowLeft, Briefcase, ShieldCheck, AlertCircle, ListChecks
} from 'lucide-react';
import { BookingRow } from '@/components/dashboard/BookingRow';
import { ServiceList } from '@/components/dashboard/ServiceList';
import { AddServiceForm } from '@/components/dashboard/AddServiceForm';
import { AvatarUpload } from '@/components/dashboard/AvatarUpload';
import { EditProfileForm } from '@/components/dashboard/EditProfileForm';
import { WorkingHoursForm } from '@/components/dashboard/WorkingHoursForm';
import { parseSchedule } from '@/lib/scheduling';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
    params,
}: {
    params: { id: string };
}) {
    const profileId = parseInt(params.id, 10);
    if (isNaN(profileId)) notFound();

    const session = await auth();
    if (!session?.user) {
        redirect('/auth/login');
    }

    if (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN') {
        redirect('/');
    }

    // ─── Fetch master profile ───────────────────────────────────────
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: {
            id: true,
            user_id: true,
            user_email: true,
            name: true,
            image_url: true,
            bio: true,
            phone: true,
            city: true,
            address: true,
            is_verified: true,
            schedule: true,
        },
    });
    if (!profile) notFound();

    if (session.user.role !== 'ADMIN') {
        const ownsByUserId = profile.user_id && profile.user_id === session.user.id;
        const ownsByEmail = session.user.email && profile.user_email === session.user.email;

        if (!ownsByUserId && !ownsByEmail) {
            redirect('/');
        }

        // Auto-link legacy provider profiles to the authenticated user.
        if (!profile.user_id && session.user.id) {
            await prisma.profile.update({
                where: { id: profile.id },
                data: { user_id: session.user.id },
            });
            profile.user_id = session.user.id;
        }
    }
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

    // ─── Fetch services ─────────────────────────────────────────────
    const services = await prisma.service.findMany({
        where: { profile_id: profileId },
        orderBy: { title: 'asc' },
    });

    const workingSchedule = parseSchedule(profile.schedule);
    const hasServices = services.length > 0;
    const hasScheduleConfigured = Boolean(profile.schedule);
    const isProfileVerified = Boolean(profile.is_verified);

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

    const serializedServices = services.map(s => ({
        id: s.id,
        title: s.title,
        price: s.price.toString(),
        duration_min: s.duration_min,
    }));

    return (
        <div className="min-h-screen bg-gray-50/80">
            {/* ═══════════════════════════════════════════════════════ */}
            {/* HEADER                                                 */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 max-w-6xl py-8">
                    <Link
                        href={`/profile/${profileId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Мой профиль
                    </Link>

                    <AvatarUpload
                        profileId={profileId}
                        profileName={profile.name}
                        currentImageUrl={profile.image_url}
                    />
                    <div className="mt-4">
                        {isProfileVerified ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Профиль активен
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Ожидает проверки администратором
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* STATS CARDS                                            */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="container mx-auto px-4 max-w-6xl py-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <CalendarDays className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{totalBookings}</div>
                        <div className="text-sm text-gray-400">Всего заявок</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
                        <div className="text-sm text-gray-400">Ожидают подтверждения</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{confirmedCount}</div>
                        <div className="text-sm text-gray-400">Подтверждены</div>
                    </div>
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
            {/* MAIN CONTENT: Bookings + Services                      */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="container mx-auto px-4 max-w-6xl pb-16">
                {(!hasServices || !hasScheduleConfigured) && (
                    <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                                <ListChecks className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-sm font-bold text-blue-900">
                                    Завершите настройку профиля
                                </h2>
                                <p className="mt-1 text-xs text-blue-800/80">
                                    Это поможет клиентам быстрее находить вас и бронировать удобное время.
                                </p>
                                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                    <div className={`rounded-lg border px-3 py-2 ${hasServices ? 'border-green-200 bg-green-50 text-green-700' : 'border-blue-200 bg-white text-blue-900'}`}>
                                        {hasServices ? '✅' : '1.'} Добавьте услуги
                                    </div>
                                    <div className={`rounded-lg border px-3 py-2 ${hasScheduleConfigured ? 'border-green-200 bg-green-50 text-green-700' : 'border-blue-200 bg-white text-blue-900'}`}>
                                        {hasScheduleConfigured ? '✅' : '2.'} Укажите рабочие часы
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ── LEFT: Bookings ── */}
                    <div className="flex-1 min-w-0">
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
                            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Inbox className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    У вас пока нет записей
                                </h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-6">
                                    Как только клиент забронирует время, заявка появится здесь.
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

                    {/* ── RIGHT: Services + Edit Profile ── */}
                    <div className="w-full lg:w-[380px] flex-shrink-0">
                        <div className="lg:sticky lg:top-6 space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-gray-900">Мои услуги</h2>
                                        <p className="text-xs text-gray-400">{services.length} услуг</p>
                                    </div>
                                </div>

                                <ServiceList services={serializedServices} />
                                <AddServiceForm profileId={profileId} />
                            </div>

                            {/* ── Edit Profile ── */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                <h2 className="font-bold text-gray-900 mb-5">Редактировать профиль</h2>
                                <EditProfileForm profile={{
                                    id: profileId,
                                    name: profile.name,
                                    bio: profile.bio,
                                    phone: profile.phone,
                                    city: profile.city,
                                    address: profile.address,
                                }} />
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                <h2 className="font-bold text-gray-900 mb-1">Рабочие часы</h2>
                                <p className="mb-5 text-xs text-gray-500">
                                    Эти настройки используются для автоматического расчета свободных слотов в бронировании.
                                </p>
                                <WorkingHoursForm
                                    profileId={profileId}
                                    initialSchedule={{
                                        startTime: workingSchedule.startTime,
                                        endTime: workingSchedule.endTime,
                                        workingDays: workingSchedule.workingDays,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
