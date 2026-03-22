'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock3, Loader2, Plus, X } from 'lucide-react';
import { updateSchedule } from '@/app/actions/updateSchedule';
import type { TimeInterval, WorkingDaySchedule } from '@/lib/scheduling';
import { timeToMinutes, minutesToTime, validateIntervals } from '@/lib/scheduling';
import toast from 'react-hot-toast';

type WorkingHoursFormProps = {
    profileId: number;
    initialSchedule: {
        days: WorkingDaySchedule[];
    };
};

type DayScheduleMap = Record<number, TimeInterval[]>;

const DAYS = [
    { id: 1, label: 'Пн' },
    { id: 2, label: 'Вт' },
    { id: 3, label: 'Ср' },
    { id: 4, label: 'Чт' },
    { id: 5, label: 'Пт' },
    { id: 6, label: 'Сб' },
    { id: 0, label: 'Вс' },
];

const DEFAULT_INTERVAL: TimeInterval = {
    start: '10:00',
    end: '18:00',
};

function buildInitialMap(days: WorkingDaySchedule[]): DayScheduleMap {
    return DAYS.reduce<DayScheduleMap>((acc, day) => {
        acc[day.id] = days.find((item) => item.day === day.id)?.intervals ?? [];
        return acc;
    }, {} as DayScheduleMap);
}

function createNextInterval(existing: TimeInterval[]): TimeInterval {
    const last = existing[existing.length - 1];
    if (!last) {
        return { ...DEFAULT_INTERVAL };
    }

    const lastStart = timeToMinutes(last.start);
    const lastEnd = timeToMinutes(last.end);
    const fallbackStart = Math.min(lastEnd, 22 * 60);
    const duration = Math.max(60, lastEnd - lastStart);
    const nextEnd = Math.min(fallbackStart + duration, 23 * 60 + 59);

    return {
        start: minutesToTime(fallbackStart),
        end: minutesToTime(nextEnd > fallbackStart ? nextEnd : Math.min(fallbackStart + 60, 23 * 60 + 59)),
    };
}

export function WorkingHoursForm({ profileId, initialSchedule }: WorkingHoursFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scheduleByDay, setScheduleByDay] = useState<DayScheduleMap>(() => buildInitialMap(initialSchedule.days));

    const activeDaysCount = useMemo(
        () => DAYS.filter((day) => (scheduleByDay[day.id] ?? []).length > 0).length,
        [scheduleByDay],
    );

    const toggleDay = (day: number) => {
        setScheduleByDay((prev) => {
            const current = prev[day] ?? [];
            if (current.length > 0) {
                return { ...prev, [day]: [] };
            }

            const sampleInterval = DAYS
                .flatMap((item) => prev[item.id] ?? [])[0];

            return {
                ...prev,
                [day]: [sampleInterval ? { ...sampleInterval } : { ...DEFAULT_INTERVAL }],
            };
        });
    };

    const applyPreset = (start: string, end: string) => {
        setScheduleByDay((prev) => {
            const next = { ...prev };
            DAYS.forEach((day) => {
                if ((next[day.id] ?? []).length > 0) {
                    next[day.id] = [{ start, end }];
                }
            });
            return next;
        });
    };

    const updateIntervalField = (day: number, index: number, field: keyof TimeInterval, value: string) => {
        setScheduleByDay((prev) => ({
            ...prev,
            [day]: (prev[day] ?? []).map((interval, intervalIndex) => (
                intervalIndex === index ? { ...interval, [field]: value } : interval
            )),
        }));
    };

    const addInterval = (day: number) => {
        setScheduleByDay((prev) => ({
            ...prev,
            [day]: [...(prev[day] ?? []), createNextInterval(prev[day] ?? [])],
        }));
    };

    const removeInterval = (day: number, index: number) => {
        setScheduleByDay((prev) => ({
            ...prev,
            [day]: (prev[day] ?? []).filter((_, intervalIndex) => intervalIndex !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSaved(false);
        setError(null);

        const days = DAYS
            .map((day) => ({
                day: day.id,
                intervals: (scheduleByDay[day.id] ?? []).filter((interval) => interval.start && interval.end),
            }))
            .filter((day) => day.intervals.length > 0);

        if (days.length === 0) {
            setIsSubmitting(false);
            setError('Выберите хотя бы один рабочий день и задайте интервал.');
            return;
        }

        for (const day of days) {
            const intervalError = validateIntervals(day.intervals);
            if (intervalError) {
                setIsSubmitting(false);
                setError(`${DAYS.find((item) => item.id === day.day)?.label || 'День'}: ${intervalError}`);
                return;
            }
        }

        const formData = new FormData(e.currentTarget);
        formData.set('profile_id', String(profileId));
        formData.set('schedule', JSON.stringify(days));

        const result = await updateSchedule(formData);
        setIsSubmitting(false);

        if (result.success) {
            setSaved(true);
            toast.success('Расписание сохранено');
            setTimeout(() => setSaved(false), 2500);
        } else {
            setError(result.error || 'Не удалось сохранить расписание.');
            toast.error(result.error || 'Не удалось сохранить расписание');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {error}
                </div>
            )}
            {saved && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    Расписание сохранено
                </div>
            )}

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Пресеты времени</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => applyPreset('09:00', '18:00')}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Стандарт: 09:00 - 18:00
                    </button>
                    <button
                        type="button"
                        onClick={() => applyPreset('10:00', '20:00')}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Вечерний: 10:00 - 20:00
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {DAYS.map((day) => {
                    const intervals = scheduleByDay[day.id] ?? [];
                    const active = intervals.length > 0;

                    return (
                        <div key={day.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                <button
                                    type="button"
                                    onClick={() => toggleDay(day.id)}
                                    className={`inline-flex h-11 min-w-[64px] items-center justify-center rounded-xl border text-sm font-semibold transition ${
                                        active
                                            ? 'border-gray-900 bg-gray-900 text-white'
                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {day.label}
                                </button>

                                <div className="min-w-0 flex-1 space-y-3">
                                    {active ? (
                                        <>
                                            {intervals.map((interval, index) => (
                                                <div key={`${day.id}-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                                    <div className="grid flex-1 grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                С
                                                            </label>
                                                            <input
                                                                type="time"
                                                                required
                                                                value={interval.start}
                                                                onChange={(e) => updateIntervalField(day.id, index, 'start', e.target.value)}
                                                                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-gray-300"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                До
                                                            </label>
                                                            <input
                                                                type="time"
                                                                required
                                                                value={interval.end}
                                                                onChange={(e) => updateIntervalField(day.id, index, 'end', e.target.value)}
                                                                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-gray-300"
                                                            />
                                                        </div>
                                                    </div>

                                                    {index > 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeInterval(day.id, index)}
                                                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                                                            aria-label="Удалить интервал"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    ) : (
                                                        <div className="hidden h-10 w-10 sm:block" aria-hidden="true" />
                                                    )}
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => addInterval(day.id)}
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-gray-900"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Добавить интервал
                                            </button>
                                        </>
                                    ) : (
                                        <p className="pt-2 text-sm text-gray-400">Выходной день</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                type="submit"
                disabled={isSubmitting || activeDaysCount === 0}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
                Сохранить часы работы
            </button>
        </form>
    );
}
