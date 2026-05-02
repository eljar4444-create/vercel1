import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import deMessages from '@/i18n/messages/de.json';
import ruMessages from '@/i18n/messages/ru.json';
import ukMessages from '@/i18n/messages/uk.json';
import { createZodErrorMap, localeFromRequest } from '../zod';

describe('localized Zod error map', () => {
    it('formats Russian validation messages', () => {
        const schema = z.object({
            email: z.string().email(),
            password: z.string().min(6),
        });

        const result = schema.safeParse(
            { email: 'bad-email', password: '123' },
            { errorMap: createZodErrorMap(ruMessages) },
        );

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.email?.[0]).toBe('Укажите корректный email.');
            expect(result.error.flatten().fieldErrors.password?.[0]).toBe('Минимум 6 символов.');
        }
    });

    it('formats German validation messages', () => {
        const schema = z.object({
            email: z.string().email(),
            password: z.string().min(6),
        });

        const result = schema.safeParse(
            { email: 'bad-email', password: '123' },
            { errorMap: createZodErrorMap(deMessages) },
        );

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.email?.[0]).toBe('Geben Sie eine gültige Email ein.');
            expect(result.error.flatten().fieldErrors.password?.[0]).toBe('Mindestens 6 Zeichen.');
        }
    });

    it('formats Ukrainian required field messages', () => {
        const schema = z.object({
            name: z.string(),
        });

        const result = schema.safeParse(
            {},
            { errorMap: createZodErrorMap(ukMessages) },
        );

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.name?.[0]).toBe("Заповніть обов'язкове поле.");
        }
    });

    it('resolves locale from request headers', () => {
        expect(localeFromRequest(new Request('https://www.svoi.de/api/test', {
            headers: { 'x-locale': 'uk' },
        }))).toBe('uk');

        expect(localeFromRequest(new Request('https://www.svoi.de/api/test', {
            headers: { 'accept-language': 'de-DE,de;q=0.9' },
        }))).toBe('de');

        expect(localeFromRequest(new Request('https://www.svoi.de/api/test'))).toBe('ru');
    });
});
