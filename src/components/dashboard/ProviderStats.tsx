import { getProviderStats } from '@/lib/provider-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Euro, CheckCircle, XCircle, Users } from 'lucide-react';

export function ProviderStatsSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden border-stone-200/70 bg-white shadow-sm">
                    <CardHeader className="pb-1 pt-5 px-5">
                        <Skeleton className="mb-2 h-9 w-9 rounded-xl" />
                        <Skeleton className="h-8 w-24 rounded" />
                        <Skeleton className="mt-1 h-4 w-32 rounded" />
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}

type ProviderStatsProps = {
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

export async function ProviderStats({ profileId }: ProviderStatsProps) {
    const stats = await getProviderStats(profileId);

    const cards = [
        {
            title: 'Доход',
            value: formatRevenue(stats.totalRevenue),
            icon: Euro,
            accent: 'border-t-emerald-500',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            valueColor: 'text-slate-900',
        },
        {
            title: 'Завершённые визиты',
            value: String(stats.completedBookings),
            icon: CheckCircle,
            accent: 'border-t-blue-500',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            valueColor: 'text-slate-900',
        },
        {
            title: 'Отмены',
            value: String(stats.canceledBookings),
            icon: XCircle,
            accent: 'border-t-rose-400',
            iconBg: 'bg-rose-50',
            iconColor: 'text-rose-500',
            valueColor: 'text-slate-900',
            hint: 'Старайтесь держать этот показатель низким',
        },
        {
            title: 'Уникальные клиенты',
            value: String(stats.uniqueClients),
            icon: Users,
            accent: 'border-t-violet-500',
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-600',
            valueColor: 'text-slate-900',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <Card
                        key={card.title}
                        className={`overflow-hidden border-stone-200/70 bg-white shadow-sm border-t-2 ${card.accent}`}
                    >
                        <CardHeader className="pb-1 pt-5 px-5">
                            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
                                <Icon className={`h-4.5 w-4.5 ${card.iconColor}`} aria-hidden />
                            </div>
                            <CardTitle className={`text-xl font-bold tracking-tight ${card.valueColor}`}>
                                {card.value}
                            </CardTitle>
                            <p className="text-xs font-medium text-stone-500">{card.title}</p>
                        </CardHeader>
                        {card.hint && (
                            <CardContent className="pt-0 px-5 pb-5">
                                <p className="text-[11px] text-stone-400">{card.hint}</p>
                            </CardContent>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}
