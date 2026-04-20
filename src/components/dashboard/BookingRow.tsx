'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, Clock, User, Phone, MessageCircle } from 'lucide-react';
import { updateBookingStatus } from '@/app/actions/updateBookingStatus';
import { getOrCreateConversationForProvider } from '@/app/actions/chat';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

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
    PENDING: {
        label: 'Ожидает',
        labelColor: 'text-amber-700',
        dotColor: 'bg-amber-400',
        pillBg: 'bg-transparent border border-amber-300',
        borderColor: 'border-l-amber-400',
        rowBg: '',
    },
    CONFIRMED: {
        label: 'Подтверждена',
        labelColor: 'text-emerald-700',
        dotColor: 'bg-emerald-500',
        pillBg: 'bg-transparent border border-emerald-300',
        borderColor: 'border-l-emerald-500',
        rowBg: '',
    },
    CANCELED: {
        label: 'Отменена',
        labelColor: 'text-rose-600',
        dotColor: 'bg-rose-400',
        pillBg: 'bg-transparent border border-rose-300',
        borderColor: 'border-l-rose-400',
        rowBg: '',
    },
    COMPLETED: {
        label: 'Визит завершён',
        labelColor: 'text-slate-500',
        dotColor: 'bg-slate-400',
        pillBg: 'bg-transparent border border-slate-300',
        borderColor: 'border-l-slate-300',
        rowBg: '',
    },
    NO_SHOW: {
        label: 'Не пришёл',
        labelColor: 'text-slate-500',
        dotColor: 'bg-slate-400',
        pillBg: 'bg-transparent border border-slate-300',
        borderColor: 'border-l-slate-300',
        rowBg: '',
    },
};

const DEFAULT_STATUS = {
    label: 'Неизвестно',
    labelColor: 'text-slate-500',
    dotColor: 'bg-slate-400',
    pillBg: 'bg-transparent border border-slate-300',
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
        try {
            const result = await updateBookingStatus(booking.id, newStatus);
            if (!result?.success) {
                toast.error(result?.error ?? 'Не удалось обновить статус');
            }
        } catch (err) {
            console.error('updateBookingStatus failed:', err);
            toast.error('Не удалось обновить статус');
        } finally {
            setIsUpdating(null);
        }
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
        <div className={`group relative bg-transparent border-l-2 ${cfg.borderColor} transition-colors duration-150 hover:bg-gray-50/40`}>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">

                {/* ── Date block ───────────────────────────── */}
                <div className="flex items-center gap-3 sm:w-[140px] sm:shrink-0">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-transparent border border-gray-300">
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
                        <span className="inline-flex items-center rounded-full border border-violet-300 bg-transparent px-2 py-0.5 text-[10px] font-semibold text-violet-600">
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
                                className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-transparent px-2.5 py-0.5 text-[11px] font-semibold text-green-700 hover:border-green-600 transition-colors"
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
                                className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-transparent px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 hover:border-gray-900 transition-colors disabled:opacity-50"
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
                            <span className="rounded-md border border-gray-300 bg-transparent px-1.5 py-0.5 text-[11px] font-bold text-slate-700">
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

                    {/* Action buttons — terminal states (COMPLETED/CANCELED/NO_SHOW) show none */}
                    {booking.status === 'PENDING' && (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handleStatusChange('CONFIRMED')}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {isUpdating === 'CONFIRMED'
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <Check className="h-3 w-3" />}
                                Подтвердить
                            </button>
                            <button
                                onClick={() => handleStatusChange('CANCELED')}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-500 disabled:opacity-50"
                            >
                                {isUpdating === 'CANCELED'
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <X className="h-3 w-3" />}
                                Отменить
                            </button>
                        </div>
                    )}

                    {booking.status === 'CONFIRMED' && (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handleStatusChange('COMPLETED')}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                            >
                                {isUpdating === 'COMPLETED'
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <Check className="h-3 w-3" />}
                                Завершить
                            </button>
                            <button
                                onClick={() => handleStatusChange('NO_SHOW')}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-gray-900 disabled:opacity-50"
                            >
                                {isUpdating === 'NO_SHOW'
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <X className="h-3 w-3" />}
                                Не пришёл
                            </button>
                            <button
                                onClick={() => handleStatusChange('CANCELED')}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-500 disabled:opacity-50"
                            >
                                {isUpdating === 'CANCELED'
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <X className="h-3 w-3" />}
                                Отменить
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
