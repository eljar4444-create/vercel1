import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
    let resolved: Locale = DEFAULT_LOCALE;

    const fromRequest = await requestLocale;
    if (isLocale(fromRequest)) {
        resolved = fromRequest;
    } else {
        const xLocale = headers().get('x-locale');
        if (isLocale(xLocale)) resolved = xLocale;
    }

    const messages = (await import(`./messages/${resolved}.json`)).default;

    return {
        locale: resolved,
        messages,
        timeZone: 'Europe/Berlin',
        now: new Date(),
        onError: (error) => {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[i18n]', error.message);
            }
        },
        getMessageFallback: ({ key, namespace }) => {
            const path = [namespace, key].filter(Boolean).join('.');
            return process.env.NODE_ENV === 'production' ? '' : `[missing: ${path}]`;
        },
    };
});
