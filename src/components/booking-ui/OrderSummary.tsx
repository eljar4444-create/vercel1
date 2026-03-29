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
}

export function OrderSummary({ service, staffName, dateKey, time, isSubmitting, onSubmit, canSubmit }: OrderSummaryProps) {
    return (
        <aside className="sticky top-[100px]">
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 border border-white/60 shadow-glass flex flex-col gap-6">
                
                <h3 className="font-serif text-2xl text-booking-textMain">Ваш заказ</h3>

                {/* Service Block */}
                <div className="flex gap-4 items-center bg-white/50 rounded-2xl p-3 border border-white/40">
                    <div className="relative h-16 w-16 shrink-0 bg-[#EBE6DF] rounded-xl overflow-hidden border border-white/60 shadow-sm">
                        {service.image ? (
                            <Image src={service.image} alt={service.title} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-booking-textMuted font-serif text-2xl">
                                {service.title.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[11px] font-bold text-booking-textMuted uppercase tracking-wider">ПРОЦЕДУРА</span>
                        <span className="text-booking-textMain font-semibold leading-tight line-clamp-2">{service.title}</span>
                    </div>
                </div>

                {/* Info List */}
                <div className="flex flex-col gap-4 text-[15px]">
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-booking-textMuted">
                            <UserIcon className="w-4 h-4" /> Мастер
                        </span>
                        <span className="text-booking-textMain font-medium text-right line-clamp-1 break-all bg-white/50 px-2 py-0.5 rounded-md w-full max-w-[140px] truncate block ml-2">
                            {staffName || 'Любой'}
                        </span>
                    </div>
                    <div className="flex justify-between border-t border-booking-border/30 pt-4">
                        <span className="flex items-center gap-2 text-booking-textMuted">
                            <Calendar className="w-4 h-4" /> Дата
                        </span>
                        <span className="text-booking-textMain font-medium">{dateKey ? formatRuDate(dateKey) : '—'}</span>
                    </div>
                    <div className="flex justify-between border-t border-booking-border/30 pt-4">
                        <span className="flex items-center gap-2 text-booking-textMuted">
                            <Clock className="w-4 h-4" /> Время
                        </span>
                        <span className="text-booking-textMain font-medium">{time || '—'} ({service.duration_min} мин)</span>
                    </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-end border-t border-booking-border pt-6 mt-2">
                    <span className="text-lg font-semibold text-booking-textMain">Итого</span>
                    <span className="font-serif text-[28px] font-bold text-booking-textMain text-right tracking-tight text-[#47433B]">
                        € {service.price}
                    </span>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                    <button
                        type="button"
                        disabled={!canSubmit || isSubmitting}
                        onClick={onSubmit}
                        className="w-full h-14 bg-booking-primary hover:bg-booking-primaryHover disabled:bg-opacity-50 disabled:cursor-not-allowed text-white rounded-full font-medium text-lg flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(47,75,58,0.4)] transition-all active:scale-95"
                    >
                        {isSubmitting ? 'Оформляем...' : 'Подтвердить и записаться'}
                        {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                    </button>
                    <p className="text-[10px] text-booking-textMuted text-center uppercase tracking-wider leading-relaxed px-2">
                        НАЖИМАЯ КНОПКУ, ВЫ СОГЛАШАЕТЕСЬ С ПРАВИЛАМИ<br/>УСЛОВИЯМИ И ОБРАБОТКОЙ ПЕРСОНАЛЬНЫХ ДАННЫХ
                    </p>
                </div>
            </div>

            {/* Warning Card */}
            <div className="bg-white/30 backdrop-blur-md rounded-3xl p-5 border border-white/60 shadow-sm flex gap-3 mt-6">
                <div className="shrink-0 w-6 h-6 rounded-full bg-booking-textMuted flex items-center justify-center text-white mt-0.5">
                    <Info className="w-4 h-4" />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-booking-textMain text-sm">Правила отмены</span>
                    <p className="text-xs text-booking-textMuted leading-relaxed">
                        Бесплатная отмена возможна за 24 часа до<br/>
                        начала процедуры. При отмене менее чем за<br/>
                        сутки удерживается 30% стоимости.
                    </p>
                </div>
            </div>
        </aside>
    );
}
