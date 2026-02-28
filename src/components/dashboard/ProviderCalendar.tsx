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
    pending: 'bg-amber-400 text-amber-950 border-2 border-amber-600/50 shadow',
    confirmed: 'bg-emerald-500 text-white border-2 border-emerald-700/60 shadow',
    completed: 'bg-slate-400 text-white border-2 border-slate-500 shadow-sm',
    no_show: 'bg-slate-300 text-slate-800 border-2 border-slate-400 shadow-sm',
    cancelled: 'bg-slate-200 text-slate-700 border-2 border-slate-400 shadow-sm',
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
                                className={`flex items-center justify-center border-b border-slate-200 text-xs font-semibold ${isSameDay(day, new Date())
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

                            // Calculate exact coordinates for overlaps
                            const processedBookings = dayBookings.map((b) => {
                                const [h, m] = b.time.split(':').map(Number);
                                const startMin = (h ?? 0) * 60 + (m ?? 0);
                                const durationMin = b.service?.duration_min || 60;
                                const endMin = startMin + durationMin;
                                return { ...b, startMin, endMin, durationMin };
                            }).sort((a, b) => a.startMin - b.startMin);

                            const clusters: typeof processedBookings[] = [];
                            let currentCluster: typeof processedBookings = [];
                            let currentClusterEnd = 0;

                            processedBookings.forEach((b) => {
                                if (currentCluster.length === 0) {
                                    currentCluster.push(b);
                                    currentClusterEnd = b.endMin;
                                } else {
                                    if (b.startMin < currentClusterEnd) {
                                        currentCluster.push(b);
                                        currentClusterEnd = Math.max(currentClusterEnd, b.endMin);
                                    } else {
                                        clusters.push(currentCluster);
                                        currentCluster = [b];
                                        currentClusterEnd = b.endMin;
                                    }
                                }
                            });
                            if (currentCluster.length > 0) {
                                clusters.push(currentCluster);
                            }

                            const finalBookings: (typeof processedBookings[0] & { colIndex: number; totalCols: number })[] = [];
                            clusters.forEach((cluster) => {
                                const columns: typeof processedBookings[] = [];
                                cluster.forEach((b) => {
                                    let placed = false;
                                    for (let i = 0; i < columns.length; i++) {
                                        const lastInCol = columns[i][columns[i].length - 1];
                                        if (lastInCol.endMin <= b.startMin) {
                                            columns[i].push(b);
                                            finalBookings.push({ ...b, colIndex: i, totalCols: 1 });
                                            placed = true;
                                            break;
                                        }
                                    }
                                    if (!placed) {
                                        columns.push([b]);
                                        finalBookings.push({ ...b, colIndex: columns.length - 1, totalCols: 1 });
                                    }
                                });
                                finalBookings.forEach((b) => {
                                    if (cluster.some((cb) => cb.id === b.id)) {
                                        b.totalCols = columns.length;
                                    }
                                });
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
                                    {finalBookings.map((b) => {
                                        const PIXELS_PER_MIN = (ROW_HEIGHT_PX + 2) / SLOT_MINUTES;
                                        const topPx = 2 + (b.startMin - HOUR_START * 60) * PIXELS_PER_MIN;
                                        const heightPx = Math.max(15, b.durationMin * PIXELS_PER_MIN - 2);

                                        const cardStyle =
                                            STATUS_CARD_STYLES[b.status] ?? 'bg-slate-200 text-slate-700 border-2 border-slate-400 shadow-sm';
                                        const endTime = `${String(Math.floor(b.endMin / 60)).padStart(2, '0')}:${String(b.endMin % 60).padStart(2, '0')}`;

                                        return (
                                            <button
                                                key={b.id}
                                                type="button"
                                                onClick={() => openModal(b)}
                                                className={`absolute text-left rounded-lg shadow hover:shadow-md transition overflow-hidden font-medium ${cardStyle}`}
                                                style={{
                                                    top: `${topPx}px`,
                                                    height: `${heightPx}px`,
                                                    left: `calc(${b.colIndex * (100 / b.totalCols)}% + 3px)`,
                                                    width: `calc(${100 / b.totalCols}% - 6px)`,
                                                    zIndex: 1,
                                                }}
                                            >
                                                <div className="p-2 text-xs leading-snug truncate h-full flex flex-col justify-center gap-0.5">
                                                    <span className="font-bold truncate block">
                                                        {b.time} – {endTime}
                                                    </span>
                                                    <span className="truncate font-medium">{b.user_name}</span>
                                                    {b.service && (
                                                        <span className="truncate opacity-95 text-[11px]">
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
