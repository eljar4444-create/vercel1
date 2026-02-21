'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Clock,
    ChevronLeft,
    MessageCircle,
    Star,
    MapPin,
    Sparkles,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import toast from 'react-hot-toast';

import { BookingModal } from '@/components/BookingModal';
import { startConversationWithProvider } from '@/app/actions/chat';
import { Button } from '@/components/ui/button';
import { ProfileLocationMap } from '@/components/ProfileLocationMap';

interface ProfileData {
    id: number;
    name: string;
    city: string;
    address?: string | null;
    image_url?: string | null;
    gallery: string[];
    bio?: string | null;
    phone?: string | null;
    is_verified: boolean;
    created_at: string;
    latitude: number;
    longitude: number;
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
}

const RATING_BREAKDOWN = [
    { label: 'Качество', score: 5.0 },
    { label: 'Чистота', score: 4.9 },
    { label: 'Сервис', score: 5.0 },
    { label: 'Атмосфера', score: 4.9 },
];

export function ProfileClient({ profile }: ProfileClientProps) {
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

    const services = profile.services || [];
    const cheapestService =
        services.length > 0
            ? services.reduce((min, current) => (Number(current.price) < Number(min.price) ? current : min), services[0])
            : null;
    const fullAddress = [profile.address, profile.city].filter(Boolean).join(', ');
    const priceLevel = useMemo(() => {
        if (services.length === 0) return '€€€';
        const avg = services.reduce((sum, item) => sum + Number(item.price), 0) / services.length;
        if (avg < 50) return '€';
        if (avg < 90) return '€€';
        return '€€€';
    }, [services]);
    const groupedServices = useMemo(() => {
        const groups = new Map<string, ProfileData['services']>();
        services.forEach((service) => {
            const parts = service.title.split(' - ');
            const category = parts.length > 1 ? parts[0] : 'Популярные услуги';
            const group = groups.get(category) || [];
            group.push(service);
            groups.set(category, group);
        });
        return Array.from(groups.entries());
    }, [services]);

    const initialDate = searchParams.get('date') || undefined;
    const initialTime = searchParams.get('time') || undefined;
    const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${profile.latitude}&mlon=${profile.longitude}#map=15/${profile.latitude}/${profile.longitude}`;

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
            <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
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
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{profile.name}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-slate-500" />
                                    {fullAddress || profile.city}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    5.0
                                </span>
                                <span>{priceLevel}</span>
                            </div>
                        </div>

                        <Button onClick={() => openBooking()} className="h-11 rounded-xl bg-slate-900 px-6 text-white hover:bg-slate-800">
                            Забронировать
                        </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 h-[400px] rounded-2xl overflow-hidden mt-6">
                        <div className="group relative col-span-4 overflow-hidden md:col-span-2 md:row-span-2">
                            <img
                                src={profile.gallery[0]}
                                alt={`${profile.name} photo 1`}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                            />
                        </div>
                        <div className="group relative col-span-2 hidden overflow-hidden md:block">
                            <img
                                src={profile.gallery[1] || profile.gallery[0]}
                                alt={`${profile.name} photo 2`}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                            />
                        </div>
                        <div className="group relative col-span-2 hidden overflow-hidden md:block">
                            <img
                                src={profile.gallery[2] || profile.gallery[0]}
                                alt={`${profile.name} photo 3`}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                            />
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-8 mt-12 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                            <h2 className="text-2xl font-semibold text-slate-900">О мастере</h2>
                            <p className="mt-4 leading-relaxed text-slate-600">
                                {profile.bio ||
                                    'Премиальный сервис с акцентом на комфорт, эстетику и персональный подход к каждому клиенту.'}
                            </p>
                        </article>

                        <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-semibold text-slate-900">Услуги</h2>
                                <span className="text-sm text-slate-500">{services.length} услуг</span>
                            </div>

                            {services.length === 0 ? (
                                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                                    Список услуг пока пуст.
                                </div>
                            ) : (
                                <div className="mt-6 space-y-6">
                                    {groupedServices.map(([groupTitle, groupItems]) => (
                                        <div key={groupTitle} className="space-y-3">
                                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{groupTitle}</h3>
                                            {groupItems.map((service) => (
                                                <div
                                                    key={service.id}
                                                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div>
                                                        <p className="text-base font-semibold text-slate-900">{service.title}</p>
                                                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
                                                            <Clock className="h-4 w-4" />
                                                            {service.duration_min} мин
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3 sm:min-w-[190px] sm:justify-end">
                                                        <p className="text-xl font-semibold text-slate-900">€{Number(service.price).toFixed(0)}</p>
                                                        <Button
                                                            onClick={() =>
                                                                openBooking({
                                                                    id: service.id,
                                                                    title: service.title,
                                                                    price: `€${Number(service.price).toFixed(0)}`,
                                                                    duration_min: service.duration_min,
                                                                })
                                                            }
                                                            className="h-10 rounded-xl bg-slate-900 px-4 text-white hover:bg-slate-800"
                                                        >
                                                            Выбрать
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                    </div>

                    <aside className="md:col-span-1 md:sticky md:top-24 md:self-start">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-slate-900">Рейтинг и отзывы</h2>
                            <div className="mt-5 flex items-end gap-2">
                                <p className="text-5xl font-semibold leading-none text-slate-900">5.0</p>
                                <p className="pb-1 text-sm text-slate-500">48 отзывов</p>
                            </div>
                            <div className="mt-5 space-y-3">
                                {RATING_BREAKDOWN.map((item) => (
                                    <div key={item.label}>
                                        <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                                            <span>{item.label}</span>
                                            <span>{item.score.toFixed(1)}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-100">
                                            <div
                                                className="h-2 rounded-full bg-slate-900"
                                                style={{ width: `${(item.score / 5) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs uppercase tracking-wide text-slate-400">Цена от</p>
                                <p className="mt-1 text-3xl font-semibold text-slate-900">
                                    {cheapestService ? `€${Number(cheapestService.price).toFixed(0)}` : '—'}
                                </p>
                            </div>

                            <Button
                                onClick={startChat}
                                disabled={isStartingChat}
                                variant="outline"
                                className="mt-4 h-11 w-full rounded-xl border-slate-200"
                            >
                                <MessageCircle className="mr-2 h-4 w-4" />
                                {isStartingChat ? 'Открываем...' : 'Написать мастеру'}
                            </Button>
                        </div>
                    </aside>
                </section>

                <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900">Как нас найти</h2>
                            <p className="mt-1 text-sm text-slate-600">{fullAddress || profile.city}</p>
                        </div>
                        <a
                            href={openStreetMapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                            <Sparkles className="h-4 w-4" />
                            Открыть в OpenStreetMap
                        </a>
                    </div>
                    <ProfileLocationMap
                        lat={profile.latitude}
                        lng={profile.longitude}
                        title={profile.name}
                        address={fullAddress || profile.city}
                    />
                </section>
            </div>

            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                masterName={profile.name}
                masterAddress={fullAddress || profile.city}
                rating={5}
                profileId={profile.id}
                selectedService={selectedService}
                initialDate={initialDate}
                initialTime={initialTime}
                accentColor="rose"
            />
        </div>
    );
}
