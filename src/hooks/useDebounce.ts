'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Returns a debounced value that updates after `delay` ms of no changes.
 * Useful for search inputs to avoid updating URL/API on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Returns a debounced callback that runs after `delay` ms of no invocations.
 */
export function useDebouncedCallback<A extends unknown[]>(
    callback: (...args: A) => void,
    delay: number
): (...args: A) => void {
    const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useCallback(callback, [callback]);

    const debounced = useCallback(
        (...args: A) => {
            if (timer) clearTimeout(timer);
            setTimer(
                window.setTimeout(() => {
                    callbackRef(...args);
                    setTimer(null);
                }, delay)
            );
        },
        [delay, callbackRef, timer]
    );

    useEffect(() => () => { if (timer) clearTimeout(timer); }, [timer]);
    return debounced;
}
