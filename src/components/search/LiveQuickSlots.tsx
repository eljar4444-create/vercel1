'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getQuickSlots, QuickSlotsResponse } from '@/app/actions/getQuickSlots';
import { Loader2 } from 'lucide-react';

interface LiveQuickSlotsProps {
    profileId: number;
    slug: string;
    service?: {
        id: number;
        duration_min: number;
    };
}

export function LiveQuickSlots({ profileId, slug, service }: LiveQuickSlotsProps) {
    const [slotsData, setSlotsData] = useState<QuickSlotsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const duration = service?.duration_min || 30;
        getQuickSlots(profileId, duration)
            .then(setSlotsData)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [profileId, service?.duration_min]);

    if (isLoading) {
        return (
            <div className={service ? "mt-2" : "mt-3"}>
                {!service && <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Быстрые слоты</p>}
                <div className="mt-1.5 flex h-10 items-center justify-center rounded-xl bg-[#F5F2ED]/60">
                    <Loader2 className="h-4 w-4 animate-spin text-stone-300" />
                </div>
            </div>
        );
    }

    if (!slotsData || !slotsData.hasSchedule) {
        return (
            <div className={service ? "mt-2" : "mt-3"}>
                {!service && <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Быстрые слоты</p>}
                <p className="mt-1 text-xs text-stone-400">Уточняйте время при бронировании</p>
            </div>
        );
    }

    const { morning, evening } = slotsData;
    const allSlots = [...morning, ...evening];

    if (allSlots.length === 0) {
        return (
            <div className={service ? "mt-2" : "mt-3"}>
                {!service && <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Быстрые слоты</p>}
                <p className="mt-1 text-xs text-stone-400">Нет свободных окон на ближайшие 7 дней</p>
            </div>
        );
    }

    return (
        <div className={service ? "mt-2" : "mt-3"}>
            {!service && <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Быстрые слоты</p>}
            <div className="mt-1.5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {allSlots.map((slot, idx) => (
                    <Link
                        key={idx}
                        href={`/salon/${slug}?book=1&date=${slot.date}&time=${encodeURIComponent(slot.time)}${service ? `&service=${service.id}` : ''}`}
                        className="px-3 py-1.5 rounded-lg bg-[#F5F2ED] text-xs font-medium text-stone-600 hover:bg-[#E5D5C5] transition-colors whitespace-nowrap"
                    >
                        {slot.time}
                    </Link>
                ))}
            </div>
        </div>
    );
}
