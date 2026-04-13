"use client";

import { motion } from "framer-motion";
import { Scissors, Sparkles, Eye, Palette, Hand, Flower } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const categories = [
    {
        id: "hair",
        title: "Волосы",
        icon: Scissors,
        services: [
            "Стрижки",
            "Сложное окрашивание",
            "Наращивание",
            "Тонирование",
            "Укладки",
            "Кератин / Ботокс"
        ]
    },
    {
        id: "face",
        title: "Лицо и Уход",
        icon: Sparkles,
        services: [
            "Чистка лица",
            "Пилинги",
            "Аппаратная косметология",
            "Массаж лица",
            "Уходовые маски"
        ]
    },
    {
        id: "lashes",
        title: "Брови и Ресницы",
        icon: Eye,
        services: [
            "Архитектура бровей",
            "Ламинирование",
            "Наращивание ресниц",
            "Окрашивание"
        ]
    },
    {
        id: "makeup",
        title: "Макияж",
        icon: Palette,
        services: [
            "Вечерний макияж",
            "Свадебный макияж",
            "Экспресс-мейкап",
            "Обучение «Макияж для себя»"
        ]
    },
    {
        id: "nails",
        title: "Ногтевой сервис",
        icon: Hand,
        services: [
            "Маникюр",
            "Педикюр",
            "Наращивание ногтей",
            "Подология",
            "Дизайн"
        ]
    },
    {
        id: "body",
        title: "Тело и Эпиляция",
        icon: Flower,
        services: [
            "Массаж",
            "Лазерная эпиляция",
            "Шугаринг / Воск",
            "Антицеллюлитный уход",
            "СПА"
        ]
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

export default function CityHubPage() {
    const params = useParams();
    const cityName = decodeURIComponent(params.city as string);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F4EFE6] w-full flex flex-col items-center py-16 md:py-20">
            {/* Hero Section */}
            <section className="w-full max-w-6xl px-6 md:px-12 text-center mb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h1 className="text-4xl md:text-5xl lg:text-5xl font-medium tracking-tight text-gray-900 mb-6">
                        Бьюти-специалисты в городе {cityName}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
                        Выберите направление, чтобы найти лучших мастеров SVOI в вашей локации.
                    </p>
                </motion.div>
            </section>

            {/* Catalog Grid */}
            <section className="w-full max-w-6xl px-6 md:px-12">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                >
                    {categories.map((category) => {
                        const Icon = category.icon;

                        return (
                            <motion.div
                                key={category.id}
                                variants={itemVariants}
                                className="bg-[#1B2A23] border-2 border-[#C2A363] p-8 rounded-3xl flex flex-col h-full shadow-lg transition-all duration-300"
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
                            </motion.div>
                        );
                    })}
                </motion.div>
            </section>
        </div>
    );
}
