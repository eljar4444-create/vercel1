import { getProviderStats, getTopServices, getRevenueByDay } from '@/lib/provider-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { Euro, CheckCircle, XCircle, Users, Trophy, TrendingUp, CalendarDays } from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ProviderCalendar } from '@/components/dashboard/ProviderCalendar';
import { getLocale, getTranslations } from 'next-intl/server';

type AnalyticsViewProps = {
    profileId: number;
};

function formatRevenue(value: number, locale: string): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function AnalyticsViewSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-300 border-b border-gray-300 pb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="px-5 first:pl-0">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-24 rounded" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </div>
                        <Skeleton className="mt-4 h-8 w-20 rounded" />
                    </div>
                ))}
            </div>
            <div className="border-b border-gray-300 pb-8">
                <Skeleton className="h-5 w-32 rounded mb-4" />
                <Skeleton className="h-[320px] w-full rounded-md" />
            </div>
            <div className="border-b border-gray-300 pb-8">
                <Skeleton className="h-5 w-40 rounded mb-4" />
                <Skeleton className="h-[420px] w-full rounded-md" />
            </div>
            <div>
                <Skeleton className="h-5 w-32 rounded mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-md" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export async function AnalyticsView({ profileId }: AnalyticsViewProps) {
    const [t, locale] = await Promise.all([
        getTranslations('dashboard.provider.analytics'),
        getLocale(),
    ]);
    const [stats, topServices, revenueByDay] = await Promise.all([
        getProviderStats(profileId),
        getTopServices(profileId),
        getRevenueByDay(profileId, 14),
    ]);

    const statCards = [
        { title: t('revenue'), value: formatRevenue(stats.totalRevenue, locale), icon: Euro, iconAccent: true },
        { title: t('completedVisits'), value: String(stats.completedBookings), icon: CheckCircle, iconAccent: false },
        { title: t('cancellations'), value: String(stats.canceledBookings), icon: XCircle, iconAccent: false },
        { title: t('uniqueClients'), value: String(stats.uniqueClients), icon: Users, iconAccent: false },
    ];

    return (
        <div className="space-y-8">
            <div className="border-b border-gray-300 pb-6">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">{t('subtitle')}</p>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-300 border-b border-gray-300 pb-8">
                {statCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.title} className={`px-5 ${idx === 0 ? 'sm:pl-0' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-muted-foreground">{card.title}</p>
                                <Icon
                                    className={`h-4 w-4 shrink-0 ${card.iconAccent ? 'text-emerald-600' : 'text-muted-foreground'}`}
                                    aria-hidden
                                />
                            </div>
                            <p className="mt-4 text-2xl font-bold text-foreground">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Revenue trend */}
            <div className="border-b border-gray-300 pb-8">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">{t('revenueTrend')}</h2>
                        <p className="text-xs text-muted-foreground">{t('last14Days')}</p>
                    </div>
                </div>
                <RevenueChart data={revenueByDay} />
            </div>

            {/* Booking calendar */}
            <div className="border-b border-gray-300 pb-8">
                <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">{t('calendarTitle')}</h2>
                        <p className="text-xs text-muted-foreground">{t('calendarSubtitle')}</p>
                    </div>
                </div>
                <ProviderCalendar profileId={profileId} />
            </div>

            {/* Top services */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Trophy className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">{t('topServices')}</h2>
                        <p className="text-xs text-muted-foreground">{t('topServicesSubtitle')}</p>
                    </div>
                </div>
                {topServices.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">{t('emptyTopServices')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-300">
                                    <th className="py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        {t('service')}
                                    </th>
                                    <th className="py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                                        {t('visits')}
                                    </th>
                                    <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        {t('revenue')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {topServices.map((row) => (
                                    <tr key={row.serviceId} className="border-b border-gray-200 last:border-0">
                                        <td className="py-3 text-sm font-medium text-foreground">
                                            {row.serviceTitle}
                                        </td>
                                        <td className="py-3 text-sm text-muted-foreground text-right tabular-nums">
                                            {row.visitCount}
                                        </td>
                                        <td className="py-3 text-right text-sm font-medium text-foreground tabular-nums">
                                            {formatRevenue(row.revenue, locale)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
