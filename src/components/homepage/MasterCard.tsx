import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Star } from 'lucide-react';

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
    return (
        <Link
            href={`/salon/${slug}`}
            className="block bg-booking-card rounded-[2rem] shadow-soft-out border border-white/50 overflow-hidden transition-transform duration-200 hover:-translate-y-1"
        >
            <div className="w-full h-48 md:h-56 relative">
                {workPhotoUrl ? (
                    <Image
                        src={workPhotoUrl}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full bg-booking-border flex items-center justify-center">
                        <span className="text-3xl font-bold text-booking-textMuted">
                            {getInitials(name)}
                        </span>
                    </div>
                )}
            </div>

            <div className="p-5 md:p-6">
                <div className="flex justify-between items-center">
                    {isVerified ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-booking-primary">
                            <ShieldCheck className="h-4 w-4" />
                            Подтверждён
                        </span>
                    ) : (
                        <span />
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-booking-textMain">
                        <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                        {avgRating}
                    </span>
                </div>

                <h3 className="font-didot text-xl font-bold tracking-wide text-booking-textMain mt-3 leading-tight">
                    {name}
                </h3>
                <p className="text-sm text-booking-textMuted mt-1">
                    {category} · {city}
                </p>

                {services.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {services.slice(0, 2).map((s) => (
                            <div key={s.title} className="flex justify-between text-sm">
                                <span className="text-booking-textMain font-medium">{s.title}</span>
                                <span className="text-booking-textMuted">
                                    от €{s.price} · {s.durationMin} мин
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-5 text-center rounded-full bg-booking-primary text-white py-3 text-sm font-bold btn-neu">
                    Записаться
                </div>
            </div>
        </Link>
    );
}
