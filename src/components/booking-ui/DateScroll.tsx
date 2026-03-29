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
    today 
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
        <section className="mb-10">
            <h2 className="font-serif text-2xl text-booking-textMain flex items-center gap-2 mb-4">
                <span className="text-booking-textMuted tracking-tight text-xl translate-y-[2px]">📅</span> 
                Выберите дату
            </h2>
            
            <div className="bg-booking-card rounded-[2rem] p-6 sm:p-8 shadow-soft-out border border-white/50">
                <div className="flex items-center justify-between mb-8">
                    <span className="font-medium text-booking-textMain text-lg">{capitalizedMonth}</span>
                    <div className="flex gap-4 text-booking-textMain">
                        <button onClick={onPrevWeek} disabled={weekStart <= today} className="active:scale-95 transition-transform disabled:opacity-30">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={onNextWeek} className="active:scale-95 transition-transform">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-y-6 sm:gap-x-4">
                    {/* Headers */}
                    {weekDates.map(day => (
                        <div key={'header-'+day.toISOString()} className="text-center text-xs font-semibold text-booking-textMuted uppercase tracking-wider">
                            {DAY_LABEL_FORMATTER.format(day)}
                        </div>
                    ))}
                    
                    {/* Days */}
                    {weekDates.map((day) => {
                        const dayKey = toDateKey(day);
                        const isSelected = selectedDateKey === dayKey;
                        const hasSlots = (availableSlots[dayKey] || []).length > 0;
                        const isPast = day < today;
                        const disabled = isPast || (!hasSlots && !isSelected); // If selected via finding nearest, don't disable yet

                        return (
                            <div key={dayKey} className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => !disabled && onSelectDate(dayKey)}
                                    disabled={disabled}
                                    className={`
                                        w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base sm:text-lg transition-all duration-300
                                        ${isSelected 
                                            ? 'bg-booking-primary text-white shadow-[0_6px_16px_rgba(47,75,58,0.3)] shadow-soft-in scale-110' 
                                            : disabled 
                                                ? 'opacity-30 cursor-not-allowed bg-booking-bg shadow-none' 
                                                : 'bg-[#F2EFE8] text-booking-textMain shadow-[4px_4px_8px_rgba(200,193,183,0.5),-4px_-4px_8px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_4px_rgba(200,193,183,0.5),-2px_-2px_4px_rgba(255,255,255,0.9)]'
                                        }
                                    `}
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
