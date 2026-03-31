'use client';

import Link from 'next/link';
import Image from 'next/image';
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
        <section className="py-24 px-8 overflow-hidden">
            <div ref={ref} className="max-w-screen-2xl mx-auto relative rounded-[2rem] bg-booking-primary text-white p-12 md:p-24 overflow-hidden">
                {/* Background image overlay */}
                <div className="absolute inset-0 opacity-40">
                    <Image
                        src="/categories/hair.png"
                        alt="Artist working"
                        fill
                        className="object-cover"
                    />
                </div>

                <div className={`relative z-10 max-w-2xl transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-6 block">
                        Для профессионалов
                    </span>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 leading-tight">
                        Хотите такой же профиль?
                    </h2>
                    <p className="text-white/70 text-lg mb-12 leading-relaxed">
                        Присоединяйтесь к элитному сообществу мастеров SVOI. Представьте свои работы в цифровом ателье для премиальной аудитории.
                    </p>
                    <Link
                        href="/become-pro"
                        className="inline-block bg-white text-booking-primary px-10 py-5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-stone-100 transition-all"
                    >
                        Создать свою галерею
                    </Link>
                </div>
            </div>
        </section>
    );
}
