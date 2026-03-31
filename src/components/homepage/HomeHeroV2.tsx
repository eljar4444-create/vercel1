import Link from 'next/link';
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
        <header className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background image/video with overlay */}
            <div className="absolute inset-0 z-0">
                <video
                    src="/hero-bg.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#EBE6DF]" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-5xl px-8 text-center mt-12">
                <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 leading-[0.9]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                    Свои мастера.<br />Тот самый уровень качества.
                </h1>

                <p className="text-white/80 text-lg md:text-xl font-light mb-12 tracking-wide max-w-2xl mx-auto">
                    Найдите и забронируйте лучших бьюти-мастеров
                </p>

                {/* Search Bar slot */}
                {children}

                {/* City Tags */}
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                    {CITIES.map((city) => (
                        <Link
                            key={city.query}
                            href={`/search?city=${city.query}`}
                            className="px-5 py-2 rounded-full border border-white/20 text-white/70 text-xs font-semibold tracking-widest uppercase cursor-pointer hover:bg-white/10 transition-all"
                        >
                            {city.label}
                        </Link>
                    ))}
                </div>
            </div>
        </header>
    );
}
