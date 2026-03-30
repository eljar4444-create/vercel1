import Link from 'next/link';
import { ReactNode } from 'react';

const CITIES = ['Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln', 'Düsseldorf'];

export default function HomeHeroV2({ children }: { children?: ReactNode }) {
    return (
        <section className="relative overflow-hidden pt-36 pb-24 md:pt-48 md:pb-32 bg-black flex flex-col items-center justify-center px-4 md:px-8 z-0">
            {/* Ambient Background Video */}
            <div className="absolute inset-0 w-full h-full -z-10 bg-black">
                <video
                    src="/hero-bg.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            </div>

            <h1 className="font-didot text-4xl md:text-6xl font-bold text-white tracking-normal md:tracking-wide text-center relative z-10">
                <span className="block">Свои мастера.</span>
                <span className="block">Тот самый уровень качества.</span>
            </h1>

            <p className="font-sans text-base md:text-lg text-white/90 text-center mt-5 relative z-10 font-medium">
                Finde und buche die besten Beauty-Meister in Deutschland
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3 relative z-10">
                {CITIES.map((city) => (
                    <Link
                        key={city}
                        href={`/search?city=${city}`}
                        className="rounded-full px-5 py-2.5 bg-white/10 backdrop-blur-md shadow-soft-out hover:shadow-soft-in hover:bg-white/20 transition-all text-sm font-semibold text-white border border-white/20"
                    >
                        {city}
                    </Link>
                ))}
            </div>

            {children}
        </section>
    );
}
