import Link from "next/link";
import type { Metadata } from "next";
import { Scissors, Sparkles, Eye, Palette, Hand, Flower } from "lucide-react";
import prisma from "@/lib/prisma";
import { getCityFilterVariants } from "@/constants/searchSuggestions";
import { slugify } from "@/lib/slugify";
import { localizedAlternates, pathForLocale, resolveLocale } from "@/i18n/canonical";

export const revalidate = 3600;

interface PageParams {
    params: { locale: string; city: string };
}

const categories = [
    {
        id: "hair",
        title: "Волосы",
        icon: Scissors,
        services: [
            "Стрижки", "Сложное окрашивание", "Наращивание",
            "Тонирование", "Укладки", "Кератин / Ботокс",
        ],
    },
    {
        id: "face",
        title: "Лицо и Уход",
        icon: Sparkles,
        services: [
            "Чистка лица", "Пилинги", "Аппаратная косметология",
            "Массаж лица", "Уходовые маски",
        ],
    },
    {
        id: "lashes",
        title: "Брови и Ресницы",
        icon: Eye,
        services: ["Архитектура бровей", "Ламинирование", "Наращивание ресниц", "Окрашивание"],
    },
    {
        id: "makeup",
        title: "Макияж",
        icon: Palette,
        services: ["Вечерний макияж", "Свадебный макияж", "Экспресс-мейкап", "Обучение «Макияж для себя»"],
    },
    {
        id: "nails",
        title: "Ногтевой сервис",
        icon: Hand,
        services: ["Маникюр", "Педикюр", "Наращивание ногтей", "Подология", "Дизайн"],
    },
    {
        id: "body",
        title: "Тело и Эпиляция",
        icon: Flower,
        services: ["Массаж", "Лазерная эпиляция", "Шугаринг / Воск", "Антицеллюлитный уход", "СПА"],
    },
];

function buildCityWhere(cityName: string) {
    const variants = getCityFilterVariants(cityName);
    const andConditions: any[] = [
        { status: "PUBLISHED" },
        { is_verified: true },
        { category: { slug: { not: "health" } } },
        { user: { isBanned: false } },
    ];
    if (variants.length > 0) {
        andConditions.push({
            OR: variants.map((variant) => ({
                city: { contains: variant, mode: "insensitive" },
            })),
        });
    }
    return { AND: andConditions };
}

async function getCityMasterCount(cityName: string): Promise<number> {
    try {
        return await prisma.profile.count({ where: buildCityWhere(cityName) });
    } catch {
        return 0;
    }
}

async function getTopMasters(cityName: string) {
    try {
        return await prisma.profile.findMany({
            where: buildCityWhere(cityName),
            select: {
                id: true,
                slug: true,
                name: true,
                city: true,
                image_url: true,
                provider_type: true,
                category: { select: { name: true } },
            },
            orderBy: { created_at: "desc" },
            take: 6,
        });
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
    const cityName = decodeURIComponent(params.city);
    const count = await getCityMasterCount(cityName);

    const title = `Лучшие бьюти-мастера в ${cityName} | SVOI`;
    const description = count > 0
        ? `Найдено ${count} проверенных мастеров в ${cityName}. Сравните цены, отзывы и запишитесь онлайн на SVOI.de.`
        : `Проверенные бьюти-мастера в ${cityName}. Сравните цены, отзывы и запишитесь онлайн на SVOI.de.`;

    const citySlug = slugify(cityName);
    const locale = resolveLocale(params.locale);
    const path = `/${citySlug}`;

    return {
        title,
        description,
        alternates: localizedAlternates(locale, path),
        openGraph: { title, description, url: pathForLocale(locale, path) },
    };
}

export default async function CityHubPage({ params }: PageParams) {
    const cityName = decodeURIComponent(params.city);
    const [count, topMasters] = await Promise.all([
        getCityMasterCount(cityName),
        getTopMasters(cityName),
    ]);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F4EFE6] w-full flex flex-col items-center py-16 md:py-20">
            <section className="w-full max-w-6xl px-6 md:px-12 text-center mb-20">
                <h1 className="text-4xl md:text-5xl lg:text-5xl font-medium tracking-tight text-gray-900 mb-6">
                    Бьюти-специалисты в городе {cityName}
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
                    {count > 0
                        ? `Найдено ${count} проверенных мастеров в ${cityName}. Выберите направление, чтобы найти лучших мастеров SVOI в вашей локации.`
                        : `Новые мастера скоро появятся в ${cityName}. А пока — изучите каталог направлений.`}
                </p>
            </section>

            {topMasters.length > 0 && (
                <section className="w-full max-w-6xl px-6 md:px-12 mb-20">
                    <h2 className="text-3xl font-medium tracking-tight text-[#1B2A23] mb-8">
                        Популярные мастера в {cityName}
                    </h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topMasters.map((master) => (
                            <li key={master.id}>
                                <Link
                                    href={`/salon/${master.slug}`}
                                    className="block bg-white border border-[#C2A363]/40 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#C2A363] transition"
                                >
                                    <h3 className="text-xl font-semibold text-[#1B2A23] mb-1">
                                        {master.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {master.category?.name ?? "Мастер красоты"} · {master.city}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className="w-full max-w-6xl px-6 md:px-12">
                <h2 className="sr-only">Направления услуг в {cityName}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <div
                                key={category.id}
                                className="bg-[#1B2A23] border-2 border-[#C2A363] p-8 rounded-3xl flex flex-col h-full shadow-lg"
                            >
                                <div className="flex items-center space-x-5 mb-8">
                                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                                        <Icon className="w-6 h-6" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-2xl font-medium tracking-tight text-white">
                                        {category.title}
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {category.services.map((service) => (
                                        <Link
                                            key={service}
                                            href={`/search?location=${encodeURIComponent(cityName)}&q=${encodeURIComponent(service)}`}
                                            className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm text-white hover:bg-[#C2A363] hover:text-[#1B2A23] transition-colors duration-200"
                                        >
                                            {service}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
