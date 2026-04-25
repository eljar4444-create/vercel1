'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { DateScroll } from '@/components/booking-ui/DateScroll';
import { TimeGrid } from '@/components/booking-ui/TimeGrid';
import { UserForm } from '@/components/booking-ui/UserForm';
import { OrderSummary } from '@/components/booking-ui/OrderSummary';
import { getWeekAvailableSlots, createBooking } from '@/app/actions/booking';
import toast from 'react-hot-toast';

interface BookingStandaloneProps {
    profile: {
        id: number;
        slug: string;
        name: string;
        staff: { id: string; name: string; avatarUrl: string | null }[];
    };
    service: {
        id: number;
        title: string;
        price: string;
        duration_min: number;
        image?: string | null;
    } | null;
    sessionUser: any;
    initialStaffId?: string | null;
}

export function BookingStandalone({ profile, service, sessionUser, initialStaffId }: BookingStandaloneProps) {
    const router = useRouter();
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const [weekStart, setWeekStart] = useState(() => {
        const d = new Date();
        const day = d.getDay() || 7;
        const diff = d.getDate() - day + 1;
        const start = new Date(d.setDate(diff));
        start.setHours(0, 0, 0, 0);
        return start;
    });

    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(initialStaffId || null);

    const [name, setName] = useState(sessionUser?.name || '');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(sessionUser?.email || '');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoAdvanced, setAutoAdvanced] = useState(0);

    // Provide a fallback service if one isn't passed (e.g. they came without search params)
    const effectiveService = service || {
        id: 0,
        title: 'Консультация',
        price: 'Бесплатно',
        duration_min: 60,
    };

    const fetchWeekSlots = useCallback(async (key: any): Promise<Record<string, string[]>> => {
        const [, pId, sDate, dur, sStaffId] = key;
        const result = await getWeekAvailableSlots({
            profileId: pId,
            staffId: sStaffId,
            startDate: sDate,
            serviceDuration: dur,
        });
        if ('weekSlots' in result && result.weekSlots) {
            return result.weekSlots as Record<string, string[]>;
        }
        return {} as Record<string, string[]>;
    }, []);

    const toDateKey = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const { data } = useSWR<{ [date: string]: string[] }>(
        ['weekSlots', profile.id, toDateKey(weekStart), effectiveService.duration_min, selectedStaffId],
        fetchWeekSlots,
        {
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );
    const weekSlotsMap = data || {};

    useEffect(() => {
        if (!data) return;

        // Ensure we are looking at the data for the CURRENT weekStart, to avoid loops with keepPreviousData
        if (data[toDateKey(weekStart)] === undefined) return;

        // Find available slots in current fetched data
        const availableDates = Object.entries(data)
            .filter(([dateStr, slots]) => {
                const parts = dateStr.split('-');
                if (parts.length !== 3) return false;
                const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                d.setHours(0, 0, 0, 0);
                return d >= today && slots.length > 0;
            })
            .sort((a, b) => a[0].localeCompare(b[0]));

        if (availableDates.length > 0) {
            // If data is loaded and we have no selected date across the board, auto-select the earliest available
            if (!selectedDate && autoAdvanced < 4) {
                setSelectedDate(availableDates[0][0]);
                setSelectedTime('');
                setAutoAdvanced(4); // Stop any further auto-advance
            } else if (autoAdvanced < 4) {
               setAutoAdvanced(4);
            }
        } else {
            // No slots available this week from 'today' onwards
            if (autoAdvanced < 4) {
                // Auto advance to next week (up to 4 weeks)
                setAutoAdvanced(prev => prev + 1);
                const next = new Date(weekStart);
                next.setDate(next.getDate() + 7);
                setWeekStart(next);
            }
        }
    }, [data, today, weekStart, selectedDate, autoAdvanced]);

    const handlePrevWeek = () => {
        const prev = new Date(weekStart);
        prev.setDate(prev.getDate() - 7);
        if (prev >= today) setWeekStart(prev);
    };

    const handleNextWeek = () => {
        const next = new Date(weekStart);
        next.setDate(next.getDate() + 7);
        setWeekStart(next);
    };

    const handleDateSelect = (dateKey: string) => {
        setSelectedDate(dateKey);
        setSelectedTime(''); // reset time on change
    };

    const availableTimes = selectedDate ? (weekSlotsMap[selectedDate] || []) : [];
    
    // Derived state
    const staffRef = profile.staff.find(s => s.id === selectedStaffId);
    const staffName = staffRef?.name;

    const canSubmit = !!(selectedDate && selectedTime && name && phone);

    const handleSubmit = async () => {
        if (!process.env.NEXT_PUBLIC_ALLOW_UNAUTHENTICATED_BOOKINGS && !sessionUser && !phone) {
            toast.error('Необходима авторизация или указание телефона');
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await createBooking({
                profileId: profile.id,
                staffId: selectedStaffId,
                serviceId: service ? service.id : null,
                serviceDuration: effectiveService.duration_min,
                date: selectedDate,
                time: selectedTime,
                userName: name,
                userPhone: phone,
            });

            if (result.success) {
                toast.success('Успешно! Вы записаны.');
                router.push(`/my-bookings`);
            } else {
                toast.error(result.error || 'Ошибка записи');
            }
        } catch (_) {
            toast.error('Ошибка сервера');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Mobile stack & grid layout
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            
            <header className="mb-10 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-sans font-semibold text-booking-textMain tracking-tight mb-3">
                    Оформление записи
                </h1>
                <p className="text-base text-booking-textMuted max-w-2xl leading-relaxed">
                    Выберите удобную дату и время для визита в <span className="font-medium text-booking-textMain">{profile.name}</span>.
                </p>
            </header>

            {profile.staff && profile.staff.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-booking-textMuted mb-5">
                        Выберите мастера
                    </h2>
                    <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
                        <StaffPick
                            selected={selectedStaffId === null}
                            onClick={() => { setSelectedStaffId(null); setSelectedDate(''); setSelectedTime(''); }}
                            name="Любой"
                        />
                        {profile.staff.map(staff => (
                            <StaffPick
                                key={staff.id}
                                selected={selectedStaffId === staff.id}
                                onClick={() => { setSelectedStaffId(staff.id); setSelectedDate(''); setSelectedTime(''); }}
                                name={staff.name}
                                avatarUrl={staff.avatarUrl}
                            />
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-20">
                {/* Main Selection Area */}
                <div className="lg:col-span-8 flex flex-col xl:pr-8">
                    <DateScroll
                        weekStart={weekStart}
                        selectedDateKey={selectedDate}
                        availableSlots={weekSlotsMap}
                        onSelectDate={handleDateSelect}
                        onPrevWeek={handlePrevWeek}
                        onNextWeek={handleNextWeek}
                        today={today}
                    />
                    
                    {selectedDate && (
                        <TimeGrid 
                            slots={availableTimes}
                            selectedTime={selectedTime}
                            onSelectTime={setSelectedTime}
                        />
                    )}

                    {selectedDate && selectedTime ? (
                        <UserForm
                            name={name} setName={setName}
                            phone={phone} setPhone={setPhone}
                            email={email} setEmail={setEmail}
                            comment={comment} setComment={setComment}
                        />
                    ) : null}
                </div>

                {/* Sticky Summary & Submit Area */}
                <div className="lg:col-span-4 self-start order-first lg:order-last mb-8 lg:mb-0 w-full z-10 transition-all duration-300">
                    <OrderSummary 
                        service={effectiveService}
                        staffName={staffName}
                        dateKey={selectedDate}
                        time={selectedTime}
                        isSubmitting={isSubmitting}
                        onSubmit={handleSubmit}
                        canSubmit={canSubmit}
                    />
                </div>
            </div>
            
        </div>
    );
}

function StaffPick({
    selected,
    onClick,
    name,
    avatarUrl,
}: {
    selected: boolean;
    onClick: () => void;
    name: string;
    avatarUrl?: string | null;
}) {
    const initials = name === 'Любой' ? '∗' : name.charAt(0).toUpperCase();
    return (
        <button
            type="button"
            onClick={onClick}
            className="shrink-0 flex flex-col items-center gap-2 w-20 group focus:outline-none"
        >
            <div
                className={`h-16 w-16 rounded-full overflow-hidden bg-white border transition-all ${
                    selected
                        ? 'border-transparent ring-[3px] ring-booking-primary ring-offset-2 ring-offset-booking-bg'
                        : 'border-booking-border group-hover:border-booking-textMuted'
                }`}
            >
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt={name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-booking-textMuted font-medium text-lg">
                        {initials}
                    </div>
                )}
            </div>
            <span className={`text-xs text-center leading-tight truncate w-full ${selected ? 'text-booking-textMain font-medium' : 'text-booking-textMuted'}`}>
                {name}
            </span>
        </button>
    );
}
