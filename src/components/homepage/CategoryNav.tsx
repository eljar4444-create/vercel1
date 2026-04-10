'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const CATEGORIES = [
    {
        name: 'Волосы',
        href: '/search?q=Стрижка',
        imageSrc: '/categories/hair_texture.png',
        subServices: ['Стрижка и укладка', 'Сложное окрашивание', 'Уход и восстановление'],
    },
    {
        name: 'Ногти',
        href: '/search?q=Маникюр',
        imageSrc: '/categories/manicure.png',
        subServices: ['Гелевое наращивание', 'Аппаратный маникюр', 'Дизайн ногтей'],
    },
    {
        name: 'Брови',
        href: '/search?q=Брови',
        imageSrc: '/categories/eyebrow_macro.png',
        subServices: ['Коррекция формы', 'Окрашивание', 'Долговременная укладка'],
    },
    {
        name: 'Педикюр',
        href: '/search?q=Педикюр',
        imageSrc: '/categories/spa_pedicure.png',
        subServices: ['Spa-педикюр', 'Смарт-педикюр', 'Покрытие гель-лаком'],
    },
    {
        name: 'Массаж',
        href: '/search?q=Массаж',
        imageSrc: '/categories/massage.png',
        subServices: ['Классический', 'Лимфодренажный', 'Стоун-терапия'],
    },
    {
        name: 'Косметология',
        href: '/search?q=Косметология',
        imageSrc: '/categories/cosmetology.png',
        subServices: ['Чистка лица', 'Пилинги', 'Увлажняющие уходы'],
    },
];

export default function CategoryNav() {
    const [flippedCategory, setFlippedCategory] = useState<string | null>(null);

    const handleFastTravel = (text: string) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const event = new CustomEvent('smart-search-trigger', { detail: { service: text } });
        window.dispatchEvent(event);
    };

    const handleCardClick = (name: string) => {
        setFlippedCategory(prev => prev === name ? null : name);
    };

    return (
        <section className="py-24 px-8 bg-[#F5F2ED]">
            <div className="max-w-screen-2xl mx-auto">
                {/* Section Header */}
                <div className="flex flex-col items-center text-center mb-16 relative">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-booking-primary mb-3 block">
                        Откройте для себя
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-booking-textMain">
                        Популярные услуги
                    </h2>
                    <a
                        href="/search"
                        className="hidden md:block absolute right-0 bottom-2 border-b-2 border-booking-primary pb-1 text-xs font-bold uppercase tracking-widest text-booking-textMain hover:text-booking-primary transition-colors"
                    >
                        Все категории
                    </a>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {CATEGORIES.map((cat) => (
                        <div
                            key={cat.name}
                            className="relative aspect-[3/4] cursor-pointer [perspective:1000px]"
                            onClick={() => handleCardClick(cat.name)}
                        >
                            <div className={cn(
                                "relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]",
                                flippedCategory === cat.name ? "[transform:rotateY(180deg)]" : ""
                            )}>
                                {/* Front Face */}
                                <div 
                                    className="absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden rounded-xl bg-stone-200"
                                >
                                    <Image
                                        src={cat.imageSrc}
                                        alt={cat.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-6 left-6">
                                        <p className="text-white text-xs font-bold uppercase tracking-[0.2em]">{cat.name}</p>
                                    </div>
                                </div>

                                {/* Back Face */}
                                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden rounded-xl bg-[#2F4B3A] flex flex-col items-center justify-center p-6 text-center shadow-inner">
                                    <p className="text-white text-xs font-bold uppercase tracking-[0.2em] mb-4 opacity-70">{cat.name}</p>
                                    <ul className="space-y-3">
                                        {cat.subServices.map((sub, idx) => (
                                            <li 
                                                key={idx} 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFastTravel(sub);
                                                }}
                                                className="text-[#F5F2ED]/90 hover:text-white text-[13px] md:text-sm font-sans font-medium tracking-wide cursor-pointer transition-colors"
                                            >
                                                {sub}
                                            </li>
                                        ))}
                                    </ul>
                                    <div 
                                        className="mt-8 text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#F5F2ED]/60 hover:text-white cursor-pointer transition-colors group/cta flex items-center"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFastTravel(cat.name);
                                        }}
                                    >
                                        Смотреть все <span className="ml-1 group-hover/cta:translate-x-1 transition-transform duration-300">➔</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
