import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

// framer-motion: strip motion-only props and render the underlying HTML tag so
// jsdom doesn't receive unknown props and we don't pay for animation machinery
// during tests.
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

// next/navigation: stub the Next.js hooks in case anything in the tree reaches
// for them transitively.
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/locations',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: vi.fn(),
    notFound: vi.fn(),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Import the page under test AFTER the mocks so they apply during module init.
// ─────────────────────────────────────────────────────────────────────────────
import LocationsPage from '@/app/[locale]/locations/page';

describe('LocationsPage', () => {
    beforeEach(() => {
        cleanup();
    });

    it('Test 1 — renders the hero, popular-destinations header, and an empty search input', () => {
        render(<LocationsPage />);

        // Popular directory header is visible in the default state.
        const popularHeading = screen.getByRole('heading', {
            name: /Популярные направления/i,
        });
        expect(popularHeading).toBeTruthy();

        // Hero heading present.
        expect(
            screen.getByRole('heading', { name: /Каталог городов/i }),
        ).toBeTruthy();

        // Search input present and empty.
        const searchInput = screen.getByPlaceholderText(
            'Найти город...',
        ) as HTMLInputElement;
        expect(searchInput).toBeTruthy();
        expect(searchInput.value).toBe('');
    });

    it('Test 2 — typing "Ber" hides the Популярные направления section and filters the A-Z list', () => {
        render(<LocationsPage />);

        const searchInput = screen.getByPlaceholderText(
            'Найти город...',
        ) as HTMLInputElement;

        fireEvent.change(searchInput, { target: { value: 'Ber' } });

        // Input reflects the new query.
        expect(searchInput.value).toBe('Ber');

        // Popular Destinations section is now hidden.
        expect(
            screen.queryByRole('heading', { name: /Популярные направления/i }),
        ).toBeNull();

        // Berlin still renders inside the filtered A-Z directory.
        const berlinLink = screen.getByRole('link', { name: /^Berlin$/ });
        expect(berlinLink).toBeTruthy();
        expect(berlinLink.getAttribute('href')).toBe('/locations/Berlin');
    });

    it('Test 3 — city links use properly URI-encoded hrefs (München → /locations/M%C3%BCnchen)', () => {
        const { container } = render(<LocationsPage />);

        // At least one link in the tree should point at the encoded München URL.
        // We use a container query here because the popular card link's
        // accessible name also includes the hover CTA text, so filtering by
        // role+name would miss it.
        const munichLinks = container.querySelectorAll<HTMLAnchorElement>(
            'a[href="/locations/M%C3%BCnchen"]',
        );
        expect(munichLinks.length).toBeGreaterThan(0);

        // Sanity-check the A-Z directory link specifically — it has "München"
        // as its full, exact accessible name.
        const azLink = screen.getByRole('link', { name: /^München$/ });
        expect(azLink.getAttribute('href')).toBe('/locations/M%C3%BCnchen');

        // And every München link we found should agree on the encoded URL.
        for (const link of Array.from(munichLinks)) {
            expect(link.getAttribute('href')).toBe('/locations/M%C3%BCnchen');
        }
    });
});
