const COLUMNS = [
    {
        icon: (
            <svg className="w-8 h-8 text-booking-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
        ),
        title: 'Выберите мастера',
        description: 'Изучайте курируемые профили, отзывы и галереи работ профессионалов высшего уровня.',
    },
    {
        icon: (
            <svg className="w-8 h-8 text-booking-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        ),
        title: 'Бронь за 30 секунд',
        description: 'Бесшовная система онлайн-записи позволяет забронировать визит без лишних звонков.',
    },
    {
        icon: (
            <svg className="w-8 h-8 text-booking-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-4.5A1.5 1.5 0 0 0 15 12.75H9A1.5 1.5 0 0 0 7.5 14.25v4.5m9-12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
            </svg>
        ),
        title: 'Стандарты качества',
        description: 'Мы проводим строгий аудит каждого мастера на предмет гигиены и техники выполнения услуг.',
    },
];

export default function HowItWorks() {
    return (
        <section className="py-24 px-8 bg-[#F5F2ED] border-t border-stone-200/30">
            <div className="max-w-screen-2xl mx-auto">
                <div className="grid md:grid-cols-3 gap-16">
                    {COLUMNS.map((col) => (
                        <div
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
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
