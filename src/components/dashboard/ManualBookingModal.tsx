'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface ManualBookingService {
    id: number;
    title: string;
    price: number | string;
    duration_min: number;
}

export interface ManualBookingStaff {
    id: string;
    name: string;
}

interface ManualBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    profileId: number;
    services: ManualBookingService[];
    staff: ManualBookingStaff[];
    onCreated?: () => void;
}

const inputClass =
    'w-full h-10 px-3 text-sm bg-transparent border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 placeholder:text-gray-400';

export function ManualBookingModal({
    isOpen,
    onClose,
    profileId,
    services,
    staff,
    onCreated,
}: ManualBookingModalProps) {
    const t = useTranslations('dashboard.provider.manualBooking');
    const router = useRouter();
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [serviceId, setServiceId] = useState<number | null>(null);
    const [staffId, setStaffId] = useState<string | null>(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [serviceQuery, setServiceQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setClientName('');
            setClientPhone('');
            setServiceId(null);
            setStaffId(null);
            setDate('');
            setTime('');
            setServiceQuery('');
            setError(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const filteredServices = useMemo(() => {
        const q = serviceQuery.trim().toLowerCase();
        if (!q) return services;
        return services.filter((s) => s.title.toLowerCase().includes(q));
    }, [services, serviceQuery]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!clientName.trim()) return setError(t('errors.clientName'));
        if (!clientPhone.trim()) return setError(t('errors.clientPhone'));
        if (!serviceId) return setError(t('errors.service'));
        if (!date) return setError(t('errors.date'));
        if (!time) return setError(t('errors.time'));

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/bookings/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profileId,
                    serviceId,
                    staffId: staffId || null,
                    date,
                    time,
                    clientName: clientName.trim(),
                    clientPhone: clientPhone.trim(),
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.error ?? t('errors.create'));
                setIsSubmitting(false);
                return;
            }

            router.refresh();
            onCreated?.();
            onClose();
        } catch (err) {
            console.error('manual booking error:', err);
            setError(t('errors.network'));
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden
            />
            <div
                className="relative w-full max-w-md rounded-md border border-gray-300 bg-[#faf8f5] shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="manual-booking-title"
            >
                <div className="flex items-center justify-between border-b border-gray-300 px-5 py-4">
                    <h2
                        id="manual-booking-title"
                        className="text-base font-semibold text-gray-900"
                    >
                        {t('newBooking')}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        aria-label={t('close')}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            {t('clientName')}
                        </label>
                        <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className={inputClass}
                            placeholder={t('clientNamePlaceholder')}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            {t('phone')}
                        </label>
                        <input
                            type="tel"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className={inputClass}
                            placeholder="+49 ..."
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            {t('service')}
                        </label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={serviceQuery}
                                onChange={(e) => setServiceQuery(e.target.value)}
                                className={`${inputClass} pl-8`}
                                placeholder={t('serviceSearchPlaceholder')}
                            />
                        </div>
                        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md bg-white/50">
                            {filteredServices.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-gray-400">
                                    {t('nothingFound')}
                                </div>
                            ) : (
                                filteredServices.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setServiceId(s.id)}
                                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm border-b border-gray-200 last:border-b-0 hover:bg-gray-50 ${
                                            serviceId === s.id
                                                ? 'bg-gray-100 font-medium'
                                                : ''
                                        }`}
                                    >
                                        <span className="text-gray-900">{s.title}</span>
                                        <span className="text-xs text-gray-500">
                                            {t('durationMin', { count: s.duration_min })}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {staff.length > 0 && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                {t('staff')}
                            </label>
                            <select
                                value={staffId ?? ''}
                                onChange={(e) => setStaffId(e.target.value || null)}
                                className={inputClass}
                            >
                                <option value="">{t('noStaff')}</option>
                                {staff.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                {t('date')}
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                {t('time')}
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="border-l-2 border-red-500 bg-red-50/50 px-3 py-2 text-xs text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-full border border-gray-300 bg-transparent px-5 py-2 text-sm font-medium text-gray-700 hover:border-gray-900 hover:bg-gray-50 disabled:opacity-50"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {t('createBooking')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
