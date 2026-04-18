import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CraftWallGrid, type CraftPhoto } from '@/components/profile/CraftWallGrid';

// Mock next/image to a plain img
vi.mock('next/image', () => ({
    default: (props: any) => {
        const { fill, sizes, loading, ...rest } = props;
        return <img {...rest} data-loading={loading} />;
    },
}));

function makePhotos(n: number): CraftPhoto[] {
    return Array.from({ length: n }, (_, i) => ({
        id: `p${i}`,
        url: `http://x/${i}.jpg`,
        serviceId: 1,
        staffId: null,
    }));
}

describe('CraftWallGrid', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns null when photos array is empty', () => {
        const { container } = render(<CraftWallGrid photos={[]} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders all photos in a grid', () => {
        const { container } = render(<CraftWallGrid photos={makePhotos(6)} />);
        const imgs = container.querySelectorAll('img');
        expect(imgs).toHaveLength(6);
    });

    it('applies correct responsive grid classes by default (4 cols)', () => {
        const { container } = render(<CraftWallGrid photos={makePhotos(4)} />);
        const grid = container.querySelector('.grid');
        expect(grid?.className).toContain('lg:grid-cols-4');
        expect(grid?.className).toContain('sm:grid-cols-3');
        expect(grid?.className).toContain('grid-cols-2');
    });

    it('applies 2-column grid when columns=2', () => {
        const { container } = render(<CraftWallGrid photos={makePhotos(4)} columns={2} />);
        const grid = container.querySelector('.grid');
        expect(grid?.className).toContain('grid-cols-2');
        expect(grid?.className).not.toContain('sm:grid-cols-3');
    });

    it('uses lazy loading for photos beyond index 8', () => {
        const { container } = render(<CraftWallGrid photos={makePhotos(12)} />);
        const imgs = container.querySelectorAll('img');
        expect(imgs[0].getAttribute('data-loading')).toBe('eager');
        expect(imgs[7].getAttribute('data-loading')).toBe('eager');
        expect(imgs[8].getAttribute('data-loading')).toBe('lazy');
    });

    it('fires onPhotoTap with the correct photo and index', () => {
        const onTap = vi.fn();
        render(<CraftWallGrid photos={makePhotos(4)} onPhotoTap={onTap} />);

        const buttons = screen.getAllByRole('button', { name: /Фото работы/ });
        fireEvent.click(buttons[2]);

        expect(onTap).toHaveBeenCalledTimes(1);
        expect(onTap).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'p2', url: 'http://x/2.jpg' }),
            2
        );
    });

    it('shows "Показать ещё" when maxInitialRows limits visible photos', () => {
        const { container } = render(<CraftWallGrid photos={makePhotos(20)} maxInitialRows={2} />);
        const imgs = container.querySelectorAll('img');
        expect(imgs).toHaveLength(8);
        expect(screen.getByText('Показать ещё')).toBeTruthy();
    });

    it('shows more photos when "Показать ещё" is clicked', () => {
        const { container } = render(<CraftWallGrid photos={makePhotos(20)} maxInitialRows={2} />);
        expect(container.querySelectorAll('img')).toHaveLength(8);

        fireEvent.click(screen.getByText('Показать ещё'));
        expect(container.querySelectorAll('img')).toHaveLength(16);
    });

    it('hides "Показать ещё" when all photos are visible', () => {
        render(<CraftWallGrid photos={makePhotos(4)} maxInitialRows={2} />);
        expect(screen.queryByText('Показать ещё')).toBeNull();
    });

    it('shuffles photos deterministically with shuffleSeed', () => {
        const photos = makePhotos(10);
        const { container: c1 } = render(<CraftWallGrid photos={photos} shuffleSeed={42} />);
        const order1 = Array.from(c1.querySelectorAll('img')).map((img) =>
            img.getAttribute('src')
        );

        const { container: c2 } = render(<CraftWallGrid photos={photos} shuffleSeed={42} />);
        const order2 = Array.from(c2.querySelectorAll('img')).map((img) =>
            img.getAttribute('src')
        );

        // Same seed = same order
        expect(order1).toEqual(order2);

        // Different from original order (with high probability)
        const originalOrder = photos.map((p) => p.url);
        expect(order1).not.toEqual(originalOrder);
    });
});
