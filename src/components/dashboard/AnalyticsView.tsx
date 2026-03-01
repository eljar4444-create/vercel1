import { getProviderStats, getTopServices, getRevenueByDay } from '@/lib/provider-stats';
import { Card, CardContent } from '@/components/ui/card';
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
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border border-border bg-card shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-24 rounded" />
                                <Skeleton className="h-4 w-4 rounded" />
                            </div>
                            <Skeleton className="mt-4 h-8 w-20 rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card className="border border-border bg-card shadow-sm">
                <div className="border-b border-border px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-5 w-32 rounded" />
                    </div>
                </div>
                <CardContent className="p-6">
                    <Skeleton className="h-[320px] w-full rounded-lg" />
                </CardContent>
            </Card>
            <Card className="border border-border bg-card shadow-sm">
                <div className="border-b border-border px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-5 w-40 rounded" />
                    </div>
                </div>
                <CardContent className="p-4">
                    <Skeleton className="h-[420px] w-full rounded-xl" />
                </CardContent>
            </Card>
            <Card className="border border-border bg-card shadow-sm">
                <div className="border-b border-border px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-5 w-32 rounded" />
                    </div>
                </div>
                <CardContent className="p-6">
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-14 w-full rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
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
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Аналитика</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">Ключевые метрики и топ услуг</p>
            </div>

            {/* Метрики — нейтральные карточки в стиле Stripe */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title} className="border border-border bg-card shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm text-muted-foreground">{card.title}</p>
                                    <Icon
                                        className={`h-4 w-4 shrink-0 ${card.iconAccent ? 'text-emerald-600' : 'text-muted-foreground'}`}
                                        aria-hidden
                                    />
                                </div>
                                <p className="mt-4 text-2xl font-bold text-foreground">{card.value}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Динамика дохода — график */}
            <Card className="border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Динамика дохода</h2>
                        <p className="text-xs text-muted-foreground">За последние 14 дней</p>
                    </div>
                </div>
                <CardContent className="p-6">
                    <RevenueChart data={revenueByDay} />
                </CardContent>
            </Card>

            {/* Календарь записей (как на вкладке «Записи») */}
            <Card className="border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Календарь записей</h2>
                        <p className="text-xs text-muted-foreground">Назад / Сегодня / Вперёд — переключение недель</p>
                    </div>
                </div>
                <CardContent className="p-4">
                    <ProviderCalendar profileId={profileId} />
                </CardContent>
            </Card>

            {/* Топ услуг */}
            <Card className="border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                    <Trophy className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Топ услуг</h2>
                        <p className="text-xs text-muted-foreground">По завершённым визитам и доходу</p>
                    </div>
                </div>
                <CardContent className="p-0">
                    {topServices.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <p className="text-sm text-muted-foreground">Пока нет завершённых визитов по услугам</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Услуга
                                        </th>
                                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                                            Визитов
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Доход
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topServices.map((row) => (
                                        <tr key={row.serviceId} className="border-b border-border last:border-0">
                                            <td className="px-6 py-4 text-sm font-medium text-foreground">
                                                {row.serviceTitle}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground text-right tabular-nums">
                                                {row.visitCount}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-foreground tabular-nums">
                                                {formatRevenue(row.revenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
