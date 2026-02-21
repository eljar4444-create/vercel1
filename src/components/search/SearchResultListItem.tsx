import Link from 'next/link';
import { Clock3, MapPin, Star } from 'lucide-react';

interface SearchResultService {
    id: number;
    title: string;
    price: number;
    duration_min: number;
}

interface SearchResultListItemProps {
    profile: {
        id: number;
        name: string;
        city: string;
        address?: string | null;
        image_url?: string | null;
        services: SearchResultService[];
    };
}

function mockAvailability(id: number) {
    const morning = ['Сб 21', 'Пн 23', 'Вт 24'];
    const evening = ['Сегодня', 'Вс 22', 'Ср 25'];
    const shift = id % 3;
    return {
        morning: [morning[shift], morning[(shift + 1) % morning.length]],
        evening: [evening[shift], evening[(shift + 1) % evening.length]],
    };
}

export function SearchResultListItem({ profile }: SearchResultListItemProps) {
    const slots = mockAvailability(profile.id);
    const previewServices = profile.services.slice(0, 2);

    return (
        <article className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row">
                <div className="h-32 w-full overflow-hidden rounded-xl bg-slate-100 md:h-32 md:w-40 md:flex-shrink-0">
                    {profile.image_url ? (
                        <img src={profile.image_url} alt={profile.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No photo</div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{profile.name}</h3>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
                                <MapPin className="h-4 w-4" />
                                {[profile.address, profile.city].filter(Boolean).join(', ')}
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            5.0
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Быстрые слоты</p>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-slate-500">Утро</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {slots.morning.map((slot) => (
                                        <span key={slot} className="rounded-md border border-slate-100 bg-white px-2.5 py-1 text-xs text-slate-700">
                                            {slot}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Вечер</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {slots.evening.map((slot) => (
                                        <span key={slot} className="rounded-md border border-slate-100 bg-white px-2.5 py-1 text-xs text-slate-700">
                                            {slot}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        {previewServices.length > 0 ? (
                            previewServices.map((service) => (
                                <div
                                    key={service.id}
                                    className="flex flex-col justify-between gap-2 rounded-xl bg-slate-50/70 px-3 py-2 sm:flex-row sm:items-center"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{service.title}</p>
                                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                                            <Clock3 className="h-3.5 w-3.5" />
                                            {service.duration_min} мин
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm font-semibold text-slate-900">€{service.price.toFixed(0)}</p>
                                        <Link
                                            href={`/profile/${profile.id}?book=1&service=${service.id}`}
                                            className="inline-flex h-7 items-center rounded-full bg-slate-900 px-3 text-xs font-medium text-white transition hover:bg-slate-800"
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
                </div>
            </div>
        </article>
    );
}
