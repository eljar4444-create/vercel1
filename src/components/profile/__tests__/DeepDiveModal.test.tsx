import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithIntl } from './test-utils';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
        div: ({ children, variants, initial, animate, exit, ...props }: any) => (
            <div {...props}>{children}</div>
        ),
    },
}));

vi.mock('next/image', () => ({
    default: (props: any) => {
        const { fill, sizes, priority, ...rest } = props;
        return <img {...rest} />;
    },
}));

// Mock CraftWallGrid
vi.mock('@/components/profile/CraftWallGrid', () => ({
    CraftWallGrid: ({ photos, onPhotoTap }: any) => (
        <div data-testid="craft-wall-grid">
            {photos.map((p: any, i: number) => (
                <button key={p.id} data-testid={`grid-photo-${p.id}`} onClick={() => onPhotoTap?.(p, i)}>
                    {p.url}
                </button>
            ))}
        </div>
    ),
}));

import { DeepDiveModal, type DeepDivePhoto } from '@/components/profile/DeepDiveModal';

const photos: DeepDivePhoto[] = [
    { id: 'p1', url: 'http://x/1.jpg' },
    { id: 'p2', url: 'http://x/2.jpg', specialistBadge: { name: 'Анна', avatarUrl: 'http://x/anna.jpg' } },
    { id: 'p3', url: 'http://x/3.jpg' },
];

describe('DeepDiveModal', () => {
    beforeEach(() => vi.clearAllMocks());

    it('does not render when open=false', () => {
        const { container } = renderWithIntl(
            <DeepDiveModal open={false} onClose={vi.fn()} title="Test" photos={photos} />
        );
        expect(container.querySelector('[role="dialog"]')).toBeNull();
    });

    it('renders title and photo count when open', () => {
        renderWithIntl(<DeepDiveModal open={true} onClose={vi.fn()} title="Балаяж" photos={photos} />);
        expect(screen.getByText('Балаяж')).toBeTruthy();
        expect(screen.getByText('3 фото')).toBeTruthy();
    });

    it('shows grid view by default (CraftWallGrid)', () => {
        renderWithIntl(<DeepDiveModal open={true} onClose={vi.fn()} title="Test" photos={photos} />);
        expect(screen.getByTestId('craft-wall-grid')).toBeTruthy();
    });

    it('switches to lightbox when a photo is tapped', () => {
        renderWithIntl(<DeepDiveModal open={true} onClose={vi.fn()} title="Test" photos={photos} />);
        fireEvent.click(screen.getByTestId('grid-photo-p2'));
        // Lightbox shows navigation
        expect(screen.getByText('2 / 3')).toBeTruthy();
        expect(screen.getByLabelText('Предыдущее фото')).toBeTruthy();
        expect(screen.getByLabelText('Следующее фото')).toBeTruthy();
    });

    it('opens in lightbox mode when initialPhotoIndex is provided', () => {
        renderWithIntl(
            <DeepDiveModal
                open={true}
                onClose={vi.fn()}
                title="Test"
                photos={photos}
                initialPhotoIndex={0}
            />
        );
        expect(screen.getByText('1 / 3')).toBeTruthy();
    });

    it('navigates to next/prev in lightbox', () => {
        renderWithIntl(
            <DeepDiveModal
                open={true}
                onClose={vi.fn()}
                title="Test"
                photos={photos}
                initialPhotoIndex={0}
            />
        );
        expect(screen.getByText('1 / 3')).toBeTruthy();
        fireEvent.click(screen.getByLabelText('Следующее фото'));
        expect(screen.getByText('2 / 3')).toBeTruthy();
        fireEvent.click(screen.getByLabelText('Предыдущее фото'));
        expect(screen.getByText('1 / 3')).toBeTruthy();
    });

    it('wraps around at boundaries', () => {
        renderWithIntl(
            <DeepDiveModal
                open={true}
                onClose={vi.fn()}
                title="Test"
                photos={photos}
                initialPhotoIndex={2}
            />
        );
        expect(screen.getByText('3 / 3')).toBeTruthy();
        fireEvent.click(screen.getByLabelText('Следующее фото'));
        expect(screen.getByText('1 / 3')).toBeTruthy();
    });

    it('shows CTA button when onCtaClick is provided', () => {
        const onCta = vi.fn();
        renderWithIntl(
            <DeepDiveModal
                open={true}
                onClose={vi.fn()}
                title="Test"
                photos={photos}
                initialPhotoIndex={0}
                onCtaClick={onCta}
                ctaLabel="Book this look"
            />
        );
        const cta = screen.getByText('Book this look');
        fireEvent.click(cta);
        expect(onCta).toHaveBeenCalledWith(photos[0]);
    });

    it('calls onClose when Закрыть is clicked', () => {
        const onClose = vi.fn();
        renderWithIntl(<DeepDiveModal open={true} onClose={onClose} title="Test" photos={photos} />);
        fireEvent.click(screen.getByLabelText('Закрыть'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows "Назад к галерее" in lightbox and returns to grid on click', () => {
        renderWithIntl(
            <DeepDiveModal
                open={true}
                onClose={vi.fn()}
                title="Test"
                photos={photos}
                initialPhotoIndex={0}
            />
        );
        const backBtn = screen.getByText('Назад к галерее');
        fireEvent.click(backBtn);
        // Should show grid again
        expect(screen.getByTestId('craft-wall-grid')).toBeTruthy();
    });
});
