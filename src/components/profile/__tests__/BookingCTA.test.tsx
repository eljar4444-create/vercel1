import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

import { BookingCTA } from '@/components/profile/BookingCTA';

describe('BookingCTA', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders with default label', () => {
        render(<BookingCTA slug="maria" providerType="PRIVATE" />);
        expect(screen.getByText('Записаться')).toBeTruthy();
    });

    it('renders custom label', () => {
        render(<BookingCTA slug="maria" providerType="PRIVATE" label="Book now" />);
        expect(screen.getByText('Book now')).toBeTruthy();
    });

    it('navigates to /book/slug for Private Master', () => {
        render(<BookingCTA slug="maria" providerType="PRIVATE" serviceId={10} />);
        fireEvent.click(screen.getByText('Записаться'));
        expect(mockPush).toHaveBeenCalledWith('/book/maria?serviceId=10');
    });

    it('navigates with staffId when provided', () => {
        render(<BookingCTA slug="salon-x" providerType="SALON" serviceId={5} staffId="s1" />);
        fireEvent.click(screen.getByText('Записаться'));
        expect(mockPush).toHaveBeenCalledWith('/book/salon-x?serviceId=5&staffId=s1');
    });

    it('triggers onSelectSpecialist for salon with multiple specialists', () => {
        const onSelect = vi.fn();
        render(
            <BookingCTA
                slug="salon-x"
                providerType="SALON"
                serviceId={5}
                specialistCount={3}
                onSelectSpecialist={onSelect}
            />
        );
        fireEvent.click(screen.getByText('Записаться'));
        expect(onSelect).toHaveBeenCalledWith(5);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('navigates directly for salon with single specialist', () => {
        render(
            <BookingCTA slug="salon-x" providerType="SALON" serviceId={5} specialistCount={1} />
        );
        fireEvent.click(screen.getByText('Записаться'));
        expect(mockPush).toHaveBeenCalledWith('/book/salon-x?serviceId=5');
    });

    it('does not navigate when onBeforeBook returns false', () => {
        render(
            <BookingCTA slug="maria" providerType="PRIVATE" onBeforeBook={() => false} />
        );
        fireEvent.click(screen.getByText('Записаться'));
        expect(mockPush).not.toHaveBeenCalled();
    });
});
