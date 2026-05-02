'use client';

import { motion, Variants } from 'framer-motion';
import { useTranslations } from 'next-intl';

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
        transition: { duration: 0.8, ease: "easeOut" }
    }
};

const ICONS = [
    (
        <svg key="1" className="w-8 h-8 text-booking-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
    ),
    (
        <svg key="2" className="w-8 h-8 text-booking-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    ),
    (
        <svg key="3" className="w-8 h-8 text-booking-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-4.5A1.5 1.5 0 0 0 15 12.75H9A1.5 1.5 0 0 0 7.5 14.25v4.5m9-12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
        </svg>
    ),
];

export default function HowItWorks() {
    const t = useTranslations('home.howItWorks');

    const columns = [
        { icon: ICONS[0], title: t('step1.title'), description: t('step1.description') },
        { icon: ICONS[1], title: t('step2.title'), description: t('step2.description') },
        { icon: ICONS[2], title: t('step3.title'), description: t('step3.description') },
    ];

    return (
        <section className="py-24 px-8 bg-[#F5F2ED] border-t border-stone-200/30">
            <div className="max-w-screen-2xl mx-auto">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className="grid md:grid-cols-3 gap-16"
                >
                    {columns.map((col) => (
                        <motion.div
                            variants={itemVariants}
                            key={col.title}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 bg-[#ebe4db] rounded-full flex items-center justify-center mb-6">
                                {col.icon}
                            </div>
                            <h4 className="text-xl font-bold mb-4 text-booking-textMain">
                                {col.title}
                            </h4>
                            <p className="text-booking-textMuted leading-relaxed">
                                {col.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
