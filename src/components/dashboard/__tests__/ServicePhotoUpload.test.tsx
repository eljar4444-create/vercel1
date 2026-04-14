import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/app/actions/portfolio-photos', () => ({
    uploadServicePhotos: vi.fn(),
    reorderServicePhotos: vi.fn(),
    deletePortfolioPhoto: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

import {
    uploadServicePhotos,
    reorderServicePhotos,
    deletePortfolioPhoto,
} from '@/app/actions/portfolio-photos';
import toast from 'react-hot-toast';
import { ServicePhotoUpload } from '@/components/dashboard/ServicePhotoUpload';

const mockUpload = vi.mocked(uploadServicePhotos);
const mockReorder = vi.mocked(reorderServicePhotos);
const mockDelete = vi.mocked(deletePortfolioPhoto);
const mockToast = vi.mocked(toast);

function makeFile(
    name = 'photo.jpg',
    type = 'image/jpeg',
    size = 1024
): File {
    const file = new File(['x'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
}

function changeFiles(input: HTMLInputElement, files: File[]) {
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    fireEvent.change(input);
}

describe('ServicePhotoUpload', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders drop target with "Добавить фото" label', () => {
        render(<ServicePhotoUpload serviceId={10} initialPhotos={[]} />);
        expect(screen.getByText('Добавить фото')).toBeTruthy();
    });

    it('renders existing photos as thumbnails', () => {
        render(
            <ServicePhotoUpload
                serviceId={10}
                initialPhotos={[
                    { id: 'p1', url: 'http://x/p1.jpg', position: 0 },
                    { id: 'p2', url: 'http://x/p2.jpg', position: 1 },
                ]}
            />
        );
        const thumbs = document.querySelectorAll('img');
        expect(thumbs).toHaveLength(2);
        expect(thumbs[0].getAttribute('src')).toBe('http://x/p1.jpg');
    });

    it('invokes uploadServicePhotos with serviceId + files', async () => {
        mockUpload.mockResolvedValue({
            success: true,
            photos: [{ id: 'p1', url: 'http://x/new.jpg', position: 0 }],
        });
        render(<ServicePhotoUpload serviceId={42} initialPhotos={[]} />);

        const input = screen.getByTestId('service-photo-input') as HTMLInputElement;
        changeFiles(input, [makeFile()]);

        await waitFor(() => expect(mockUpload).toHaveBeenCalledTimes(1));
        const fd = mockUpload.mock.calls[0][0];
        expect(fd.get('serviceId')).toBe('42');
        expect(fd.getAll('photos')).toHaveLength(1);
    });

    it('appends uploaded photos to the strip sorted by position', async () => {
        mockUpload.mockResolvedValue({
            success: true,
            photos: [
                { id: 'p3', url: 'http://x/p3.jpg', position: 2 },
                { id: 'p4', url: 'http://x/p4.jpg', position: 3 },
            ],
        });
        render(
            <ServicePhotoUpload
                serviceId={10}
                initialPhotos={[
                    { id: 'p1', url: 'http://x/p1.jpg', position: 0 },
                    { id: 'p2', url: 'http://x/p2.jpg', position: 1 },
                ]}
            />
        );

        const input = screen.getByTestId('service-photo-input') as HTMLInputElement;
        changeFiles(input, [makeFile()]);

        await waitFor(() => {
            const thumbs = document.querySelectorAll('img');
            expect(thumbs).toHaveLength(4);
        });
        const thumbs = document.querySelectorAll('img');
        expect(thumbs[0].getAttribute('src')).toBe('http://x/p1.jpg');
        expect(thumbs[3].getAttribute('src')).toBe('http://x/p4.jpg');
    });

    it('rejects non-allowed MIME types client-side without calling server', async () => {
        render(<ServicePhotoUpload serviceId={10} initialPhotos={[]} />);
        const input = screen.getByTestId('service-photo-input') as HTMLInputElement;
        changeFiles(input, [makeFile('evil.gif', 'image/gif')]);

        await waitFor(() =>
            expect(mockToast.error).toHaveBeenCalledWith('Допустимы только JPEG, PNG и WebP.')
        );
        expect(mockUpload).not.toHaveBeenCalled();
    });

    it('rejects files >5MB client-side without calling server', async () => {
        render(<ServicePhotoUpload serviceId={10} initialPhotos={[]} />);
        const input = screen.getByTestId('service-photo-input') as HTMLInputElement;
        changeFiles(input, [makeFile('big.jpg', 'image/jpeg', 6 * 1024 * 1024)]);

        await waitFor(() =>
            expect(mockToast.error).toHaveBeenCalledWith('Файл слишком большой (макс. 5 МБ).')
        );
        expect(mockUpload).not.toHaveBeenCalled();
    });

    it('shows progress state during upload', async () => {
        let resolveUpload: (v: any) => void = () => undefined;
        mockUpload.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveUpload = resolve;
                })
        );
        render(<ServicePhotoUpload serviceId={10} initialPhotos={[]} />);
        const input = screen.getByTestId('service-photo-input') as HTMLInputElement;
        changeFiles(input, [makeFile()]);

        await waitFor(() => expect(screen.getByText('Загрузка...')).toBeTruthy());

        resolveUpload({
            success: true,
            photos: [{ id: 'p1', url: 'http://x/p1.jpg', position: 0 }],
        });

        await waitFor(() => expect(screen.getByText('Добавить фото')).toBeTruthy());
    });

    it('shows toast error on server failure and does not add photos', async () => {
        mockUpload.mockResolvedValue({
            success: false,
            error: 'Недостаточно прав.',
        });
        render(<ServicePhotoUpload serviceId={10} initialPhotos={[]} />);
        const input = screen.getByTestId('service-photo-input') as HTMLInputElement;
        changeFiles(input, [makeFile()]);

        await waitFor(() =>
            expect(mockToast.error).toHaveBeenCalledWith('Недостаточно прав.')
        );
        expect(document.querySelectorAll('img')).toHaveLength(0);
    });

    it('sends multiple files in one request', async () => {
        mockUpload.mockResolvedValue({
            success: true,
            photos: [
                { id: 'p1', url: 'http://x/p1.jpg', position: 0 },
                { id: 'p2', url: 'http://x/p2.jpg', position: 1 },
            ],
        });
        render(<ServicePhotoUpload serviceId={10} initialPhotos={[]} />);
        const input = screen.getByTestId('service-photo-input') as HTMLInputElement;
        changeFiles(input, [makeFile('a.jpg'), makeFile('b.jpg')]);

        await waitFor(() => expect(mockUpload).toHaveBeenCalledTimes(1));
        const fd = mockUpload.mock.calls[0][0];
        expect(fd.getAll('photos')).toHaveLength(2);
    });
});

describe('ServicePhotoUpload — cover photo management', () => {
    const threePhotos = () => [
        { id: 'p1', url: 'http://x/p1.jpg', position: 0 },
        { id: 'p2', url: 'http://x/p2.jpg', position: 1 },
        { id: 'p3', url: 'http://x/p3.jpg', position: 2 },
    ];

    beforeEach(() => vi.clearAllMocks());

    it('renders the cover badge on the position-0 thumbnail only', () => {
        render(<ServicePhotoUpload serviceId={10} initialPhotos={threePhotos()} />);
        const badges = screen.getAllByText('Обложка');
        expect(badges).toHaveLength(1);
    });

    it('calls reorderServicePhotos with the target moved to index 0 on set-as-cover', async () => {
        mockReorder.mockResolvedValue({ success: true });
        render(<ServicePhotoUpload serviceId={10} initialPhotos={threePhotos()} />);

        const setCoverButtons = screen.getAllByLabelText('Сделать обложкой');
        // p2 is first non-cover thumbnail (index 1 in photos -> first in button list)
        fireEvent.click(setCoverButtons[0]);

        await waitFor(() => expect(mockReorder).toHaveBeenCalledTimes(1));
        const [serviceIdArg, orderArg] = mockReorder.mock.calls[0];
        expect(serviceIdArg).toBe(10);
        expect(orderArg).toEqual(['p2', 'p1', 'p3']);
    });

    it('calls deletePortfolioPhoto when confirmed and removes the thumbnail', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockDelete.mockResolvedValue({ success: true });
        render(<ServicePhotoUpload serviceId={10} initialPhotos={threePhotos()} />);

        const deleteButtons = screen.getAllByLabelText('Удалить фото');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('p1'));
        await waitFor(() => {
            expect(document.querySelectorAll('img')).toHaveLength(2);
        });
        confirmSpy.mockRestore();
    });

    it('does nothing on delete when user cancels the confirm dialog', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
        render(<ServicePhotoUpload serviceId={10} initialPhotos={threePhotos()} />);

        const deleteButtons = screen.getAllByLabelText('Удалить фото');
        fireEvent.click(deleteButtons[0]);

        expect(mockDelete).not.toHaveBeenCalled();
        expect(document.querySelectorAll('img')).toHaveLength(3);
        confirmSpy.mockRestore();
    });

    it('reverts order and toasts on reorder server failure', async () => {
        mockReorder.mockResolvedValue({
            success: false,
            error: 'Ошибка изменения порядка.',
        });
        render(<ServicePhotoUpload serviceId={10} initialPhotos={threePhotos()} />);

        const setCoverButtons = screen.getAllByLabelText('Сделать обложкой');
        fireEvent.click(setCoverButtons[0]);

        await waitFor(() =>
            expect(mockToast.error).toHaveBeenCalledWith('Ошибка изменения порядка.')
        );
        // p1 should still be the cover (reverted)
        await waitFor(() => {
            const thumbs = document.querySelectorAll('img');
            expect(thumbs[0].getAttribute('src')).toBe('http://x/p1.jpg');
        });
    });

    it('restores the deleted photo and toasts on delete server failure', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockDelete.mockResolvedValue({
            success: false,
            error: 'Ошибка удаления фото.',
        });
        render(<ServicePhotoUpload serviceId={10} initialPhotos={threePhotos()} />);

        const deleteButtons = screen.getAllByLabelText('Удалить фото');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() =>
            expect(mockToast.error).toHaveBeenCalledWith('Ошибка удаления фото.')
        );
        await waitFor(() => {
            expect(document.querySelectorAll('img')).toHaveLength(3);
        });
        confirmSpy.mockRestore();
    });
});

describe('ServicePhotoUpload — staff-scoped mode', () => {
    const threePhotos = () => [
        { id: 'p1', url: 'http://x/p1.jpg', position: 0, staffId: 'staff-a' },
        { id: 'p2', url: 'http://x/p2.jpg', position: 1, staffId: 'staff-a' },
        { id: 'p3', url: 'http://x/p3.jpg', position: 2, staffId: 'staff-a' },
    ];

    beforeEach(() => vi.clearAllMocks());

    it('forwards staffId in the upload FormData when the prop is provided', async () => {
        mockUpload.mockResolvedValue({
            success: true,
            photos: [{ id: 'p1', url: 'http://x/p1.jpg', position: 0 }],
        });
        render(
            <ServicePhotoUpload serviceId={42} staffId="staff-a" initialPhotos={[]} />
        );

        const input = screen.getByTestId('service-photo-input') as HTMLInputElement;
        changeFiles(input, [makeFile()]);

        await waitFor(() => expect(mockUpload).toHaveBeenCalledTimes(1));
        const fd = mockUpload.mock.calls[0][0];
        expect(fd.get('serviceId')).toBe('42');
        expect(fd.get('staffId')).toBe('staff-a');
    });

    it('hides "Сделать обложкой" buttons when staffId prop is present', () => {
        render(
            <ServicePhotoUpload
                serviceId={10}
                staffId="staff-a"
                initialPhotos={threePhotos()}
            />
        );
        expect(screen.queryAllByLabelText('Сделать обложкой')).toHaveLength(0);
        // Delete buttons still render — one per photo
        expect(screen.getAllByLabelText('Удалить фото')).toHaveLength(3);
    });

    it('still renders the cover badge on position 0 in staff-scoped mode', () => {
        render(
            <ServicePhotoUpload
                serviceId={10}
                staffId="staff-a"
                initialPhotos={threePhotos()}
            />
        );
        expect(screen.getAllByText('Обложка')).toHaveLength(1);
    });
});
