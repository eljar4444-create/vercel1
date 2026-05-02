'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

export function LoginNotifier() {
    const t = useTranslations('forms.loginNotifier');
    const { data: session, status } = useSession();
    // Use a ref to track if we've shown the toast in this component's lifecycle if needed,
    // but sessionStorage is better for page reloads.

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            // Check if we've already shown the welcome message in this session
            const hasShownWelcome = sessionStorage.getItem('welcome_shown');

            if (!hasShownWelcome) {
                const name = session.user.name || t('userFallback');
                toast.success(t('welcome', { name }), {
                    duration: 4000,
                    icon: '👋',
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });

                // Mark as shown so we don't spam on refresh
                sessionStorage.setItem('welcome_shown', 'true');
            }
        }
    }, [status, session, t]);

    return null;
}
