import Link from 'next/link';
import Image from 'next/image';
import { Building2, Clock3, MapPin, Star, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LiveQuickSlots } from '@/components/search/LiveQuickSlots';
import { FavoriteButton } from '@/components/client/FavoriteButton';

interface SearchResultService {
    id: number;
    title: string;
    price: number;
    duration_min: number;
}

interface SearchResultListItemProps {
    profile: {
        id: number;
        slug: string;
        name: string;
        provider_type: 'SALON' | 'PRIVATE' | 'INDIVIDUAL';
        city: string;
        address?: string | null;
        image_url?: string | null;
        services: SearchResultService[];
    };
    /** Whether the current user has this provider in favorites (from server). */
    initialIsFavorited?: boolean;
}

export function SearchResultListItem({ profile, initialIsFavorited = false }: SearchResultListItemProps) {
    const previewServices = profile.services.slice(0, 2);
    const isSalon = profile.provider_type === 'SALON';
    const visibleAddress = isSalon ? [profile.address, profile.city].filter(Boolean).join(', ') : profile.city;

    return (
        <article className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm relative">
            <div className="flex flex-col md:flex-row">
                <Link
                    href={`/salon/${profile.slug}`}
                    className="block h-52 w-full cursor-pointer overflow-hidden bg-slate-100 md:h-auto md:min-h-[200px] md:w-48 md:flex-shrink-0 relative"
                    aria-label={`Открыть профиль ${profile.name}`}
                >
                    <FavoriteButton
                        providerProfileId={profile.id}
                        initialIsFavorited={initialIsFavorited}
                        variant="card"
                    />
                    {profile.image_url ? (
                        <Image
                            src={profile.image_url}
                            alt={`${profile.name} — мастер в ${profile.city}`}
                            width={400}
                            height={400}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No photo</div>
                    )}
                </Link>

                <div className="min-w-0 flex-1 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <Link href={`/salon/${profile.slug}`} className="block cursor-pointer">
                            <h2 className="text-[17px] font-semibold leading-tight text-slate-900 transition-colors hover:text-blue-600">
                                {profile.name}
                            </h2>
                            <Badge variant="outline" className="mt-1 inline-flex border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-600">
                                {isSalon ? <Building2 className="mr-1 h-3 w-3" /> : <UserRound className="mr-1 h-3 w-3" />}
                                {isSalon ? 'Салон' : 'Частный мастер'}
                            </Badge>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin className="h-4 w-4" />
                                {visibleAddress}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">4.8 (5 отзывов) · €€€</p>
                        </Link>
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700" aria-label="Рейтинг 5.0">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            5.0
                        </div>
                    </div>

                    <LiveQuickSlots profileId={profile.id} slug={profile.slug} />

                    <div className="mt-3">
                        {previewServices.length > 0 ? (
                            previewServices.map((service, index) => (
                                <div
                                    key={service.id}
                                    className={`flex flex-col justify-between gap-2 px-0 py-2 sm:flex-row sm:items-center ${index > 0 ? 'border-t border-slate-100' : ''
                                        }`}
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{service.title}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                                            <Clock3 className="h-3.5 w-3.5" />
                                            {service.duration_min} мин
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900">€{service.price.toFixed(0)}</p>
                                        <Link
                                            href={`/salon/${profile.slug}?book=1&service=${service.id}`}
                                            className="inline-flex min-h-[44px] items-center rounded-md bg-slate-100 px-3 text-[11px] font-medium text-slate-900 transition hover:bg-slate-200"
                                        >
                                            Выбрать
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500">Услуги появятся скоро</p>
                        )}
                    </div>

                    <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                        <Link
                            href={`/salon/${profile.slug}?book=1`}
                            className="inline-flex min-h-[44px] items-center rounded-md bg-black px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                            Записаться
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
