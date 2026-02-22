'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, ArrowLeft, UserRound } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CancelBookingForm } from '@/components/client/CancelBookingForm';

export interface BookingItem {
    id: number;
    date: string;
    time: string;
    status: string;
    user_name: string;
    price: string;
    isFuture: boolean;
    isCancellable: boolean;
    profile: {
        id: number;
        name: string;
        city: string;
        image_url: string | null;
    };
    service: {
        id: number;
        title: string;
        price: string | number;
    } | null;
}

interface MyBookingsViewProps {
    upcoming: BookingItem[];
    history: BookingItem[];
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(iso));
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        confirmed: {
            label: 'Подтверждено',
            cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        cancelled: {
            label: 'Отменена',
            cls: 'bg-red-50 text-red-600 border-red-200',
        },
    };

    const meta = map[status] ?? {
        label: 'Ожидает',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
            {meta.label}
        </span>
    );
}

function ProfileAvatar({ src, name }: { src: string | null; name: string }) {
    if (src) {
        return (
            <Image
                src={src}
                alt={name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
            />
        );
    }

    return (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <UserRound className="h-5 w-5 text-slate-400" />
        </div>
    );
}

function BookingCard({ booking, variant }: { booking: BookingItem; variant: 'upcoming' | 'history' }) {
    return (
        <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex gap-4">
                <div className="shrink-0 pt-0.5">
                    <ProfileAvatar src={booking.profile.image_url} name={booking.profile.name} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-slate-900">
                                {booking.service?.title || 'Услуга уточняется'}
                            </p>
                            <Link
                                href={`/profile/${booking.profile.id}`}
                                className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                            >
                                {booking.profile.name}
                            </Link>
                        </div>
                        <StatusBadge status={booking.status} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-slate-400" />
                            {formatDate(booking.date)} в {booking.time}
                        </span>
                        {booking.price && (
                            <span className="font-medium text-slate-900">{booking.price}</span>
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {variant === 'history' && booking.status !== 'cancelled' && (
                            <Button asChild size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                                <Link href={`/profile/${booking.profile.id}`}>Записаться снова</Link>
                            </Button>
                        )}
                        {variant === 'history' && booking.status === 'cancelled' && (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/profile/${booking.profile.id}`}>Перейти к мастеру</Link>
                            </Button>
                        )}
                        {variant === 'upcoming' && booking.isCancellable && (
                            <CancelBookingForm bookingId={booking.id} />
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                <CalendarDays className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">{message}</p>
            <Button asChild className="mt-4 bg-slate-900 text-white hover:bg-slate-800">
                <Link href="/search">Найти мастера</Link>
            </Button>
        </div>
    );
}

export function MyBookingsView({ upcoming, history }: MyBookingsViewProps) {
    const hasBookings = upcoming.length > 0 || history.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link
                    href="/account"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Мои записи</h1>
            </div>

            {!hasBookings ? (
                <EmptyState message="Когда вы запишетесь к мастеру, ваши визиты появятся здесь" />
            ) : (
                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="upcoming" className="flex-1 sm:flex-initial">
                            Предстоящие
                            {upcoming.length > 0 && (
                                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] font-semibold text-white">
                                    {upcoming.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex-1 sm:flex-initial">
                            История
                            {history.length > 0 && (
                                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-[11px] font-semibold text-slate-600">
                                    {history.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upcoming">
                        {upcoming.length === 0 ? (
                            <EmptyState message="Нет предстоящих записей" />
                        ) : (
                            <div className="space-y-3">
                                {upcoming.map((b) => (
                                    <BookingCard key={b.id} booking={b} variant="upcoming" />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history">
                        {history.length === 0 ? (
                            <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
                                <p className="text-sm text-slate-500">История посещений пуста</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map((b) => (
                                    <BookingCard key={b.id} booking={b} variant="history" />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
