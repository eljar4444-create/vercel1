'use client';

import { useState } from 'react';
import { Check, X, Loader2, Calendar, Clock, User, Phone } from 'lucide-react';
import { updateBookingStatus } from '@/app/actions/updateBookingStatus';

interface BookingData {
    id: number;
    date: string;       // ISO string
    time: string;
    user_name: string;
    user_phone: string;
    status: string;
    created_at: string; // ISO string
    service?: {
        id: number;
        title: string;
        price: string;
    } | null;
}

interface BookingRowProps {
    booking: BookingData;
}

// ─── Status config ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
    label: string;
    bg: string;
    text: string;
    dot: string;
}> = {
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
};

const DEFAULT_STATUS = {
    label: 'Неизвестно',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
};

export function BookingRow({ booking }: BookingRowProps) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const statusConfig = STATUS_CONFIG[booking.status] || DEFAULT_STATUS;

    const dateObj = new Date(booking.date);
    const formattedDate = dateObj.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const createdDate = new Date(booking.created_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
    });

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(newStatus);
        await updateBookingStatus(booking.id, newStatus);
        setIsUpdating(null);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* ── Date & Time Block ── */}
                <div className="flex items-center gap-3 sm:w-[180px] flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex flex-col items-center justify-center border border-gray-100">
                        <span className="text-xs font-bold text-gray-900 leading-tight">
                            {dateObj.getDate()}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase leading-tight">
                            {dateObj.toLocaleDateString('ru-RU', { month: 'short' })}
                        </span>
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-900">{formattedDate}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {booking.time}
                        </div>
                    </div>
                </div>

                {/* ── Client Info ── */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{booking.user_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <a href={`tel:${booking.user_phone}`} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                            {booking.user_phone}
                        </a>
                    </div>
                    {booking.service && (
                        <div className="mt-1.5 text-xs text-gray-500">
                            Услуга: <span className="font-medium text-gray-700">{booking.service.title}</span>
                            <span className="ml-1.5 text-gray-400">— {booking.service.price}</span>
                        </div>
                    )}
                </div>

                {/* ── Status Badge ── */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        {statusConfig.label}
                    </span>
                </div>

                {/* ── Action Buttons ── */}
                {booking.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => handleStatusChange('confirmed')}
                            disabled={isUpdating !== null}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {isUpdating === 'confirmed' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Check className="w-3.5 h-3.5" />
                            )}
                            Подтвердить
                        </button>
                        <button
                            onClick={() => handleStatusChange('cancelled')}
                            disabled={isUpdating !== null}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {isUpdating === 'cancelled' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <X className="w-3.5 h-3.5" />
                            )}
                            Отменить
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
