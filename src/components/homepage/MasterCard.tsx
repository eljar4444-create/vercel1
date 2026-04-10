import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';

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
    city,
    workPhotoUrl,
    services,
}: MasterCardProps) {
    const minPrice = services.length > 0
        ? Math.min(...services.map(s => s.price))
        : null;

    return (
        <Link
            href={`/salon/${slug}`}
            className="block w-full group cursor-pointer p-[5px] rounded-3xl bg-gradient-to-br from-[#997A30] via-[#C29F52] to-[#604A15] hover:shadow-xl hover:shadow-[#997A30]/30 transition-all duration-500"
        >
            <div className="bg-[#1B2B21] rounded-[19px] p-3 h-full w-full relative">
                {/* Photo */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                    {workPhotoUrl ? (
                        <Image
                            src={workPhotoUrl}
                            alt={name}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="w-full h-full bg-[#111A13] flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                            <span className="text-6xl font-serif text-[#997A30]/40 group-hover:text-[#C29F52] transition-colors duration-500">
                                {getInitials(name)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Container to align with padding */}
                <div className="px-2 pb-1">
                    {/* Name */}
                    <h3 className="text-lg font-semibold text-white mt-4 group-hover:text-[#C29F52] transition-colors duration-300">{name}</h3>

                    {/* City */}
                    {city && (
                        <div className="text-[#A0B0A6] text-sm flex items-center gap-1 mt-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{city}</span>
                        </div>
                    )}

                    {/* Price & CTA */}
                    <div className="flex justify-between items-center mt-5">
                        <span className="text-sm font-medium text-[#C29F52]">
                            От {minPrice !== null ? `€${minPrice.toFixed(2)}` : '—'}
                        </span>
                        <span className="bg-[#997A30] hover:bg-[#C29F52] text-[#111A13] rounded-xl px-4 py-2 text-sm font-bold transition-colors duration-300">
                            Записаться
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
