import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
        div: ({ children, variants, initial, animate, exit, ...props }: any) => (
            <div {...props}>{children}</div>
        ),
    },
}));

vi.mock('next/image', () => ({
    default: (props: any) => {
        const { fill, sizes, ...rest } = props;
        return <img {...rest} />;
    },
}));

import { SpecialistSelector, type SpecialistOption } from '@/components/profile/SpecialistSelector';

const specialists: SpecialistOption[] = [
    { id: 's1', name: 'Анна', avatarUrl: 'http://x/anna.jpg', specialty: 'Колорист', rating: 4.9, reviewCount: 32 },
    { id: 's2', name: 'Лиза', avatarUrl: null, specialty: 'Стилист', rating: 4.7, reviewCount: 15, nearestSlot: 'Завтра, 10:00' },
];

describe('SpecialistSelector', () => {
    beforeEach(() => vi.clearAllMocks());

    it('does not render when open=false', () => {
        const { container } = render(
            <SpecialistSelector open={false} onClose={vi.fn()} serviceTitle="Балаяж" specialists={specialists} onSelect={vi.fn()} />
        );
        expect(container.querySelector('[role="dialog"]')).toBeNull();
    });

    it('renders title and service name when open', () => {
        render(
            <SpecialistSelector open={true} onClose={vi.fn()} serviceTitle="Балаяж" specialists={specialists} onSelect={vi.fn()} />
        );
        expect(screen.getByText('Выберите специалиста')).toBeTruthy();
        expect(screen.getByText('Балаяж')).toBeTruthy();
    });

    it('renders specialist cards with name, specialty, rating', () => {
        render(
            <SpecialistSelector open={true} onClose={vi.fn()} serviceTitle="Балаяж" specialists={specialists} onSelect={vi.fn()} />
        );
        expect(screen.getByText('Анна')).toBeTruthy();
        expect(screen.getByText('Колорист')).toBeTruthy();
        expect(screen.getByText('4.9')).toBeTruthy();
        expect(screen.getByText('Лиза')).toBeTruthy();
        expect(screen.getByText('Завтра, 10:00')).toBeTruthy();
    });

    it('renders "Любой свободный специалист" option', () => {
        render(
            <SpecialistSelector open={true} onClose={vi.fn()} serviceTitle="Балаяж" specialists={specialists} onSelect={vi.fn()} />
        );
        expect(screen.getByText('Любой свободный специалист')).toBeTruthy();
    });

    it('calls onSelect with specialist id and closes on click', () => {
        const onSelect = vi.fn();
        const onClose = vi.fn();
        render(
            <SpecialistSelector open={true} onClose={onClose} serviceTitle="Балаяж" specialists={specialists} onSelect={onSelect} />
        );
        fireEvent.click(screen.getByText('Анна'));
        expect(onSelect).toHaveBeenCalledWith('s1');
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onSelect with null for "Любой свободный"', () => {
        const onSelect = vi.fn();
        render(
            <SpecialistSelector open={true} onClose={vi.fn()} serviceTitle="Балаяж" specialists={specialists} onSelect={onSelect} />
        );
        fireEvent.click(screen.getByText('Любой свободный специалист'));
        expect(onSelect).toHaveBeenCalledWith(null);
    });

    it('highlights pre-selected specialist', () => {
        const { container } = render(
            <SpecialistSelector
                open={true}
                onClose={vi.fn()}
                serviceTitle="Балаяж"
                specialists={specialists}
                onSelect={vi.fn()}
                preSelectedId="s1"
            />
        );
        // Pre-selected has ring-2 class
        const buttons = container.querySelectorAll('button[class*="ring-2"]');
        expect(buttons).toHaveLength(1);
    });

    it('calls onClose when Закрыть is clicked', () => {
        const onClose = vi.fn();
        render(
            <SpecialistSelector open={true} onClose={onClose} serviceTitle="Балаяж" specialists={specialists} onSelect={vi.fn()} />
        );
        fireEvent.click(screen.getByLabelText('Закрыть'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
