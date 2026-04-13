import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

// framer-motion: strip motion-only props and render the plain HTML tag so
// jsdom doesn't warn about unknown DOM attributes and we skip animation work.
vi.mock('framer-motion', async () => {
    const ReactMod = await import('react');
    const MOTION_ONLY_PROPS = new Set([
        'initial', 'animate', 'exit', 'transition', 'variants',
        'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'viewport',
        'layoutId', 'layout', 'drag', 'dragConstraints', 'dragElastic',
        'onAnimationStart', 'onAnimationComplete',
    ]);
    const filterProps = (props: Record<string, unknown>) => {
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(props)) {
            if (!MOTION_ONLY_PROPS.has(key)) out[key] = props[key];
        }
        return out;
    };
    const motion = new Proxy(
        {},
        {
            get: (_target, tag: string) =>
                ReactMod.forwardRef(function MotionMock(
                    { children, ...props }: { children?: React.ReactNode } & Record<string, unknown>,
                    ref: React.Ref<HTMLElement>,
                ) {
                    return ReactMod.createElement(
                        tag,
                        { ref, ...filterProps(props) },
                        children,
                    );
                }),
        },
    );
    return {
        motion,
        AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
    };
});

// next/link: render a plain <a> so href assertions work without the Next router.
vi.mock('next/link', async () => {
    const ReactMod = await import('react');
    return {
        default: ReactMod.forwardRef(function LinkMock(
            { children, href, ...props }: { children?: React.ReactNode; href: string } & Record<string, unknown>,
            ref: React.Ref<HTMLAnchorElement>,
        ) {
            return ReactMod.createElement(
                'a',
                { ref, href: typeof href === 'string' ? href : String(href), ...props },
                children,
            );
        }),
    };
});

// next/navigation: stub the hooks defensively in case anything in the tree
// reaches for them transitively.
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/services',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: vi.fn(),
    notFound: vi.fn(),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Import the page under test AFTER the mocks so they take effect.
// ─────────────────────────────────────────────────────────────────────────────
import ServicesPage from '@/app/services/page';

describe('ServicesPage', () => {
    beforeEach(() => {
        cleanup();
    });

    it('Test 1 — default render exposes search, the "Основные направления" section, and main categories in the directory', () => {
        render(<ServicesPage />);

        // Search input is present and empty.
        const searchInput = screen.getByPlaceholderText('Найти услугу...') as HTMLInputElement;
        expect(searchInput).toBeTruthy();
        expect(searchInput.value).toBe('');

        // "Основные направления" top-cards section header is visible.
        const topCardsHeading = screen.getByRole('heading', {
            name: /Основные направления/i,
        });
        expect(topCardsHeading).toBeTruthy();

        // Hero heading present.
        expect(
            screen.getByRole('heading', { name: /Каталог услуг/i }),
        ).toBeTruthy();

        // Main categories visible specifically in the directory list (h3 level).
        // Cards render the same title as h2, the directory renders h3, so
        // filtering by level 3 scopes us to the directory unambiguously.
        expect(
            screen.getByRole('heading', { level: 3, name: 'Волосы' }),
        ).toBeTruthy();
        expect(
            screen.getByRole('heading', { level: 3, name: 'Ногтевой сервис' }),
        ).toBeTruthy();
        expect(
            screen.getByRole('heading', { level: 3, name: 'Лицо и Уход' }),
        ).toBeTruthy();
    });

    it('Test 2 — typing "Массаж лица" hides the top section, filters empty categories, and keeps the matching one', () => {
        render(<ServicesPage />);

        const searchInput = screen.getByPlaceholderText('Найти услугу...') as HTMLInputElement;
        fireEvent.change(searchInput, { target: { value: 'Массаж лица' } });

        // Input reflects the query.
        expect(searchInput.value).toBe('Массаж лица');

        // "Основные направления" top-cards section is dynamically hidden.
        expect(
            screen.queryByRole('heading', { name: /Основные направления/i }),
        ).toBeNull();

        // The related category "Лицо и Уход" is still present (as the
        // directory's h3 header).
        const faceHeading = screen.getByRole('heading', {
            level: 3,
            name: 'Лицо и Уход',
        });
        expect(faceHeading).toBeTruthy();

        // The specific service is visible as a link.
        const massageLink = screen.getByRole('link', { name: /^Массаж лица$/ });
        expect(massageLink).toBeTruthy();

        // Crucial: unrelated categories were entirely pruned from the DOM
        // (both their card title and directory header should be gone).
        expect(screen.queryByText('Волосы')).toBeNull();
        expect(screen.queryByText('Ногтевой сервис')).toBeNull();
        expect(screen.queryByText('Брови и Ресницы')).toBeNull();
        expect(screen.queryByText('Макияж')).toBeNull();

        // "Тело и Эпиляция" contains services like "Антицеллюлитный массаж"
        // that match "массаж" alone but NOT "массаж лица" — so it should also
        // have been pruned.
        expect(screen.queryByText('Тело и Эпиляция')).toBeNull();

        // Defensive: the directory under "Лицо и Уход" should contain only
        // "Массаж лица" (the sole service matching the query in that group).
        const faceSection = faceHeading.closest('div')?.parentElement;
        if (faceSection) {
            const scoped = within(faceSection as HTMLElement);
            expect(scoped.getByRole('link', { name: /^Массаж лица$/ })).toBeTruthy();
            // No other service links should have survived the filter here.
            expect(scoped.queryByRole('link', { name: /^Чистка лица$/ })).toBeNull();
        }
    });

    it('Test 3 — Cyrillic service links are URI-encoded (Массаж лица → /services/%D0%9C%D0%B0%D1%81%D1%81%D0%B0%D0%B6%20%D0%BB%D0%B8%D1%86%D0%B0)', () => {
        const { container } = render(<ServicesPage />);

        const expectedHref =
            '/services/%D0%9C%D0%B0%D1%81%D1%81%D0%B0%D0%B6%20%D0%BB%D0%B8%D1%86%D0%B0';

        // Sanity: encodeURIComponent produces the exact expected string.
        expect(encodeURIComponent('Массаж лица')).toBe(
            '%D0%9C%D0%B0%D1%81%D1%81%D0%B0%D0%B6%20%D0%BB%D0%B8%D1%86%D0%B0',
        );

        // The directory link should use the encoded href.
        const massageLink = screen.getByRole('link', { name: /^Массаж лица$/ }) as HTMLAnchorElement;
        expect(massageLink.getAttribute('href')).toBe(expectedHref);

        // And searching by attribute selector also finds it (useful when a
        // service title overlaps with another link's accessible name).
        const byAttribute = container.querySelector(`a[href="${expectedHref}"]`);
        expect(byAttribute).not.toBeNull();
    });
});
