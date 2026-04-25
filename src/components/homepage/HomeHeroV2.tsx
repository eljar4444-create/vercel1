import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

const CITIES = [
    { label: 'Берлин', query: 'Berlin' },
    { label: 'Мюнхен', query: 'München' },
    { label: 'Гамбург', query: 'Hamburg' },
    { label: 'Франкфурт', query: 'Frankfurt' },
    { label: 'Дюссельдорф', query: 'Düsseldorf' },
];

export default function HomeHeroV2({ children }: { children?: ReactNode }) {
    return (
        <header className="relative min-h-[100dvh] flex items-center justify-center pt-20">
            {/* Background image/video with overlay */}
            <div className="absolute inset-0 z-0 bg-[#1A1A1A] overflow-hidden">
                <Image
                    src="/hero-bg.jpg"
                    alt="Beauty salon interior"
                    fill
                    priority
                    fetchPriority="high"
                    sizes="100vw"
                    className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/60" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-5xl px-8 text-center -mt-20">
                <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 leading-[0.9]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                    Свои мастера<br />Свой сервис
                </h1>

                <p className="text-white/80 text-lg md:text-xl font-light mb-12 tracking-wide max-w-2xl mx-auto">
                    Найдите и забронируйте лучших бьюти-мастеров
                </p>

                {/* Search Bar slot */}
                {children}


            </div>
        </header>
    );
}
