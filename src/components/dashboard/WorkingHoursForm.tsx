'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Clock3, Loader2 } from 'lucide-react';
import { updateSchedule } from '@/app/actions/updateSchedule';
import toast from 'react-hot-toast';

type WorkingHoursFormProps = {
    profileId: number;
    initialSchedule: {
        startTime: string;
        endTime: string;
        workingDays: number[];
    };
};

const DAYS = [
    { id: 1, label: 'Пн' },
    { id: 2, label: 'Вт' },
    { id: 3, label: 'Ср' },
    { id: 4, label: 'Чт' },
    { id: 5, label: 'Пт' },
    { id: 6, label: 'Сб' },
    { id: 0, label: 'Вс' },
];

export function WorkingHoursForm({ profileId, initialSchedule }: WorkingHoursFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [workingDays, setWorkingDays] = useState<number[]>(initialSchedule.workingDays);

    const toggleDay = (day: number) => {
        setWorkingDays((prev) => {
            const exists = prev.includes(day);
            if (exists) return prev.filter((d) => d !== day);
            return [...prev, day].sort((a, b) => a - b);
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSaved(false);
        setError(null);

        const formData = new FormData(e.currentTarget);
        formData.set('profile_id', String(profileId));
        formData.delete('working_days');
        workingDays.forEach((day) => formData.append('working_days', String(day)));

        const result = await updateSchedule(formData);
        setIsSubmitting(false);

        if (result.success) {
            setSaved(true);
            toast.success('Рабочие часы сохранены');
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

            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Рабочие дни
                </label>
                <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day) => {
                        const active = workingDays.includes(day.id);
                        return (
                            <button
                                key={day.id}
                                type="button"
                                onClick={() => toggleDay(day.id)}
                                className={`h-9 rounded-lg border text-xs font-semibold transition ${
                                    active
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {day.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        С
                    </label>
                    <input
                        name="start_time"
                        type="time"
                        required
                        defaultValue={initialSchedule.startTime}
                        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-gray-300"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        До
                    </label>
                    <input
                        name="end_time"
                        type="time"
                        required
                        defaultValue={initialSchedule.endTime}
                        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-gray-300"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting || workingDays.length === 0}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
                Сохранить часы работы
            </button>
        </form>
    );
}
