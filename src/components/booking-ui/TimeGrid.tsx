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
            <section className="mb-10">
                <h2 className="font-serif text-2xl text-booking-textMain flex items-center gap-2 mb-6 opacity-50">
                    <span className="text-booking-textMuted tracking-tight text-xl translate-y-[2px]">🕒</span> 
                    На этот день нет свободного времени
                </h2>
            </section>
        );
    }
    return (
        <section className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="font-serif text-2xl text-booking-textMain flex items-center gap-2 mb-6">
                <span className="text-booking-textMuted tracking-tight text-xl translate-y-[2px]">🕒</span> 
                Доступное время
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                {slots.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                        <button
                            key={slot}
                            onClick={() => onSelectTime(slot)}
                            className={`
                                h-12 rounded-[1rem] flex items-center justify-center text-[15px] font-medium transition-all duration-300
                                ${isSelected
                                    ? 'bg-booking-primary text-white shadow-[0_6px_16px_rgba(47,75,58,0.3)] shadow-soft-in'
                                    : 'bg-[#F2EFE8] text-booking-textMain shadow-[4px_4px_8px_rgba(200,193,183,0.5),-4px_-4px_8px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_4px_rgba(200,193,183,0.5),-2px_-2px_4px_rgba(255,255,255,0.9)]'
                                }
                            `}
                        >
                            {slot}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
