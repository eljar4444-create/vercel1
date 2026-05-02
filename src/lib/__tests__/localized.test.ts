import { describe, expect, it } from 'vitest';
import { getLocalizedText, localizeCategoryName, localizeProfileBio, localizeService } from '@/lib/localized';

describe('localized content helpers', () => {
    it('prefers the requested locale translation', () => {
        expect(
            getLocalizedText(
                'Стрижка',
                [
                    { locale: 'ru', title: 'Стрижка' },
                    { locale: 'de', title: 'Haarschnitt' },
                ],
                'de',
                'title',
            ),
        ).toBe('Haarschnitt');
    });

    it('falls back to the default locale translation before the base value', () => {
        expect(
            getLocalizedText(
                'Legacy title',
                [{ locale: 'ru', title: 'Стрижка' }],
                'uk',
                'title',
            ),
        ).toBe('Стрижка');
    });

    it('falls back to the base value when no usable translation exists', () => {
        expect(
            getLocalizedText(
                'Legacy title',
                [{ locale: 'de', title: '' }],
                'uk',
                'title',
            ),
        ).toBe('Legacy title');
    });

    it('localizes category, service, and profile bio fields', () => {
        expect(
            localizeCategoryName(
                {
                    name: 'Брови и ресницы',
                    translations: [{ locale: 'de', name: 'Augenbrauen und Wimpern' }],
                },
                'de',
            ),
        ).toBe('Augenbrauen und Wimpern');

        expect(
            localizeService(
                {
                    title: 'Окрашивание',
                    description: 'Описание',
                    translations: [{ locale: 'uk', title: 'Фарбування', description: 'Опис' }],
                },
                'uk',
            ),
        ).toEqual({
            title: 'Фарбування',
            description: 'Опис',
            translations: [{ locale: 'uk', title: 'Фарбування', description: 'Опис' }],
        });

        expect(
            localizeProfileBio(
                {
                    bio: 'Русское био',
                    translations: [{ locale: 'de', bio: 'Deutsche Bio' }],
                },
                'de',
            ),
        ).toBe('Deutsche Bio');
    });
});
