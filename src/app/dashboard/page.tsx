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
    Users,
} from 'lucide-react';
import { DashboardView } from '@/components/client/DashboardView';
import { BookingListClient } from '@/components/dashboard/BookingListClient';
import { ProviderCalendar } from '@/components/dashboard/ProviderCalendar';
import { ManualBookingTrigger } from '@/components/dashboard/ManualBookingTrigger';
import { AnalyticsView, AnalyticsViewSkeleton } from '@/components/dashboard/AnalyticsView';
import { ClientsSection } from '@/components/dashboard/ClientsSection';
import { ReviewsSection } from '@/components/dashboard/ReviewsSection';
import { CopyProfileLinkButton } from '@/components/dashboard/CopyProfileLinkButton';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { ScrollToTaxIdButton } from '@/components/dashboard/ScrollToTaxIdButton';
import { ServicesSection } from '@/components/dashboard/ServicesSection';
import { AvatarUpload } from '@/components/dashboard/AvatarUpload';
import { EditProfileForm } from '@/components/dashboard/EditProfileForm';
import { WorkingHoursForm } from '@/components/dashboard/WorkingHoursForm';
import { StaffSection } from '@/components/dashboard/StaffSection';
import { ArrivalInfoSection } from '@/components/dashboard/ArrivalInfoSection';
import { InteriorPhotosSection } from '@/components/dashboard/InteriorPhotosSection';
import { CoverPhotoSection } from '@/components/dashboard/CoverPhotoSection';
import { parseSchedule } from '@/lib/scheduling';
import { Button } from '@/components/ui/button';
import { createTelegramConnectLink } from '@/lib/telegram-link';
import { PendingReviewNotice } from '@/components/dashboard/PendingReviewNotice';
import { getTranslations } from 'next-intl/server';

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

type DashboardSection =
    | 'bookings'
    | 'analytics'
    | 'services'
    | 'schedule'
    | 'staff'
    | 'clients'
    | 'reviews'
    | 'profile-general'
    | 'profile-location'
    | 'profile-notifications';

function parseSection(searchParams?: DashboardPageProps['searchParams']): DashboardSection {
    const sectionRaw = searchParams?.section;
    const section = Array.isArray(sectionRaw) ? sectionRaw[0] : sectionRaw;

    if (
        section === 'services' ||
        section === 'schedule' ||
        section === 'analytics' ||
        section === 'staff' ||
        section === 'clients' ||
        section === 'reviews' ||
        section === 'profile-general' ||
        section === 'profile-location' ||
        section === 'profile-notifications'
    ) {
        return section;
    }

    if (section === 'profile') {
        return 'profile-general';
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
        const isCancellable = isFuture && booking.status !== 'CANCELED';

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
        .filter((b) => b.isFuture && b.status !== 'LOCKED' && b.status !== 'CANCELED' && b.status !== 'COMPLETED' && b.status !== 'NO_SHOW')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const history = bookings
        .filter((b) => !b.isFuture || b.status === 'CANCELED' || b.status === 'COMPLETED' || b.status === 'NO_SHOW')
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
    const t = await getTranslations('dashboard.provider');
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: {
            id: true,
            slug: true,
            name: true,
            provider_type: true,
            image_url: true,
            gallery: true,
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
            arrivalInfo: true,
            category_id: true,
            category: { select: { name: true, slug: true } },
            user_id: true,
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

    // Fetch taxId for soft lock UI
    const ownerUser = profile.user_id
        ? await prisma.user.findUnique({
            where: { id: profile.user_id },
            select: { taxId: true },
        })
        : null;
    const hasTaxId = Boolean(ownerUser?.taxId?.trim());
    const currentTaxId = ownerUser?.taxId ?? '';
    const isSalonProvider = profile.provider_type === 'SALON';

    const connectTelegramLink =
        process.env.TELEGRAM_BOT_USERNAME && !profile.telegramChatId
            ? await createTelegramConnectLink(profile.id, process.env.TELEGRAM_BOT_USERNAME)
            : null;

    const bookings = await prisma.booking.findMany({
        where: {
            profile_id: profileId,
            // Hide LOCKED bookings — transient system state, not actionable by provider
            status: { not: 'LOCKED' },
        },
        include: { service: { select: { id: true, title: true, price: true } } },
        orderBy: { date: 'desc' },
    });

    const services = await prisma.service.findMany({
        where: { profile_id: profileId },
        orderBy: { title: 'asc' },
        include: {
            photos: {
                orderBy: { position: 'asc' },
                select: { id: true, url: true, position: true, staffId: true },
            },
            staff: {
                select: { id: true },
            },
        },
    });

    const staff = isSalonProvider ? await prisma.staff.findMany({
        where: { profileId },
        orderBy: { createdAt: 'desc' }
    }) : [];

    const interiorPhotos = await prisma.portfolioPhoto.findMany({
        where: { profileId, serviceId: null, staffId: null },
        orderBy: { position: 'asc' },
        select: { id: true, url: true, position: true },
    });

    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
    });

    const workingSchedule = parseSchedule(profile.schedule);
    const hasServices = services.length > 0;
    const hasScheduleConfigured = Boolean(profile.schedule);
    const isProfileVerified = Boolean(profile.is_verified);
    const isPendingReview = profile.status === 'PENDING_REVIEW';

    const totalBookings = bookings.length;
    const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
    const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const cancelledCount = bookings.filter((b) => b.status === 'CANCELED').length;
    const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;

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
        portfolioPhotos: s.photos.map((p) => ({
            id: p.id,
            url: p.url,
            position: p.position,
            staffId: p.staffId,
        })),
        staffIds: s.staff.map((st) => st.id),
    }));

    const staffOptions = staff.map((s) => ({
        id: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl,
    }));

    const isProfileSection =
        currentSection === 'profile-general' ||
        currentSection === 'profile-location' ||
        currentSection === 'profile-notifications';

    const mobileNavItems = [
        { key: 'bookings', label: t('nav.bookings'), icon: CalendarDays },
        { key: 'analytics', label: t('nav.analytics'), icon: BarChart2 },
        ...(isSalonProvider ? [{ key: 'staff', label: t('nav.staff'), icon: Users }] as const : []),
        { key: 'profile-general', label: t('nav.profile'), icon: UserCircle2 },
    ] as const;

    const kpiCards = [
        {
            label: t('kpi.total'),
            value: totalBookings,
            trend: t('kpi.totalTrend'),
            trendType: 'neutral' as const,
            icon: TrendingUp,
        },
        {
            label: t('kpi.pending'),
            value: pendingCount,
            trend: pendingCount > 0 ? t('kpi.pendingNeedsAnswer') : t('kpi.pendingEmpty'),
            trendType: pendingCount > 0 ? ('warn' as const) : ('neutral' as const),
            icon: Clock,
        },
        {
            label: t('kpi.confirmed'),
            value: confirmedCount,
            trend: completedCount > 0 ? t('kpi.completedCount', { count: completedCount }) : t('kpi.activeBookings'),
            trendType: 'positive' as const,
            icon: CheckCircle,
        },
        {
            label: t('kpi.cancelled'),
            value: cancelledCount,
            trend: cancelledCount === 0 ? t('kpi.cancelledEmpty') : t('kpi.cancelledWarn'),
            trendType: cancelledCount === 0 ? ('positive' as const) : ('warn' as const),
            icon: XCircle,
        },
    ];

    return (
        <div className="relative min-h-screen">
            <div className="mx-auto w-full max-w-7xl px-3 pb-24 pt-5 sm:px-4 md:pb-10">
                <PendingReviewNotice profileId={profileId} profileStatus={profile.status} />

                <div className="relative flex w-full gap-0">
                    <main className="min-w-0 flex-1 md:pr-8">

                    <Link
                        href={`/dashboard/preview/${profile.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('backToProfile')}
                    </Link>

                    {currentSection !== 'analytics' && (
                        <>
                            <div className="bg-transparent border-b border-gray-300 pb-8 mb-8 mt-6">
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="shrink-0">
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
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        {t('active')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        <Link
                                            href={`/dashboard/preview/${profile.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-transparent px-5 py-2 text-sm font-medium text-gray-900 transition-colors hover:border-gray-900 hover:bg-gray-50"
                                        >
                                            <Eye className="h-4 w-4" />
                                            {t('viewProfile')}
                                        </Link>
                                        <CopyProfileLinkButton slug={profile.slug} />
                                    </div>
                                </div>
                            </div>

                            {currentSection === 'bookings' && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-300 border-b border-gray-300 pb-8 mb-8">
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
                                                className="flex flex-col justify-between gap-4 px-5 first:pl-0 last:pr-0"
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
                                <div className="bg-transparent border-b border-gray-300 pb-8 mb-8">
                                    <div className="flex items-start gap-4">
                                        <ListChecks className="h-5 w-5 mt-1 shrink-0 text-violet-600" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h2 className="text-sm font-semibold text-slate-900">{t('setup.title')}</h2>
                                                <span className="text-xs font-semibold text-stone-400">
                                                    {t('setup.percent', { percent: setupProgressPercent })}
                                                </span>
                                            </div>
                                            <div className="mt-2 h-1 w-full bg-gray-200">
                                                <div
                                                    className="h-1 bg-slate-900 transition-all duration-500"
                                                    style={{ width: `${setupProgressPercent}%` }}
                                                />
                                            </div>
                                            <div className="mt-3 space-y-1.5 text-sm">
                                                <Link
                                                    href="/dashboard?section=services"
                                                    className={`flex items-center gap-2 py-1 transition-colors ${hasServices
                                                        ? 'text-emerald-700'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                        }`}
                                                >
                                                    <span
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold ${hasServices
                                                            ? 'text-emerald-700'
                                                            : 'text-stone-500'
                                                            }`}
                                                    >
                                                        {hasServices ? '✓' : '1'}
                                                    </span>
                                                    {t('setup.addServices')}
                                                </Link>
                                                <Link
                                                    href="/dashboard?section=schedule"
                                                    className={`flex items-center gap-2 py-1 transition-colors ${hasScheduleConfigured
                                                        ? 'text-emerald-700'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                        }`}
                                                >
                                                    <span
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold ${hasScheduleConfigured
                                                            ? 'text-emerald-700'
                                                            : 'text-stone-500'
                                                            }`}
                                                    >
                                                        {hasScheduleConfigured ? '✓' : '2'}
                                                    </span>
                                                    {t('setup.addSchedule')}
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

                    {currentSection === 'clients' && (
                        <ClientsSection profileId={profileId} />
                    )}

                    {currentSection === 'reviews' && (
                        <ReviewsSection profileId={profileId} />
                    )}

                    {currentSection === 'bookings' && (
                        <div className="space-y-10">
                            <div className="bg-transparent">
                                <div className="flex items-end justify-between border-b border-gray-300 pb-4 mb-6">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">{t('bookings.calendarTitle')}</h2>
                                        <p className="mt-0.5 text-xs text-stone-400">
                                            {t('bookings.calendarSubtitle')}
                                        </p>
                                    </div>
                                    <ManualBookingTrigger
                                        profileId={profileId}
                                        services={services.map((s) => ({
                                            id: s.id,
                                            title: s.title,
                                            price: Number(s.price),
                                            duration_min: s.duration_min,
                                        }))}
                                        staff={staff.map((m) => ({ id: m.id, name: m.name }))}
                                    />
                                </div>
                                <div className="border border-gray-300">
                                    <ProviderCalendar profileId={profileId} />
                                </div>
                            </div>

                            <div className="bg-transparent">
                                <div className="flex items-center justify-between border-b border-gray-300 pb-4 mb-6">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">{t('bookings.incomingTitle')}</h2>
                                        <p className="mt-0.5 text-xs text-stone-400">
                                            {t('bookings.totalCount', { count: totalBookings })}
                                        </p>
                                    </div>
                                    {completedCount > 0 && (
                                        <span className="text-xs text-stone-400">{t('bookings.completedCount', { count: completedCount })}</span>
                                    )}
                                </div>

                                <div>
                                    {serializedBookings.length > 0 ? (
                                        <BookingListClient bookings={serializedBookings} providerId={profileId} />
                                    ) : (
                                        <div className="border border-dashed border-gray-300 py-14 text-center">
                                            <Inbox className="mx-auto mb-4 h-12 w-12 text-stone-300" />
                                            <h3 className="text-base font-semibold text-slate-700">
                                                {t('bookings.emptyTitle')}
                                            </h3>
                                            <p className="mx-auto mt-1 max-w-xs text-sm text-stone-400">
                                                {t('bookings.emptyBody')}
                                            </p>
                                            <Button asChild className="mt-5 rounded-full border border-gray-300 bg-transparent text-gray-900 hover:border-gray-900 hover:bg-gray-50">
                                                <Link href={`/salon/${profile.slug}`} target="_blank" rel="noopener noreferrer">
                                                    {t('bookings.shareProfile')}
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentSection === 'services' && (
                        <div className="bg-transparent">
                            <div className="flex items-center gap-3 border-b border-gray-300 pb-4 mb-6">
                                <Briefcase className="h-5 w-5 text-violet-600" />
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">{t('services.title')}</h2>
                                    <p className="text-xs text-stone-400">
                                        {t('services.count', { count: services.length })}
                                    </p>
                                </div>
                            </div>
                            <ServicesSection profileId={profileId} services={serializedServices} staff={staffOptions} />
                        </div>
                    )}

                    {currentSection === 'schedule' && (
                        <div className="bg-transparent">
                            <div className="border-b border-gray-300 pb-4 mb-6">
                                <h2 className="text-base font-semibold text-slate-900">{t('schedule.title')}</h2>
                                <p className="mt-0.5 text-xs text-stone-400">
                                    {t('schedule.subtitle')}
                                </p>
                            </div>
                            <WorkingHoursForm
                                profileId={profileId}
                                initialSchedule={{
                                    days: workingSchedule.days,
                                }}
                            />
                        </div>
                    )}

                    {currentSection === 'staff' && isSalonProvider && (
                        <div className="bg-transparent">
                            <div className="flex items-center gap-3 border-b border-gray-300 pb-4 mb-6">
                                <Users className="h-5 w-5 text-orange-600" />
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">{t('staff.title')}</h2>
                                    <p className="text-xs text-stone-400">
                                        {t('staff.subtitle')}
                                    </p>
                                </div>
                            </div>
                            <StaffSection staff={staff} services={serializedServices} />
                        </div>
                    )}

                    {isProfileSection && (
                        <div className="space-y-10">
                            {!hasTaxId && currentSection === 'profile-general' && (
                                <div className="bg-transparent border-b border-amber-300 pb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-700" />
                                        <div className="min-w-0">
                                            {isSalonProvider ? (
                                                <>
                                                    <p className="text-sm font-semibold text-amber-900">
                                                        {t('tax.salonTitle')}
                                                    </p>
                                                    <p className="mt-1 text-sm leading-relaxed text-amber-800">
                                                        {t('tax.salonBody')}
                                                    </p>
                                                    <div className="mt-3">
                                                        <ScrollToTaxIdButton />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-semibold text-amber-900">
                                                        {t('tax.individualTitle')}
                                                    </p>
                                                    <p className="mt-1 text-sm leading-relaxed text-amber-800">
                                                        {t('tax.individualBody')}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                        <ScrollToTaxIdButton />
                                                        <Link
                                                            href="/guide/kleingewerbe"
                                                            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-transparent px-4 py-1.5 text-sm font-medium text-amber-900 transition hover:border-amber-700"
                                                        >
                                                            {t('tax.guideLink')}
                                                        </Link>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {currentSection === 'profile-general' && (
                                <div className="bg-transparent mb-6">
                                    <div className="border-b border-gray-300 pb-4 mb-6">
                                        <h2 className="text-base font-semibold text-slate-900">
                                            {isSalonProvider ? t('photos.salonTitle') : t('photos.individualTitle')}
                                        </h2>
                                        <p className="mt-0.5 text-xs text-stone-400">
                                            {isSalonProvider
                                                ? t('photos.salonSubtitle')
                                                : t('photos.individualSubtitle')}
                                        </p>
                                    </div>
                                    <InteriorPhotosSection initialPhotos={interiorPhotos} />
                                </div>
                            )}
                            <div className="bg-transparent">
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
                                        categoryId: profile.category_id,
                                        taxId: currentTaxId,
                                    }}
                                    categories={categories}
                                    connectTelegramLink={connectTelegramLink}
                                    section={
                                        currentSection === 'profile-location'
                                            ? 'location'
                                            : currentSection === 'profile-notifications'
                                                ? 'notifications'
                                                : 'general'
                                    }
                                />
                            </div>


                            {!isSalonProvider && currentSection === 'profile-location' && (
                                <div className="bg-transparent">
                                    <div className="border-b border-gray-300 pb-4 mb-6">
                                        <h2 className="text-base font-semibold text-slate-900">{t('arrival.title')}</h2>
                                        <p className="mt-0.5 text-xs text-stone-400">
                                            {t('arrival.subtitle')}
                                        </p>
                                    </div>
                                    <ArrivalInfoSection
                                        initialData={
                                            profile.arrivalInfo &&
                                            typeof profile.arrivalInfo === 'object' &&
                                            !Array.isArray(profile.arrivalInfo) &&
                                            'address' in profile.arrivalInfo &&
                                            typeof (profile.arrivalInfo as Record<string, unknown>).address === 'string'
                                                ? (profile.arrivalInfo as { address: string; doorCode?: string; bellNote?: string; waitingSpot?: string })
                                                : null
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    </main>

                    <DashboardSidebar
                        currentSection={currentSection}
                        pendingCount={pendingCount}
                        isSalonProvider={isSalonProvider}
                        profileSlug={profile.slug}
                    />
                </div>
            </div>

            <nav className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 border border-gray-300 bg-[#F5F2ED]/95 backdrop-blur-md md:hidden">
                <div className="grid grid-cols-4 divide-x divide-gray-300">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            item.key === 'profile-general'
                                ? isProfileSection
                                : currentSection === item.key;
                        return (
                            <Link
                                key={`mobile-${item.key}`}
                                href={`/dashboard?section=${item.key}`}
                                className={`flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors ${isActive
                                    ? 'text-slate-900 border-t-2 border-slate-900'
                                    : 'text-stone-500 hover:text-slate-900 border-t-2 border-transparent'
                                    }`}
                            >
                                <Icon className="h-[18px] w-[18px]" />
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
        where: { user_id: session.user.id },
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
