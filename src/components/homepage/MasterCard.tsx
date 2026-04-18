import Link from 'next/link';
import Image from 'next/image';

type ProviderType = 'SALON' | 'PRIVATE' | 'INDIVIDUAL';

interface MasterCardProps {
    slug: string;
    name: string;
    category: string;
    city: string;
    isVerified: boolean;
    avgRating: string;
    reviewCount: number;
    workPhotoUrl: string | null;
    providerType: ProviderType;
    services: { title: string; price: number; durationMin: number }[];
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'M';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'M';
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export default function MasterCard(props: MasterCardProps) {
    if (props.providerType === 'SALON') {
        return <SalonCard {...props} />;
    }
    return <FreelancerCard {...props} />;
}

function SalonCard({
    slug,
    name,
    category,
    workPhotoUrl,
}: MasterCardProps) {
    const specialty = category || 'Салон';

    return (
        <Link
            href={`/salon/${slug}`}
            className="relative rounded-2xl overflow-hidden aspect-video sm:aspect-[16/9] group cursor-pointer shadow-sm block"
        >
            {workPhotoUrl ? (
                <Image
                    src={workPhotoUrl}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a2e25] via-[#0f1f18] to-[#0a1812]">
                    <span className="text-3xl font-serif font-medium tracking-wide text-[#C29F52]">
                        {getInitials(name)}
                    </span>
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 p-4 sm:p-5 w-full flex flex-col gap-0.5">
                <span className="font-bold text-white text-[16px] sm:text-xl drop-shadow-md leading-tight truncate">
                    {name}
                </span>
                <span className="text-gray-200 text-sm sm:text-[15px] drop-shadow line-clamp-1 leading-tight">
                    {specialty}
                </span>
            </div>
        </Link>
    );
}

function FreelancerCard({
    slug,
    name,
    category,
    workPhotoUrl,
}: MasterCardProps) {
    const specialty = category || 'Мастер';

    return (
        <Link
            href={`/salon/${slug}`}
            className="relative rounded-2xl overflow-hidden aspect-[3/4] group cursor-pointer block"
        >
            {workPhotoUrl ? (
                <Image
                    src={workPhotoUrl}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a2e25] via-[#0f1f18] to-[#0a1812]">
                    <span className="text-3xl font-serif font-medium tracking-wide text-[#C29F52]">
                        {getInitials(name)}
                    </span>
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 p-4 sm:p-5 w-full flex flex-col gap-0.5">
                <span className="font-bold text-white text-[16px] sm:text-xl drop-shadow-md leading-tight">
                    {name}
                </span>
                <span className="text-gray-200 text-sm sm:text-[15px] drop-shadow line-clamp-1 leading-tight">
                    {specialty}
                </span>
            </div>
        </Link>
    );
}
