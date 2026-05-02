'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock3, Loader2, Plus, X } from 'lucide-react';
import { updateSchedule } from '@/app/actions/updateSchedule';
import type { TimeInterval, WorkingDaySchedule } from '@/lib/scheduling';
import { timeToMinutes, minutesToTime, validateIntervals } from '@/lib/scheduling';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

type WorkingHoursFormProps = {
    profileId: number;
    initialSchedule: {
        days: WorkingDaySchedule[];
    };
};

type DayScheduleMap = Record<number, TimeInterval[]>;

const DAY_IDS = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_INTERVAL: TimeInterval = {
    start: '10:00',
    end: '18:00',
};

function buildInitialMap(days: WorkingDaySchedule[]): DayScheduleMap {
    return DAY_IDS.reduce<DayScheduleMap>((acc, dayId) => {
        acc[dayId] = days.find((item) => item.day === dayId)?.intervals ?? [];
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
    const t = useTranslations('dashboard.provider.workingHours');
    const DAYS = useMemo(() => [
        { id: 1, label: t('days.mon') },
        { id: 2, label: t('days.tue') },
        { id: 3, label: t('days.wed') },
        { id: 4, label: t('days.thu') },
        { id: 5, label: t('days.fri') },
        { id: 6, label: t('days.sat') },
        { id: 0, label: t('days.sun') },
    ], [t]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scheduleByDay, setScheduleByDay] = useState<DayScheduleMap>(() => buildInitialMap(initialSchedule.days));

    const activeDaysCount = useMemo(
        () => DAYS.filter((day) => (scheduleByDay[day.id] ?? []).length > 0).length,
        [DAYS, scheduleByDay],
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
            setError(t('selectDayError'));
            return;
        }

        for (const day of days) {
            const intervalError = validateIntervals(day.intervals);
            if (intervalError) {
                setIsSubmitting(false);
                setError(`${DAYS.find((item) => item.id === day.day)?.label || t('dayFallback')}: ${intervalError}`);
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
            toast.success(t('saved'));
            setTimeout(() => setSaved(false), 2500);
        } else {
            setError(result.error || t('saveError'));
            toast.error(result.error || t('saveErrorShort'));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="flex items-center gap-2 border-l-2 border-red-500 px-3 py-2 text-xs text-red-700">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {error}
                </div>
            )}
            {saved && (
                <div className="flex items-center gap-2 border-l-2 border-green-500 px-3 py-2 text-xs text-green-700">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {t('saved')}
                </div>
            )}

            <div className="border-l-2 border-gray-300 pl-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('presets')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => applyPreset('09:00', '18:00')}
                        className="rounded-full border border-gray-300 bg-transparent px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-900 transition-colors"
                    >
                        {t('standardPreset')}
                    </button>
                    <button
                        type="button"
                        onClick={() => applyPreset('10:00', '20:00')}
                        className="rounded-full border border-gray-300 bg-transparent px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-900 transition-colors"
                    >
                        {t('eveningPreset')}
                    </button>
                </div>
            </div>

            <div className="divide-y divide-gray-200">
                {DAYS.map((day) => {
                    const intervals = scheduleByDay[day.id] ?? [];
                    const active = intervals.length > 0;

                    return (
                        <div key={day.id} className="bg-transparent py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                <button
                                    type="button"
                                    onClick={() => toggleDay(day.id)}
                                    className={`inline-flex h-11 min-w-[64px] items-center justify-center rounded-md border bg-transparent text-sm font-semibold transition-colors ${
                                        active
                                            ? 'border-gray-900 text-gray-900'
                                            : 'border-gray-300 text-gray-500 hover:border-gray-900'
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
                                                                {t('from')}
                                                            </label>
                                                            <input
                                                                type="time"
                                                                required
                                                                value={interval.start}
                                                                onChange={(e) => updateIntervalField(day.id, index, 'start', e.target.value)}
                                                                className="h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                {t('to')}
                                                            </label>
                                                            <input
                                                                type="time"
                                                                required
                                                                value={interval.end}
                                                                onChange={(e) => updateIntervalField(day.id, index, 'end', e.target.value)}
                                                                className="h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors"
                                                            />
                                                        </div>
                                                    </div>

                                                    {index > 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeInterval(day.id, index)}
                                                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-transparent text-gray-400 transition-colors hover:border-red-500 hover:text-red-500"
                                                            aria-label={t('deleteInterval')}
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
                                                {t('addInterval')}
                                            </button>
                                        </>
                                    ) : (
                                        <p className="pt-2 text-sm text-gray-400">{t('dayOff')}</p>
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
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
            >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
                {t('saveHours')}
            </button>
        </form>
    );
}
