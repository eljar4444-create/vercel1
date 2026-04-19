import { getProviderStats, getTopServices, getRevenueByDay } from '@/lib/provider-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { Euro, CheckCircle, XCircle, Users, Trophy, TrendingUp, CalendarDays } from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ProviderCalendar } from '@/components/dashboard/ProviderCalendar';

type AnalyticsViewProps = {
    profileId: number;
};

function formatRevenue(value: number): string {
    return new Intl.NumberFormat('de-DE', {
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
    const [stats, topServices, revenueByDay] = await Promise.all([
        getProviderStats(profileId),
        getTopServices(profileId),
        getRevenueByDay(profileId, 14),
    ]);

    const statCards = [
        { title: 'Доход', value: formatRevenue(stats.totalRevenue), icon: Euro, iconAccent: true },
        { title: 'Завершённые визиты', value: String(stats.completedBookings), icon: CheckCircle, iconAccent: false },
        { title: 'Отмены', value: String(stats.canceledBookings), icon: XCircle, iconAccent: false },
        { title: 'Уникальные клиенты', value: String(stats.uniqueClients), icon: Users, iconAccent: false },
    ];

    return (
        <div className="space-y-8">
            <div className="border-b border-gray-300 pb-6">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Аналитика</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">Ключевые метрики и топ услуг</p>
            </div>

            {/* Метрики — flat divider grid */}
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

            {/* Динамика дохода — график */}
            <div className="border-b border-gray-300 pb-8">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Динамика дохода</h2>
                        <p className="text-xs text-muted-foreground">За последние 14 дней</p>
                    </div>
                </div>
                <RevenueChart data={revenueByDay} />
            </div>

            {/* Календарь записей (как на вкладке «Записи») */}
            <div className="border-b border-gray-300 pb-8">
                <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Календарь записей</h2>
                        <p className="text-xs text-muted-foreground">Назад / Сегодня / Вперёд — переключение недель</p>
                    </div>
                </div>
                <ProviderCalendar profileId={profileId} />
            </div>

            {/* Топ услуг */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Trophy className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Топ услуг</h2>
                        <p className="text-xs text-muted-foreground">По завершённым визитам и доходу</p>
                    </div>
                </div>
                {topServices.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">Пока нет завершённых визитов по услугам</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-300">
                                    <th className="py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Услуга
                                    </th>
                                    <th className="py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                                        Визитов
                                    </th>
                                    <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Доход
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
                                            {formatRevenue(row.revenue)}
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
