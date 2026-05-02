import { describe, it, expect, vi } from 'vitest';
import { DateScroll } from '../DateScroll';
import { TimeGrid } from '../TimeGrid';
import { OrderSummary } from '../OrderSummary';
import { renderWithIntl } from './test-utils';

describe('Booking UI Components - Snapshots', () => {
    it('matches snapshot for DateScroll', () => {
        const { container } = renderWithIntl(
            <DateScroll
                weekStart={new Date('2024-10-06T00:00:00Z')}
                selectedDateKey="2024-10-06"
                availableSlots={{ '2024-10-06': ['10:00', '12:00'] }}
                onSelectDate={vi.fn()}
                onPrevWeek={vi.fn()}
                onNextWeek={vi.fn()}
                today={new Date('2024-10-04T00:00:00Z')}
            />
        );
        expect(container).toMatchSnapshot();
    });

    it('matches snapshot for TimeGrid', () => {
        const { container } = renderWithIntl(
            <TimeGrid
                slots={['10:00', '12:00', '15:30']}
                selectedTime="12:00"
                onSelectTime={vi.fn()}
            />
        );
        expect(container).toMatchSnapshot();
    });

    it('matches snapshot for OrderSummary (Glassmorphism)', () => {
        const { container } = renderWithIntl(
            <OrderSummary
                service={{
                    title: 'Глубокое увлажнение',
                    price: '5 500',
                    duration_min: 60,
                }}
                staffName="Елена Волкова"
                dateKey="2024-10-06"
                time="12:00"
                isSubmitting={false}
                onSubmit={vi.fn()}
                canSubmit={true}
            />
        );
        expect(container).toMatchSnapshot();
    });
});
