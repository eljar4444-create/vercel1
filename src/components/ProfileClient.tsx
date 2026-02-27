'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    provider_type: 'SALON' | 'PRIVATE' | 'INDIVIDUAL';
    city: string;
    address?: string | null;
    image_url?: string | null;
    gallery: string[];
    studioImages: string[];
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
        description?: string | null;
        images?: string[];
        price: string;
        duration_min: number;
    }[];
    reviews: {
        id: string;
        text: string | null;
        rating: number;
        createdAt: string;
        clientName: string;
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

const MOCK_REVIEWS: { id: string; text: string; rating: number; createdAt: string; clientName: string }[] = [
    { id: 'mock-1', clientName: 'Анна К.', rating: 5, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), text: 'Очень довольна результатом! Мастер внимательная, атмосфера приятная. Обязательно вернусь.' },
    { id: 'mock-2', clientName: 'Мария С.', rating: 5, createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), text: 'Рекомендую. Качество на высоте, цены адекватные. Запись онлайн — супер удобно.' },
    { id: 'mock-3', clientName: 'Елена В.', rating: 4, createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), text: 'Хороший сервис, чисто и аккуратно. Буду обращаться ещё.' },
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

    const services = useMemo(() => profile.services || [], [profile.services]);
    const cheapestService =
        services.length > 0
            ? services.reduce((min, current) => (Number(current.price) < Number(min.price) ? current : min), services[0])
            : null;
    const fullAddress = [profile.address, profile.city].filter(Boolean).join(', ');
    const visibleAddress = profile.provider_type === 'SALON' ? fullAddress || profile.city : profile.city;
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
    const trimmedBio = (profile.bio || '').trim();
    const galleryImages = [
        ...(profile.image_url ? [profile.image_url] : []),
        ...(profile.gallery || []),
        ...(profile.studioImages || []),
    ].filter(Boolean);
    const fallbackStudioImage =
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2000&q=80';
    const studioImages =
        galleryImages.length > 0 ? galleryImages : [fallbackStudioImage];

    const initialDate = searchParams.get('date') || undefined;
    const initialTime = searchParams.get('time') || undefined;
    const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${profile.latitude}&mlon=${profile.longitude}#map=15/${profile.latitude}/${profile.longitude}`;

    const openBooking = (service?: { id?: number; title: string; price: string; duration_min?: number }) => {
        if (service) {
            setSelectedService(service);
            setIsModalOpen(true);
            return;
        }
        const el = document.getElementById('services');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            setSelectedService(null);
            setIsModalOpen(true);
        }
    };

    const startChat = useCallback(async () => {
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
    }, [isStartingChat, status, session?.user, profile.id, router]);

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
    }, [status, session?.user, pathname, router, searchParams, startChat]);

    return (
        <div className="min-h-screen bg-slate-50/60">
            <nav aria-label="Навигация" className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
                <div className="container mx-auto flex h-14 max-w-6xl items-center px-4">
                    <Link
                        href={`/search${profile.category?.slug ? `?category=${profile.category.slug}` : ''}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
                        aria-label="Назад к поиску"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Назад к поиску
                    </Link>
                </div>
            </nav>

            <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{profile.name}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-slate-500" />
                                    {visibleAddress}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    5.0
                                </span>
                                <span>{priceLevel}</span>
                            </div>
                        </div>

                        <Button onClick={() => openBooking()} className="min-h-[44px] h-11 rounded-xl bg-slate-900 px-6 text-white hover:bg-slate-800">
                            Забронировать
                        </Button>
                    </div>

                    <div className="mt-6 md:hidden">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {studioImages.map((image, index) => (
                                <div key={`${image}-${index}`} className="group relative h-44 w-64 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                                    <Image
                                        src={image}
                                        alt={`${profile.name} — фото ${index + 1}`}
                                        width={256}
                                        height={176}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                                        {...(index === 0 ? { priority: true } : {})}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 hidden min-h-[320px] overflow-hidden rounded-2xl bg-slate-100 md:block md:min-h-[400px] md:h-[400px]">
                        {studioImages.length >= 3 ? (
                            <div className="grid h-full grid-cols-4 gap-2">
                                <div className="group relative col-span-2 row-span-2 overflow-hidden">
                                    <Image
                                        src={studioImages[0]}
                                        alt={`${profile.name} — главное фото студии`}
                                        width={800}
                                        height={400}
                                        priority
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                                    />
                                </div>
                                <div className="group relative col-span-2 overflow-hidden">
                                    <Image
                                        src={studioImages[1]}
                                        alt={`${profile.name} — фото студии 2`}
                                        width={400}
                                        height={200}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                                    />
                                </div>
                                <div className="group relative col-span-2 overflow-hidden">
                                    <Image
                                        src={studioImages[2]}
                                        alt={`${profile.name} — фото студии 3`}
                                        width={400}
                                        height={200}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                                    />
                                </div>
                            </div>
                        ) : studioImages.length === 2 ? (
                            <div className="grid h-full grid-cols-4 gap-2">
                                <div className="group relative col-span-3 overflow-hidden">
                                    <Image
                                        src={studioImages[0]}
                                        alt={`${profile.name} — главное фото студии`}
                                        width={600}
                                        height={400}
                                        priority
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                                    />
                                </div>
                                <div className="group relative col-span-1 overflow-hidden">
                                    <Image
                                        src={studioImages[1]}
                                        alt={`${profile.name} — фото студии 2`}
                                        width={200}
                                        height={400}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="group relative flex h-full min-h-[320px] items-center justify-center overflow-hidden md:min-h-[400px]">
                                <Image
                                    src={studioImages[0]}
                                    alt={`${profile.name} — фото`}
                                    width={800}
                                    height={400}
                                    priority
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                                />
                            </div>
                        )}
                    </div>
                </section>

                {/* О нас / О мастере — сразу под галереей */}
                {trimmedBio ? (
                    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {profile.provider_type === 'SALON' ? 'О нас' : 'О мастере'}
                        </h2>
                        <div className="mt-4 max-w-3xl">
                            <p className="whitespace-pre-wrap leading-relaxed text-slate-600">{trimmedBio}</p>
                        </div>
                    </section>
                ) : null}

                <section className="grid grid-cols-1 gap-8 mt-8 md:mt-12 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        <article id="services" className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm scroll-mt-6">
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
                                                        {service.description ? (
                                                            <p className="mt-1 text-sm leading-relaxed text-slate-600">{service.description}</p>
                                                        ) : null}
                                                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
                                                            <Clock className="h-4 w-4" />
                                                            {service.duration_min} мин
                                                        </p>
                                                        {service.images && service.images.length > 0 ? (
                                                            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                                                                {service.images.slice(0, 6).map((imageUrl, imageIndex) => (
                                                                    <Image
                                                                        key={`${service.id}-work-${imageIndex}`}
                                                                        src={imageUrl}
                                                                        alt={`${service.title} — работа ${imageIndex + 1} от ${profile.name}`}
                                                                        width={56}
                                                                        height={56}
                                                                        className="h-14 w-14 flex-shrink-0 rounded-lg border border-slate-200 object-cover"
                                                                    />
                                                                ))}
                                                            </div>
                                                        ) : null}
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
                                                            className="min-h-[44px] h-11 rounded-xl bg-slate-900 px-4 text-white hover:bg-slate-800"
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
                                className="mt-4 min-h-[44px] h-11 w-full rounded-xl border-slate-200"
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
                            <p className="mt-1 text-sm text-slate-600">{visibleAddress}</p>
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
                        address={visibleAddress}
                    />
                </section>

                {/* Отзывы клиентов */}
                <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-2xl font-semibold text-slate-900">Отзывы клиентов</h2>
                    <div className="mt-6 space-y-4">
                        {(profile.reviews?.length ? profile.reviews : MOCK_REVIEWS).slice(0, 5).map((review) => (
                            <div
                                key={review.id}
                                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-medium text-slate-900">{review.clientName}</span>
                                    <span className="text-sm text-slate-500">
                                        {new Date(review.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="mt-2 flex gap-0.5" aria-label={`Рейтинг: ${review.rating} из 5`}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-4 w-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                        />
                                    ))}
                                </div>
                                {review.text ? (
                                    <p className="mt-3 leading-relaxed text-slate-600">{review.text}</p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                masterName={profile.name}
                masterAddress={visibleAddress}
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
