'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileLocationMapClient = dynamic(() => import('@/components/ProfileLocationMapClient'), {
    ssr: false,
    loading: () => (
        <Skeleton className="h-[360px] w-full rounded-2xl" />
    ),
});

interface ProfileLocationMapProps {
    lat: number;
    lng: number;
    title: string;
    address: string;
}

export function ProfileLocationMap({ lat, lng, title, address }: ProfileLocationMapProps) {
    return (
        <div className="h-[360px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <ProfileLocationMapClient lat={lat} lng={lng} title={title} address={address} />
        </div>
    );
}
