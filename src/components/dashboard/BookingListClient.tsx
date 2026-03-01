'use client';

import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BookingRow } from '@/components/dashboard/BookingRow';
import { updateBookingStatus } from '@/app/actions/updateBookingStatus';
import toast from 'react-hot-toast';

export type SerializedBooking = {
    id: number;
    date: string;
    time: string;
    user_id?: string | null;
    user_name: string;
    user_phone: string;
    status: string;
    created_at: string;
    service?: { id: number; title: string; price: string } | null;
};

type BookingListClientProps = {
    bookings: SerializedBooking[];
    providerId: number;
};

type OptimisticAction = { bookingId: number; newStatus: string };

function optimisticReducer(state: SerializedBooking[], action: OptimisticAction): SerializedBooking[] {
    return state.map((b) =>
        b.id === action.bookingId ? { ...b, status: action.newStatus } : b
    );
}

export function BookingListClient({ bookings, providerId }: BookingListClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [optimisticBookings, addOptimistic] = useOptimistic(bookings, optimisticReducer);

    const handleStatusChange = (bookingId: number, newStatus: string) => {
        addOptimistic({ bookingId, newStatus });
        startTransition(async () => {
            const result = await updateBookingStatus(bookingId, newStatus);
            if (!result.success) {
                toast.error(result.error ?? 'Ошибка при обновлении');
                throw new Error(result.error);
            }
            router.refresh();
        });
    };

    return (
        <div className="space-y-2.5">
            {optimisticBookings.map((booking) => (
                <BookingRow
                    key={booking.id}
                    booking={booking}
                    providerId={providerId}
                    onStatusChange={handleStatusChange}
                    isPending={isPending}
                />
            ))}
        </div>
    );
}
