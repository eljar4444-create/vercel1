import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/app/actions/portfolio-photos', () => ({
    uploadServicePhotos: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

import { uploadServicePhotos } from '@/app/actions/portfolio-photos';
import toast from 'react-hot-toast';
import { ServicePhotoUpload } from '@/components/dashboard/ServicePhotoUpload';

const mockUpload = vi.mocked(uploadServicePhotos);
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
