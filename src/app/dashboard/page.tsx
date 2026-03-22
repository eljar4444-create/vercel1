import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import {
    CalendarDays,
    Clock,
    CheckCircle,
    XCircle,
    Inbox,
    ArrowLeft,
    Briefcase,
    ShieldCheck,
    AlertCircle,
    ListChecks,
    Eye,
    UserCircle2,
    TrendingUp,
    BarChart2,
} from 'lucide-react';
import { DashboardView } from '@/components/client/DashboardView';
import { BookingListClient } from '@/components/dashboard/BookingListClient';
import { ProviderCalendar } from '@/components/dashboard/ProviderCalendar';
import { AnalyticsView, AnalyticsViewSkeleton } from '@/components/dashboard/AnalyticsView';
import { ServicesSection } from '@/components/dashboard/ServicesSection';
import { AvatarUpload } from '@/components/dashboard/AvatarUpload';
import { EditProfileForm } from '@/components/dashboard/EditProfileForm';
import { WorkingHoursForm } from '@/components/dashboard/WorkingHoursForm';
import { parseSchedule } from '@/lib/scheduling';
import { Button } from '@/components/ui/button';
import { createTelegramConnectLink } from '@/lib/telegram-link';
import { PendingReviewNotice } from '@/components/dashboard/PendingReviewNotice';

export const dynamic = 'force-dynamic';

type DashboardPageProps = {
    searchParams?: {
        section?: string | string[];
    };
};

function buildBookingDateTime(date: Date, time: string) {
    const [h, m] = time.split(':').map((v) => Number(v));
    const dt = new Date(date);
    dt.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
    return dt;
}

function normalizeOnboardingType(type?: string | null) {
    return type === 'SALON' || type === 'INDIVIDUAL' ? type : null;
}

function parseSection(
    searchParams?: DashboardPageProps['searchParams'],
): 'bookings' | 'analytics' | 'services' | 'schedule' | 'profile' {
    const sectionRaw = searchParams?.section;
    const section = Array.isArray(sectionRaw) ? sectionRaw[0] : sectionRaw;

    if (
        section === 'services' ||
        section === 'schedule' ||
        section === 'profile' ||
        section === 'analytics'
    ) {
        return section;
    }

    return 'bookings';
}

async function renderClientDashboard(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        return <div>User not found</div>;
    }

    const rawBookings = await prisma.booking.findMany({
        where: { user_id: userId },
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
                        select: { name: true, icon: true },
                    },
                },
            },
            service: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                    duration_min: true,
                },
            },
            review: {
                select: { id: true },
            },
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
            hasReview: !!booking.review,
            profile: booking.profile,
            service: booking.service
                ? {
                    ...booking.service,
                    price: Number(booking.service.price),
                }
                : null,
        };
    });

    const upcoming = bookings
        .filter((b) => b.isFuture && b.status !== 'cancelled' && b.status !== 'completed' && b.status !== 'COMPLETED')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const history = bookings
        .filter((b) => !b.isFuture || b.status === 'cancelled' || b.status === 'completed' || b.status === 'COMPLETED')
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

    const recommendedCategories =
        rawBookings.length === 0
            ? await prisma.category.findMany({
                take: 6,
                select: { id: true, name: true, slug: true, icon: true },
            })
            : [];

    const favoriteProfiles = await prisma.favorite
        .findMany({
            where: { clientId: userId },
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
        })
        .then((rows) =>
            rows.map((r) => ({
                id: r.provider.id,
                slug: r.provider.slug,
                name: r.provider.name,
                city: r.provider.city,
                image_url: r.provider.image_url,
            })),
        );

    return (
        <section className="min-h-screen pb-12 pt-24">
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

async function renderProviderDashboard(
    profileId: number,
    searchParams?: DashboardPageProps['searchParams'],
) {
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: {
            id: true,
            slug: true,
            name: true,
            provider_type: true,
            image_url: true,
            studioImages: true,
            bio: true,
            phone: true,
            telegramChatId: true,
            city: true,
            address: true,
            latitude: true,
            longitude: true,
            is_verified: true,
            status: true,
            schedule: true,
            category: { select: { name: true, slug: true } },
        },
    });

    if (!profile) {
        redirect('/onboarding');
    }

    const languageRows = await prisma.$queryRaw<Array<{ languages: string[] | null }>>`
        SELECT "languages"
        FROM "Profile"
        WHERE "id" = ${profile.id}
        LIMIT 1
    `;
    const profileLanguages = languageRows[0]?.languages ?? [];

    const connectTelegramLink =
        process.env.TELEGRAM_BOT_USERNAME && !profile.telegramChatId
            ? await createTelegramConnectLink(profile.id, process.env.TELEGRAM_BOT_USERNAME)
            : null;

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
    const isPendingReview = profile.status === 'PENDING_REVIEW';

    const totalBookings = bookings.length;
    const pendingCount = bookings.filter((b) => b.status === 'pending').length;
    const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
    const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;
    const completedCount = bookings.filter((b) => b.status === 'completed').length;

    const setupCompletedSteps = Number(hasServices) + Number(hasScheduleConfigured);
    const setupProgressPercent = Math.round((setupCompletedSteps / 2) * 100);
    const currentSection = parseSection(searchParams);

    const serializedBookings = bookings.map((b) => ({
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

    const serializedServices = services.map((s) => ({
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
        <div className="relative min-h-screen">
            <div className="mx-auto w-full max-w-7xl px-3 pb-24 pt-5 sm:px-4 md:pb-10">
                <PendingReviewNotice profileId={profileId} profileStatus={profile.status} />

                <div className="relative flex w-full gap-5">
                    <main className="min-w-0 flex-1 space-y-4">

                    <Link
                        href={`/salon/${profile.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Мой профиль
                    </Link>

                    {currentSection !== 'analytics' && (
                        <>
                            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_28px_rgba(15,23,42,0.07)]">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                                <div className="p-7">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="shrink-0 rounded-full border-2 border-slate-200 bg-white p-[3px] shadow-sm">
                                                <AvatarUpload
                                                    profileId={profileId}
                                                    profileName={profile.name}
                                                    currentImageUrl={profile.image_url}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl">
                                                    {profile.name}
                                                </h1>
                                                {profile.category && (
                                                    <p className="mt-0.5 text-sm font-medium text-slate-400">
                                                        {profile.category.name}
                                                    </p>
                                                )}
                                                {isProfileVerified && !isPendingReview && (
                                                    <div className="mt-2.5">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                            <ShieldCheck className="h-3 w-3" />
                                                            Активен
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            <Link
                                                href={`/salon/${profile.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 active:bg-slate-950"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Посмотреть профиль
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>

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
                                                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_16px_rgba(15,23,42,0.06)] sm:p-6"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-[11px] font-semibold uppercase leading-none tracking-widest text-slate-400">
                                                        {card.label}
                                                    </p>
                                                    <Icon className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="text-4xl font-bold leading-none tabular-nums text-slate-900 sm:text-5xl">
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

                            {(!hasServices || !hasScheduleConfigured) && (
                                <div className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100">
                                            <ListChecks className="h-5 w-5 text-violet-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h2 className="text-sm font-semibold text-slate-900">Ваш прогресс</h2>
                                                <span className="text-xs font-semibold text-stone-400">
                                                    {setupProgressPercent}% готово
                                                </span>
                                            </div>
                                            <div className="mt-2 h-1.5 w-full rounded-full bg-stone-100">
                                                <div
                                                    className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                                                    style={{ width: `${setupProgressPercent}%` }}
                                                />
                                            </div>
                                            <div className="mt-3 space-y-1.5 text-sm">
                                                <Link
                                                    href="/dashboard?section=services"
                                                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${hasServices
                                                        ? 'text-emerald-700'
                                                        : 'text-slate-600 hover:bg-stone-50'
                                                        }`}
                                                >
                                                    <span
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${hasServices
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-stone-100 text-stone-500'
                                                            }`}
                                                    >
                                                        {hasServices ? '✓' : '1'}
                                                    </span>
                                                    Добавьте услуги
                                                </Link>
                                                <Link
                                                    href="/dashboard?section=schedule"
                                                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${hasScheduleConfigured
                                                        ? 'text-emerald-700'
                                                        : 'text-slate-600 hover:bg-stone-50'
                                                        }`}
                                                >
                                                    <span
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${hasScheduleConfigured
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-stone-100 text-stone-500'
                                                            }`}
                                                    >
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

                    {currentSection === 'analytics' && (
                        <Suspense fallback={<AnalyticsViewSkeleton />}>
                            <AnalyticsView profileId={profileId} />
                        </Suspense>
                    )}

                    {currentSection === 'bookings' && (
                        <div className="space-y-4">
                            <div className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm">
                                <div className="border-b border-stone-100 px-5 py-4">
                                    <h2 className="text-base font-semibold text-slate-900">Календарь записей</h2>
                                    <p className="mt-0.5 text-xs text-stone-400">
                                        Неделя по умолчанию. Клик по записи — детали и смена статуса.
                                    </p>
                                </div>
                                <div className="p-4">
                                    <ProviderCalendar profileId={profileId} />
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">Входящие записи</h2>
                                        <p className="mt-0.5 text-xs text-stone-400">
                                            {totalBookings} {totalBookings === 1 ? 'запись' : 'записей'}
                                        </p>
                                    </div>
                                    {completedCount > 0 && (
                                        <span className="text-xs text-stone-400">{completedCount} завершено</span>
                                    )}
                                </div>

                                <div className="p-4">
                                    {serializedBookings.length > 0 ? (
                                        <BookingListClient bookings={serializedBookings} providerId={profileId} />
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 py-14 text-center">
                                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                                                <Inbox className="h-8 w-8 text-stone-300" />
                                            </div>
                                            <h3 className="text-base font-semibold text-slate-700">
                                                У вас пока нет записей
                                            </h3>
                                            <p className="mx-auto mt-1 max-w-xs text-sm text-stone-400">
                                                Поделитесь ссылкой на профиль, чтобы клиенты начали бронировать услуги.
                                            </p>
                                            <Button asChild className="mt-5 bg-slate-900 text-white hover:bg-slate-800">
                                                <Link href={`/salon/${profile.slug}`} target="_blank" rel="noopener noreferrer">
                                                    Поделиться ссылкой на профиль
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentSection === 'services' && (
                        <div className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100">
                                    <Briefcase className="h-[18px] w-[18px] text-violet-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">Мои услуги</h2>
                                    <p className="text-xs text-stone-400">
                                        {services.length} {services.length === 1 ? 'услуга' : 'услуг'}
                                    </p>
                                </div>
                            </div>
                            <ServicesSection profileId={profileId} services={serializedServices} />
                        </div>
                    )}

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
                                        days: workingSchedule.days,
                                    }}
                                />
                            </div>
                        </div>
                    )}

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
                                        languages: profileLanguages,
                                        telegramChatId: profile.telegramChatId ?? null,
                                        city: profile.city,
                                        address: profile.address,
                                        latitude: profile.latitude,
                                        longitude: profile.longitude,
                                        studioImages: profile.studioImages,
                                    }}
                                    connectTelegramLink={connectTelegramLink}
                                />
                            </div>
                        </div>
                    )}
                    </main>

                    <aside className="sticky top-6 hidden h-fit w-56 shrink-0 md:block">
                        <div className="overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.07)]">
                            <div className="border-b border-stone-200/60 bg-gradient-to-br from-stone-100 to-amber-50 px-4 py-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                                    SVOI.DE
                                </p>
                                <h2 className="mt-1 text-sm font-bold text-slate-800">Кабинет мастера</h2>
                            </div>

                            <nav className="space-y-0.5 p-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = currentSection === item.key;
                                    return (
                                        <Link
                                            key={item.key}
                                            href={`/dashboard?section=${item.key}`}
                                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'text-stone-500 hover:bg-stone-50 hover:text-slate-900'
                                                }`}
                                        >
                                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-amber-300' : ''}`} />
                                            {item.label}
                                            {item.key === 'bookings' && pendingCount > 0 && (
                                                <span
                                                    className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${isActive
                                                        ? 'bg-amber-400 text-slate-900'
                                                        : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                >
                                                    {pendingCount}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="mx-2 my-1 border-t border-stone-100" />
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
            </div>

            <nav className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl border border-stone-200/80 bg-white/90 shadow-[0_8px_32px_rgba(15,23,42,0.18)] backdrop-blur-md md:hidden">
                <div className="grid grid-cols-4">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentSection === item.key;
                        return (
                            <Link
                                key={`mobile-${item.key}`}
                                href={`/dashboard?section=${item.key}`}
                                className={`flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors ${isActive
                                    ? 'bg-slate-900 text-white'
                                    : 'text-stone-500 hover:bg-stone-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-amber-300' : ''}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/auth/login');
    }

    const providerProfile = await prisma.profile.findFirst({
        where: {
            OR: [
                { user_id: session.user.id },
                ...(session.user.email ? [{ user_email: session.user.email }] : []),
            ],
        },
        select: {
            id: true,
            status: true,
            provider_type: true,
        },
    });

    if (providerProfile) {
        if (providerProfile.status === 'DRAFT') {
            const flowType = providerProfile.provider_type === 'SALON' ? 'SALON' : 'INDIVIDUAL';
            redirect(`/onboarding?type=${flowType}`);
        }

        return renderProviderDashboard(providerProfile.id, searchParams);
    }

    const onboardingType = normalizeOnboardingType(session.user.onboardingType);
    if (session.user.onboardingCompleted === false && onboardingType) {
        redirect(`/onboarding?type=${onboardingType}`);
    }

    return renderClientDashboard(session.user.id);
}
