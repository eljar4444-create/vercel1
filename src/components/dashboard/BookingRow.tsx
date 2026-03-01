'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, Clock, User, Phone, MessageCircle } from 'lucide-react';
import { updateBookingStatus } from '@/app/actions/updateBookingStatus';
import { getOrCreateConversationForProvider } from '@/app/actions/chat';
import { Button } from '@/components/ui/button';

interface BookingData {
    id: number;
    date: string;
    time: string;
    user_id?: string | null;
    user_name: string;
    user_phone: string;
    status: string;
    created_at: string;
    service?: {
        id: number;
        title: string;
        price: string;
    } | null;
}

interface BookingRowProps {
    booking: BookingData;
    providerId: number;
    onStatusChange?: (bookingId: number, newStatus: string) => void;
    isPending?: boolean;
}

const STATUS_CONFIG: Record<string, {
    label: string;
    labelColor: string;
    dotColor: string;
    pillBg: string;
    borderColor: string;
    rowBg: string;
}> = {
    pending: {
        label: 'Ожидает',
        labelColor: 'text-amber-700',
        dotColor: 'bg-amber-400',
        pillBg: 'bg-amber-50 border border-amber-200',
        borderColor: 'border-l-amber-400',
        rowBg: 'hover:bg-amber-50/30',
    },
    confirmed: {
        label: 'Подтверждена',
        labelColor: 'text-emerald-700',
        dotColor: 'bg-emerald-500',
        pillBg: 'bg-emerald-50 border border-emerald-200',
        borderColor: 'border-l-emerald-500',
        rowBg: 'hover:bg-emerald-50/20',
    },
    cancelled: {
        label: 'Отменена',
        labelColor: 'text-rose-600',
        dotColor: 'bg-rose-400',
        pillBg: 'bg-rose-50 border border-rose-200',
        borderColor: 'border-l-rose-400',
        rowBg: 'hover:bg-rose-50/20',
    },
    completed: {
        label: 'Визит завершен',
        labelColor: 'text-slate-500',
        dotColor: 'bg-slate-400',
        pillBg: 'bg-slate-100 border border-slate-200',
        borderColor: 'border-l-slate-300',
        rowBg: 'hover:bg-slate-50/50',
    },
    no_show: {
        label: 'Не пришел',
        labelColor: 'text-slate-500',
        dotColor: 'bg-slate-400',
        pillBg: 'bg-slate-100 border border-slate-200',
        borderColor: 'border-l-slate-300',
        rowBg: 'hover:bg-slate-50/50',
    },
};

const DEFAULT_STATUS = {
    label: 'Неизвестно',
    labelColor: 'text-slate-500',
    dotColor: 'bg-slate-400',
    pillBg: 'bg-slate-100 border border-slate-200',
    borderColor: 'border-l-slate-200',
    rowBg: '',
};

export function BookingRow({ booking, providerId, onStatusChange, isPending }: BookingRowProps) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [isOpeningChat, setIsOpeningChat] = useState(false);
    const router = useRouter();
    const [, startNavTransition] = useTransition();

    const useOptimisticUpdate = typeof onStatusChange === 'function';
    const busy = useOptimisticUpdate ? isPending : isUpdating !== null;

    const handleStatusChange = async (newStatus: string) => {
        if (onStatusChange) {
            onStatusChange(booking.id, newStatus);
            return;
        }
        setIsUpdating(newStatus);
        await updateBookingStatus(booking.id, newStatus);
        setIsUpdating(null);
    };

    const cfg = STATUS_CONFIG[booking.status] ?? DEFAULT_STATUS;
    const dateObj = new Date(booking.date);
    const dayNum = dateObj.getDate();
    const monthShort = dateObj.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');
    const formattedDate = dateObj.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const handleOpenChat = async () => {
        if (!booking.user_id || isOpeningChat) return;
        setIsOpeningChat(true);
        try {
            const result = await getOrCreateConversationForProvider(providerId, booking.user_id);
            if (!result?.success || !result.conversationId) {
                alert(result?.error || 'Не удалось открыть чат');
                return;
            }
            startNavTransition(() => {
                router.push(`/chat/${result.conversationId}`);
            });
        } finally {
            setIsOpeningChat(false);
        }
    };

    return (
        <div className={`group relative overflow-hidden rounded-xl border border-slate-100 border-l-4 ${cfg.borderColor} bg-white shadow-sm transition-all duration-150 ${cfg.rowBg} hover:shadow-md`}>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">

                {/* ── Date block ───────────────────────────── */}
                <div className="flex items-center gap-3 sm:w-[140px] sm:shrink-0">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                        <span className="text-base font-extrabold leading-none text-slate-900">{dayNum}</span>
                        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{monthShort}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-700">{formattedDate}</p>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="font-semibold text-slate-600">{booking.time}</span>
                        </div>
                    </div>
                </div>

                {/* ── Client info ──────────────────────────── */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-900">{booking.user_name}</span>
                        <span className="inline-flex items-center rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 ring-1 ring-inset ring-violet-500/20">
                            ✨ Новый клиент
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                            <a
                                href={`tel:${booking.user_phone}`}
                                className="text-xs font-medium text-blue-600 hover:underline"
                            >
                                {booking.user_phone}
                            </a>
                        </div>
                        {booking.user_phone && (
                            <a
                                href={`https://wa.me/${booking.user_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 hover:bg-green-100 transition-colors"
                            >
                                <MessageCircle className="h-3 w-3" />
                                WhatsApp
                            </a>
                        )}
                        {booking.user_id && (
                            <button
                                type="button"
                                onClick={handleOpenChat}
                                disabled={isOpeningChat}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                {isOpeningChat
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <MessageCircle className="h-3 w-3" />}
                                Написать
                            </button>
                        )}
                    </div>

                    {booking.service && (
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-slate-500">{booking.service.title}</span>
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700">
                                {booking.service.price}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Status + Actions ─────────────────────── */}
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-col sm:items-end sm:gap-2">
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.pillBg} ${cfg.labelColor}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotColor}`} />
                        {cfg.label}
                    </span>

                    {/* Action buttons */}
                    {booking.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handleStatusChange('confirmed')}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 hover:shadow-sm disabled:opacity-50"
                            >
                                {isUpdating === 'confirmed'
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <Check className="h-3 w-3" />}
                                Подтвердить
                            </button>
                            <button
                                onClick={() => handleStatusChange('cancelled')}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                                {isUpdating === 'cancelled'
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <X className="h-3 w-3" />}
                                Отменить
                            </button>
                        </div>
                    )}

                    {booking.status === 'confirmed' && (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handleStatusChange('completed')}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 hover:shadow-sm disabled:opacity-50"
                            >
                                {isUpdating === 'completed'
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <Check className="h-3 w-3" />}
                                Завершить
                            </button>
                            <button
                                onClick={() => handleStatusChange('no_show')}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                {isUpdating === 'no_show'
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <X className="h-3 w-3" />}
                                Не пришел
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
