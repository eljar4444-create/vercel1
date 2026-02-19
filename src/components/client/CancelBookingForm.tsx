'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cancelClientBookingState } from '@/app/my-bookings/actions';
import toast from 'react-hot-toast';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            variant="outline"
            disabled={pending}
            className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
            {pending ? (
                <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Отмена...
                </>
            ) : (
                <>
                    <XCircle className="mr-1 h-4 w-4" />
                    Отменить
                </>
            )}
        </Button>
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
