'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    X,
    Check,
    Loader2,
    Clock,
    User,
    Phone,
    MessageCircle,
    Send,
} from 'lucide-react';
import { updateBookingStatus } from '@/app/actions/updateBookingStatus';
import { getOrCreateConversationForProvider } from '@/app/actions/chat';
import { Button } from '@/components/ui/button';

export interface BookingForModal {
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
        price: number | string;
        duration_min?: number;
    } | null;
}

const STATUS_CONFIG: Record<
    string,
    { label: string; bg: string; text: string; dot: string }
> = {
    pending: {
        label: 'Ожидает',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        dot: 'bg-amber-400',
    },
    confirmed: {
        label: 'Подтверждена',
        bg: 'bg-green-50',
        text: 'text-green-700',
        dot: 'bg-green-400',
    },
    cancelled: {
        label: 'Отменена',
        bg: 'bg-red-50',
        text: 'text-red-600',
        dot: 'bg-red-400',
    },
    completed: {
        label: 'Визит завершен',
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        dot: 'bg-gray-400',
    },
    no_show: {
        label: 'Не пришел',
        bg: 'bg-slate-100',
        text: 'text-slate-500',
        dot: 'bg-slate-400',
    },
};

const DEFAULT_STATUS = {
    label: 'Неизвестно',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
};

interface BookingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: BookingForModal | null;
    providerId: number;
    onStatusUpdated?: () => void;
}

export function BookingDetailsModal({
    isOpen,
    onClose,
    booking,
    providerId,
    onStatusUpdated,
}: BookingDetailsModalProps) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [isOpeningChat, setIsOpeningChat] = useState(false);
    const router = useRouter();

    if (!isOpen) return null;
    if (!booking) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />
                <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                    <p className="text-slate-600">Запись не найдена</p>
                    <Button variant="outline" className="mt-4" onClick={onClose}>
                        Закрыть
                    </Button>
                </div>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[booking.status] ?? DEFAULT_STATUS;
    const dateObj = new Date(booking.date);
    const formattedDate = dateObj.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(newStatus);
        await updateBookingStatus(booking.id, newStatus);
        setIsUpdating(null);
        onStatusUpdated?.();
    };

    const handleOpenChat = async () => {
        if (!booking.user_id || isOpeningChat) return;
        setIsOpeningChat(true);
        try {
            const result = await getOrCreateConversationForProvider(
                providerId,
                booking.user_id
            );
            if (!result?.success || !result.conversationId) {
                alert(result?.error ?? 'Не удалось открыть чат');
                return;
            }
            router.push(`/chat/${result.conversationId}`);
            onClose();
        } finally {
            setIsOpeningChat(false);
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
                className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="booking-details-title"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 id="booking-details-title" className="text-lg font-semibold text-slate-900">
                        Детали записи
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Закрыть"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                            <Clock className="h-6 w-6 text-slate-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900">{formattedDate}</p>
                            <p className="text-sm text-slate-500">{booking.time}</p>
                        </div>
                        <span
                            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                            {statusConfig.label}
                        </span>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{booking.user_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <a
                                href={`tel:${booking.user_phone}`}
                                className="text-blue-600 hover:underline"
                            >
                                {booking.user_phone}
                            </a>
                        </div>
                        {booking.service && (
                            <p className="text-sm text-slate-600">
                                Услуга: <span className="font-medium">{booking.service.title}</span>
                                {' · '}
                                {typeof booking.service.price === 'number'
                                    ? `€${booking.service.price.toFixed(0)}`
                                    : booking.service.price}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {booking.user_phone && (
                            <>
                                <a
                                    href={`https://wa.me/${booking.user_phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    WhatsApp
                                </a>
                                <a
                                    href={`https://t.me/+${booking.user_phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                                >
                                    <Send className="h-4 w-4" />
                                    Telegram
                                </a>
                            </>
                        )}
                        {booking.user_id && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleOpenChat}
                                disabled={isOpeningChat}
                            >
                                {isOpeningChat ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <MessageCircle className="h-4 w-4" />
                                )}
                                <span className="ml-2">Написать</span>
                            </Button>
                        )}
                    </div>

                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                            {booking.status === 'pending' && (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={() => handleStatusChange('confirmed')}
                                        disabled={isUpdating !== null}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {isUpdating === 'confirmed' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                        <span className="ml-2">Подтвердить</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusChange('cancelled')}
                                        disabled={isUpdating !== null}
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        {isUpdating === 'cancelled' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <X className="h-4 w-4" />
                                        )}
                                        <span className="ml-2">Отменить</span>
                                    </Button>
                                </>
                            )}
                            {booking.status === 'confirmed' && (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={() => handleStatusChange('completed')}
                                        disabled={isUpdating !== null}
                                    >
                                        {isUpdating === 'completed' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                        <span className="ml-2">Завершить визит</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusChange('no_show')}
                                        disabled={isUpdating !== null}
                                    >
                                        {isUpdating === 'no_show' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <X className="h-4 w-4" />
                                        )}
                                        <span className="ml-2">Не пришел</span>
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
