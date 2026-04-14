import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockUploadInterior, mockDeletePhoto, mockReorderInterior, mockToast } = vi.hoisted(() => ({
    mockUploadInterior: vi.fn(),
    mockDeletePhoto: vi.fn(),
    mockReorderInterior: vi.fn(),
    mockToast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/app/actions/portfolio-photos', () => ({
    uploadInteriorPhotos: (...args: any[]) => mockUploadInterior(...args),
    deletePortfolioPhoto: (...args: any[]) => mockDeletePhoto(...args),
    reorderInteriorPhotos: (...args: any[]) => mockReorderInterior(...args),
}));

vi.mock('react-hot-toast', () => ({ default: mockToast }));

// Mock framer-motion Reorder to a simple div
vi.mock('framer-motion', () => ({
    Reorder: {
        Group: ({ children, ...props }: any) => <div data-testid="reorder-group" {...props}>{children}</div>,
        Item: ({ children, value, ...props }: any) => (
            <div data-testid={`reorder-item-${value?.id || 'unknown'}`} {...props}>
                {children}
            </div>
        ),
    },
}));

import { InteriorPhotosSection } from '@/components/dashboard/InteriorPhotosSection';

const makePhotos = () => [
    { id: 'p1', url: 'http://x/1.jpg', position: 0 },
    { id: 'p2', url: 'http://x/2.jpg', position: 1 },
    { id: 'p3', url: 'http://x/3.jpg', position: 2 },
];

describe('InteriorPhotosSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUploadInterior.mockResolvedValue({
            success: true,
            photos: [{ id: 'new1', url: 'http://x/new.jpg', position: 3 }],
        });
        mockDeletePhoto.mockResolvedValue({ success: true });
        mockReorderInterior.mockResolvedValue({ success: true });
    });

    it('renders existing photos as a grid', () => {
        render(<InteriorPhotosSection initialPhotos={makePhotos()} />);
        const items = screen.getAllByTestId(/^reorder-item-/);
        expect(items).toHaveLength(3);
        expect(screen.getByText('3/12 фото')).toBeTruthy();
    });

    it('renders empty state when no photos', () => {
        render(<InteriorPhotosSection initialPhotos={[]} />);
        expect(screen.getByText('Добавьте фото вашего интерьера')).toBeTruthy();
        expect(screen.getByText('0/12 фото')).toBeTruthy();
    });

    it('calls uploadInteriorPhotos on file select', async () => {
        render(<InteriorPhotosSection initialPhotos={[]} />);
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;

        const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockUploadInterior).toHaveBeenCalledTimes(1);
        });

        const fd = mockUploadInterior.mock.calls[0][0] as FormData;
        expect(fd.getAll('photos')).toHaveLength(1);
        expect(mockToast.success).toHaveBeenCalledWith('Фото загружено');
    });

    it('calls deletePortfolioPhoto on delete with confirmation', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<InteriorPhotosSection initialPhotos={makePhotos()} />);
        const deleteButtons = screen.getAllByLabelText('Удалить фото');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(mockDeletePhoto).toHaveBeenCalledWith('p1');
        });
        expect(mockToast.success).toHaveBeenCalledWith('Фото удалено');
    });

    it('does not delete when confirm is cancelled', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        render(<InteriorPhotosSection initialPhotos={makePhotos()} />);
        const deleteButtons = screen.getAllByLabelText('Удалить фото');
        fireEvent.click(deleteButtons[0]);

        expect(mockDeletePhoto).not.toHaveBeenCalled();
    });

    it('shows error toast on upload failure', async () => {
        mockUploadInterior.mockResolvedValue({ success: false, error: 'Тест ошибки' });

        render(<InteriorPhotosSection initialPhotos={[]} />);
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Тест ошибки');
        });
    });

    it('prevents upload beyond max photos limit', () => {
        const photos = Array.from({ length: 12 }, (_, i) => ({
            id: `p${i}`,
            url: `http://x/${i}.jpg`,
            position: i,
        }));

        render(<InteriorPhotosSection initialPhotos={photos} />);
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(input.disabled).toBe(true);
        expect(screen.getByText('12/12 фото')).toBeTruthy();
    });
});
