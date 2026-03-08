import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import {
    CalendarDays, Clock, CheckCircle, XCircle,
    Inbox, ArrowLeft, Briefcase, ShieldCheck, AlertCircle,
    ListChecks, Eye, UserCircle2, TrendingUp, BarChart2,
} from 'lucide-react';
import { BookingRow } from '@/components/dashboard/BookingRow';
import { BookingListClient } from '@/components/dashboard/BookingListClient';
import { ProviderCalendar } from '@/components/dashboard/ProviderCalendar';
import { AnalyticsView, AnalyticsViewSkeleton } from '@/components/dashboard/AnalyticsView';
import { ServicesSection } from '@/components/dashboard/ServicesSection';
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
    if (!session?.user) redirect('/auth/login');
    if (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN') redirect('/');

    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: {
            id: true,
            slug: true,
            user_id: true,
            user_email: true,
            name: true,
            provider_type: true,
            image_url: true,
            studioImages: true,
            bio: true,
            phone: true,
            telegramChatId: true,
            city: true,
            address: true,
            is_verified: true,
            schedule: true,
            category: { select: { name: true, slug: true } },
        },
    });
    if (!profile) notFound();

    if (session.user.role !== 'ADMIN') {
        const ownsByUserId = profile.user_id && profile.user_id === session.user.id;
        const ownsByEmail = session.user.email && profile.user_email === session.user.email;
        if (!ownsByUserId && !ownsByEmail) redirect('/');
        if (!profile.user_id && session.user.id) {
            await prisma.profile.update({ where: { id: profile.id }, data: { user_id: session.user.id } });
            profile.user_id = session.user.id;
        }
    }

    const bookings = await prisma.booking.findMany({
        where: { profile_id: profileId },
        include: { service: { select: { id: true, title: true, price: true } } },
        orderBy: { date: 'desc' },
    });

    const services = await prisma.service.findMany({
        where: { profile_id: profileId },
        orderBy: { title: 'asc' },
    });

    const workingSchedule = parseSchedule(profile.schedule);
    const hasServices = services.length > 0;
    const hasScheduleConfigured = Boolean(profile.schedule);
    const isProfileVerified = Boolean(profile.is_verified);

    const totalBookings = bookings.length;
    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
    const completedCount = bookings.filter(b => b.status === 'completed').length;

    const setupCompletedSteps = Number(hasServices) + Number(hasScheduleConfigured);
    const setupProgressPercent = Math.round((setupCompletedSteps / 2) * 100);

    const currentSection =
        searchParams?.section === 'services' ||
            searchParams?.section === 'schedule' ||
            searchParams?.section === 'profile' ||
            searchParams?.section === 'analytics'
            ? searchParams.section
            : 'bookings';

    const firstName = profile.name?.split(' ')[0] ?? profile.name;

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
        { key: 'bookings', label: 'Записи', icon: CalendarDays },
        { key: 'analytics', label: 'Статистика', icon: BarChart2 },
        { key: 'services', label: 'Услуги', icon: Briefcase },
        { key: 'schedule', label: 'Расписание', icon: Clock },
        { key: 'profile', label: 'Профиль', icon: UserCircle2 },
    ] as const;

    const mobileNavItems = [
        { key: 'bookings', label: 'Записи', icon: CalendarDays },
        { key: 'analytics', label: 'Статистика', icon: BarChart2 },
        { key: 'services', label: 'Услуги', icon: Briefcase },
        { key: 'profile', label: 'Профиль', icon: UserCircle2 },
    ] as const;

    const kpiCards = [
        {
            label: 'Всего записей',
            value: totalBookings,
            trend: 'За всё время работы',
            trendType: 'neutral' as const,
            icon: TrendingUp,
        },
        {
            label: 'Ожидают подтверждения',
            value: pendingCount,
            trend: pendingCount > 0 ? 'Требуют вашего ответа' : 'Нет новых запросов',
            trendType: pendingCount > 0 ? ('warn' as const) : ('neutral' as const),
            icon: Clock,
        },
        {
            label: 'Подтверждено',
            value: confirmedCount,
            trend: completedCount > 0 ? `${completedCount} завершено` : 'Активных записей',
            trendType: 'positive' as const,
            icon: CheckCircle,
        },
        {
            label: 'Отменено',
            value: cancelledCount,
            trend: cancelledCount === 0 ? 'Отлично — держите так' : 'Старайтесь снизить',
            trendType: cancelledCount === 0 ? ('positive' as const) : ('warn' as const),
            icon: XCircle,
        },
    ];

    return (
        <div className="relative min-h-screen bg-slate-50">
            <div className="relative mx-auto flex w-full max-w-7xl gap-5 px-3 pb-24 pt-5 sm:px-4 md:pb-10">

                {/* ── Main Content ─────────────────────────────────────── */}
                <main className="min-w-0 flex-1 space-y-4">

                    {/* Back link */}
                    <Link
                        href={`/profile/${profileId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Мой профиль
                    </Link>

                    {/* ── Hero / Profile Card + KPI + Setup (только не на вкладке Статистика) ─────────────────────────── */}
                    {currentSection !== 'analytics' && (
                        <>
                            {/* ── Hero / Profile Card ─────────────────────────── */}
                            <div className="relative overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_28px_rgba(15,23,42,0.07)]">
                                {/* Hairline gradient top border for depth */}
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                                <div className="p-7">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                                        {/* Left: Avatar ring + Info */}
                                        <div className="flex items-center gap-5">
                                            {/* Outer ring wrapper */}
                                            <div className="shrink-0 p-[3px] rounded-full border-2 border-slate-200 shadow-sm bg-white">
                                                <AvatarUpload
                                                    profileId={profileId}
                                                    profileName={profile.name}
                                                    currentImageUrl={profile.image_url}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                                                    {profile.name}
                                                </h1>
                                                {profile.category && (
                                                    <p className="mt-0.5 text-sm font-medium text-slate-400">{profile.category.name}</p>
                                                )}
                                                <div className="mt-2.5">
                                                    {isProfileVerified ? (
                                                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                                                            <ShieldCheck className="h-3 w-3" />
                                                            Активен
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                                                            <AlertCircle className="h-3 w-3" />
                                                            На проверке
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: CTA Button */}
                                        <div className="shrink-0">
                                            <Link
                                                href={`/salon/${profile?.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-800 active:bg-slate-950 transition-colors shadow-sm"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Посмотреть профиль
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── KPI Cards (только на вкладке Записи) ────────────────────────────────────── */}
                            {currentSection === 'bookings' && (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {kpiCards.map((card) => {
                                        const Icon = card.icon;
                                        const trendCls =
                                            card.trendType === 'positive'
                                                ? 'text-emerald-600'
                                                : card.trendType === 'warn'
                                                    ? 'text-amber-600'
                                                    : 'text-slate-400';
                                        return (
                                            <div
                                                key={card.label}
                                                className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_16px_rgba(15,23,42,0.06)] flex flex-col justify-between gap-4"
                                            >
                                                {/* Top row: icon + label */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 leading-none">
                                                        {card.label}
                                                    </p>
                                                    <Icon className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                                </div>
                                                {/* Bottom: number + trend */}
                                                <div>
                                                    <p className="text-4xl sm:text-5xl font-bold text-slate-900 leading-none tabular-nums">
                                                        {card.value}
                                                    </p>
                                                    <p className={`mt-2 text-[11px] font-medium ${trendCls}`}>
                                                        {card.trend}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── Setup Progress ───────────────────────────────── */}
                            {(!hasServices || !hasScheduleConfigured) && (
                                <div className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100">
                                            <ListChecks className="h-5 w-5 text-violet-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h2 className="text-sm font-semibold text-slate-900">Ваш прогресс</h2>
                                                <span className="text-xs font-semibold text-stone-400">{setupProgressPercent}% готово</span>
                                            </div>
                                            <div className="mt-2 h-1.5 w-full rounded-full bg-stone-100">
                                                <div
                                                    className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                                                    style={{ width: `${setupProgressPercent}%` }}
                                                />
                                            </div>
                                            <div className="mt-3 space-y-1.5 text-sm">
                                                <Link
                                                    href={`/dashboard/${profileId}?section=services`}
                                                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${hasServices
                                                        ? 'text-emerald-700'
                                                        : 'text-slate-600 hover:bg-stone-50'
                                                        }`}
                                                >
                                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${hasServices ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                                                        {hasServices ? '✓' : '1'}
                                                    </span>
                                                    Добавьте услуги
                                                </Link>
                                                <Link
                                                    href={`/dashboard/${profileId}?section=schedule`}
                                                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${hasScheduleConfigured
                                                        ? 'text-emerald-700'
                                                        : 'text-slate-600 hover:bg-stone-50'
                                                        }`}
                                                >
                                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${hasScheduleConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                                                        {hasScheduleConfigured ? '✓' : '2'}
                                                    </span>
                                                    Укажите рабочие часы
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </>
                    )}

                    {/* ── Section: Analytics ───────────────────────────── */}
                    {currentSection === 'analytics' && (
                        <Suspense fallback={<AnalyticsViewSkeleton />}>
                            <AnalyticsView profileId={profileId} />
                        </Suspense>
                    )}

                    {/* ── Section: Bookings ─────────────────────────────── */}
                    {currentSection === 'bookings' && (
                        <div className="space-y-4">
                            {/* Calendar */}
                            <div className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm">
                                <div className="border-b border-stone-100 px-5 py-4">
                                    <h2 className="text-base font-semibold text-slate-900">Календарь записей</h2>
                                    <p className="mt-0.5 text-xs text-stone-400">Неделя по умолчанию. Клик по записи — детали и смена статуса.</p>
                                </div>
                                <div className="p-4">
                                    <ProviderCalendar profileId={profileId} />
                                </div>
                            </div>

                            {/* Booking list */}
                            <div className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">Входящие записи</h2>
                                        <p className="mt-0.5 text-xs text-stone-400">{totalBookings} {totalBookings === 1 ? 'запись' : 'записей'}</p>
                                    </div>
                                    {completedCount > 0 && (
                                        <span className="text-xs text-stone-400">
                                            {completedCount} завершено
                                        </span>
                                    )}
                                </div>

                                <div className="p-4">
                                    {serializedBookings.length > 0 ? (
                                        <BookingListClient
                                            bookings={serializedBookings}
                                            providerId={profileId}
                                        />
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 py-14 text-center">
                                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                                                <Inbox className="h-8 w-8 text-stone-300" />
                                            </div>
                                            <h3 className="text-base font-semibold text-slate-700">У вас пока нет записей</h3>
                                            <p className="mx-auto mt-1 max-w-xs text-sm text-stone-400">
                                                Поделитесь ссылкой на профиль, чтобы клиенты начали бронировать услуги.
                                            </p>
                                            <Button asChild className="mt-5 bg-slate-900 text-white hover:bg-slate-800">
                                                <Link href={`/profile/${profileId}`} target="_blank" rel="noopener noreferrer">
                                                    Поделиться ссылкой на профиль
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Section: Services ─────────────────────────────── */}
                    {currentSection === 'services' && (
                        <div className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100">
                                    <Briefcase className="h-4.5 w-4.5 text-violet-600" style={{ width: '18px', height: '18px' }} />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">Мои услуги</h2>
                                    <p className="text-xs text-stone-400">{services.length} {services.length === 1 ? 'услуга' : 'услуг'}</p>
                                </div>
                            </div>
                            <ServicesSection profileId={profileId} services={serializedServices} />
                        </div>
                    )}

                    {/* ── Section: Schedule ─────────────────────────────── */}
                    {currentSection === 'schedule' && (
                        <div className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm">
                            <div className="border-b border-stone-100 px-5 py-4">
                                <h2 className="text-base font-semibold text-slate-900">Расписание</h2>
                                <p className="mt-0.5 text-xs text-stone-400">
                                    Эти настройки используются для автоматического расчёта свободных слотов.
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

                    {/* ── Section: Profile ──────────────────────────────── */}
                    {currentSection === 'profile' && (
                        <div className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm">
                            <div className="border-b border-stone-100 px-5 py-4">
                                <h2 className="text-base font-semibold text-slate-900">Профиль мастера</h2>
                                <p className="mt-0.5 text-xs text-stone-400">
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
                                        telegramChatId: profile.telegramChatId ?? null,
                                        city: profile.city,
                                        address: profile.address,
                                        studioImages: profile.studioImages,
                                    }}
                                    connectTelegramLink={
                                        process.env.TELEGRAM_BOT_USERNAME && profile.user_id
                                            ? `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${profile.user_id}`
                                            : null
                                    }
                                />
                            </div>
                        </div>
                    )}
                </main>

                {/* ── Sidebar (RIGHT) ──────────────────────────────────── */}
                <aside className="sticky top-6 hidden h-fit w-56 shrink-0 md:block">
                    <div className="overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.07)]">
                        {/* Brand header — light warm tone */}
                        <div className="bg-gradient-to-br from-stone-100 to-amber-50 px-4 py-5 border-b border-stone-200/60">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                                SVOI.DE
                            </p>
                            <h2 className="mt-1 text-sm font-bold text-slate-800">Кабинет мастера</h2>
                        </div>

                        {/* Nav items */}
                        <nav className="p-2 space-y-0.5">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentSection === item.key;
                                return (
                                    <Link
                                        key={item.key}
                                        href={`/dashboard/${profileId}?section=${item.key}`}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'text-stone-500 hover:bg-stone-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-amber-300' : ''}`} />
                                        {item.label}
                                        {item.key === 'bookings' && pendingCount > 0 && (
                                            <span className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${isActive ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-700'}`}>
                                                {pendingCount}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Divider + public profile link */}
                        <div className="border-t border-stone-100 mx-2 my-1" />
                        <div className="p-2 pb-3">
                            <Link
                                href={`/salon/${profile.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-50 hover:text-slate-800"
                            >
                                <Eye className="h-4 w-4 shrink-0" />
                                Посмотреть профиль
                            </Link>
                        </div>
                    </div>
                </aside>
            </div>

            {/* ── Mobile bottom nav ─────────────────────────────────────── */}
            <nav className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl border border-stone-200/80 bg-white/90 shadow-[0_8px_32px_rgba(15,23,42,0.18)] backdrop-blur-md md:hidden">
                <div className="grid grid-cols-4">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentSection === item.key;
                        return (
                            <Link
                                key={`mobile-${item.key}`}
                                href={`/dashboard/${profileId}?section=${item.key}`}
                                className={`flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors ${isActive
                                    ? 'bg-slate-900 text-white'
                                    : 'text-stone-500 hover:bg-stone-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-amber-300' : ''}`} style={{ width: '18px', height: '18px' }} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
