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
        <article className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col md:flex-row">
                <div className="h-52 w-full overflow-hidden bg-slate-100 md:h-auto md:min-h-[200px] md:w-48 md:flex-shrink-0">
                    {profile.image_url ? (
                        <img src={profile.image_url} alt={profile.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No photo</div>
                    )}
                </div>

                <div className="min-w-0 flex-1 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="text-[17px] font-semibold leading-tight text-slate-900">{profile.name}</h3>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin className="h-4 w-4" />
                                {[profile.address, profile.city].filter(Boolean).join(', ')}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">4.8 (5 отзывов) · €€€</p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            5.0
                        </div>
                    </div>

                    <div className="mt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Быстрые слоты</p>
                        <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                                <p className="text-[10px] font-semibold uppercase text-slate-500">Утро</p>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {slots.morning.map((slot) => (
                                        <span key={slot} className="rounded-md border border-blue-600 bg-white px-2 py-0.5 text-[11px] font-medium text-blue-600">
                                            {slot}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase text-slate-500">Вечер</p>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {slots.evening.map((slot) => (
                                        <span key={slot} className="rounded-md border border-blue-600 bg-white px-2 py-0.5 text-[11px] font-medium text-blue-600">
                                            {slot}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3">
                        {previewServices.length > 0 ? (
                            previewServices.map((service, index) => (
                                <div
                                    key={service.id}
                                    className={`flex flex-col justify-between gap-2 px-0 py-2 sm:flex-row sm:items-center ${
                                        index > 0 ? 'border-t border-slate-100' : ''
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
                                            href={`/profile/${profile.id}?book=1&service=${service.id}`}
                                            className="inline-flex h-7 items-center rounded-md bg-slate-100 px-3 text-[11px] font-medium text-slate-900 transition hover:bg-slate-200"
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
                            href={`/profile/${profile.id}?book=1`}
                            className="inline-flex h-8 items-center rounded-md bg-black px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                            Записаться
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
