'use server';

import prisma from '@/lib/prisma';

interface BookingInput {
    profileId: number;
    serviceId?: number | null;
    date: string;       // "2026-02-20"
    time: string;       // "14:00"
    userName: string;
    userPhone: string;
}

export async function createBooking(input: BookingInput) {
    try {
        const booking = await prisma.booking.create({
            data: {
                profile_id: input.profileId,
                service_id: input.serviceId || null,
                date: new Date(input.date),
                time: input.time,
                user_name: input.userName,
                user_phone: input.userPhone,
                status: 'pending',
            },
        });

        return { success: true, bookingId: booking.id };
    } catch (error: any) {
        console.error('Booking creation error:', error);
        return { success: false, error: error.message || 'Ошибка при создании записи' };
    }
}
