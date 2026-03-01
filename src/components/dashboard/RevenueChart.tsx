'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';

export type RevenueChartPoint = {
    date: string;
    dateLabel: string;
    revenue: number;
};

type RevenueChartProps = {
    data: RevenueChartPoint[];
};

function formatEuro(value: number): string {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: RevenueChartPoint }[]; label?: string }) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
            <p className="font-medium text-foreground">{p.dateLabel}</p>
            <p className="mt-0.5 tabular-nums text-muted-foreground">{formatEuro(p.revenue)}</p>
        </div>
    );
}

export function RevenueChart({ data }: RevenueChartProps) {
    return (
        <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                        dataKey="dateLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                        dataKey="revenue"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
