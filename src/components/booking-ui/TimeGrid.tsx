'use client';

export function TimeGrid({
    slots,
    selectedTime,
    onSelectTime,
}: {
    slots: string[];
    selectedTime: string;
    onSelectTime: (time: string) => void;
}) {
    if (!slots || slots.length === 0) {
        return (
            <section className="mb-8">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-booking-textMuted mb-4">
                    Время
                </h2>
                <div className="rounded-2xl border border-booking-border bg-white p-6 text-center text-sm text-booking-textMuted">
                    На этот день нет свободного времени
                </div>
            </section>
        );
    }

    return (
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-booking-textMuted mb-4">
                Время
            </h2>
            <div className="rounded-2xl border border-booking-border bg-white p-4 sm:p-5">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                    {slots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                            <button
                                key={slot}
                                type="button"
                                onClick={() => onSelectTime(slot)}
                                className={`h-11 rounded-lg text-sm font-medium transition-colors duration-150 border ${
                                    isSelected
                                        ? 'bg-booking-primary text-white border-booking-primary'
                                        : 'bg-white text-booking-textMain border-booking-border hover:border-booking-primary'
                                }`}
                            >
                                {slot}
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
