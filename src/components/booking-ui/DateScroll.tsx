'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });

export function DateScroll({
    weekStart,
    selectedDateKey,
    availableSlots,
    onSelectDate,
    onPrevWeek,
    onNextWeek,
    today,
}: {
    weekStart: Date;
    selectedDateKey: string;
    availableSlots: Record<string, string[]>;
    onSelectDate: (dateKey: string) => void;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    today: Date;
}) {
    const weekDates = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [weekStart]);

    const toDateKey = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const monthName = weekStart.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return (
        <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-booking-textMuted mb-4">
                Дата
            </h2>

            <div className="rounded-2xl border border-booking-border bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                    <span className="font-medium text-booking-textMain text-base">{capitalizedMonth}</span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={onPrevWeek}
                            disabled={weekStart <= today}
                            className="h-9 w-9 flex items-center justify-center rounded-lg border border-booking-border text-booking-textMain transition-colors hover:bg-booking-bg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            aria-label="Предыдущая неделя"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onNextWeek}
                            className="h-9 w-9 flex items-center justify-center rounded-lg border border-booking-border text-booking-textMain transition-colors hover:bg-booking-bg"
                            aria-label="Следующая неделя"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {weekDates.map((day) => (
                        <div
                            key={'header-' + day.toISOString()}
                            className="text-center text-[11px] font-medium text-booking-textMuted uppercase tracking-wider pb-2"
                        >
                            {DAY_LABEL_FORMATTER.format(day)}
                        </div>
                    ))}

                    {weekDates.map((day) => {
                        const dayKey = toDateKey(day);
                        const isSelected = selectedDateKey === dayKey;
                        const hasSlots = (availableSlots[dayKey] || []).length > 0;
                        const isPast = day < today;
                        const disabled = isPast || (!hasSlots && !isSelected);

                        return (
                            <div key={dayKey} className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => !disabled && onSelectDate(dayKey)}
                                    disabled={disabled}
                                    className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center text-sm sm:text-base font-medium transition-colors duration-150 border ${
                                        isSelected
                                            ? 'bg-booking-primary text-white border-booking-primary'
                                            : disabled
                                                ? 'border-transparent text-booking-textMuted/40 cursor-not-allowed'
                                                : 'bg-white text-booking-textMain border-booking-border hover:border-booking-primary'
                                    }`}
                                >
                                    {day.getDate()}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
