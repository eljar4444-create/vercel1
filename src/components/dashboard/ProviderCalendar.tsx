'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
    startOfWeek,
    addWeeks,
    addDays,
    format,
    isSameDay,
    isWithinInterval,
    parseISO,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getProviderBookingsForWeek } from '@/app/actions/getProviderBookingsForWeek';
import { BookingDetailsModal, type BookingForModal } from '@/components/dashboard/BookingDetailsModal';

const HOUR_START = 8;
const HOUR_END = 21;
const SLOT_MINUTES = 30;
const ROW_HEIGHT_PX = 26;

const DAY_LABELS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const STATUS_CARD_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    pending:   { bg: 'bg-amber-400',   text: 'text-amber-950', border: 'border-amber-500' },
    confirmed: { bg: 'bg-emerald-500', text: 'text-white',      border: 'border-emerald-600' },
    completed: { bg: 'bg-slate-300',   text: 'text-slate-800',  border: 'border-slate-400' },
    no_show:   { bg: 'bg-slate-200',   text: 'text-slate-700',  border: 'border-slate-300' },
    cancelled: { bg: 'bg-rose-100',    text: 'text-rose-700',   border: 'border-rose-300' },
};

function getDefaultWeekStart(): Date {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
}

function toWeekStartKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

function getDayIndex(d: Date): number {
    const day = d.getDay();
    return day === 0 ? 6 : day - 1;
}

const COL_TEMPLATE = '44px repeat(7, minmax(0, 1fr))';

interface ProviderCalendarProps {
    profileId: number;
}

export function ProviderCalendar({ profileId }: ProviderCalendarProps) {
    const [weekStart, setWeekStart] = useState<Date>(getDefaultWeekStart);
    const [bookings, setBookings] = useState<BookingForModal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<BookingForModal | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const weekStartKey = toWeekStartKey(weekStart);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const totalSlots = ((HOUR_END - HOUR_START) * 60) / SLOT_MINUTES;

    // Only whole-hour labels
    const hourLabels: { slot: number; label: string }[] = [];
    for (let h = HOUR_START; h < HOUR_END; h++) {
        const slotIdx = ((h - HOUR_START) * 60) / SLOT_MINUTES;
        hourLabels.push({ slot: slotIdx, label: `${String(h).padStart(2, '0')}:00` });
    }

    const loadBookings = useCallback(async () => {
        setLoading(true);
        setError(null);
        const result = await getProviderBookingsForWeek(profileId, weekStartKey);
        setLoading(false);
        if (result.success) {
            setBookings(result.bookings as BookingForModal[]);
        } else {
            setError(result.error ?? 'Ошибка загрузки');
            setBookings([]);
        }
    }, [profileId, weekStartKey]);

    useEffect(() => { loadBookings(); }, [loadBookings]);

    const goPrevWeek = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        setWeekStart(d => addWeeks(d, -1));
    };
    const goNextWeek = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        setWeekStart(d => addWeeks(d, 1));
    };
    const goToday = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        setWeekStart(getDefaultWeekStart());
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
            if (e.key === 'ArrowLeft') { e.preventDefault(); setWeekStart(d => addWeeks(d, -1)); }
            if (e.key === 'ArrowRight') { e.preventDefault(); setWeekStart(d => addWeeks(d, 1)); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const openModal  = (b: BookingForModal) => { setSelectedBooking(b); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setSelectedBooking(null); };

    const weekRangeLabel = `${format(weekDays[0], 'd MMM', { locale: ru })} — ${format(weekDays[6], 'd MMM yyyy', { locale: ru })}`;

    // Build processed bookings per day
    const buildDayBookings = (day: Date) => {
        const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
        const dayEnd   = new Date(day); dayEnd.setHours(23, 59, 59, 999);
        const dayBookings = bookings.filter(b => isWithinInterval(parseISO(b.date), { start: dayStart, end: dayEnd }));

        const processed = dayBookings.map(b => {
            const [h, m] = b.time.split(':').map(Number);
            const startMin = (h ?? 0) * 60 + (m ?? 0);
            const durationMin = b.service?.duration_min || 60;
            return { ...b, startMin, endMin: startMin + durationMin, durationMin };
        }).sort((a, b) => a.startMin - b.startMin);

        // Cluster + column assignment for overlaps
        const clusters: typeof processed[] = [];
        let cur: typeof processed = [], curEnd = 0;
        processed.forEach(b => {
            if (cur.length === 0) { cur.push(b); curEnd = b.endMin; }
            else if (b.startMin < curEnd) { cur.push(b); curEnd = Math.max(curEnd, b.endMin); }
            else { clusters.push(cur); cur = [b]; curEnd = b.endMin; }
        });
        if (cur.length > 0) clusters.push(cur);

        const final: (typeof processed[0] & { colIndex: number; totalCols: number })[] = [];
        clusters.forEach(cluster => {
            const cols: typeof processed[] = [];
            cluster.forEach(b => {
                let placed = false;
                for (let i = 0; i < cols.length; i++) {
                    if (cols[i][cols[i].length - 1].endMin <= b.startMin) {
                        cols[i].push(b);
                        final.push({ ...b, colIndex: i, totalCols: 1 });
                        placed = true; break;
                    }
                }
                if (!placed) { cols.push([b]); final.push({ ...b, colIndex: cols.length - 1, totalCols: 1 }); }
            });
            final.forEach(b => { if (cluster.some(cb => cb.id === b.id)) b.totalCols = cols.length; });
        });
        return final;
    };

    const PIXELS_PER_MIN = ROW_HEIGHT_PX / SLOT_MINUTES;

    return (
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">

            {/* ── Week navigation (sticky, always visible) ── */}
            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b-2 border-stone-200 bg-stone-50 px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 capitalize">{weekRangeLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={goPrevWeek}
                        className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-stone-300 bg-white px-3 text-stone-700 transition hover:bg-stone-100 hover:border-stone-400"
                        aria-label="Предыдущая неделя"
                        title="Предыдущая неделя"
                    >
                        <ChevronLeft className="h-5 w-5 shrink-0" />
                        <span className="hidden sm:inline text-sm font-medium">Назад</span>
                    </button>
                    <button
                        type="button"
                        onClick={goToday}
                        className="rounded-xl border-2 border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:border-stone-400"
                        title="Текущая неделя"
                    >
                        Сегодня
                    </button>
                    <button
                        type="button"
                        onClick={goNextWeek}
                        className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-stone-300 bg-white px-3 text-stone-700 transition hover:bg-stone-100 hover:border-stone-400"
                        aria-label="Следующая неделя"
                        title="Следующая неделя"
                    >
                        <span className="hidden sm:inline text-sm font-medium">Вперёд</span>
                        <ChevronRight className="h-5 w-5 shrink-0" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-10 text-xs text-stone-400">Загрузка...</div>
            )}

            {!loading && (
                <div className="overflow-x-auto">
                    <div className="min-w-[540px]">

                        {/* ── Sticky day-header row ── */}
                        <div
                            style={{ display: 'grid', gridTemplateColumns: COL_TEMPLATE }}
                            className="border-b border-stone-100"
                        >
                            {/* corner */}
                            <div className="bg-stone-50/60" />
                            {weekDays.map((day, di) => {
                                const isToday = isSameDay(day, new Date());
                                const dayBookingsCount = bookings.filter(b => isSameDay(parseISO(b.date), day)).length;
                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={`flex flex-col items-center justify-center py-2 text-xs font-semibold gap-0.5 border-l border-stone-100 ${isToday ? 'bg-slate-900 text-white' : 'bg-stone-50/60 text-stone-500'}`}
                                    >
                                        <span>{DAY_LABELS_SHORT[getDayIndex(day)]}</span>
                                        <span className={`text-[11px] font-bold ${isToday ? 'text-amber-300' : 'text-slate-700'}`}>
                                            {format(day, 'd')}
                                        </span>
                                        {dayBookingsCount > 0 && (
                                            <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${isToday ? 'bg-amber-400 text-slate-900' : 'bg-slate-900 text-white'}`}>
                                                {dayBookingsCount}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Scrollable time body ── */}
                        <div className="max-h-[380px] overflow-y-auto">
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: COL_TEMPLATE,
                                    gridTemplateRows: `repeat(${totalSlots}, ${ROW_HEIGHT_PX}px)`,
                                    position: 'relative',
                                }}
                            >
                                {/* Time labels — only on hour marks */}
                                {Array.from({ length: totalSlots }, (_, rowIdx) => {
                                    const hourEntry = hourLabels.find(h => h.slot === rowIdx);
                                    return (
                                        <div
                                            key={rowIdx}
                                            className="border-r border-stone-100 flex items-start justify-end pr-1.5 pt-0.5"
                                            style={{ gridColumn: 1, gridRow: rowIdx + 1 }}
                                        >
                                            {hourEntry && (
                                                <span className="text-[9px] font-medium text-stone-400 leading-none">{hourEntry.label}</span>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Day columns */}
                                {weekDays.map((day, dayIdx) => {
                                    const isToday = isSameDay(day, new Date());
                                    const dayFinalBookings = buildDayBookings(day);

                                    return (
                                        <div
                                            key={day.toISOString()}
                                            className={`relative border-l border-stone-100 ${isToday ? 'bg-blue-50/20' : ''}`}
                                            style={{
                                                gridColumn: dayIdx + 2,
                                                gridRow: `1 / -1`,
                                            }}
                                        >
                                            {/* Row lines */}
                                            {Array.from({ length: totalSlots }, (_, rowIdx) => (
                                                <div
                                                    key={rowIdx}
                                                    className={`absolute w-full border-b ${rowIdx % 2 === 0 ? 'border-stone-100' : 'border-dashed border-stone-50'}`}
                                                    style={{ top: rowIdx * ROW_HEIGHT_PX, height: ROW_HEIGHT_PX }}
                                                />
                                            ))}

                                            {/* Booking cards */}
                                            {dayFinalBookings.map(b => {
                                                const topPx = (b.startMin - HOUR_START * 60) * PIXELS_PER_MIN;
                                                const heightPx = Math.max(20, b.durationMin * PIXELS_PER_MIN - 2);
                                                const isCompact = heightPx < 36;
                                                const st = STATUS_CARD_STYLES[b.status] ?? STATUS_CARD_STYLES.completed;

                                                return (
                                                    <button
                                                        key={b.id}
                                                        type="button"
                                                        onClick={() => openModal(b)}
                                                        className={`absolute rounded-md border text-left overflow-hidden shadow-sm hover:shadow-md transition-shadow z-10 ${st.bg} ${st.text} ${st.border}`}
                                                        style={{
                                                            top: topPx,
                                                            height: heightPx,
                                                            left: `calc(${b.colIndex * (100 / b.totalCols)}% + 2px)`,
                                                            width: `calc(${100 / b.totalCols}% - 4px)`,
                                                        }}
                                                    >
                                                        <div className={`w-full h-full ${isCompact ? 'flex items-center gap-1 px-1.5' : 'flex flex-col justify-center px-1.5 py-1 gap-0.5'}`}>
                                                            <span className="font-bold text-[9px] leading-none truncate shrink-0">{b.time}</span>
                                                            {!isCompact && (
                                                                <span className="text-[9px] leading-tight truncate opacity-90">{b.user_name}</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Legend ── */}
            <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 px-4 py-2.5 text-[11px] text-stone-400">
                {[
                    { color: 'bg-amber-400', label: 'Ожидает' },
                    { color: 'bg-emerald-500', label: 'Подтверждена' },
                    { color: 'bg-rose-200', label: 'Отменена' },
                    { color: 'bg-slate-300', label: 'Завершена' },
                ].map(item => (
                    <span key={item.label} className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                        {item.label}
                    </span>
                ))}
            </div>

            <BookingDetailsModal
                isOpen={modalOpen}
                onClose={closeModal}
                booking={selectedBooking}
                providerId={profileId}
                onStatusUpdated={loadBookings}
            />
        </div>
    );
}
