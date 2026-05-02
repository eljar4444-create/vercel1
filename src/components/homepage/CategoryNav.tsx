'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function CategoryNav() {
    const t = useTranslations('home.categoryNav');
    const tCat = useTranslations('home.categories');

    const CATEGORIES = [
        {
            id: 'hair',
            title: tCat('hair.title'),
            href: '/search?q=Стрижка',
            imageSrc: '/categories/cat_hair.png',
            subServices: [tCat('hair.service1'), tCat('hair.service2'), tCat('hair.service3')],
        },
        {
            id: 'nails',
            title: tCat('nails.title'),
            href: '/search?q=Маникюр',
            imageSrc: '/categories/cat_nails.png',
            subServices: [tCat('nails.service1'), tCat('nails.service2'), tCat('nails.service3')],
        },
        {
            id: 'face',
            title: tCat('face.title'),
            href: '/search?q=Брови',
            imageSrc: '/categories/cat_face.png',
            subServices: [tCat('face.service1'), tCat('face.service2'), tCat('face.service3')],
        },
        {
            id: 'body',
            title: tCat('body.title'),
            href: '/search?q=Массаж',
            imageSrc: '/categories/cat_body.png',
            subServices: [tCat('body.service1'), tCat('body.service2'), tCat('body.service3')],
        },
    ];

    const handleFastTravel = (text: string) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const event = new CustomEvent('smart-search-trigger', { detail: { service: text } });
        window.dispatchEvent(event);
    };

    return (
        <section className="py-24 px-8 bg-[#F5F2ED]">
            <div className="max-w-screen-2xl mx-auto">
                {/* Section Header */}
                <div className="flex flex-col items-center text-center mb-16 relative">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-booking-primary mb-3 block">
                        {t('eyebrow')}
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-booking-textMain">
                        {t('title')}
                    </h2>
                    <a
                        href="/search"
                        className="hidden md:block absolute right-0 bottom-2 border-b-2 border-booking-primary pb-1 text-xs font-bold uppercase tracking-widest text-booking-textMain hover:text-booking-primary transition-colors"
                    >
                        {t('allCategories')}
                    </a>
                </div>

                {/* 4-Column Category Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    {CATEGORIES.map((cat) => (
                        <div
                            key={cat.id}
                            className="flex flex-col rounded-2xl overflow-hidden shadow-md hover:shadow-lg border border-gray-100 bg-white h-[420px] sm:h-[450px] group cursor-pointer transition-all duration-300"
                            onClick={() => handleFastTravel(cat.subServices[0])}
                        >
                            {/* Top 75% Image Area */}
                            <div className="relative h-[72%] w-full overflow-hidden shrink-0">
                                <Image
                                    src={cat.imageSrc}
                                    alt={cat.title}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                />
                            </div>

                            {/* Bottom Info Area */}
                            <div className="p-5 mt-auto flex flex-col items-center text-center bg-white flex-1 justify-center">
                                {/* Category Title */}
                                <h3 className="text-gray-950 font-bold text-lg">
                                    {cat.title}
                                </h3>

                                {/* Sub-Services List */}
                                <div className="text-gray-600 text-sm mt-1.5 flex flex-wrap justify-center gap-x-2 gap-y-1">
                                    {cat.subServices.map((sub, idx) => (
                                        <span key={sub} className="flex items-center">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFastTravel(sub);
                                                }}
                                                className="hover:text-booking-primary hover:underline underline-offset-2 transition-colors duration-200 cursor-pointer"
                                            >
                                                {sub}
                                            </button>
                                            {idx < cat.subServices.length - 1 && (
                                                <span className="mx-1.5 text-gray-300">•</span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
