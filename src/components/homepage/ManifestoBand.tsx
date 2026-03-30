'use client';

import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';

export default function ManifestoBand() {
    const ref = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={ref} className="bg-booking-primary py-16 md:py-20">
            <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
                <h2
                    className={`font-didot tracking-wide text-2xl md:text-4xl font-bold text-white transition-all duration-700 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                    }`}
                >
                    Мы не идём на компромиссы. И вы не должны.
                </h2>

                <div
                    className={`mt-8 flex flex-col sm:flex-row justify-center gap-4 transition-all duration-700 delay-300 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                    }`}
                >
                    <Link
                        href="/search"
                        className="rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white px-8 py-4 text-sm font-bold hover:bg-white/25 transition-colors"
                    >
                        Найти мастера
                    </Link>
                    <Link
                        href="/become-pro"
                        className="rounded-full bg-white text-booking-primary px-8 py-4 text-sm font-bold hover:bg-white/90 transition-colors"
                    >
                        Стать мастером
                    </Link>
                </div>
            </div>
        </section>
    );
}
