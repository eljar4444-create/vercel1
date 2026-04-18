'use client';

import { ArrowRight, User as UserIcon, Calendar, Clock, Info } from 'lucide-react';
import Image from 'next/image';

interface OrderSummaryProps {
    service: {
        title: string;
        price: string;
        image?: string | null;
        duration_min: number;
    };
    staffName?: string | null;
    dateKey: string;
    time: string;
    isSubmitting: boolean;
    onSubmit: () => void;
    canSubmit: boolean;
}

const formatRuDate = (dateKey: string) => {
    if (!dateKey) return '';
    try {
        const d = new Date(dateKey);
        const name = d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        return name;
    } catch {
        return dateKey;
    }
};

export function OrderSummary({
    service,
    staffName,
    dateKey,
    time,
    isSubmitting,
    onSubmit,
    canSubmit,
}: OrderSummaryProps) {
    return (
        <aside className="sticky top-[100px] space-y-4">
            <div className="rounded-2xl border border-booking-border bg-white p-6 flex flex-col gap-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-booking-textMuted">
                    Ваш заказ
                </h3>

                {/* Service Block */}
                <div className="flex gap-3 items-center">
                    <div className="relative h-14 w-14 shrink-0 bg-booking-bg rounded-lg overflow-hidden border border-booking-border">
                        {service.image ? (
                            <Image src={service.image} alt={service.title} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-booking-textMuted text-xl font-medium">
                                {service.title.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-semibold text-booking-textMuted uppercase tracking-wider">
                            Процедура
                        </span>
                        <span className="text-booking-textMain font-semibold text-sm leading-tight line-clamp-2">
                            {service.title}
                        </span>
                    </div>
                </div>

                {/* Info List */}
                <div className="flex flex-col text-sm divide-y divide-booking-border/60 border-t border-booking-border/60">
                    <Row icon={<UserIcon className="w-4 h-4" />} label="Мастер" value={staffName || 'Любой'} />
                    <Row icon={<Calendar className="w-4 h-4" />} label="Дата" value={dateKey ? formatRuDate(dateKey) : '—'} />
                    <Row
                        icon={<Clock className="w-4 h-4" />}
                        label="Время"
                        value={time ? `${time} · ${service.duration_min} мин` : '—'}
                    />
                </div>

                {/* Total */}
                <div className="flex justify-between items-baseline border-t border-booking-border/60 pt-5">
                    <span className="text-sm text-booking-textMuted">Итого</span>
                    <span className="text-2xl font-semibold text-booking-textMain tracking-tight">
                        € {service.price}
                    </span>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        disabled={!canSubmit || isSubmitting}
                        onClick={onSubmit}
                        className="w-full h-12 bg-booking-primary hover:bg-booking-primaryHover text-white disabled:bg-booking-border disabled:text-booking-textMuted disabled:cursor-not-allowed rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        {isSubmitting ? 'Оформляем…' : 'Подтвердить и записаться'}
                        {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                    </button>
                    <p className="text-[11px] text-booking-textMuted text-center leading-relaxed">
                        Нажимая кнопку, вы соглашаетесь с правилами и обработкой персональных данных.
                    </p>
                </div>
            </div>

            {/* Cancellation Notice */}
            <div className="rounded-2xl border border-booking-border bg-white p-5 flex gap-3">
                <Info className="w-4 h-4 text-booking-textMuted mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                    <span className="font-medium text-booking-textMain text-sm">Правила отмены</span>
                    <p className="text-xs text-booking-textMuted leading-relaxed">
                        Бесплатная отмена возможна за 24 часа до начала процедуры. При отмене менее чем за сутки удерживается 30% стоимости.
                    </p>
                </div>
            </div>
        </aside>
    );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-3 first:pt-4 last:pb-0">
            <span className="flex items-center gap-2 text-booking-textMuted">
                <span className="text-booking-textMuted">{icon}</span>
                {label}
            </span>
            <span className="text-booking-textMain font-medium text-right truncate max-w-[60%]">
                {value}
            </span>
        </div>
    );
}
