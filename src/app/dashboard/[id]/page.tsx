import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    CalendarDays, Clock, CheckCircle, XCircle,
    Inbox, ArrowLeft, Briefcase, ShieldCheck, AlertCircle, ListChecks, Eye, UserCircle2
} from 'lucide-react';
import { BookingRow } from '@/components/dashboard/BookingRow';
import { ServiceList } from '@/components/dashboard/ServiceList';
import { AddServiceForm } from '@/components/dashboard/AddServiceForm';
import { AvatarUpload } from '@/components/dashboard/AvatarUpload';
import { EditProfileForm } from '@/components/dashboard/EditProfileForm';
import { WorkingHoursForm } from '@/components/dashboard/WorkingHoursForm';
import { parseSchedule } from '@/lib/scheduling';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
    params,
    searchParams,
}: {
    params: { id: string };
    searchParams?: { section?: string };
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
            provider_type: true,
            image_url: true,
            bio: true,
            phone: true,
            city: true,
            address: true,
            is_verified: true,
            schedule: true,
            category: {
                select: {
                    name: true,
                    slug: true,
                },
            },
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
    const setupCompletedSteps = Number(hasServices) + Number(hasScheduleConfigured);
    const setupProgressPercent = Math.round((setupCompletedSteps / 2) * 100);
    const currentSection =
        searchParams?.section === 'services' ||
        searchParams?.section === 'schedule' ||
        searchParams?.section === 'profile'
            ? searchParams.section
            : 'bookings';

    // ─── Serialize for client ───────────────────────────────────────
    const serializedBookings = bookings.map(b => ({
        id: b.id,
        date: b.date.toISOString(),
        time: b.time,
        user_id: b.user_id,
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
        description: s.description,
        images: s.images,
        price: s.price.toString(),
        duration_min: s.duration_min,
    }));

    const navItems = [
        { key: 'bookings', label: 'Записи', icon: Inbox },
        { key: 'services', label: 'Услуги', icon: Briefcase },
        { key: 'schedule', label: 'Расписание', icon: Clock },
        { key: 'profile', label: 'Профиль', icon: UserCircle2 },
    ] as const;

    return (
        <div className="relative min-h-screen overflow-hidden bg-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.22),transparent_42%),radial-gradient(circle_at_top_left,rgba(244,114,182,0.16),transparent_35%)]" />
            <div className="relative mx-auto flex w-full max-w-7xl gap-6 px-4 pb-24 pt-6 md:pb-8">
                <aside className="sticky top-6 hidden h-fit w-64 shrink-0 md:block">
                    <div className="rounded-[2rem] border border-white/50 bg-white/75 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-md ring-1 ring-slate-900/5">
                        <div className="mb-3 px-2 pb-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">svoi.de</p>
                            <h2 className="mt-1 text-lg font-semibold text-slate-900">Provider Cockpit</h2>
                        </div>
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentSection === item.key;
                                return (
                                    <Link
                                        key={item.key}
                                        href={`/dashboard/${profileId}?section=${item.key}`}
                                        className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                                            isActive
                                                ? 'bg-slate-900/6 text-slate-900'
                                                : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-900'
                                        }`}
                                    >
                                        {isActive ? <span className="absolute left-0 top-2 h-7 w-1 rounded-r-full bg-slate-900/70" /> : null}
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                <main className="min-w-0 flex-1 space-y-5">
                    <Link
                        href={`/profile/${profileId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Мой профиль
                    </Link>

                    <div className="flex flex-col gap-4 rounded-[2rem] border border-white/50 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-md ring-1 ring-slate-900/5 md:flex-row md:items-start md:justify-between">
                        <div>
                            <AvatarUpload
                                profileId={profileId}
                                profileName={profile.name}
                                currentImageUrl={profile.image_url}
                            />
                            <div className="mt-3">
                                {isProfileVerified ? (
                                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
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

                        <Link
                            href={`/profile/${profileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-900"
                        >
                            <Eye className="h-4 w-4" />
                            Посмотреть профиль
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        <div className="rounded-[1.5rem] border border-white/50 bg-white/80 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-md ring-1 ring-slate-900/5">
                            <div className="mb-2 flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100">
                                    <CalendarDays className="h-4 w-4 text-blue-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{totalBookings}</div>
                            <div className="text-xs text-slate-500">Всего заявок</div>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/50 bg-white/80 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-md ring-1 ring-slate-900/5">
                            <div className="mb-2 flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
                            <div className="text-xs text-slate-500">Ожидают</div>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/50 bg-white/80 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-md ring-1 ring-slate-900/5">
                            <div className="mb-2 flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-green-100">
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{confirmedCount}</div>
                            <div className="text-xs text-slate-500">Подтверждены</div>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/50 bg-white/80 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-md ring-1 ring-slate-900/5">
                            <div className="mb-2 flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-rose-100">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{cancelledCount}</div>
                            <div className="text-xs text-slate-500">Отменены</div>
                        </div>
                    </div>

                    {(!hasServices || !hasScheduleConfigured) && (
                        <div className="rounded-[2rem] border border-white/50 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-md ring-1 ring-slate-900/5">
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
                                    <ListChecks className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className="text-sm font-semibold text-slate-900">Ваш прогресс</h2>
                                        <span className="text-xs font-medium text-slate-500">{setupProgressPercent}% готово</span>
                                    </div>
                                    <div className="mt-2 h-2 rounded-full bg-slate-200/70">
                                        <div
                                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                                            style={{ width: `${setupProgressPercent}%` }}
                                        />
                                    </div>
                                    <div className="mt-3 space-y-2 text-sm">
                                        <Link
                                            href={`/dashboard/${profileId}?section=services`}
                                            className={`block rounded-lg px-2 py-1 transition ${
                                                hasServices ? 'text-emerald-700' : 'text-slate-700 hover:bg-slate-100/60'
                                            }`}
                                        >
                                            {hasServices ? '✅' : '○'} Добавьте услуги
                                        </Link>
                                        <Link
                                            href={`/dashboard/${profileId}?section=schedule`}
                                            className={`block rounded-lg px-2 py-1 transition ${
                                                hasScheduleConfigured ? 'text-emerald-700' : 'text-slate-700 hover:bg-slate-100/60'
                                            }`}
                                        >
                                            {hasScheduleConfigured ? '✅' : '○'} Укажите рабочие часы
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentSection === 'bookings' && (
                        <div className="rounded-[2rem] border border-white/50 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-md ring-1 ring-slate-900/5">
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                                <h2 className="text-lg font-semibold text-slate-900">Входящие записи</h2>
                                <span className="text-sm text-slate-500">{totalBookings} записей</span>
                            </div>
                            <div className="p-5">
                                {serializedBookings.length > 0 ? (
                                    <div className="space-y-3">
                                        {serializedBookings.map((booking) => (
                                            <BookingRow key={booking.id} booking={booking} providerId={profileId} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center">
                                        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-white">
                                            <Inbox className="h-12 w-12 text-slate-400" />
                                        </div>
                                        <h3 className="mb-2 text-xl font-semibold text-slate-900">У вас пока нет записей</h3>
                                        <p className="mx-auto mb-6 max-w-md text-slate-500">
                                            Поделитесь ссылкой на профиль, чтобы клиенты начали бронировать услуги.
                                        </p>
                                        <Button asChild className="bg-slate-900 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_10px_30px_rgba(15,23,42,0.22)] hover:bg-slate-800">
                                            <Link href={`/profile/${profileId}`} target="_blank" rel="noopener noreferrer">
                                                Поделиться ссылкой на профиль
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentSection === 'services' && (
                        <div className="rounded-[2rem] border border-white/50 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-md ring-1 ring-slate-900/5">
                            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100">
                                    <Briefcase className="h-5 w-5 text-violet-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Мои услуги</h2>
                                    <p className="text-xs text-slate-500">{services.length} услуг</p>
                                </div>
                            </div>
                            <div className="space-y-6 p-5">
                                <ServiceList services={serializedServices} />
                                <AddServiceForm profileId={profileId} />
                            </div>
                        </div>
                    )}

                    {currentSection === 'schedule' && (
                        <div className="rounded-[2rem] border border-white/50 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-md ring-1 ring-slate-900/5">
                            <div className="border-b border-slate-100 px-6 py-5">
                                <h2 className="text-lg font-semibold text-slate-900">Расписание</h2>
                                <p className="text-xs text-slate-500">
                                    Эти настройки используются для автоматического расчета свободных слотов.
                                </p>
                            </div>
                            <div className="p-5">
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
                    )}

                    {currentSection === 'profile' && (
                        <div className="rounded-[2rem] border border-white/50 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-md ring-1 ring-slate-900/5">
                            <div className="border-b border-slate-100 px-6 py-5">
                                <h2 className="text-lg font-semibold text-slate-900">Профиль мастера</h2>
                                <p className="text-xs text-slate-500">
                                    Обновите описание, контакты и данные витрины для клиентов.
                                </p>
                            </div>
                            <div className="p-5">
                                <EditProfileForm
                                    profile={{
                                        id: profileId,
                                        name: profile.name,
                                        providerType: profile.provider_type,
                                        bio: profile.bio,
                                        phone: profile.phone,
                                        city: profile.city,
                                        address: profile.address,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <nav className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-white/60 bg-white/85 p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.2)] backdrop-blur-md ring-1 ring-slate-900/5 md:hidden">
                <div className="grid grid-cols-4 gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentSection === item.key;
                        return (
                            <Link
                                key={`mobile-${item.key}`}
                                href={`/dashboard/${profileId}?section=${item.key}`}
                                className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                                    isActive
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-900'
                                }`}
                            >
                                <Icon className="mb-1 h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
