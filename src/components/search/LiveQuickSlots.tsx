'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getQuickSlots, QuickSlotsResponse } from '@/app/actions/getQuickSlots';
import { Loader2 } from 'lucide-react';

interface LiveQuickSlotsProps {
    profileId: number;
    slug: string;
}

export function LiveQuickSlots({ profileId, slug }: LiveQuickSlotsProps) {
    const [slotsData, setSlotsData] = useState<QuickSlotsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getQuickSlots(profileId)
            .then(setSlotsData)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [profileId]);

    if (isLoading) {
        return (
            <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Быстрые слоты</p>
                <div className="mt-1.5 flex h-10 items-center justify-center rounded-md border border-slate-100 bg-slate-50/50">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                </div>
            </div>
        );
    }

    if (!slotsData || !slotsData.hasSchedule) {
        return (
            <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Быстрые слоты</p>
                <p className="mt-1 text-xs text-slate-500">Уточняйте время при бронировании</p>
            </div>
        );
    }

    const { morning, evening } = slotsData;
    const hasSlots = morning.length > 0 || evening.length > 0;

    if (!hasSlots) {
        return (
            <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Быстрые слоты</p>
                <p className="mt-1 text-xs text-slate-500">Нет свободных окон на ближайшие 7 дней</p>
            </div>
        );
    }

    return (
        <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Быстрые слоты</p>
            <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {/* Morning */}
                {morning.length > 0 && (
                    <div>
                        <p className="text-[10px] font-semibold uppercase text-slate-500">Утро</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            {morning.map((slot, idx) => (
                                <Link
                                    key={idx}
                                    href={`/salon/${slug}?book=1&date=${slot.date}&time=${encodeURIComponent(slot.time)}`}
                                    className="min-h-[44px] flex flex-col justify-center items-center rounded-md border border-blue-600 bg-white px-2 py-0.5 text-[11px] font-medium text-blue-600 transition hover:bg-blue-50"
                                >
                                    <span className="text-[9px] text-blue-400 font-normal leading-tight">{slot.label}</span>
                                    <span>{slot.time}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Evening */}
                {evening.length > 0 && (
                    <div>
                        <p className="text-[10px] font-semibold uppercase text-slate-500">Вечер</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            {evening.map((slot, idx) => (
                                <Link
                                    key={idx}
                                    href={`/salon/${slug}?book=1&date=${slot.date}&time=${encodeURIComponent(slot.time)}`}
                                    className="min-h-[44px] flex flex-col justify-center items-center rounded-md border border-blue-600 bg-white px-2 py-0.5 text-[11px] font-medium text-blue-600 transition hover:bg-blue-50"
                                >
                                    <span className="text-[9px] text-blue-400 font-normal leading-tight">{slot.label}</span>
                                    <span>{slot.time}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
