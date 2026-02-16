'use client';

import { useState } from 'react';
import { X, Calendar, Clock, User, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { createBooking } from '@/app/actions/booking';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    masterName: string;
    profileId: number;
    selectedService?: {
        id?: number;
        title: string;
        price: string;
    } | null;
    accentColor?: string;
}

const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00',
];

export function BookingModal({
    isOpen,
    onClose,
    masterName,
    profileId,
    selectedService,
    accentColor = 'rose',
}: BookingModalProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const isRose = accentColor === 'rose';
    const btnClass = isRose
        ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-300'
        : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-300';
    const accentText = isRose ? 'text-rose-600' : 'text-teal-600';
    const accentBg = isRose ? 'bg-rose-50' : 'bg-teal-50';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const result = await createBooking({
            profileId,
            serviceId: selectedService?.id || null,
            date,
            time,
            userName: name,
            userPhone: phone,
        });

        setIsSubmitting(false);

        if (result.success) {
            setIsSubmitted(true);
            setTimeout(() => {
                setIsSubmitted(false);
                setDate('');
                setTime('');
                setName('');
                setPhone('');
                onClose();
            }, 2500);
        } else {
            setError(result.error || 'Произошла ошибка. Попробуйте позже.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">

                {/* ── Success State ── */}
                {isSubmitted ? (
                    <div className="p-10 text-center">
                        <div className={`w-20 h-20 ${accentBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                            <CheckCircle className={`w-10 h-10 ${accentText}`} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Заявка отправлена!</h3>
                        <p className="text-gray-500">
                            Мастер свяжется с вами для подтверждения записи.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── Header ── */}
                        <div className="relative p-6 pb-4 border-b border-gray-100">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-xl font-bold text-gray-900 pr-12">
                                Запись к мастеру
                            </h2>
                            <p className="text-lg font-semibold text-gray-700 mt-0.5">
                                {masterName}
                            </p>

                            {selectedService && (
                                <div className={`inline-flex items-center gap-2 mt-3 ${accentBg} ${accentText} px-4 py-2 rounded-xl text-sm font-medium`}>
                                    <span>{selectedService.title}</span>
                                    <span className="font-bold">— {selectedService.price}</span>
                                </div>
                            )}
                            {!selectedService && (
                                <p className="text-sm text-gray-400 mt-2">
                                    Выбор услуг — обсудите с мастером
                                </p>
                            )}
                        </div>

                        {/* ── Form ── */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Date */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    Дата
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Time */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    Время
                                </label>
                                <select
                                    required
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Выберите время</option>
                                    {TIME_SLOTS.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    Ваше имя
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ваше имя"
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    Телефон
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+49 ..."
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full h-14 ${btnClass} text-white font-semibold text-base rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Отправка...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Подтвердить запись
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* Animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
                .animate-slideUp { animation: slideUp 0.3s ease-out; }
            `}</style>
        </div>
    );
}
