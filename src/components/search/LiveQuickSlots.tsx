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
    const allSlots = [...morning, ...evening];

    if (allSlots.length === 0) {
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
            <div className="mt-1.5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {allSlots.map((slot, idx) => (
                    <Link
                        key={idx}
                        href={`/salon/${slug}?book=1&date=${slot.date}&time=${encodeURIComponent(slot.time)}`}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-colors whitespace-nowrap"
                    >
                        {slot.time}
                    </Link>
                ))}
            </div>
        </div>
    );
}
