'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function JealousyCard() {
    return (
        <section className="py-24 px-8 overflow-hidden">
            <div className="max-w-screen-2xl mx-auto relative rounded-[2rem] bg-booking-primary text-white p-12 md:p-24 overflow-hidden">
                {/* Background image overlay */}
                <div className="absolute inset-0 opacity-40">
                    <Image
                        src="/categories/hair.png"
                        alt="Artist working"
                        fill
                        className="object-cover"
                    />
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center"
                >
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-6 block">
                        Для профессионалов
                    </span>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 leading-tight">
                        Хотите такой же профиль?
                    </h2>
                    <p className="text-white/70 text-lg mb-12 leading-relaxed">
                        Присоединяйтесь к элитному сообществу мастеров SVOI. Представьте свои работы в цифровом ателье для премиальной аудитории.
                    </p>
                    <Link
                        href="/become-pro"
                        className="inline-block bg-white text-booking-primary px-10 py-5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-stone-100 transition-all"
                    >
                        Создать свою галерею
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
