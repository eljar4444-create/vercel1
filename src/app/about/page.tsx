'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { ShieldCheck, Sparkles, BadgeCheck } from 'lucide-react';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

export default function AboutPage() {
    return (
        <div className="bg-[#F5F2ED] pt-16 md:pt-20">
            {/* Section 1: Hero Manifesto */}
            <section className="py-10 px-8 text-center">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={containerVariants}
                    className="max-w-4xl mx-auto flex flex-col items-center"
                >
                    <motion.h1 
                        variants={itemVariants}
                        className="text-4xl md:text-5xl font-bold tracking-tighter text-booking-textMain mb-6 leading-tight"
                    >
                        Закрытый маркетплейс проверенных бьюти-специалистов.
                    </motion.h1>
                    <motion.p 
                        variants={itemVariants}
                        className="text-booking-textMuted text-base md:text-lg font-light leading-relaxed max-w-2xl"
                    >
                        SVOI — это технологичная платформа для поиска и онлайн-записи к независимым мастерам и салонам красоты в Германии. Наша цель — сделать рынок бьюти-услуг прозрачным, а процесс бронирования — быстрым и предсказуемым.
                    </motion.p>
                </motion.div>
            </section>

            {/* Section 2: The Audit Process */}
            <section className="py-10 px-8 border-t border-stone-200/30">
                <div className="max-w-screen-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-center mb-8"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-booking-textMain">
                            Принцип жесткой модерации
                        </h2>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-[#ebe4db] rounded-full flex items-center justify-center mb-4">
                                <Sparkles className="w-6 h-6 text-booking-primary" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-booking-textMain">Верификация квалификации</h3>
                            <p className="text-booking-textMuted text-sm leading-relaxed">
                                Мы проверяем профессиональный бэкграунд каждого специалиста. Доступ на платформу открыт только мастерам с подтвержденным опытом и сертификацией.
                            </p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-[#ebe4db] rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck className="w-6 h-6 text-booking-primary" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-booking-textMain">Оценка портфолио</h3>
                            <p className="text-booking-textMuted text-sm leading-relaxed">
                                Никаких стоковых изображений или чужих работ. Профиль мастера — это строго задокументированная витрина его реальных навыков.
                            </p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-[#ebe4db] rounded-full flex items-center justify-center mb-4">
                                <BadgeCheck className="w-6 h-6 text-booking-primary" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-booking-textMain">Независимый рейтинг</h3>
                            <p className="text-booking-textMuted text-sm leading-relaxed">
                                Оценки и отзывы формируются алгоритмом исключительно на основе подтвержденных визитов через платформу SVOI. Накрутки исключены.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Section 3: Dual Value Proposition */}
            <section className="py-10 px-8 bg-white border-t border-stone-200/30">
                <div className="max-w-screen-2xl mx-auto">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="grid md:grid-cols-2 gap-8"
                    >
                        {/* Left Block */}
                        <motion.div variants={itemVariants} className="flex flex-col justify-center items-start bg-[#F5F2ED] p-8 md:p-10 rounded-[1.5rem]">
                            <h3 className="text-2xl md:text-3xl font-bold tracking-tighter text-booking-textMain mb-4">
                                Инфраструктура для клиентов
                            </h3>
                            <p className="text-booking-textMuted text-base leading-relaxed">
                                Единая точка доступа к лучшим бьюти-специалистам города. Выбирайте услугу, сверяйте цены и бронируйте свободные слоты в календаре мастера 24/7.
                            </p>
                        </motion.div>

                        {/* Right Block */}
                        <motion.div variants={itemVariants} className="flex flex-col justify-center items-start bg-booking-primary text-white p-8 md:p-10 rounded-[1.5rem]">
                            <h3 className="text-2xl md:text-3xl font-bold tracking-tighter mb-4">
                                Инфраструктура для бизнеса
                            </h3>
                            <p className="text-white/90 text-base leading-relaxed">
                                SVOI предоставляет мастерам и салонам полноценную CRM-систему: управление расписанием, автоматические напоминания клиентам и защиту от неявок.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Section 4: The Final Push */}
            <section className="py-12 px-8 text-center bg-white">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className="max-w-4xl mx-auto"
                >
                    <motion.h2
                        variants={itemVariants}
                        className="text-4xl md:text-5xl font-bold tracking-tighter text-booking-textMain mb-8 leading-tight"
                    >
                        Платформа, где качество — это правило.
                    </motion.h2>

                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col sm:flex-row justify-center gap-4"
                    >
                        <Link
                            href="/search"
                            className="bg-booking-primary text-white px-10 py-4 rounded-lg font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all"
                        >
                            Найти мастера
                        </Link>
                        <Link
                            href="/become-pro"
                            className="border-2 border-booking-primary text-booking-primary px-10 py-4 rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-booking-primary hover:text-white transition-all"
                        >
                            Стать мастером
                        </Link>
                    </motion.div>
                </motion.div>
            </section>
        </div>
    );
}
