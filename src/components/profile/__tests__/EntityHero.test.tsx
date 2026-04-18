import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/image', () => ({
    default: (props: any) => {
        const { fill, sizes, priority, ...rest } = props;
        return <img {...rest} />;
    },
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

import { EntityHero } from '@/components/profile/EntityHero';

describe('EntityHero', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Private Variant', () => {
        it('renders avatar, name, bio, city and outcall radius', () => {
            render(
                <EntityHero
                    providerType="PRIVATE"
                    name="Мария"
                    slug="maria"
                    avatarUrl="http://x/avatar.jpg"
                    bioOrDescription="Я специализируюсь на маникюре"
                    city="Берлин"
                    outcallRadiusKm={10}
                />
            );
            expect(screen.getByText('Мария')).toBeTruthy();
            expect(screen.getByText('Я специализируюсь на маникюре')).toBeTruthy();
            expect(screen.getByText('Берлин')).toBeTruthy();
            expect(screen.getByText('• Выезд до 10 км')).toBeTruthy();
            expect(screen.getByText('Записаться')).toBeTruthy(); // BookingCTA
            
            const img = screen.getByAltText('Мария');
            expect(img.getAttribute('src')).toBe('http://x/avatar.jpg');
        });

        it('does not render address even if provided', () => {
            render(
                <EntityHero
                    providerType="PRIVATE"
                    name="Мария"
                    slug="maria"
                    city="Берлин"
                    address="Street 1"
                />
            );
            expect(screen.queryByText('Street 1, Берлин')).toBeNull();
        });
    });

    describe('Salon Variant', () => {
        it('renders logo, name, full address, description', () => {
            render(
                <EntityHero
                    providerType="SALON"
                    name="Студия Красоты"
                    slug="salon-1"
                    avatarUrl="http://x/logo.jpg"
                    bioOrDescription="Лучший салон в городе."
                    city="Мюнхен"
                    address="Hauptstr. 10"
                />
            );
            expect(screen.getByText('Студия Красоты')).toBeTruthy();
            expect(screen.getByText('Лучший салон в городе.')).toBeTruthy();
            expect(screen.getByText('Hauptstr. 10, Мюнхен')).toBeTruthy();
            
            const img = screen.getByAltText('Студия Красоты');
            expect(img.getAttribute('src')).toBe('http://x/logo.jpg');
        });

        it('renders interior photos strip', () => {
            const photos = ['http://x/1.jpg', 'http://x/2.jpg'];
            render(
                <EntityHero
                    providerType="SALON"
                    name="Студия"
                    slug="salon-1"
                    city="Мюнхен"
                    interiorPhotos={photos}
                />
            );
            
            const img1 = screen.getByAltText('Интерьер салона Студия 1');
            const img2 = screen.getByAltText('Интерьер салона Студия 2');
            expect(img1.getAttribute('src')).toBe(photos[0]);
            expect(img2.getAttribute('src')).toBe(photos[1]);
        });
    });
});
