import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const spuProps: any[] = [];
vi.mock('@/components/dashboard/ServicePhotoUpload', () => ({
    ServicePhotoUpload: (props: any) => {
        spuProps.push(props);
        return (
            <div
                data-testid="service-photo-upload-stub"
                data-service-id={props.serviceId}
                data-staff-id={props.staffId}
                data-initial-count={props.initialPhotos.length}
            />
        );
    },
}));

import { StaffPhotosModal } from '@/components/dashboard/StaffPhotosModal';

const staff = { id: 'staff-a', name: 'Анна' };

function makeServices() {
    return [
        {
            id: 10,
            title: 'Стрижка',
            portfolioPhotos: [
                { id: 'p1', url: 'http://x/1.jpg', position: 0, staffId: 'staff-a' },
                { id: 'p2', url: 'http://x/2.jpg', position: 1, staffId: 'staff-a' },
                { id: 'p3', url: 'http://x/3.jpg', position: 2, staffId: 'staff-b' },
            ],
        },
        {
            id: 11,
            title: 'Окрашивание',
            portfolioPhotos: [
                { id: 'p4', url: 'http://x/4.jpg', position: 0, staffId: 'staff-b' },
            ],
        },
    ];
}

describe('StaffPhotosModal', () => {
    beforeEach(() => {
        spuProps.length = 0;
    });

    it('renders service rows with staff-filtered photo counts', () => {
        render(
            <StaffPhotosModal
                staff={staff}
                services={makeServices()}
                onClose={() => undefined}
            />
        );

        // "Стрижка" shows 2 photos (staff-a only); "Окрашивание" shows 0 (only staff-b)
        expect(screen.getByText('Стрижка')).toBeTruthy();
        expect(screen.getByText('Окрашивание')).toBeTruthy();
        const counts = screen.getAllByText(/фото$/);
        expect(counts.map((n) => n.textContent)).toEqual(['2 фото', '0 фото']);
    });

    it('renders empty state with Add-service CTA when there are no services', () => {
        render(<StaffPhotosModal staff={staff} services={[]} onClose={() => undefined} />);
        expect(
            screen.getByText(
                'Сначала добавьте услугу — фотографии мастера прикрепляются к конкретной услуге.'
            )
        ).toBeTruthy();
        const cta = screen.getByRole('link', { name: /добавить услугу/i });
        expect(cta.getAttribute('href')).toBe('/dashboard?section=services');
    });

    it('closes the modal when the Add-service CTA is clicked', () => {
        const onClose = vi.fn();
        render(<StaffPhotosModal staff={staff} services={[]} onClose={onClose} />);
        fireEvent.click(screen.getByRole('link', { name: /добавить услугу/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('expands a service row and mounts ServicePhotoUpload with scoped props', () => {
        render(
            <StaffPhotosModal
                staff={staff}
                services={makeServices()}
                onClose={() => undefined}
            />
        );

        // No stub rendered until a row is expanded
        expect(screen.queryByTestId('service-photo-upload-stub')).toBeNull();

        fireEvent.click(screen.getByText('Стрижка'));

        const stub = screen.getByTestId('service-photo-upload-stub');
        expect(stub.getAttribute('data-service-id')).toBe('10');
        expect(stub.getAttribute('data-staff-id')).toBe('staff-a');
        // Only 2 staff-a photos passed, the staff-b photo is filtered out
        expect(stub.getAttribute('data-initial-count')).toBe('2');

        const last = spuProps[spuProps.length - 1];
        expect(last.initialPhotos.map((p: any) => p.id)).toEqual(['p1', 'p2']);
    });

    it('collapses the previously expanded row when another is opened', () => {
        render(
            <StaffPhotosModal
                staff={staff}
                services={makeServices()}
                onClose={() => undefined}
            />
        );
        fireEvent.click(screen.getByText('Стрижка'));
        fireEvent.click(screen.getByText('Окрашивание'));
        const stubs = screen.getAllByTestId('service-photo-upload-stub');
        expect(stubs).toHaveLength(1);
        expect(stubs[0].getAttribute('data-service-id')).toBe('11');
    });

    it('invokes onClose when the close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <StaffPhotosModal
                staff={staff}
                services={makeServices()}
                onClose={onClose}
            />
        );
        fireEvent.click(screen.getByLabelText('Закрыть'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
