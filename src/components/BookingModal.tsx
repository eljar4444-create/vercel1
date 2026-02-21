'use client';

import { useCallback, useMemo, useState } from 'react';
import { X, Clock, User, Phone, CheckCircle, Loader2, MapPin, Star, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { createBooking, getAvailableSlots } from '@/app/actions/booking';
import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    masterName: string;
    profileId: number;
    selectedService?: {
        id?: number;
        title: string;
        price: string;
        duration_min?: number;
    } | null;
    initialDate?: string;
    initialTime?: string;
    masterAddress?: string;
    rating?: number;
    accentColor?: string;
}

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' });
const NEAREST_LABEL_FORMATTER = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: '2-digit', month: 'short' });

function startOfDay(date: Date) {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
}

function addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return startOfDay(next);
}

function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
    const [yearStr, monthStr, dayStr] = value.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    if (!year || !month || !day) return startOfDay(new Date());
    const parsed = new Date(year, month - 1, day);
    if (Number.isNaN(parsed.getTime())) return startOfDay(new Date());
    return startOfDay(parsed);
}

function formatDuration(durationMin: number) {
    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    if (!hours) return `${mins} мин`;
    if (!mins) return `${hours} ч`;
    return `${hours} ч ${mins} мин`;
}

function filterPastSlots(dateKey: string, slots: string[]) {
    const todayKey = toDateKey(startOfDay(new Date()));
    if (dateKey !== todayKey) return slots;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return slots.filter((slot) => {
        const [hourStr, minStr] = slot.split(':');
        const slotMinutes = Number(hourStr) * 60 + Number(minStr);
        return Number.isFinite(slotMinutes) && slotMinutes > currentMinutes;
    });
}

export function BookingModal({
    isOpen,
    onClose,
    masterName,
    profileId,
    selectedService,
    initialDate,
    initialTime,
    masterAddress,
    rating = 5,
    accentColor = 'rose',
}: BookingModalProps) {
    const { data: session, status } = useSession();
    const today = useMemo(() => startOfDay(new Date()), []);

    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [weekStart, setWeekStart] = useState<Date>(today);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weekSlots, setWeekSlots] = useState<Record<string, string[]>>({});
    const [isLoadingWeek, setIsLoadingWeek] = useState(false);
    const [isFindingNearest, setIsFindingNearest] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);

    const selectedDuration = selectedService?.duration_min || 60;
    const weekDates = useMemo(
        () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
        [weekStart]
    );
    const selectedDateLabel = date ? NEAREST_LABEL_FORMATTER.format(parseDateKey(date)) : '';
    const nearestInCurrentWeek = useMemo(() => {
        for (const day of weekDates) {
            const dayKey = toDateKey(day);
            const slots = weekSlots[dayKey] || [];
            if (slots.length > 0) {
                return { dateKey: dayKey, slot: slots[0], dateLabel: NEAREST_LABEL_FORMATTER.format(day) };
            }
        }
        return null;
    }, [weekDates, weekSlots]);

    useEffect(() => {
        if (!isOpen) return;
        if (initialDate) {
            const parsed = parseDateKey(initialDate);
            setWeekStart(parsed);
            setDate(initialDate);
        } else {
            setWeekStart(today);
            setDate('');
        }
        if (initialTime) {
            setTime(initialTime);
        } else {
            setTime('');
        }
        setWeekSlots({});
        setSlotsError(null);

        if (session?.user?.name && !name) {
            setName(session.user.name);
        }
    }, [isOpen, initialDate, initialTime, session?.user?.name, name, today]);

    const loadWeekSlots = useCallback(async (startDate: Date) => {
        const days = Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
        const entries = await Promise.all(
            days.map(async (day) => {
                const dayKey = toDateKey(day);
                const result = await getAvailableSlots({
                    profileId,
                    date: dayKey,
                    serviceDuration: selectedDuration,
                });

                if (!result.success) {
                    throw new Error(result.error || 'Не удалось загрузить слоты');
                }

                return [dayKey, filterPastSlots(dayKey, result.slots)] as const;
            })
        );

        return Object.fromEntries(entries) as Record<string, string[]>;
    }, [profileId, selectedDuration]);

    useEffect(() => {
        if (!isOpen) return;
        let isActive = true;
        setIsLoadingWeek(true);
        setSlotsError(null);

        loadWeekSlots(weekStart)
            .then((nextWeekSlots) => {
                if (!isActive) return;
                setWeekSlots(nextWeekSlots);

                if (date) {
                    const daySlots = nextWeekSlots[date] || [];
                    setTime((prev) => (prev && daySlots.includes(prev) ? prev : ''));
                }
            })
            .catch((loadError: any) => {
                if (!isActive) return;
                setWeekSlots({});
                setSlotsError(loadError?.message || 'Ошибка загрузки свободного времени');
            })
            .finally(() => {
                if (!isActive) return;
                setIsLoadingWeek(false);
            });

        return () => {
            isActive = false;
        };
    }, [isOpen, weekStart, date, loadWeekSlots]);

    if (!isOpen) return null;

    const selectSlot = (dayKey: string, slot: string) => {
        setDate(dayKey);
        setTime(slot);
    };

    const goPrevWeek = () => {
        const prev = addDays(weekStart, -7);
        if (prev >= today) {
            setWeekStart(prev);
        }
    };

    const goNextWeek = () => {
        setWeekStart(addDays(weekStart, 7));
    };

    const findNearestSlot = async () => {
        setIsFindingNearest(true);
        setSlotsError(null);
        try {
            for (let weekOffset = 0; weekOffset < 12; weekOffset++) {
                const start = addDays(today, weekOffset * 7);
                const slotsMap = await loadWeekSlots(start);
                const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

                for (const day of days) {
                    const dayKey = toDateKey(day);
                    const slots = slotsMap[dayKey] || [];
                    if (slots.length > 0) {
                        setWeekStart(start);
                        setWeekSlots(slotsMap);
                        setDate(dayKey);
                        setTime(slots[0]);
                        return;
                    }
                }
            }

            toast.error('Свободных слотов на ближайшие недели не найдено');
        } catch (nearestError: any) {
            setSlotsError(nearestError?.message || 'Не удалось найти ближайший слот');
        } finally {
            setIsFindingNearest(false);
        }
    };

    const isRose = accentColor === 'rose';
    const accentText = isRose ? 'text-blue-600' : 'text-teal-600';
    const accentBg = isRose ? 'bg-blue-50' : 'bg-teal-50';
    const canSubmit = Boolean(time);
    const authButtonText = canSubmit ? 'Войти и подтвердить запись' : 'Сначала выберите время';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const result = await createBooking({
            profileId,
            serviceId: selectedService?.id || null,
            serviceDuration: selectedDuration,
            date,
            time,
            userName: name,
            userPhone: phone,
        });

        setIsSubmitting(false);

        if (result.success) {
            toast.success('Успешно! Вы записаны');
            setIsSubmitted(true);
        } else {
            setError(result.error || 'Произошла ошибка. Попробуйте позже.');
            toast.error(result.error || 'Не удалось создать запись');
        }
    };

    const getSignInCallbackUrl = () => {
        if (typeof window === 'undefined') return '/auth/login';

        const url = new URL(window.location.href);
        url.searchParams.set('book', '1');
        if (selectedService?.id) url.searchParams.set('service', String(selectedService.id));
        if (date) url.searchParams.set('date', date);
        if (time) url.searchParams.set('time', time);
        return url.toString();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />

            <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-slideUp">
                {isSubmitted ? (
                    <div className="p-10 text-center">
                        <div className={`w-20 h-20 ${accentBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                            <CheckCircle className={`w-10 h-10 ${accentText}`} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Заявка отправлена!</h3>
                        <p className="text-gray-500">
                            Мастер свяжется с вами для подтверждения записи.
                        </p>
                        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                            <Link
                                href="/my-bookings"
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-800"
                            >
                                Перейти в мои записи
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSubmitted(false);
                                    setDate('');
                                    setTime('');
                                    setWeekSlots({});
                                    setName('');
                                    setPhone('');
                                    onClose();
                                }}
                                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="relative border-b border-slate-100 px-6 py-5 md:px-8">
                            <button
                                onClick={onClose}
                                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="pr-12 text-xl font-semibold text-slate-900">Бронирование</h2>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">{masterName}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-slate-500" />
                                    {masterAddress || 'Адрес уточняется'}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    {rating.toFixed(1)}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-6 md:px-8">
                            {error && (
                                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <section>
                                <h3 className={`text-2xl font-semibold ${accentText}`}>1. Выбранная услуга</h3>
                                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-base font-semibold text-slate-900">
                                                {selectedService?.title || 'Услуга будет уточнена у мастера'}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {formatDuration(selectedDuration)} · {masterName}
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-lg font-semibold text-slate-900">{selectedService?.price || '—'}</p>
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="mt-1 text-sm text-blue-600 transition hover:underline"
                                            >
                                                Изменить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mt-3 inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    + Добавить еще одну услугу
                                </button>
                            </section>

                            <section className="mt-8">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <h3 className="text-2xl font-semibold text-slate-900">2. Выберите дату и время</h3>
                                    <button
                                        type="button"
                                        onClick={findNearestSlot}
                                        disabled={isFindingNearest}
                                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {isFindingNearest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                        {nearestInCurrentWeek
                                            ? `Ближайшее время: ${nearestInCurrentWeek.dateLabel} · ${nearestInCurrentWeek.slot}`
                                            : 'Найти ближайшее время'}
                                    </button>
                                </div>

                                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 md:p-4">
                                    <div className="flex items-start gap-2">
                                        <button
                                            type="button"
                                            onClick={goPrevWeek}
                                            disabled={weekStart <= today}
                                            className="mt-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 md:inline-flex"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>

                                        <div className="flex-1 overflow-x-auto pb-1">
                                            <div className="grid min-w-max grid-flow-col auto-cols-[140px] gap-3 md:min-w-0 md:grid-cols-7 md:grid-flow-row md:auto-cols-auto md:gap-4">
                                                {weekDates.map((day) => {
                                                    const dayKey = toDateKey(day);
                                                    const slots = weekSlots[dayKey] || [];
                                                    const isCurrentDay = dayKey === date;
                                                    return (
                                                        <div
                                                            key={dayKey}
                                                            className={`rounded-xl border p-3 ${
                                                                isCurrentDay ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
                                                            }`}
                                                        >
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                {DAY_LABEL_FORMATTER.format(day)}
                                                            </p>
                                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                                {DATE_LABEL_FORMATTER.format(day)}
                                                            </p>

                                                            <div className="mt-3 flex max-h-56 flex-col gap-2 overflow-y-auto">
                                                                {isLoadingWeek ? (
                                                                    <>
                                                                        <div className="h-8 rounded-md bg-slate-100" />
                                                                        <div className="h-8 rounded-md bg-slate-100" />
                                                                    </>
                                                                ) : slots.length === 0 ? (
                                                                    <p className="text-xs text-slate-400">Нет слотов</p>
                                                                ) : (
                                                                    slots.map((slot) => {
                                                                        const isSelected = date === dayKey && time === slot;
                                                                        return (
                                                                            <button
                                                                                key={slot}
                                                                                type="button"
                                                                                onClick={() => selectSlot(dayKey, slot)}
                                                                                className={`h-9 rounded-md px-2 text-sm font-medium transition ${
                                                                                    isSelected
                                                                                        ? 'bg-slate-900 text-white'
                                                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                                                }`}
                                                                            >
                                                                                {slot}
                                                                            </button>
                                                                        );
                                                                    })
                                                                )}
                                    </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={goNextWeek}
                                            className="mt-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 md:inline-flex"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {slotsError ? (
                                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {slotsError}
                                    </div>
                                ) : null}

                                {canSubmit ? (
                                    <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                        <Clock className="h-3.5 w-3.5" />
                                        Выбрано: {selectedDateLabel} · {time}
                                    </p>
                                ) : (
                                    <p className="mt-3 text-sm text-slate-500">Выберите любой свободный слот для продолжения.</p>
                                )}
                            </section>

                            <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <User className="h-4 w-4 text-slate-400" />
                                        Ваше имя
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ваше имя"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        Телефон
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+49 ..."
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                    />
                                </div>
                            </section>

                            <section className="mt-8">
                                {status !== 'authenticated' ? (
                                    <button
                                        type="button"
                                        disabled={!canSubmit}
                                        onClick={() => signIn(undefined, { callbackUrl: getSignInCallbackUrl() })}
                                        className="flex h-14 w-full items-center justify-center rounded-xl bg-slate-900 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {authButtonText}
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !canSubmit || !session?.user}
                                        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Отправка...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-5 w-5" />
                                                Подтвердить запись
                                            </>
                                        )}
                                    </button>
                                )}
                            </section>
                        </form>
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
                .animate-slideUp { animation: slideUp 0.3s ease-out; }
            `}</style>
        </div>
    );
}
