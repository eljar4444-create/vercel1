"use client";

import { motion } from "framer-motion";
import { Scissors, Sparkles, Eye, Palette, Hand, Flower } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Master catalogue: main categories plus the exhaustive service lists used by
// both the 6 quick-link cards and the full A-Z directory below them.
// ─────────────────────────────────────────────────────────────────────────────
const rawCategoriesData = [
    {
        id: "hair",
        title: "Волосы",
        icon: Scissors,
        services: [
            "Афроплетение", "Балаяж", "Биозавивка волос", "Ботокс для волос", "Бразильское выпрямление",
            "Голливудское наращивание волос", "Детская стрижка", "Женская стрижка", "Капсульное наращивание",
            "Кератиновое выпрямление", "Колорирование", "Мелирование", "Мужская стрижка", "Наращивание волос",
            "Окрашивание в один тон", "Омбре", "Осветление волос", "Свадебная укладка", "Сложное окрашивание",
            "Тонирование волос", "Укладка волос", "Химическая завивка", "Шатуш"
        ]
    },
    {
        id: "face",
        title: "Лицо и Уход",
        icon: Sparkles,
        services: [
            "Аппаратная косметология", "Биоревитализация", "Массаж лица", "Пилинг лица",
            "СПА-уход для лица", "Ультразвуковая чистка лица", "Уходовые маски", "Чистка лица"
        ]
    },
    {
        id: "lashes",
        title: "Брови и Ресницы",
        icon: Eye,
        services: [
            "Архитектура бровей", "Коррекция бровей", "Ламинирование бровей", "Ламинирование ресниц",
            "Наращивание ресниц (2D/3D)", "Наращивание ресниц (Классика)", "Окрашивание бровей"
        ]
    },
    {
        id: "makeup",
        title: "Макияж",
        icon: Palette,
        services: [
            "Вечерний макияж", "Визаж", "Дневной макияж", "Макияж для себя", "Перманентный макияж бровей",
            "Перманентный макияж губ", "Свадебный макияж", "Татуаж", "Экспресс-макияж"
        ]
    },
    {
        id: "nails",
        title: "Ногтевой сервис",
        icon: Hand,
        services: [
            "Аппаратный маникюр", "Аппаратный педикюр", "Горячий маникюр", "Дизайн ногтей",
            "Европейский маникюр", "Комбинированный маникюр", "Маникюр с покрытием гель-лак",
            "Наращивание ногтей", "Педикюр", "Подология", "Снятие гель-лака",
            "Французский маникюр (Френч)", "Японский маникюр"
        ]
    },
    {
        id: "body",
        title: "Тело и Эпиляция",
        icon: Flower,
        services: [
            "Антицеллюлитный массаж", "Восковая депиляция", "Депиляция", "Классический массаж",
            "Лазерная эпиляция", "Лимфодренажный массаж", "Пирсинг", "Спортивный массаж",
            "Шугаринг", "Эпиляция"
        ]
    }
];

// Defensive A-Z sort — the source data is already alphabetical, but this
// guarantees the invariant holds if the arrays are edited later.
const categoriesData = rawCategoriesData.map((category) => ({
    ...category,
    services: [...category.services].sort((a, b) => a.localeCompare(b, "ru")),
}));

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export default function ServicesPage() {
    const [searchQuery, setSearchQuery] = useState("");

    // Nested filter: keep categories that still have matching services.
    const filteredCategories = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return categoriesData;
        return categoriesData
            .map((category) => ({
                ...category,
                services: category.services.filter((service) =>
                    service.toLowerCase().includes(query)
                ),
            }))
            .filter((category) => category.services.length > 0);
    }, [searchQuery]);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F4EFE6] w-full flex flex-col items-center py-16 md:py-20 scroll-smooth">
            {/* Hero Section */}
            <section className="w-full max-w-6xl px-6 md:px-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h1 className="text-4xl md:text-5xl lg:text-5xl font-medium tracking-tight text-gray-900 mb-6">
                        Каталог услуг
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed mb-8">
                        Выберите направление, чтобы найти лучших специалистов в вашей локации.
                    </p>

                    {/* Live Search */}
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Найти услугу..."
                        className="max-w-2xl mx-auto w-full px-6 py-4 rounded-full border border-gray-200 focus:border-[#C2A363] focus:ring-1 focus:ring-[#C2A363] outline-none text-gray-900 bg-white shadow-sm mb-16"
                    />
                </motion.div>
            </section>

            {/* Quick Links — 6 main-category cards. Hidden while searching. */}
            {!searchQuery && (
                <section className="w-full max-w-6xl px-6 md:px-12">
                    <h2 className="text-3xl font-bold text-[#1B2A23] mb-8">
                        Основные направления
                    </h2>
                <motion.section
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                >
                    {categoriesData.map((category) => {
                        const Icon = category.icon;
                        const previewServices = category.services.slice(0, 5);
                        const remaining = category.services.length - previewServices.length;

                        return (
                            <motion.div key={category.id} variants={itemVariants}>
                                <Link
                                    href={`#category-${category.id}`}
                                    className="group block bg-[#1B2A23] border-2 border-[#C2A363] p-8 rounded-3xl h-full shadow-lg hover:shadow-[0_0_30px_rgba(194,163,99,0.35)] hover:scale-[1.02] transition-all duration-300"
                                >
                                    <div className="flex items-center space-x-5 mb-8">
                                        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                                            <Icon className="w-6 h-6" strokeWidth={1.5} />
                                        </div>
                                        <h2 className="text-2xl font-medium tracking-tight text-white">
                                            {category.title}
                                        </h2>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {previewServices.map((service) => (
                                            <span
                                                key={service}
                                                className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm text-white group-hover:bg-white/15 transition-colors"
                                            >
                                                {service}
                                            </span>
                                        ))}
                                        {remaining > 0 && (
                                            <span className="inline-flex items-center px-4 py-2 bg-[#C2A363] rounded-full text-sm font-semibold text-[#1B2A23]">
                                                + ещё {remaining}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.section>
                </section>
            )}

            {/* Complete Directory — grouped by category */}
            <section className="w-full max-w-6xl px-6 md:px-12">
                {filteredCategories.length === 0 ? (
                    <p className="text-center text-gray-500 text-lg mt-16">
                        Ничего не найдено. Попробуйте другой запрос.
                    </p>
                ) : (
                    filteredCategories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <div
                                key={category.id}
                                id={`category-${category.id}`}
                                className="scroll-mt-24"
                            >
                                <div className="flex items-center gap-3 mb-6 mt-16 pb-4 border-b border-[#C2A363]/30">
                                    <Icon className="w-8 h-8 text-[#C2A363]" />
                                    <h3 className="text-3xl font-bold text-[#1B2A23]">
                                        {category.title}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6">
                                    {category.services.map((service) => (
                                        <Link
                                            key={service}
                                            href={`/services/${encodeURIComponent(service)}`}
                                            className="text-gray-600 hover:text-[#C2A363] hover:underline underline-offset-4 transition-colors font-medium"
                                        >
                                            {service}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </section>
        </div>
    );
}
