'use client';

import useSWR from 'swr';
import { MapPin, KeyRound, Bell, Loader2 } from 'lucide-react';

interface ArrivalInfo {
    address: string;
    doorCode?: string;
    bellNote?: string;
    waitingSpot?: string;
}

export function ArrivalRitualCard({ bookingId }: { bookingId: number }) {
    const { data, error, isLoading } = useSWR<{ arrivalInfo: ArrivalInfo | null }>(
        `/api/bookings/${bookingId}/arrival`,
        (url: string) => fetch(url).then((res) => {
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        })
    );

    if (isLoading) {
        return (
            <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-booking-primary/50" />
            </div>
        );
    }

    // Hide if error or no arrival info configured
    if (error || !data?.arrivalInfo) return null;

    const { address, doorCode, bellNote, waitingSpot } = data.arrivalInfo;

    return (
        <div className="rounded-3xl border border-booking-primary/20 bg-booking-card p-6 shadow-soft-out relative overflow-hidden">
            {/* Subtle gold accent strip */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-booking-primary/30 via-booking-primary to-booking-primary/30" />
            
            <h3 className="font-serif text-lg font-semibold text-booking-textMain mb-4">
                Как подготовиться к визиту
            </h3>

            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-booking-primary/10 text-booking-primary">
                        <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-booking-textMuted uppercase tracking-wide">Точный адрес</p>
                        <p className="text-sm font-medium text-booking-textMain mt-0.5">
                            {address}
                        </p>
                    </div>
                </div>

                {(doorCode || bellNote) && (
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-booking-primary/10 text-booking-primary">
                            <KeyRound className="h-4 w-4" />
                        </div>
                        <div className="space-y-2 w-full">
                            {doorCode && (
                                <div>
                                    <p className="text-xs font-medium text-booking-textMuted uppercase tracking-wide">Код домофона</p>
                                    <p className="text-sm font-medium text-booking-textMain mt-0.5">
                                        {doorCode}
                                    </p>
                                </div>
                            )}
                            {bellNote && (
                                <div>
                                    <p className="text-xs font-medium text-booking-textMuted uppercase tracking-wide">В какой звонок звонить?</p>
                                    <p className="text-sm font-medium text-booking-textMain mt-0.5">
                                        {bellNote}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {waitingSpot && (
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-booking-primary/10 text-booking-primary">
                            <Bell className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-booking-textMuted uppercase tracking-wide">Важная информация</p>
                            <p className="text-sm font-medium text-booking-textMain mt-0.5">
                                {waitingSpot}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
