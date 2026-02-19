'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Link2, Loader2, Phone } from 'lucide-react';
import { linkLegacyBookingsState } from '@/app/my-bookings/actions';

const initialState = {
    success: false,
    error: null as string | null,
    linked: 0,
};

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
        >
            {pending ? (
                <>
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Привязка...
                </>
            ) : (
                <>
                    <Link2 className="mr-1 h-3.5 w-3.5" />
                    Привязать записи
                </>
            )}
        </button>
    );
}

export function LinkLegacyBookingsForm() {
    const [state, action] = useFormState(linkLegacyBookingsState, initialState);

    return (
        <form action={action} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs font-semibold text-gray-700">Перенести старые записи из MVP-периода</p>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-9 flex-1 items-center rounded-lg border border-gray-200 bg-gray-50 px-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <input
                        name="phone"
                        type="tel"
                        required
                        placeholder="+49..."
                        className="w-full bg-transparent px-2 text-xs text-gray-900 outline-none placeholder:text-gray-400"
                    />
                </div>
                <SubmitButton />
            </div>
            {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
            {state.success && (
                <p className="mt-2 text-xs text-green-700">
                    Готово: привязано записей — <span className="font-semibold">{state.linked}</span>
                </p>
            )}
        </form>
    );
}
