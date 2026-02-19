'use client';

import { useFormStatus } from 'react-dom';
import { Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function CancelBookingButton() {
    return (
        <div
            onClick={(event) => {
                const ok = window.confirm('Отменить запись? Это действие можно выполнить только до визита.');
                if (!ok) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }}
        >
            <SubmitButton />
        </div>
    );
}
