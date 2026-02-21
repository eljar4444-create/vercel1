'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ProfileLocationMapClient = dynamic(() => import('@/components/ProfileLocationMapClient'), {
    ssr: false,
    loading: () => (
        <div className="flex h-full min-h-[320px] w-full items-center justify-center bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
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
