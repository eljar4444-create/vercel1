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
        <section ref={ref} className="py-32 px-8 bg-white text-center">
            <div className="max-w-4xl mx-auto">
                <h2
                    className={`text-5xl md:text-7xl font-bold tracking-tighter text-booking-textMain mb-12 leading-tight transition-all duration-700 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                    }`}
                >
                    Мы не идём на компромиссы.<br />И вы не должны.
                </h2>

                <div
                    className={`flex flex-col sm:flex-row justify-center gap-6 transition-all duration-700 delay-300 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                    }`}
                >
                    <Link
                        href="/search"
                        className="bg-booking-primary text-white px-12 py-5 rounded-lg font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all"
                    >
                        Найти мастера
                    </Link>
                    <Link
                        href="/become-pro"
                        className="border-2 border-booking-primary text-booking-primary px-12 py-5 rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-booking-primary hover:text-white transition-all"
                    >
                        Стать мастером
                    </Link>
                </div>
            </div>
        </section>
    );
}
