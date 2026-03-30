import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

const CATEGORIES = [
    { 
        name: 'Волосы', 
        href: '/search?q=Стрижка', 
        imageSrc: '/categories/hair.png',
        bullets: ['Стрижка и укладка', 'Сложное окрашивание', 'Уход и восстановление']
    },
    { 
        name: 'Маникюр', 
        href: '/search?q=Маникюр', 
        imageSrc: '/categories/manicure.png',
        bullets: ['Гелевое наращивание', 'Аппаратный маникюр', 'Японский уход']
    },
    { 
        name: 'Косметология', 
        href: '/search?q=Косметология', 
        imageSrc: '/categories/cosmetology.png',
        bullets: ['Глубокое увлажнение', 'Пилинги', 'LED-терапия']
    },
    { 
        name: 'Массаж', 
        href: '/search?q=Массаж', 
        imageSrc: '/categories/massage.png',
        bullets: ['Стоун-терапия', 'Ароматерапия', 'Классический массаж']
    },
];

export default function CategoryNav() {
    return (
        <section className="pt-8 pb-16 md:pt-16 md:pb-24 bg-booking-bg">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Centered Lookbook Title */}
                <div className="mb-12 text-center">
                    <h2 className="font-didot text-3xl md:text-5xl font-bold tracking-wide text-[#2F4B3A]">
                        Популярные услуги
                    </h2>
                </div>

                {/* Service Feature Cards (4 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.name}
                            href={cat.href}
                            className="group flex flex-col bg-white rounded-[2rem] p-7 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 border border-gray-100/50"
                        >
                            {/* The "Icon" Image */}
                            <div className="w-14 h-14 rounded-full overflow-hidden relative mb-5 shrink-0 shadow-sm border border-gray-50/50">
                                <Image
                                    src={cat.imageSrc}
                                    alt={cat.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                    sizes="56px"
                                />
                            </div>

                            {/* Title */}
                            <h3 className="font-didot text-2xl font-bold text-gray-900 mb-4 tracking-wide group-hover:text-[#2F4B3A] transition-colors">
                                {cat.name}
                            </h3>

                            {/* Sub-services Bullets */}
                            <ul className="flex flex-col gap-3 mb-8 flex-grow">
                                {cat.bullets.map((bullet, idx) => (
                                    <li key={idx} className="flex items-start text-[14px] text-gray-400 font-sans font-medium leading-tight">
                                        <span className="text-gray-300 mr-2 shrink-0 text-xs drop-shadow-sm mt-0.5">&bull;</span>
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <div className="font-sans text-[13px] font-bold text-[#2F4B3A] uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all mt-auto pt-4 border-t border-gray-50">
                                Выбрать <span>&rarr;</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
