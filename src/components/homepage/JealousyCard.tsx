'use client';

import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';

export default function JealousyCard() {
    const ref = useRef<HTMLDivElement>(null);
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
        <div ref={ref} className="bg-white/40 backdrop-blur-md border border-white/50 shadow-glass rounded-[2rem] p-8 md:p-10 col-span-2 lg:col-span-3 relative overflow-hidden">
            {isVisible && (
                <div className="absolute inset-0 glass-shimmer-overlay animate-glass-shimmer pointer-events-none" />
            )}

            <div className="relative z-10">
                <h3 className="font-didot tracking-wide text-2xl md:text-3xl font-bold text-booking-textMain">
                    Хотите такой же профиль?
                </h3>
                <p className="font-sans text-base md:text-lg text-booking-textMain mt-3">
                    Мы — ваш невидимый менеджер.
                </p>
                <p className="font-sans text-base md:text-lg font-bold text-booking-primary mt-1">
                    0% комиссии. Навсегда.
                </p>
                <Link
                    href="/become-pro"
                    className="mt-6 inline-block rounded-full bg-booking-primary text-white px-8 py-3.5 text-sm font-bold btn-neu"
                >
                    Создать свою галерею
                </Link>
            </div>
        </div>
    );
}
