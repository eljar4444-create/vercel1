'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';

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

export default function ManifestoBand() {
    return (
        <section className="py-32 px-8 bg-white text-center">
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="max-w-4xl mx-auto"
            >
                <motion.h2
                    variants={itemVariants}
                    className="text-5xl md:text-7xl font-bold tracking-tighter text-booking-textMain mb-12 leading-tight"
                >
                    Мы не идём на компромиссы.<br />И вы не должны.
                </motion.h2>

                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row justify-center gap-6"
                >
                    <Link
                        href="/search"
                        className="bg-booking-primary text-white px-12 py-5 rounded-lg font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all"
                    >
                        Найти мастера
                    </Link>
                    <Link
                        href="/become-pro"
                        className="border-2 border-booking-primary text-booking-primary px-12 py-5 rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-booking-primary hover:text-white transition-all"
                    >
                        Стать мастером
                    </Link>
                </motion.div>
            </motion.div>
        </section>
    );
}
