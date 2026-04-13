"use client";

import { useState } from "react";
import { motion, AnimatePresence, cubicBezier, type Variants } from "framer-motion";
import { Search, Calendar, CreditCard, MessageSquareHeart, ChevronDown } from "lucide-react";
import Link from "next/link";

const easeOutExpo = cubicBezier(0.22, 1, 0.36, 1);

const faqs = [
    {
        question: "Нужно ли привязывать карту для бронирования?",
        answer: "Нет. Бронирование через платформу SVOI абсолютно бесплатно. Вы платите только за саму услугу непосредственно мастеру."
    },
    {
        question: "Как отменить или перенести запись?",
        answer: "В вашем личном кабинете есть раздел «Мои записи». Вы можете отменить или перенести визит в один клик, но не позднее чем за 24 часа до начала."
    },
    {
        question: "Что делать, если мастер отменил мою запись?",
        answer: "Такие случаи крайне редки, так как мы строго следим за дисциплиной специалистов. Если это произойдет, вы получите мгновенное уведомление, а платформа предложит вам альтернативные варианты."
    }
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full py-6 text-left focus:outline-none group"
            >
                <span className="text-xl font-medium tracking-tight text-[#1A1514] group-hover:text-black transition-colors">
                    {question}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-shrink-0 ml-4 text-gray-400 group-hover:text-[#1A1514] transition-colors"
                >
                    <ChevronDown className="w-5 h-5" strokeWidth={2} />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: easeOutExpo }}
                        className="overflow-hidden"
                    >
                        <p className="text-[#6B6B6B] font-light leading-relaxed pb-6 pr-8">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function GuidePage() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOutExpo } },
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#FAFAFA] w-full flex flex-col items-center pt-24 pb-20">
            {/* Hero Section */}
            <section className="w-full max-w-5xl px-6 md:px-12 text-center mb-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: easeOutExpo }}
                >
                    <h1 className="text-4xl md:text-5xl lg:text-5xl font-medium tracking-tight text-[#1A1514] mb-6">
                        Ваш идеальный визит начинается здесь
                    </h1>
                    <p className="text-lg md:text-xl text-[#6B6B6B] max-w-2xl mx-auto font-light leading-relaxed">
                        Полное руководство по использованию платформы SVOI. От поиска первого мастера до оплаты услуги.
                    </p>
                </motion.div>
            </section>

            {/* 4-Step Interactive Process Grid */}
            <section className="w-full max-w-5xl px-6 md:px-12 mb-32">
                <motion.ul
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10"
                >
                    {/* Step 1 */}
                    <motion.li variants={itemVariants} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-default flex flex-col items-start space-y-6">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-[#1A1514] overflow-hidden flex-shrink-0">
                            <Search className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-medium tracking-tight text-[#1A1514]">01. Интеллектуальный поиск</h2>
                            <p className="text-[#6B6B6B] font-light leading-relaxed">
                                Укажите ваш город и нужную услугу. Наш алгоритм покажет портфолио, реальные отзывы и свободные окна только тех мастеров, которые прошли проверку качества SVOI.
                            </p>
                        </div>
                    </motion.li>

                    {/* Step 2 */}
                    <motion.li variants={itemVariants} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-default flex flex-col items-start space-y-6">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-[#1A1514] overflow-hidden flex-shrink-0">
                            <Calendar className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-medium tracking-tight text-[#1A1514]">02. Мгновенная запись</h2>
                            <p className="text-[#6B6B6B] font-light leading-relaxed">
                                Выберите удобное время в онлайн-календаре мастера. Запись подтверждается автоматически — вам не нужно ждать ответа в мессенджерах или звонить администратору.
                            </p>
                        </div>
                    </motion.li>

                    {/* Step 3 */}
                    <motion.li variants={itemVariants} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-default flex flex-col items-start space-y-6">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-[#1A1514] overflow-hidden flex-shrink-0">
                            <CreditCard className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-medium tracking-tight text-[#1A1514]">03. Визит и Оплата</h2>
                            <p className="text-[#6B6B6B] font-light leading-relaxed">
                                Никаких скрытых комиссий или предоплат на сайте. Вы оплачиваете услугу напрямую мастеру после завершения визита (наличными или картой, в зависимости от условий мастера).
                            </p>
                        </div>
                    </motion.li>

                    {/* Step 4 */}
                    <motion.li variants={itemVariants} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-default flex flex-col items-start space-y-6">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-[#1A1514] overflow-hidden flex-shrink-0">
                            <MessageSquareHeart className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-medium tracking-tight text-[#1A1514]">04. Отзыв и Рейтинг</h2>
                            <p className="text-[#6B6B6B] font-light leading-relaxed">
                                После визита вы сможете оценить работу специалиста. Ваш честный отзыв формирует независимый рейтинг и помогает другим клиентам сделать правильный выбор.
                            </p>
                        </div>
                    </motion.li>
                </motion.ul>
            </section>

            {/* Interactive FAQ Accordion */}
            <section className="w-full max-w-3xl px-6 md:px-12 mt-24 pb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: easeOutExpo }}
                >
                    <h2 className="text-3xl font-bold text-[#1A1514] text-center mb-10">
                        Частые вопросы
                    </h2>
                    
                    <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        {faqs.map((faq, index) => (
                            <FAQItem key={index} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Bottom CTA */}
            <section className="w-full px-6 mt-20 text-center flex justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.2 }}
                >
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center bg-gray-900 text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        Найти мастера
                    </Link>
                </motion.div>
            </section>
        </div>
    );
}
