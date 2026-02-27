'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getProviderBookingsForWeek } from '@/app/actions/getProviderBookingsForWeek';
import { BookingDetailsModal, type BookingForModal } from '@/components/dashboard/BookingDetailsModal';

const HOUR_START = 8;
const HOUR_END = 22;
const SLOT_MINUTES = 30;
const ROW_HEIGHT_PX = 40;

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const STATUS_CARD_STYLES: Record<string, string> = {
    pending: 'bg-amber-400/90 text-amber-950 border-amber-500/30',
    confirmed: 'bg-emerald-500/90 text-white border-emerald-600/30',
    completed: 'bg-slate-300/70 text-slate-700 border-slate-400/30',
    no_show: 'bg-slate-300/60 text-slate-600 border-slate-400/20',
    cancelled: 'bg-slate-300/50 text-slate-500 border-slate-400/20',
};

function getDefaultWeekStart(): Date {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
}

function toWeekStartKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

/** Monday = 0, Sunday = 6 */
function getDayIndex(d: Date): number {
    const day = d.getDay();
    return day === 0 ? 6 : day - 1;
}

function timeToSlotRow(time: string): number {
    const [h, m] = time.split(':').map(Number);
    const minutes = (h ?? 0) * 60 + (m ?? 0);
    const startMinutes = HOUR_START * 60;
    const slotIndex = Math.floor((minutes - startMinutes) / SLOT_MINUTES);
    return Math.max(0, slotIndex);
}

function durationToRowSpan(durationMin: number): number {
    return Math.max(1, Math.ceil(durationMin / SLOT_MINUTES));
}

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
    const timeLabels = Array.from({ length: totalSlots }, (_, i) => {
        const totalMin = HOUR_START * 60 + i * SLOT_MINUTES;
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    });

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

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const goPrevWeek = () => setWeekStart((d) => addWeeks(d, -1));
    const goNextWeek = () => setWeekStart((d) => addWeeks(d, 1));
    const goToday = () => setWeekStart(getDefaultWeekStart());

    const openModal = (booking: BookingForModal) => {
        setSelectedBooking(booking);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedBooking(null);
    };

    const handleStatusUpdated = () => {
        loadBookings();
    };

    const weekRangeLabel = `${format(weekDays[0], 'd MMM', { locale: ru })} – ${format(weekDays[6], 'd MMM yyyy', { locale: ru })}`;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-slate-500" />
                    <span className="font-semibold text-slate-900">{weekRangeLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={goPrevWeek}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                        aria-label="Предыдущая неделя"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={goToday}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Сегодня
                    </button>
                    <button
                        type="button"
                        onClick={goNextWeek}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                        aria-label="Следующая неделя"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
                    Загрузка записей...
                </div>
            )}

            {!loading && (
            <div className="overflow-x-auto relative">
                <div
                    className="min-w-[600px] p-4 relative"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '56px repeat(7, minmax(0, 1fr))',
                        gridTemplateRows: `32px repeat(${totalSlots}, ${ROW_HEIGHT_PX}px)`,
                    }}
                >
                    {/* Corner */}
                    <div className="border-b border-r border-slate-200 bg-slate-50/80" style={{ gridColumn: 1, gridRow: 1 }} />

                    {/* Day headers */}
                    {weekDays.map((day, dayIdx) => (
                        <div
                            key={day.toISOString()}
                            className={`flex items-center justify-center border-b border-slate-200 text-xs font-semibold ${
                                isSameDay(day, new Date())
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-50/80 text-slate-600'
                            }`}
                            style={{ gridColumn: dayIdx + 2, gridRow: 1 }}
                        >
                            <span className="hidden sm:inline">{format(day, 'EEE', { locale: ru })}</span>
                            <span className="sm:hidden">{DAY_LABELS[getDayIndex(day)]}</span>
                            <span className="ml-1 text-slate-400">({format(day, 'd')})</span>
                        </div>
                    ))}

                    {/* Time column */}
                    {timeLabels.map((label, rowIdx) => (
                        <div
                            key={label}
                            className="border-r border-slate-100 pr-1 text-right text-xs text-slate-400"
                            style={{ gridColumn: 1, gridRow: rowIdx + 2 }}
                        >
                            {rowIdx % 2 === 0 ? label : ''}
                        </div>
                    ))}

                    {/* Day columns: each is a grid containing slot cells and booking blocks */}
                    {weekDays.map((day, dayIdx) => {
                        const dayStart = new Date(day);
                        dayStart.setHours(0, 0, 0, 0);
                        const dayEnd = new Date(day);
                        dayEnd.setHours(23, 59, 59, 999);
                        const dayBookings = bookings.filter((b) => {
                            const d = parseISO(b.date);
                            return isWithinInterval(d, { start: dayStart, end: dayEnd });
                        });

                        return (
                            <div
                                key={day.toISOString()}
                                className="border-r border-slate-100 last:border-r-0 relative"
                                style={{
                                    gridColumn: dayIdx + 2,
                                    gridRow: `2 / -1`,
                                    display: 'grid',
                                    gridTemplateRows: `repeat(${totalSlots}, ${ROW_HEIGHT_PX}px)`,
                                    gap: 2,
                                    padding: 2,
                                }}
                            >
                                {timeLabels.map((_, rowIdx) => (
                                    <div
                                        key={rowIdx}
                                        className="border-b border-slate-50"
                                        style={{ gridRow: rowIdx + 1 }}
                                    />
                                ))}
                                {dayBookings.map((b) => {
                                    const row = timeToSlotRow(b.time);
                                    const span = b.service?.duration_min
                                        ? durationToRowSpan(b.service.duration_min)
                                        : durationToRowSpan(60);
                                    const cardStyle =
                                        STATUS_CARD_STYLES[b.status] ?? 'bg-slate-300/60 text-slate-600';
                                    const [h, m] = b.time.split(':').map(Number);
                                    const endMin = (h ?? 0) * 60 + (m ?? 0) + (b.service?.duration_min ?? 60);
                                    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

                                    return (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => openModal(b)}
                                            className={`absolute left-0.5 right-0.5 text-left rounded-lg border shadow-sm hover:shadow transition overflow-hidden ${cardStyle}`}
                                            style={{
                                                top: 2 + row * (ROW_HEIGHT_PX + 2),
                                                height: ROW_HEIGHT_PX * span + (span - 1) * 2 - 2,
                                                zIndex: 1,
                                            }}
                                        >
                                            <div className="p-1.5 text-[11px] leading-tight truncate h-full flex flex-col justify-center">
                                                <span className="font-semibold truncate">
                                                    {b.time} – {endTime}
                                                </span>
                                                <span className="truncate mt-0.5">{b.user_name}</span>
                                                {b.service && (
                                                    <span className="truncate opacity-90">
                                                        {b.service.title}
                                                    </span>
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
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-amber-400/90" />
                    Ожидает
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-emerald-500/90" />
                    Подтверждена
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-slate-300/70" />
                    Завершена / Отмена
                </span>
            </div>

            <BookingDetailsModal
                isOpen={modalOpen}
                onClose={closeModal}
                booking={selectedBooking}
                providerId={profileId}
                onStatusUpdated={handleStatusUpdated}
            />
        </div>
    );
}
