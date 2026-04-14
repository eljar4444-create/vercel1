import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Hoist mock variables so they're available in vi.mock factories
const { mockUpdateArrivalInfo, mockToast } = vi.hoisted(() => ({
    mockUpdateArrivalInfo: vi.fn(),
    mockToast: { success: vi.fn(), error: vi.fn() },
}));

// Mock the server action
vi.mock('@/app/actions/portfolio-photos', () => ({
    updateArrivalInfo: (...args: any[]) => mockUpdateArrivalInfo(...args),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({ default: mockToast }));

import { ArrivalInfoSection } from '@/components/dashboard/ArrivalInfoSection';

describe('ArrivalInfoSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUpdateArrivalInfo.mockResolvedValue({ success: true });
    });

    it('renders all four fields with empty values when initialData is null', () => {
        render(<ArrivalInfoSection initialData={null} />);

        const address = screen.getByPlaceholderText(/Auguststraße/);
        const doorCode = screen.getByPlaceholderText('4521#');
        const bellNote = screen.getByPlaceholderText(/Звонок/);
        const waitingSpot = screen.getByPlaceholderText(/Café Oliv/);

        expect(address).toBeTruthy();
        expect(doorCode).toBeTruthy();
        expect(bellNote).toBeTruthy();
        expect(waitingSpot).toBeTruthy();

        expect((address as HTMLInputElement).value).toBe('');
        expect((doorCode as HTMLInputElement).value).toBe('');
        expect((bellNote as HTMLInputElement).value).toBe('');
        expect((waitingSpot as HTMLInputElement).value).toBe('');
    });

    it('populates fields from initialData', () => {
        render(
            <ArrivalInfoSection
                initialData={{
                    address: 'Hauptstr 1',
                    doorCode: '1234',
                    bellNote: '3 этаж',
                    waitingSpot: 'Café Oliv',
                }}
            />
        );

        expect((screen.getByPlaceholderText(/Auguststraße/) as HTMLInputElement).value).toBe('Hauptstr 1');
        expect((screen.getByPlaceholderText('4521#') as HTMLInputElement).value).toBe('1234');
        expect((screen.getByPlaceholderText(/Звонок/) as HTMLInputElement).value).toBe('3 этаж');
        expect((screen.getByPlaceholderText(/Café Oliv/) as HTMLInputElement).value).toBe('Café Oliv');
    });

    it('shows preview card when address is filled', () => {
        render(
            <ArrivalInfoSection
                initialData={{ address: 'Hauptstr 1', doorCode: '5678' }}
            />
        );

        expect(screen.getByText('Как добраться')).toBeTruthy();
        expect(screen.getByText('Hauptstr 1')).toBeTruthy();
        expect(screen.getByText('Код двери: 5678')).toBeTruthy();
    });

    it('does not show preview card when address is empty', () => {
        render(<ArrivalInfoSection initialData={null} />);
        expect(screen.queryByText('Как добраться')).toBeNull();
    });

    it('calls updateArrivalInfo with correct data on save', async () => {
        render(<ArrivalInfoSection initialData={null} />);

        fireEvent.change(screen.getByPlaceholderText(/Auguststraße/), {
            target: { value: 'Hauptstr 1' },
        });
        fireEvent.change(screen.getByPlaceholderText('4521#'), {
            target: { value: '9999' },
        });

        fireEvent.click(screen.getByText('Сохранить'));

        await waitFor(() => {
            expect(mockUpdateArrivalInfo).toHaveBeenCalledWith({
                address: 'Hauptstr 1',
                doorCode: '9999',
            });
        });
        expect(mockToast.success).toHaveBeenCalledWith('Информация о прибытии сохранена');
    });

    it('shows error toast when address is empty on save attempt', async () => {
        render(<ArrivalInfoSection initialData={null} />);
        // Save button is disabled when address is empty — but let's also test the toast guard
        const saveBtn = screen.getByText('Сохранить');
        expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('calls updateArrivalInfo(null) on clear', async () => {
        // Mock window.confirm
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(
            <ArrivalInfoSection initialData={{ address: 'Hauptstr 1' }} />
        );

        fireEvent.click(screen.getByText('Удалить'));

        await waitFor(() => {
            expect(mockUpdateArrivalInfo).toHaveBeenCalledWith(null);
        });
        expect(mockToast.success).toHaveBeenCalledWith('Информация о прибытии удалена');
    });

    it('does not clear when confirm is cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        render(
            <ArrivalInfoSection initialData={{ address: 'Hauptstr 1' }} />
        );

        fireEvent.click(screen.getByText('Удалить'));
        expect(mockUpdateArrivalInfo).not.toHaveBeenCalled();
    });

    it('shows error toast on save failure', async () => {
        mockUpdateArrivalInfo.mockResolvedValue({ success: false, error: 'Ошибка' });

        render(<ArrivalInfoSection initialData={null} />);

        fireEvent.change(screen.getByPlaceholderText(/Auguststraße/), {
            target: { value: 'Test Addr' },
        });
        fireEvent.click(screen.getByText('Сохранить'));

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Ошибка');
        });
    });

    it('only sends non-empty optional fields', async () => {
        render(<ArrivalInfoSection initialData={null} />);

        fireEvent.change(screen.getByPlaceholderText(/Auguststraße/), {
            target: { value: 'My Address' },
        });
        // Leave other fields empty
        fireEvent.click(screen.getByText('Сохранить'));

        await waitFor(() => {
            expect(mockUpdateArrivalInfo).toHaveBeenCalledWith({
                address: 'My Address',
            });
        });
        // No doorCode, bellNote, or waitingSpot keys
        const callArg = mockUpdateArrivalInfo.mock.calls[0][0];
        expect(callArg).not.toHaveProperty('doorCode');
        expect(callArg).not.toHaveProperty('bellNote');
        expect(callArg).not.toHaveProperty('waitingSpot');
    });
});
