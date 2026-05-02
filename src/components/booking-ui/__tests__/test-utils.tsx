import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/i18n/messages/ru.json';

export function renderWithIntl(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return render(ui, {
        wrapper: ({ children }) => (
            <NextIntlClientProvider locale="ru" messages={messages}>
                {children}
            </NextIntlClientProvider>
        ),
        ...options,
    });
}
