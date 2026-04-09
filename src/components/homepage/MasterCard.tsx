import Link from 'next/link';
import Image from 'next/image';
import { Star, ShieldCheck, MapPin } from 'lucide-react';

interface MasterCardProps {
    slug: string;
    name: string;
    category: string;
    city: string;
    isVerified: boolean;
    avgRating: string;
    workPhotoUrl: string | null;
    services: { title: string; price: number; durationMin: number }[];
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'M';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'M';
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export default function MasterCard({
    slug,
    name,
    category,
    city,
    isVerified,
    avgRating,
    workPhotoUrl,
    services,
}: MasterCardProps) {
    const minPrice = services.length > 0
        ? Math.min(...services.map(s => s.price))
        : null;

    return (
        <Link
            href={`/salon/${slug}`}
            className="block bg-white p-6 rounded-xl group hover:shadow-2xl transition-all duration-500"
        >
            {/* Photo */}
            <div className="relative aspect-[4/5] mb-6 overflow-hidden rounded-lg">
                {workPhotoUrl ? (
                    <Image
                        src={workPhotoUrl}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                        <span className="text-4xl font-bold text-stone-400">
                            {getInitials(name)}
                        </span>
                    </div>
                )}
                {isVerified && (
                    <div className="absolute top-4 right-4 bg-booking-primary/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white">
                        Рекомендуем
                    </div>
                )}
            </div>

            {/* Name & Rating */}
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold tracking-tight text-booking-textMain">{name}</h3>
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-booking-primary" />
                    <span className="text-sm font-bold text-booking-textMain">{avgRating}</span>
                </div>
            </div>

            {/* City */}
            {city && (
                <div className="flex items-center gap-1 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-booking-textMuted" />
                    <span className="text-sm text-booking-textMuted">{city}</span>
                </div>
            )}

            {/* Category */}
            <p className="text-booking-textMuted text-sm mb-6 font-medium uppercase tracking-wider">
                {category}
            </p>

            {/* Price & CTA */}
            <div className="flex items-center justify-between pt-6 border-t border-stone-100">
                <div>
                    <span className="text-xs text-booking-textMuted font-medium block">От</span>
                    <span className="text-lg font-bold text-booking-textMain">
                        {minPrice !== null ? `€${minPrice.toFixed(2)}` : '—'}
                    </span>
                </div>
                <span className="bg-booking-primary text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest group-active:scale-95 transition-all">
                    Записаться
                </span>
            </div>
        </Link>
    );
}
