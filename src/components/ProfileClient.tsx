'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    MapPin,
    Star,
    Clock,
    Euro,
    CheckCircle2,
    ChevronLeft,
    Phone,
    MessageCircle,
    ExternalLink,
    UserCircle2,
    Sparkles,
    Stethoscope,
    Calendar,
    Zap,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import toast from 'react-hot-toast';

import { BookingModal } from '@/components/BookingModal';
import { startConversationWithProvider } from '@/app/actions/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProfileData {
    id: number;
    name: string;
    city: string;
    address?: string | null;
    image_url?: string | null;
    bio?: string | null;
    phone?: string | null;
    is_verified: boolean;
    created_at: string;
    attributes: any;
    category: {
        id: number;
        name: string;
        slug: string;
    } | null;
    services: {
        id: number;
        title: string;
        price: string;
        duration_min: number;
    }[];
}

interface ProfileClientProps {
    profile: ProfileData;
    nextAvailableLabel?: string | null;
}

const ACCENT = {
    beauty: {
        cta: 'bg-rose-600 hover:bg-rose-700',
        light: 'bg-rose-50 text-rose-700',
        ring: 'ring-rose-100',
        icon: <Sparkles className="h-4 w-4" />,
        accentKey: 'rose',
    },
    health: {
        cta: 'bg-teal-600 hover:bg-teal-700',
        light: 'bg-teal-50 text-teal-700',
        ring: 'ring-teal-100',
        icon: <Stethoscope className="h-4 w-4" />,
        accentKey: 'teal',
    },
} as const;

const DEFAULT_ACCENT = ACCENT.beauty;

export function ProfileClient({ profile, nextAvailableLabel }: ProfileClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStartingChat, setIsStartingChat] = useState(false);
    const [selectedService, setSelectedService] = useState<{
        id?: number;
        title: string;
        price: string;
        duration_min?: number;
    } | null>(null);

    const catSlug = profile.category?.slug === 'health' ? 'health' : 'beauty';
    const accent = ACCENT[catSlug] || DEFAULT_ACCENT;
    const services = profile.services || [];
    const cheapest =
        services.length > 0
            ? services.reduce((min, current) => (Number(current.price) < Number(min.price) ? current : min), services[0])
            : null;

    const initialDate = searchParams.get('date') || undefined;
    const initialTime = searchParams.get('time') || undefined;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${profile.address || ''} ${profile.city}`
    )}`;

    const openBooking = (service?: { id?: number; title: string; price: string; duration_min?: number }) => {
        setSelectedService(service || null);
        setIsModalOpen(true);
    };

    const startChat = async () => {
        if (isStartingChat) return;

        if (status !== 'authenticated' || !session?.user) {
            if (typeof window === 'undefined') return;
            const url = new URL(window.location.href);
            url.searchParams.set('startChat', '1');
            await signIn(undefined, { callbackUrl: url.toString() });
            return;
        }

        setIsStartingChat(true);
        const result = await startConversationWithProvider(profile.id);
        setIsStartingChat(false);

        if (!result.success || !result.conversationId) {
            toast.error(result.error || 'Не удалось открыть чат');
            return;
        }

        router.push(`/chat/${result.conversationId}`);
    };

    useEffect(() => {
        if (searchParams.get('book') !== '1') return;

        const serviceIdParam = Number(searchParams.get('service'));
        if (Number.isInteger(serviceIdParam)) {
            const service = services.find((item) => item.id === serviceIdParam);
            if (service) {
                setSelectedService({
                    id: service.id,
                    title: service.title,
                    price: `€${Number(service.price).toFixed(0)}`,
                    duration_min: service.duration_min,
                });
            }
        }

        setIsModalOpen(true);

        const next = new URLSearchParams(searchParams.toString());
        next.delete('book');
        next.delete('service');
        next.delete('date');
        next.delete('time');
        const query = next.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [pathname, router, searchParams, services]);

    useEffect(() => {
        if (searchParams.get('startChat') !== '1') return;
        if (status !== 'authenticated' || !session?.user) return;

        startChat();

        const next = new URLSearchParams(searchParams.toString());
        next.delete('startChat');
        const query = next.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [status, session?.user, pathname, router, searchParams]);

    return (
        <div className="min-h-screen bg-slate-50/60">
            <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="container mx-auto flex h-14 max-w-6xl items-center px-4">
                    <Link
                        href={`/search${profile.category?.slug ? `?category=${profile.category.slug}` : ''}`}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Назад к поиску
                    </Link>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
                <Card className="rounded-3xl border-slate-200 bg-white shadow-lg shadow-slate-200/40">
                    <CardContent className="p-6 sm:p-8">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                            <div className="h-32 w-32 overflow-hidden rounded-3xl bg-slate-100 shadow-lg shadow-slate-200/60 sm:h-40 sm:w-40">
                                {profile.image_url ? (
                                    <img src={profile.image_url} alt={profile.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <UserCircle2 className="h-16 w-16 text-slate-300 sm:h-20 sm:w-20" />
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{profile.name}</h1>
                                    {profile.is_verified ? (
                                        <Badge className="border border-blue-200 bg-blue-50 text-blue-700">
                                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                            Verified
                                        </Badge>
                                    ) : null}
                                </div>

                                <p className="mt-1 text-lg text-slate-500">{profile.category?.name || 'Специалист'}</p>
                                <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500">
                                    <MapPin className="h-4 w-4" />
                                    {profile.city}
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                        5.0
                                    </span>
                                    <span>Новый мастер</span>
                                    <a
                                        href={googleMapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-blue-600 transition-colors hover:text-blue-700"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Показать на карте
                                    </a>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-6">
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-lg shadow-slate-200/40">
                            <CardHeader className="p-7 pb-4">
                                <CardTitle className="text-2xl">О мастере</CardTitle>
                            </CardHeader>
                            <CardContent className="p-7 pt-0">
                                <p className="leading-relaxed text-slate-600">
                                    {profile.bio ||
                                        'Профессионал с многолетним опытом работы. Индивидуальный подход к каждому клиенту, качественные материалы и внимание к деталям.'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-slate-200 bg-white shadow-lg shadow-slate-200/40">
                            <CardHeader className="flex-row items-center justify-between space-y-0 p-7 pb-4">
                                <CardTitle className="text-2xl">Услуги</CardTitle>
                                <span className="text-sm text-slate-500">{services.length} услуг</span>
                            </CardHeader>
                            <CardContent className="space-y-3 p-7 pt-0">
                                {services.length > 0 ? (
                                    services.map((service) => (
                                        <div
                                            key={service.id}
                                            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{service.title}</h3>
                                                <div className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
                                                    <Clock className="h-4 w-4" />
                                                    {service.duration_min} мин
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 sm:min-w-[180px] sm:justify-end">
                                                <span className="text-xl font-bold text-slate-900">€{Number(service.price).toFixed(0)}</span>
                                                <Button
                                                    onClick={() =>
                                                        openBooking({
                                                            id: service.id,
                                                            title: service.title,
                                                            price: `€${Number(service.price).toFixed(0)}`,
                                                            duration_min: service.duration_min,
                                                        })
                                                    }
                                                    className={`${accent.cta} text-white`}
                                                >
                                                    Выбрать
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-10 text-center">
                                        <Euro className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                                        <p className="text-slate-500">Услуги пока не добавлены</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <Card className={`rounded-3xl border-slate-200 bg-white shadow-xl shadow-slate-200/60 ring-1 ${accent.ring}`}>
                            <CardHeader className="p-6 pb-4">
                                <CardTitle className="text-xl">Быстрая запись</CardTitle>
                                <p className="text-sm text-slate-500">Запишитесь онлайн за пару кликов без звонков.</p>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6 pt-0">
                                {profile.category ? (
                                    <Badge className={`${accent.light} border-0`}>
                                        {accent.icon}
                                        <span className="ml-1">{profile.category.name}</span>
                                    </Badge>
                                ) : null}

                                {cheapest ? (
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-xs uppercase tracking-wide text-slate-400">Цена от</p>
                                        <p className="mt-1 text-3xl font-bold text-slate-900">€{Number(cheapest.price).toFixed(0)}</p>
                                    </div>
                                ) : null}

                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                        <Zap className="h-3.5 w-3.5" />
                                        Ближайшее окно
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-emerald-800">
                                        {nextAvailableLabel ? `⚡ Ближайшая запись: ${nextAvailableLabel}` : 'Проверить свободные даты'}
                                    </p>
                                </div>

                                <Button onClick={() => openBooking()} className={`h-12 w-full text-base text-white ${accent.cta}`}>
                                    <Calendar className="mr-2 h-5 w-5" />
                                    Забронировать
                                </Button>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button asChild variant="outline" className="h-11">
                                        <a href={profile.phone ? `tel:${profile.phone}` : '#'} aria-disabled={!profile.phone}>
                                            <Phone className="mr-2 h-4 w-4" />
                                            Позвонить
                                        </a>
                                    </Button>
                                    <Button onClick={startChat} disabled={isStartingChat} variant="outline" className="h-11">
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        {isStartingChat ? 'Открываем...' : 'Написать'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                masterName={profile.name}
                profileId={profile.id}
                selectedService={selectedService}
                initialDate={initialDate}
                initialTime={initialTime}
                accentColor={accent.accentKey}
            />
        </div>
    );
}
