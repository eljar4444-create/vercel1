import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

const CATEGORIES = [
    {
        name: 'Волосы',
        href: '/search?q=Стрижка',
        imageSrc: '/categories/hair.png',
    },
    {
        name: 'Ногти',
        href: '/search?q=Маникюр',
        imageSrc: '/categories/manicure.png',
    },
    {
        name: 'Брови',
        href: '/search?q=Брови',
        imageSrc: '/categories/cosmetology.png',
    },
    {
        name: 'Педикюр',
        href: '/search?q=Педикюр',
        imageSrc: '/categories/massage.png',
    },
    {
        name: 'Массаж',
        href: '/search?q=Массаж',
        imageSrc: '/categories/massage.png',
    },
    {
        name: 'Косметология',
        href: '/search?q=Косметология',
        imageSrc: '/categories/cosmetology.png',
    },
];

export default function CategoryNav() {
    return (
        <section className="py-24 px-8 bg-[#F5F2ED]">
            <div className="max-w-screen-2xl mx-auto">
                {/* Section Header */}
                <div className="flex justify-between items-end mb-16">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-booking-primary mb-3 block">
                            Откройте для себя
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-booking-textMain">
                            Популярные услуги
                        </h2>
                    </div>
                    <Link
                        href="/search"
                        className="hidden md:block border-b-2 border-booking-primary pb-1 text-xs font-bold uppercase tracking-widest text-booking-textMain hover:text-booking-primary transition-colors"
                    >
                        Все категории
                    </Link>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.name}
                            href={cat.href}
                            className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-stone-200 cursor-pointer"
                        >
                            <div className="absolute inset-0">
                                <Image
                                    src={cat.imageSrc}
                                    alt={cat.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6">
                                <p className="text-white text-xs font-bold uppercase tracking-[0.2em]">{cat.name}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
