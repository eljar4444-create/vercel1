'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        turnstile?: {
            render: (
                container: string | HTMLElement,
                options: {
                    sitekey: string;
                    callback: (token: string) => void;
                    'error-callback'?: () => void;
                    'expired-callback'?: () => void;
                    size?: 'normal' | 'compact' | 'invisible';
                    theme?: 'light' | 'dark' | 'auto';
                }
            ) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onloadTurnstileCallback?: () => void;
    }
}

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onloadTurnstileCallback';

/**
 * React hook for Cloudflare Turnstile invisible CAPTCHA.
 * Loads the script lazily and auto-executes the invisible challenge.
 */
export function useTurnstile() {
    const [token, setToken] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const scriptLoadedRef = useRef(false);

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const initWidget = useCallback(() => {
        if (!window.turnstile || !containerRef.current || !siteKey) return;
        if (widgetIdRef.current) return; // Already initialized

        try {
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                size: 'invisible',
                callback: (t: string) => {
                    setToken(t);
                },
                'error-callback': () => {
                    console.warn('[Turnstile] Challenge error');
                    setToken(null);
                },
                'expired-callback': () => {
                    setToken(null);
                },
            });
            setIsReady(true);
        } catch (error) {
            console.error('[Turnstile] Render error:', error);
        }
    }, [siteKey]);

    useEffect(() => {
        // In development without a sitekey, auto-provide a dummy token
        if (!siteKey) {
            if (process.env.NODE_ENV === 'development') {
                setToken('dev-turnstile-bypass');
                setIsReady(true);
            }
            return;
        }

        if (scriptLoadedRef.current) {
            initWidget();
            return;
        }

        // Check if script is already in DOM
        const existingScript = document.querySelector(`script[src*="turnstile"]`);
        if (existingScript) {
            scriptLoadedRef.current = true;
            initWidget();
            return;
        }

        // Load the Turnstile script
        window.onloadTurnstileCallback = () => {
            scriptLoadedRef.current = true;
            initWidget();
        };

        const script = document.createElement('script');
        script.src = TURNSTILE_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch {
                    // Widget may already be cleaned up
                }
                widgetIdRef.current = null;
            }
        };
    }, [siteKey, initWidget]);

    const resetToken = useCallback(() => {
        setToken(null);
        if (widgetIdRef.current && window.turnstile) {
            try {
                window.turnstile.reset(widgetIdRef.current);
            } catch {
                // Ignore reset errors
            }
        }
    }, []);

    return { token, isReady, containerRef, resetToken };
}
