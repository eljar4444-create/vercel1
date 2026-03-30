const COLUMNS = [
    {
        title: 'Выберите мастера',
        description: 'Подтверждённые мастера, реальные фотографии работ и прозрачные цены.',
    },
    {
        title: 'Запишитесь за 30 секунд',
        description: 'Без переписок. Без ожидания. Мгновенное подтверждение. Ваше время важно.',
    },
    {
        title: 'Качество по нашим стандартам',
        description: 'Каждый мастер проверен. Каждый отзыв реален. Без компромиссов.',
    },
];

export default function HowItWorks() {
    return (
        <section className="py-12 md:py-16 bg-booking-bg">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {COLUMNS.map((col) => (
                        <div
                            key={col.title}
                            className="bg-booking-card rounded-[2rem] shadow-soft-out p-8 text-center"
                        >
                            <h3 className="font-didot tracking-wide text-xl md:text-2xl font-bold text-booking-textMain">
                                {col.title}
                            </h3>
                            <p className="font-sans text-sm md:text-base text-booking-textMuted mt-4 leading-relaxed">
                                {col.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
