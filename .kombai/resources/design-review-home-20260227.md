# Design Review Results: Home Page (/)

**Review Date**: 2026-02-27
**Route**: `/`
**Focus Areas**: Visual Design, UX/Usability, Responsive/Mobile, Accessibility, Micro-interactions/Motion, Consistency, Performance

> **Note**: This review was conducted through static code analysis only. Visual inspection via browser would provide additional insights into layout rendering, interactive behaviors, and actual appearance.

## Summary

The home page has a solid foundation with a well-structured hero search, clear "How it Works" steps, and a provider CTA. However, there are **critical issues** including a completely commented-out logo, missing accessible labels on search inputs, and a `display: flex !important` on the body that can cause layout conflicts. The page also lacks key conversion sections (category grid, featured specialists, testimonials) and has several accessibility violations that need immediate attention.

---

## Issues

| # | Issue | Criticality | Category | Location |
|---|-------|-------------|----------|----------|
| 1 | **Logo is commented out in Header** — the site has no visible branding on the home page; the entire left area of the header is empty | 🔴 Critical | Visual Design / UX | `src/components/Header.tsx:69-71` |
| 2 | **`display: flex !important` on `body`** — overrides the layout's `flex flex-col` in `layout.tsx:28`, can cause unpredictable stacking across all pages | 🔴 Critical | Consistency | `src/app/globals.css:84` |
| 3 | **`lang="de"` on `<html>` but all content is Russian** — screen readers will mispronounce all content; WCAG 3.1.1 Level A violation | 🔴 Critical | Accessibility | `src/app/layout.tsx:27` |
| 4 | **Search inputs have no `<label>` elements** — the city and service inputs are identified only by placeholder text, which disappears on focus. Violates WCAG 1.3.1 and 3.3.2 | 🔴 Critical | Accessibility | `src/app/page.tsx:165-178`, `203-217` |
| 5 | **Search autocomplete dropdown missing ARIA** — no `role="listbox"`, no `aria-expanded` on the input, no `aria-activedescendant`. Keyboard-only and screen reader users cannot navigate suggestions | 🔴 Critical | Accessibility | `src/app/page.tsx:180-199`, `228-247` |
| 6 | **Hero `<img>` tag used instead of `next/image`** — bypasses all Next.js image optimisation (lazy loading, WebP conversion, sizing). `next.config.mjs` also sets `unoptimized: true` globally | 🟠 High | Performance | `src/app/page.tsx:140-144`, `next.config.mjs:8` |
| 7 | **No skip-to-content link** — keyboard users must tab through the entire header navigation to reach main content on every page | 🟠 High | Accessibility | `src/app/layout.tsx:26-41` |
| 8 | **Decorative icons lack `aria-hidden="true"`** — stats icons (Star, Sparkles, Heart) and step icons are read out by screen readers as unlabelled graphics | 🟠 High | Accessibility | `src/app/page.tsx:38-41`, `319-333` |
| 9 | **No visible focus indicators in CSS** — global transitions are defined but no `:focus-visible` styles are set, making keyboard navigation nearly invisible (browser defaults only) | 🟠 High | Accessibility | `src/app/globals.css:87-96` |
| 10 | **Dark mode primary color is purple (`263.4 70% 50.4%`) instead of brand yellow** — switching to dark mode completely breaks the brand identity; likely leftover from a shadcn/UI template | 🟠 High | Consistency | `src/app/globals.css:51` |
| 11 | **Footer copyright reads "Исполнители" instead of "Svoi.de"** — incorrect branding on every page | 🟠 High | Consistency | `src/components/Footer.tsx:27` |
| 12 | **Missing CategoryGrid on home page** — `HomeCategories.tsx` exists in the codebase but is never rendered on the landing page, leaving a major discoverability gap | 🟠 High | UX/Usability | `src/components/HomeCategories.tsx` (not used in `src/app/page.tsx`) |
| 13 | **No social proof section** — no testimonials, no reviews, no trust signals beyond 3 stats numbers. Hard to build trust with new visitors | 🟠 High | UX/Usability | `src/app/page.tsx` (missing section) |
| 14 | **CTA section has only 1 button (for masters)** — clients have no CTA at the bottom of the page; conversion flow for the primary user type is incomplete | 🟠 High | UX/Usability | `src/app/page.tsx:373-381` |
| 15 | **`transition-duration: 300ms` applied to ALL interactive elements globally** — 300ms is too slow for micro-interactions; standard is 150–200ms and causes inputs/buttons to feel sluggish | 🟡 Medium | Micro-interactions | `src/app/globals.css:93-96` |
| 16 | **Search dropdown only opens when `query.trim().length > 0`** — popular services are not surfaced when a user focuses the empty search field, missing an opportunity to guide discovery | 🟡 Medium | UX/Usability | `src/app/page.tsx:168-170` |
| 17 | **No "clear input" button on search fields** — once text is entered, it requires full manual deletion; small UX friction that compounds on mobile | 🟡 Medium | UX/Usability | `src/app/page.tsx:163-200` |
| 18 | **Stats values (100+, 500+) appear small for a marketplace** — low numbers can reduce trust; consider framing them differently (e.g., "growing community") or unlocking them only once numbers are meaningful | 🟡 Medium | Visual Design | `src/app/page.tsx:37-41` |
| 19 | **`animate-fade-in` and `animate-slide-up` defined in CSS but never used on the home page** — hero content, stats, and step cards could benefit from entrance animations to increase perceived quality | 🟡 Medium | Micro-interactions | `src/app/globals.css:112-118` |
| 20 | **Search button is `bg-black` while the defined primary brand color is `#ffcc00` (yellow)** — primary action color is inconsistent with the design system | 🟡 Medium | Consistency | `src/app/page.tsx:268-274`, `tailwind.config.ts:19` |
| 21 | **Button border-radius is inconsistent across the page** — search button uses `md:rounded-full`, header login uses `rounded-xl`, CTA button uses `rounded-xl`. No single radius token for "primary button" | 🟡 Medium | Consistency | `src/app/page.tsx:268-274`, `src/components/Header.tsx:121-125` |
| 22 | **Hero section height uses mixed units: `h-[600px]` on mobile, `md:h-[70vh]`** — on small screens (SE, 375px), 600px takes up over 100% of the viewport, hiding search UI below the fold | 🟡 Medium | Responsive/Mobile | `src/app/page.tsx:139` |
| 23 | **Stats bar `gap-8 sm:gap-16` with 3 items and icons may overflow on narrow screens (<360px)** — no wrapping or truncation strategy defined | ⚪ Low | Responsive/Mobile | `src/app/page.tsx:286-299` |
| 24 | **Homepage is a `'use client'` page unnecessarily** — static sections (steps, stats, CTA) could be server-rendered, improving TTI and SEO | ⚪ Low | Performance | `src/app/page.tsx:1` |
| 25 | **Quick beauty links in header only visible at `lg` breakpoint** — mobile users get no top-level category navigation; mobile menu has only "Поиск" | ⚪ Low | Responsive/Mobile | `src/components/Header.tsx:84-96` |
| 26 | **Dashed connector line between steps uses absolute positioning** — `left-[60%] w-[80%]` can overflow grid cell boundaries at non-standard viewport widths | ⚪ Low | Visual Design | `src/app/page.tsx:322-324` |
| 27 | **`bg-gray-50/80` uses opacity alpha channel** where a solid `bg-gray-50` would suffice; adds unnecessary compositing layer | ⚪ Low | Performance | `src/app/page.tsx:305` |

---

## Criticality Legend

- 🔴 **Critical**: Breaks functionality or violates accessibility standards (WCAG A/AA)
- 🟠 **High**: Significantly impacts user experience, brand trust, or design quality
- 🟡 **Medium**: Noticeable issue that should be addressed in the near term
- ⚪ **Low**: Nice-to-have improvement, low urgency

---

## Next Steps

### Immediate (Critical — fix before launch)
1. **Uncomment the logo** in `Header.tsx` — single line change, highest visual impact
2. **Remove `display: flex !important`** from `globals.css:84` — potential layout regression fix
3. **Change `lang="de"` to `lang="ru"`** in `layout.tsx:27`
4. **Add `<label>` elements** (visually hidden or visible) to search inputs
5. **Add ARIA attributes** (`role="combobox"`, `aria-expanded`, `aria-controls`, `role="listbox"`) to search dropdowns

### Short Term (High priority)
6. **Fix Footer copyright** from "Исполнители" to "Svoi.de"
7. **Fix dark mode primary** from purple to yellow in `globals.css:51`
8. **Add `aria-hidden="true"`** to all decorative icons
9. **Add `:focus-visible` styles** — at minimum an outline ring
10. **Import and render `<HomeCategories />`** on the home page
11. **Add a second CTA button** for clients at the bottom CTA section
12. **Replace `<img>` with `<Image />`** for the hero background and remove `unoptimized: true`

### Medium Term
13. Reduce global `transition-duration` to `150ms` in `globals.css`
14. Show popular service suggestions on search focus (empty state)
15. Add clear (×) buttons to search inputs
16. Add social proof / testimonials section
17. Apply `animate-slide-up` entrance animations to hero content and sections
18. Standardise button border-radius to one token across all CTAs
19. Reconsider hero height on mobile (`h-[90vw]` or similar fluid approach)
