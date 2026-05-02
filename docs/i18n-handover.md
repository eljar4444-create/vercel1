# i18n Handover — svoi.de

This is a handover document for the next agent picking up i18n work on svoi.de. The original architecture plan is in `docs/i18n-walkthrough.md`. This document explains where things stand right now, what to keep stable, and what concrete tasks remain.

## Project context

svoi.de is a Next.js 14.2.5 App Router marketplace for beauty professionals in Germany. The site is being expanded from a single Russian-language surface to three locales: Russian (ru, default), German (de), and Ukrainian (uk). The original plan committed to four constraints that must continue to hold:

1. **No cookies, no localStorage** for locale state. The URL alone determines the locale.
2. **Locale comes from the URL prefix** — `ru` is the default and lives at unprefixed paths (`/`, `/berlin`, `/salon/foo`); `de` and `uk` live under `/de/...` and `/uk/...`.
3. **Middleware reads `Accept-Language`** for first-time unprefixed visits and 308-redirects to the appropriate prefix when the user's preferred language is `de` or `uk`. (Currently gated off — see "Where we are now".)
4. **SEO must not regress for ru users** — every existing canonical, sitemap entry, and JSON-LD block must continue to behave identically for Russian visitors. This is the dark-launch principle that's governed every PR so far.

The library in use is `next-intl` (`^3.26.0`). Dictionaries live in `src/i18n/messages/{ru,de,uk}.json`. ICU plural syntax is used for any count-dependent string.

## Current state — what's already done

Nine PRs have shipped, all behind a still-on dark guard (every `/de/*` and `/uk/*` page emits `<meta name="robots" content="noindex, nofollow">`). The full audit run in the previous session confirmed: tsc clean (zero non-test errors), all 30 status codes correct, all SEO invariants hold, dictionary parity perfect at 246 keys × 3 locales, all 26 RU dark-guarantee strings present, all 35 DE/UK chrome strings render correctly, sitemap is structurally valid (12 entries × 4 hreflang = 48 alternates), and middleware honors all auth/asset/locale boundaries.

End-to-end translation is complete on these surfaces:

- Global chrome: `Header.tsx`, `Footer.tsx`, `AvatarDropdown.tsx`, `getRoleLabel` (now `useRoleLabel` hook)
- Homepage `/`, `/de`, `/uk` — all 8 component files (HomeHeroV2, SearchBar, CategoryNav, MasterGallery, MasterCard, HowItWorks, JealousyCard, ManifestoBand, HomepageFooter)
- City listing `/[city]` and `/[city]/[category]` — body and metadata
- Salon profile `/salon/[slug]` — `PublicProfileView` and `ProfileClient` plus 7 sub-components (BookingCTA, TeamSection, EntityHero, SpecialistCard, StaffSection, ReviewsSection, ServiceMenu)
- Search `/search` — page metadata plus all 8 search components (SearchInteractiveLayout, SearchFiltersForm, SearchQuickFilters, SearchResultListItem, ActiveFilters, LiveQuickSlots, SearchResultsMapClient, SearchResultsMap)
- Static legal pages (server components): `/agb`, `/datenschutz`, `/impressum`, `/become-pro`, `/guide/kleingewerbe`
- Locations index `/locations` and `/locations/[city]` — metadata only

The complete SEO surface is live for translated routes: locale-aware canonicals via `localizedAlternates(locale, path)`, hreflang reciprocity (every page lists every variant including itself plus `x-default`), sitemap with `alternates.languages` per entry, JSON-LD `BreadcrumbList` with translated labels and prefixed URLs, `<html lang>` per locale.

## Architecture you must keep stable

These are load-bearing decisions. Don't change them without a strong reason.

**Default-locale prefixing strategy is "as-needed"**. Russian URLs stay unprefixed (`/berlin`). The middleware internally rewrites unprefixed public paths to `/ru/<path>` so the `[locale]` route tree matches, but the user-visible URL never changes. This was chosen to preserve all existing canonical and external-link equity. Switching to "always-prefix" would 301 every existing URL and is explicitly off the table.

**System routes never localize**. Auth, admin, dashboard, account, provider, onboarding, chat, my-bookings, and `/api` all live at unprefixed paths regardless of user locale. They are listed in `ALWAYS_DEFAULT_PREFIXES` in `src/middleware.ts`. Do not move them under `[locale]/`. This is a deliberate deviation from the original walkthrough document, which suggested locale-prefixing auth routes; we decided against it because system surfaces don't benefit from translated URLs.

**Root layout `src/app/layout.tsx` keeps `<html>` and `<body>`**. Next App Router requires the root layout to emit these. The `[locale]/layout.tsx` adds locale validation, calls `setRequestLocale`, and emits the dark-period `noindex` meta. The root layout reads the locale from the `x-locale` request header (set by middleware) and passes the message bundle to `NextIntlClientProvider`.

**One sitemap, not three**. The walkthrough suggested splitting into a sitemap-index with one file per locale. We kept a single `src/app/sitemap.ts` that emits `alternates.languages` per entry. Google parses both forms identically. Don't split it unless a specific operational reason emerges (e.g. per-locale Search Console submission).

**ICU plurals are the canonical pattern for counts**. There is no manual `pluralize()` helper anywhere — that was the old Russian-only approach and has been removed. Any new count-dependent string must use ICU `{count, plural, one {...} few {...} many {...} other {...}}` for ru/uk and `{count, plural, one {...} other {...}}` for de.

**Server components use `getTranslations`, client components use `useTranslations`**. The provider boundary is `src/app/layout.tsx` which mounts `NextIntlClientProvider`. Code in `src/lib/` runs server-side and uses `getTranslations` plus `getLocale` from `next-intl/server`.

**Locale-aware URL helpers live in `src/i18n/canonical.ts`**. Use `pathForLocale(locale, '/foo')` for relative URLs, `absoluteUrlForLocale(locale, '/foo')` for fully-qualified URLs (e.g. JSON-LD), and `localizedAlternates(locale, '/foo')` for the `alternates` object in `generateMetadata`. Never construct locale URLs by string concatenation.

## Where we are right now

The infrastructure is fully in place but the dark guard is still up. Three knobs are intentionally still set to "off":

The first is `ENABLE_LOCALE_REDIRECTS = false` in `src/middleware.ts`. When this flips to `true`, an unprefixed visit with `Accept-Language: de-DE` from a German speaker becomes a 308 redirect to `/de/<path>`. Until then, every visitor sees the Russian default unless they manually type a `/de` or `/uk` URL.

The second is the `robots: { index: false, follow: false }` returned from `generateMetadata` in `src/app/[locale]/layout.tsx` for any locale that is not `ru`. This emits `<meta name="robots" content="noindex, nofollow">` on every `/de/*` and `/uk/*` page. As long as this is on, search engines will not index the German or Ukrainian trees regardless of how complete the translations are.

The third is the absence of `/de` and `/uk` URLs in the sitemap as primary entries. The current sitemap lists each unprefixed URL once with `alternates.languages` pointing at all three locales. When the noindex lifts, Google will discover the `/de` and `/uk` variants through the alternates and index them naturally; no sitemap change is needed.

Two static pages are still client components without any translation: `/about` (`src/app/[locale]/about/page.tsx`, marked `'use client'`) and `/guide` (`src/app/[locale]/guide/page.tsx`, also `'use client'`). They have no `generateMetadata` and emit no canonical or hreflang. This was deferred because client-component pages cannot have `generateMetadata` directly — they need a server-page wrapper that renders the existing client component as a child. When the noindex lifts globally, these two pages should be selectively kept noindex until they are properly translated.

## Tasks remaining, in priority order

### Task 1 — The noindex-lift PR

This is the highest-value remaining work. Until this ships, the entire i18n project is invisible to search engines and to the German and Ukrainian users it was built for.

The change is small. Open `src/app/[locale]/layout.tsx` and remove the `robots: { index: false, follow: false }` from `generateMetadata`. The function should still validate the locale and call `setRequestLocale`, but should no longer emit the noindex meta. Then open `src/middleware.ts` and change `const ENABLE_LOCALE_REDIRECTS = false` to `true`. That is the entire functional change.

Before merging, add per-page noindex to the two untranslated client pages so they are not indexed under `/de` or `/uk` until they are properly translated. The cleanest way is to keep the existing client components and add a tiny server `page.tsx` wrapper that exports `generateMetadata` returning `{ robots: { index: false, follow: false } }` for non-default locales while delegating render to the client component renamed to `AboutClient.tsx` and `GuideClient.tsx`. Alternatively, leave them as-is and document that they remain dark for the first week post-launch.

After merging, smoke-test by visiting `/de` and `/uk` directly and verifying the `<meta name="robots">` tag is gone, then visiting `/agb` with `Accept-Language: de-DE` and verifying the 308 redirect to `/de/agb`. Submit the sitemap to Google Search Console and Bing Webmaster Tools, monitor for hreflang cluster errors over the following week.

### Task 2 — Move WebSite JSON-LD into the locale layout

The `WebSite` schema block in `src/app/layout.tsx` has a hardcoded `potentialAction.target: 'https://www.svoi.de/search?q={search_term_string}'`. For German and Ukrainian users this should be `/de/search` and `/uk/search` respectively. The walkthrough plan specified moving the `WebSite` JSON-LD into `src/app/[locale]/layout.tsx` so it can read the locale and use `absoluteUrlForLocale(locale, '/search')` for the target URL. The `Organization` JSON-LD block can stay in the root layout since it is locale-independent.

This is a small cleanup and not blocking. Do it before or shortly after the noindex lift.

### Task 3 — Salon profile modals

These four modal components were deferred from PR-8 because they are opt-in surfaces that crawlers do not see in default renders. They remain in Russian regardless of locale. Total surface is roughly 40 unique strings.

The components are `src/components/profile/DeepDiveModal.tsx` (267 lines, ~6 strings), `src/components/profile/StaffPortfolioModal.tsx` (294 lines, ~28 strings, the largest of the four), `src/components/profile/SpecialistSelector.tsx` (217 lines, ~5 strings), and `src/components/profile/CraftWallGrid.tsx` (121 lines, ~2 strings).

For each, add `useTranslations('salon')` (the namespace already exists with most likely keys) and replace hardcoded Russian strings. Add any missing keys to all three locale files in `src/i18n/messages/`. The existing `salon.gallery.*` namespace covers a lot of what the photo modals need. New keys should follow the convention `salon.modals.<modalName>.<keyName>`.

Verify with `npx tsc --noEmit` and by opening each modal interactively in the browser at `/de/salon/<slug>` and `/uk/salon/<slug>` after the noindex lifts.

### Task 4 — Booking flow translation

The booking flow at `/book/[slug]` is a major user-facing surface but not indexable in the SEO sense. The page is `src/app/[locale]/book/[slug]/page.tsx` and most of the UI lives in `src/components/booking-ui/` — currently includes `BookingStandalone.tsx`, `UserForm.tsx`, `TimeGrid.tsx`, and likely a few other files. There may be approximately 40 to 60 unique strings across the booking surface including form labels, validation messages, confirmation copy, error toasts, calendar weekday names, and time-slot displays.

This is a Wave 3 task per the original plan. Add a `booking.*` namespace to all three message files. Convert components to `useTranslations('booking')`. For form validation, integrate `next-intl` with the existing form-validation library (likely `react-hook-form` + `zod` based on package.json). Zod messages will need a localized resolver — see the next task for the broader form story.

Calendar weekday and month names should use `Intl.DateTimeFormat` with the active locale rather than translation keys, since the Intl API already handles locale-correct formatting. Get the locale via `useLocale()` from `next-intl`.

### Task 5 — Static client pages /about and /guide

These two pages are marked `'use client'` and therefore cannot have `generateMetadata`. They currently emit no canonical link, no hreflang cluster, and no metadata at all beyond what the root layout provides. After the noindex lift they would be indexed at `/de/about` and `/uk/about` showing Russian content with no canonical, which is a soft SEO mistake.

The fix is the same pattern for both: rename the existing file (`page.tsx`) to `AboutClient.tsx` and `GuideClient.tsx`, remove the `'use client'` directive's role as the page entry, and create a new `page.tsx` server component that exports `generateMetadata` and renders `<AboutClient />` (or `<GuideClient />`). The new server `page.tsx` should call `getTranslations('about')` (or `'guide'`) for the title and description, and use `localizedAlternates(locale, '/about')` for the canonical and hreflang.

The body translations are a separate effort. The `/about` page is a marketing manifesto with several paragraphs of copy and animated sections. The `/guide` page is a product-explainer with FAQ accordion. Translation is meaningful work — roughly 30 to 50 unique strings each — and probably benefits from a translator review pass after the LLM draft.

### Task 6 — Wave 4: forms, validation, toasts

This is the largest remaining bucket and the most diffuse. Forms exist on login, registration, onboarding (multiple steps), profile editing in the dashboard, profile creation in `become-pro`, booking, leaving reviews, support chat, and a few smaller flows. Strings include input labels, placeholders, error messages, success toasts, helper text, and confirmation prompts.

The right starting point is to introduce a localized Zod resolver. Create `src/i18n/zod.ts` that exports a function returning a `z.ZodErrorMap` driven by translation keys. Each Zod issue type (`invalid_type`, `too_small`, `too_big`, `invalid_string`, etc.) maps to a translation key under a new `validation.*` namespace. The resolver looks up the active locale's message at validation time.

Once the resolver exists, every form that currently catches Zod errors and shows them via `toast.error` or inline can switch to using the resolver, and the underlying messages become locale-correct automatically.

For non-Zod messages — toasts, button labels, helper text — add a `forms.*` namespace and translate component-by-component.

Forms in the dashboard are not indexable so the translation here is purely UX. They are still important for de/uk users to actually be able to register and use the platform.

### Task 7 — Provider/dashboard surfaces

The dashboard, account settings, onboarding, chat, my-bookings, provider profile editing, and admin panel are all currently in Russian. None of these are indexable — they're behind authentication and are explicitly not under the `[locale]` segment. The translation question is purely whether German and Ukrainian providers can actually log in and manage their profiles.

These surfaces have a lot of strings — probably 200 to 400 unique strings across all the dashboard pages combined. They include settings pages, profile editing forms, the onboarding wizard (multiple steps with different copy per step), the chat UI (message list, conversation header, send button, empty states), the bookings list (status badges, calendar views, filter chips), and the admin panel.

Recommended approach: do this as a series of small PRs grouped by user persona. PR for client-facing surfaces (my-bookings, account settings, profile in chat). PR for provider onboarding flow. PR for provider dashboard. PR for admin panel (lowest priority since admins are internal).

Important constraint: these surfaces live outside the `[locale]` segment, so the locale comes from `headers().get('x-locale')` in server components or from `useLocale()` in client components. The middleware already sets `x-locale` based on the request URL or the unprefixed default. Don't try to introduce a locale param into these routes.

### Task 8 — Database schema for translated content

This is the final PR per the original plan and the gating dependency for translating provider-authored content. Without it, category names like "Парикмахер" and service titles like "Стрижка женская" remain in Russian on every locale even though the surrounding chrome is German or Ukrainian.

The schema work has three layers.

For categories (small controlled set, ~20-50 rows): add either a `category_translations` table with `(category_id, locale, name)` or a `name jsonb` column on `Category` keyed by locale. The translation table is cleaner and what the plan recommended. Migrate data by creating ru entries from the existing `name` field, then run an LLM pass to populate de and uk.

For services (provider-authored, possibly thousands of rows): add `original_locale TEXT NOT NULL DEFAULT 'ru'` to the `Service` model, plus a `service_translations` table or a `title jsonb` column. The provider writes in their primary language; the system optionally generates translations into the other two locales using an LLM, with a `translation_source` column tracking whether each translation is original, machine, or human-edited.

For profile bios (free-form text per profile): same shape as services.

Once the schema lands, introduce a `getLocalized(field, locale, fallbackLocale)` helper in `src/lib/` that takes a field with translations and returns the best available variant. Call sites then read `getLocalized(category.name, locale, 'ru')` instead of `category.name` directly.

This work should land after the noindex lift and after at least a week of soak in production. Search Console feedback will tell you whether content gaps are causing indexing issues — that informs how aggressive to be about machine translation versus waiting for human input.

## Where to find things

The i18n infrastructure lives in `src/i18n/`. The three message files are `src/i18n/messages/{ru,de,uk}.json`. The locale config (list of locales, default, type guards) is `src/i18n/config.ts`. The next-intl request loader (handles falling back to the `x-locale` header for routes outside the `[locale]` segment) is `src/i18n/request.ts`. The URL helpers (canonical, hreflang, locale-aware paths) are in `src/i18n/canonical.ts`. The TypeScript module augmentation that makes unknown keys break the build is `src/i18n/types.d.ts`.

The middleware is `src/middleware.ts`. The translated routes live under `src/app/[locale]/`. System routes (auth, admin, dashboard, etc.) are still at the unprefixed top level under `src/app/`. The locale layout that validates `params.locale` and sets the request locale is `src/app/[locale]/layout.tsx`. The root layout that emits `<html>` and `<body>` and mounts the NextIntlClientProvider is `src/app/layout.tsx`.

The sitemap generator is `src/app/sitemap.ts` and is locale-aware via the `entry()` helper. The robots.txt generator is `src/app/robots.ts` and is locale-independent.

Two profile components have a non-obvious pattern. `src/lib/profileView.tsx` is a server-only library that renders the salon profile shell and uses `getLocale()` plus `getTranslations()` directly. `src/components/AvatarDropdown.tsx` exports both a `getRoleLabelKey(user)` pure function (returns one of five string keys) and a `useRoleLabel(user)` hook that calls the translator — split this way because the same logic needs to be callable from both inside and outside React render scope.

## How to verify changes

Before any PR merges, run `npx tsc --noEmit` and confirm zero non-test errors. Test files have pre-existing Prisma mock typing errors that are unrelated to i18n — filter them out when scanning the output.

Then run a spot-check of the changed surface in all three locales. The dev server runs on `http://localhost:3000`. For surfaces under `[locale]`, visit `/<path>` (Russian default), `/de/<path>`, and `/uk/<path>` and view-source to verify the `<html lang>`, the canonical link, the hreflang cluster (should be 4 links: ru, de, uk, x-default), and the absence or presence of `<meta name="robots" content="noindex, nofollow">` depending on whether the dark guard is still up.

For dictionary parity, run this quick Python check from the project root:

```python
import json
def flat(o, p=''):
    out = []
    for k, v in o.items():
        path = p + '.' + k if p else k
        if isinstance(v, dict): out.extend(flat(v, path))
        else: out.append(path)
    return out
ru = set(flat(json.load(open('src/i18n/messages/ru.json'))))
de = set(flat(json.load(open('src/i18n/messages/de.json'))))
uk = set(flat(json.load(open('src/i18n/messages/uk.json'))))
print('parity:', len(ru ^ de) + len(ru ^ uk), 'mismatches')
```

Should print 0. Any non-zero output names keys that are in one locale but not another.

For the dark-launch guarantee, after any change to a translated surface, verify that visiting the unprefixed Russian URL produces output identical to before the change. The simplest test is to grep for a chrome string you know should be there ("Войти", "Стать мастером", "Все права защищены", etc.) and confirm it appears in the response body. If it does not, the dark guarantee broke.

## Gotchas

The dev server runs through `npm run dev`, but in this WSL environment `npm` resolves to a Windows shim that fails on WSL paths. If the dev server fails with `'next' is not recognized as an internal or external command`, you need to prepend the WSL nvm node path: `PATH=/home/emamedov/.nvm/versions/node/v20.20.2/bin:$PATH npm run dev`. This is a local environment quirk, not a code issue.

The dev server occasionally drops between long-running test sessions. If `curl` returns empty bodies or 000 status codes, restart it with the PATH workaround above.

Several test profiles in the dev database have changed slugs over time. The currently-published profiles are `emil-bayreuth` and `eliar-mamedov-bayreuth`. Use these for any salon-page testing rather than hardcoding `test-salon`.

The `NextIntlClientProvider` ships the entire active locale's message bundle into the HTML response as a JSON payload inside a `<script>` tag. This means grepping the page body for a foreign-locale string will produce false positives — the string is in the dictionary payload, not the rendered DOM. To verify "no leak", grep for HTML element attributes or text content specifically (e.g. `<button[^>]*aria-label="..."`) rather than for the bare string.

`grep -c` counts matching lines, not matching occurrences. Hreflang links are typically all on one HTML line, so `grep -c` reports 1 even when there are 4 hreflang links present. Use `grep -oE | wc -l` for occurrence counts.

The `[meta name="robots"]` tag can appear twice on a single response — once from `[locale]/layout.tsx` (the dark-period noindex,nofollow) and once from a page-level override (e.g. filtered search variants emit `noindex, follow`). Both are correct; Next merges metadata from layouts into page-level metadata.

Booking, dashboard, and admin pages return 307 redirects for unauthenticated users because the auth gate in middleware fires before route resolution. This is correct behavior. Don't expect 404 from `/uk/dashboard` for unauthenticated users — you will get 307 to `/auth/login`, same as `/dashboard`.

`getTranslations` in server components requires either `setRequestLocale` to have been called in the layout chain (the locale layout does this) or a fallback via `x-locale` header (handled by `src/i18n/request.ts`). Code in `src/lib/` that runs outside the `[locale]` route tree should call `getLocale()` from `next-intl/server` and pass the locale explicitly to any rendered component that needs it.

When adding a new translation key, add it to `ru.json` first (the source of truth), then to `de.json` and `uk.json`. The `IntlMessages` type augmentation in `src/i18n/types.d.ts` derives from `ru.json`, so adding a key only to `de.json` will not be type-checked.

ICU placeholder syntax is `{name}` for strings and `{count, plural, one {...} other {...}}` for counts. There is no automatic pluralization on numbers — every plural-sensitive string must use the ICU form explicitly.

For dates and numbers, prefer `Intl.DateTimeFormat` and `Intl.NumberFormat` with the locale from `useLocale()` over hardcoded format strings or translation keys. The Intl API already handles locale-correct ordering, separators, and weekday/month names.

## Final note

The work that remains is well-defined but voluminous. The path of least risk is: ship the noindex-lift PR now, soak for a week with Search Console monitoring, then prioritize the booking flow translation (highest user-facing impact for de/uk users who need to actually book), then pick away at the dashboard surfaces, then tackle the database schema migration. Save Wave 4 (forms and validation) for last because the surface is the most diffuse and the localized Zod resolver pattern is the meaningful architectural decision; once that's in place the per-form work is mechanical.

If you find yourself making decisions about locale routing, URL structure, or canonical/hreflang shape, re-read the original `docs/i18n-walkthrough.md` and the "Architecture you must keep stable" section of this document before changing anything. Those decisions were made carefully; deviating from them risks SEO regressions that are expensive to reverse.

Good luck.
