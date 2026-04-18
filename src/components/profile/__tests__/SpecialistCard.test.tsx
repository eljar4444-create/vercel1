import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/image', () => ({
    default: (props: any) => {
        const { fill, sizes, priority, ...rest } = props;
        return <img {...rest} />;
    },
}));

// Mock DeepDiveModal
vi.mock('@/components/profile/DeepDiveModal', () => ({
    DeepDiveModal: ({ open, title }: any) =>
        open ? <div data-testid="deep-dive-modal">{title}</div> : null,
}));

import { SpecialistCard } from '@/components/profile/SpecialistCard';

describe('SpecialistCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders avatar, name, specialty, rating, and photos link', () => {
        render(
            <SpecialistCard
                id="s1"
                name="Анна"
                avatarUrl="http://x/avatar.jpg"
                specialty="Колорист"
                rating={4.9}
                reviewCount={20}
                photos={[{ id: 'p1', url: 'http://x/1.jpg' }, { id: 'p2', url: 'http://x/2.jpg' }]}
            />
        );

        expect(screen.getByText('Анна')).toBeTruthy();
        expect(screen.getByText('Колорист')).toBeTruthy();
        expect(screen.getByText('4.9')).toBeTruthy();
        expect(screen.getByText('(20)')).toBeTruthy();
        expect(screen.getByText('2 фото')).toBeTruthy();

        const img = screen.getByAltText('Анна');
        expect(img.getAttribute('src')).toBe('http://x/avatar.jpg');
    });

    it('opens DeepDiveModal on photos link click', () => {
        render(
            <SpecialistCard
                id="s1"
                name="Анна"
                photos={[{ id: 'p1', url: 'http://x/1.jpg' }]}
            />
        );

        fireEvent.click(screen.getByText('1 фото'));
        const modal = screen.getByTestId('deep-dive-modal');
        expect(modal).toBeTruthy();
        expect(modal.textContent).toContain('Работы Анна');
    });

    it('handles zero photos gracefully', () => {
        const { container } = render(
            <SpecialistCard
                id="s1"
                name="Анна"
                photos={[]}
            />
        );
        expect(screen.queryByText(/фото/)).toBeNull();
        expect(container.textContent).toContain('Анна');
        expect(screen.queryByTestId('deep-dive-modal')).toBeNull();
    });
});
