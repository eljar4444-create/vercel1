'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Phone, LogIn, Loader2 } from 'lucide-react';
import { loginClientPortalState } from '@/app/my-bookings/actions';

const initialState = {
    success: false,
    error: null as string | null,
};

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Входим...
                </>
            ) : (
                <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Войти в кабинет
                </>
            )}
        </button>
    );
}

export function ClientPortalLoginForm() {
    const [state, formAction] = useFormState(loginClientPortalState, initialState);

    return (
        <form action={formAction} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-medium text-gray-700">Телефон, который вы указывали при записи</label>
            <div className="mt-2 flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="+49 1..."
                    className="h-11 w-full bg-transparent px-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                />
            </div>
            {state.error && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {state.error}
                </p>
            )}
            <p className="mt-3 text-xs text-gray-500">
                Мы покажем только записи, созданные с этим номером.
            </p>
            <SubmitButton />
        </form>
    );
}
