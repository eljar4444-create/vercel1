'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cancelClientBookingState } from '@/app/my-bookings/actions';
import toast from 'react-hot-toast';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
            {pending ? (
                <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Отмена...
                </>
            ) : (
                'Отменить запись'
            )}
        </button>
    );
}

export function CancelBookingForm({ bookingId }: { bookingId: number }) {
    const [state, action] = useFormState(cancelClientBookingState, initialState);

    useEffect(() => {
        if (state.success) {
            toast.success('Запись отменена');
        } else if (state.error) {
            toast.error(state.error);
        }
    }, [state]);

    return (
        <form
            action={action}
            onSubmit={(event) => {
                const ok = window.confirm('Отменить запись? Это действие можно выполнить только до визита.');
                if (!ok) {
                    event.preventDefault();
                }
            }}
        >
            <input type="hidden" name="booking_id" value={bookingId} />
            <SubmitButton />
        </form>
    );
}
