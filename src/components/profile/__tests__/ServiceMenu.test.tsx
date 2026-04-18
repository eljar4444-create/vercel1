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

import { ServiceMenu, type ServiceItem } from '@/components/profile/ServiceMenu';

const makeService = (overrides: Partial<ServiceItem> = {}): ServiceItem => ({
    id: 1,
    title: 'Балаяж',
    description: 'Окрашивание',
    price: '120',
    duration_min: 90,
    photos: [
        { id: 'p1', url: 'http://x/1.jpg' },
        { id: 'p2', url: 'http://x/2.jpg' },
        { id: 'p3', url: 'http://x/3.jpg' },
    ],
    staff: [],
    ...overrides,
});

describe('ServiceMenu', () => {
    beforeEach(() => vi.clearAllMocks());

    it('shows empty state when no services', () => {
        render(<ServiceMenu services={[]} onBook={vi.fn()} />);
        expect(screen.getByText('Список услуг пока пуст.')).toBeTruthy();
    });

    it('renders service name, price, duration', () => {
        render(<ServiceMenu services={[makeService()]} onBook={vi.fn()} />);
        expect(screen.getByText('Балаяж')).toBeTruthy();
        expect(screen.getByText('€120')).toBeTruthy();
        expect(screen.getByText('90 мин')).toBeTruthy();
    });

    it('renders cover photo thumbnail for services with photos', () => {
        const { container } = render(<ServiceMenu services={[makeService()]} onBook={vi.fn()} />);
        const img = container.querySelector('img');
        expect(img?.getAttribute('src')).toBe('http://x/1.jpg');
    });

    it('does NOT render photo thumbnail for services with 0 photos', () => {
        const { container } = render(
            <ServiceMenu services={[makeService({ photos: [] })]} onBook={vi.fn()} />
        );
        expect(container.querySelector('img')).toBeNull();
    });

    it('shows "Ещё N фото" link when photos.length > 1', () => {
        render(<ServiceMenu services={[makeService()]} onBook={vi.fn()} />);
        expect(screen.getByText('Ещё 2 фото')).toBeTruthy();
    });

    it('does NOT show "Ещё" link when only 1 photo', () => {
        render(
            <ServiceMenu
                services={[makeService({ photos: [{ id: 'p1', url: 'http://x/1.jpg' }] })]}
                onBook={vi.fn()}
            />
        );
        expect(screen.queryByText(/Ещё/)).toBeNull();
    });

    it('opens DeepDiveModal when "Ещё N фото" is clicked', () => {
        render(<ServiceMenu services={[makeService()]} onBook={vi.fn()} />);
        fireEvent.click(screen.getByText('Ещё 2 фото'));
        const modal = screen.getByTestId('deep-dive-modal');
        expect(modal).toBeTruthy();
        expect(modal.textContent).toContain('Балаяж');
    });

    it('shows specialist names in salon mode', () => {
        const service = makeService({
            staff: [
                { id: 's1', name: 'Анна', avatarUrl: null },
                { id: 's2', name: 'Лиза', avatarUrl: null },
            ],
        });
        render(<ServiceMenu services={[service]} onBook={vi.fn()} showSpecialistNames />);
        expect(screen.getByText('Анна, Лиза')).toBeTruthy();
    });

    it('calls onBook with the service when "Выбрать" is clicked', () => {
        const onBook = vi.fn();
        const service = makeService();
        render(<ServiceMenu services={[service]} onBook={onBook} />);
        fireEvent.click(screen.getByText('Выбрать'));
        expect(onBook).toHaveBeenCalledWith(service);
    });

    it('formats price as "по договорённости" when 0', () => {
        render(<ServiceMenu services={[makeService({ price: '0' })]} onBook={vi.fn()} />);
        expect(screen.getByText('по договорённости')).toBeTruthy();
    });
});
