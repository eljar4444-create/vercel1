'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cancelClientBookingState } from '@/app/my-bookings/actions';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
    const t = useTranslations('forms.cancelBooking');
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:border-slate-400 hover:text-slate-800 disabled:opacity-50"
        >
            {pending ? (
                <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t('pending')}
                </>
            ) : (
                t('submit')
            )}
        </button>
    );
}

export function CancelBookingForm({ bookingId }: { bookingId: number }) {
    const t = useTranslations('forms.cancelBooking');
    const [state, action] = useFormState(cancelClientBookingState, initialState);

    useEffect(() => {
        if (state.success) {
            toast.success(t('success'));
        } else if (state.error) {
            toast.error(state.error);
        }
    }, [state, t]);

    return (
        <form
            action={action}
            onSubmit={(event) => {
                const ok = window.confirm(t('confirm'));
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
