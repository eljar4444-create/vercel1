import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithIntl } from './test-utils';

const mocks = vi.hoisted(() => ({
    push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mocks.push,
    }),
}));

vi.mock('next/image', () => ({
    default: (props: any) => {
        const { fill, sizes, priority, ...rest } = props;
        return <img {...rest} />;
    },
}));

import { StaffPortfolioModal, type StaffModalService } from '@/components/profile/StaffPortfolioModal';
import type { Staff } from '@/components/profile/StaffSection';

const staff: Staff = {
    id: 'staff-1',
    name: 'София',
    avatarUrl: 'http://x/sofia.jpg',
    specialty: 'Колорист',
    rating: 4.8,
    tags: ['балаяж', 'airtouch'],
    photos: ['http://x/work-1.jpg', 'http://x/work-2.jpg'],
};

const services: StaffModalService[] = [
    { id: 11, title: 'Балаяж', price: '120', duration_min: 90 },
    { id: 12, title: 'Консультация', price: '0', duration_min: 0 },
];

function renderModal(props: Partial<React.ComponentProps<typeof StaffPortfolioModal>> = {}) {
    return renderWithIntl(
        <StaffPortfolioModal
            staff={staff}
            salonSlug="test-salon"
            isOpen={true}
            onClose={vi.fn()}
            services={services}
            {...props}
        />
    );
}

describe('StaffPortfolioModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when isOpen=false', () => {
        const { container } = renderModal({ isOpen: false });
        expect(container.innerHTML).toBe('');
    });

    it('renders staff header, rating, tabs, specialty, and tags by default', () => {
        renderModal();

        expect(screen.getByText('София')).toBeTruthy();
        expect(screen.getByText('4.8')).toBeTruthy();
        expect(screen.getByText('(8 отзывов)')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'О мастере' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Услуги' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Портфолио' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Отзывы' })).toBeTruthy();
        expect(screen.getByText('Колорист')).toBeTruthy();
        expect(screen.getByText('балаяж')).toBeTruthy();
        expect(screen.getByText('airtouch')).toBeTruthy();
    });

    it('calls onClose from the close button and backdrop', () => {
        const onClose = vi.fn();
        const { container } = renderModal({ onClose });

        fireEvent.click(screen.getByLabelText('Закрыть'));
        expect(onClose).toHaveBeenCalledTimes(1);

        const backdrop = container.firstElementChild;
        expect(backdrop).not.toBeNull();
        fireEvent.click(backdrop as Element);
        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('does not close when the modal panel itself is clicked', () => {
        const onClose = vi.fn();
        renderModal({ onClose });

        fireEvent.click(screen.getByText('София'));

        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders services tab with formatted duration and price', () => {
        renderModal();

        fireEvent.click(screen.getByRole('button', { name: 'Услуги' }));

        expect(screen.getByText('Балаяж')).toBeTruthy();
        expect(screen.getByText('90 мин')).toBeTruthy();
        expect(screen.getByText('€120')).toBeTruthy();
        expect(screen.getByText('Консультация')).toBeTruthy();
        expect(screen.getAllByText('по договорённости')).toHaveLength(2);
    });

    it('shows services empty state when no services are passed', () => {
        renderModal({ services: [] });

        fireEvent.click(screen.getByRole('button', { name: 'Услуги' }));

        expect(screen.getByText('Нет услуг для отображения.')).toBeTruthy();
    });

    it('routes to booking with selected staff and service from the services tab', () => {
        renderModal();

        fireEvent.click(screen.getByRole('button', { name: 'Услуги' }));
        fireEvent.click(screen.getAllByRole('button', { name: 'Выбрать' })[0]);

        expect(mocks.push).toHaveBeenCalledWith('/book/test-salon?staffId=staff-1&serviceId=11');
    });

    it('routes to booking with selected staff from the sticky CTA', () => {
        renderModal();

        fireEvent.click(screen.getByRole('button', { name: 'Записаться к мастеру' }));

        expect(mocks.push).toHaveBeenCalledWith('/book/test-salon?staffId=staff-1');
    });

    it('renders portfolio photos with accessible alt text', () => {
        renderModal();

        fireEvent.click(screen.getByRole('button', { name: 'Портфолио' }));

        expect(screen.getAllByAltText('Работа мастера София')).toHaveLength(2);
    });

    it('shows portfolio empty state when staff has no photos', () => {
        renderModal({ staff: { ...staff, photos: [] } });

        fireEvent.click(screen.getByRole('button', { name: 'Портфолио' }));

        expect(screen.getByText('У данного мастера пока нет загруженных работ.')).toBeTruthy();
    });

    it('renders reviews tab summary and mock reviews', () => {
        renderModal();

        fireEvent.click(screen.getByRole('button', { name: 'Отзывы' }));

        expect(screen.getByText('На основе 8 отзывов')).toBeTruthy();
        expect(screen.getByText('от проверенных клиентов')).toBeTruthy();
        expect(screen.getByText('Мария')).toBeTruthy();
        expect(screen.getByText('Очень внимательная к деталям, результат превзошёл ожидания. Вернусь точно.')).toBeTruthy();
    });
});
