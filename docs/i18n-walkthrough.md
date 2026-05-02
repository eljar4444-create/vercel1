# i18n Architecture Walkthrough — svoi.de

A step-by-step plan for expanding svoi.de to support three languages: Russian (`ru`, default), Ukrainian (`uk`), and German (`de`). This document is the implementation guide. No code has been changed yet.

## 0. Findings that shape the plan

What is true in the current repo today:

- Next 14.2.5 App Router. No i18n library is installed (no `next-intl`, no `next-i18next`).
- `src/app/layout.tsx` hardcodes `<html lang="de">` and the page metadata is in Russian. The `de` here means Germany the country, not German the language. This is the crux of the rename we have to do.
- Public routes today: `/`, `/[city]`, `/[city]/[category]`, `/salon/[slug]`, `/search`, `/services(/[slug])`, `/locations(/[city])`, `/book/[slug]`, `/about`, `/guide`, `/agb`, `/datenschutz`, `/impressum`, `/become-pro`, `/reviews`.
- Protected and system routes: `/auth`, `/admin`, `/dashboard`, `/account`, `/provider`, `/onboarding`, `/chat`, `/my-bookings`, `/api`.
- `src/app/[city]/page.tsx` uses a `RESERVED_SLUGS` allowlist to keep system paths from being treated as cities. The same list is duplicated in `src/app/sitemap.ts`. Locale prefixes will need similar guarding only if we do not move things under `[locale]`. We will, see section 2.
- `metadataBase` plus relative `canonical` is already in use in `[city]/[category]`, `salon/[slug]`, `search`, `locations`. No `hreflang` anywhere, as noted in the brief.
- Roughly 97 client components live under `src/components/`. The dictionary-delivery strategy has to handle this without forcing every client to fetch JSON.
- `src/middleware.ts` already handles auth, onboarding, and ban routing, with a matcher that excludes `_next/static`, `_next/image`, and common image extensions. Locale logic layers on top of this, not alongside.

## 1. Locale model — two decisions to confirm before we start

### 1a. Locale codes

The brief says `ua`, the URL example says `/uk/search`. ISO 639-1 for Ukrainian is `uk`; `ua` is the country code. Recommendation: use `uk`. It matches the URL example, matches `<html lang="uk">`, and matches search-engine expectations. The rest of this document assumes `uk`.

### 1b. Default-locale prefixing — the load-bearing decision

There are two viable modes.

The first is **as-needed prefixing** (recommended). Russian lives at the existing unprefixed paths, German lives under `/de/...`, Ukrainian lives under `/uk/...`. So the homepage for a Russian speaker stays at `/`, the Berlin page stays at `/berlin`, and German speakers see `/de/berlin`. The benefit is zero churn to existing canonical and sitemap URLs, no 301 chains on the dominant locale, and the SEO remediation that just shipped is preserved as-is. The cost is slightly more involved middleware and canonical logic, since the system has to know whether a given path is prefixed or not.

The second is **always-prefix**. Every URL gets a locale prefix, including the default. So `/berlin` becomes `/ru/berlin`. The benefit is conceptual symmetry: every URL has the same shape. The cost is heavy. Every existing URL has to 301 to its `/ru/...` counterpart, every external backlink lands on a redirect, and the PageRank that was just consolidated by the SEO remediation gets diluted into a redirect hop.

Recommendation: **as-needed**. The rest of this plan assumes that. If always-prefix is preferred, sections 3 and 6 change shape.

## 2. Directory restructuring

Move all public, indexable routes under a `[locale]` segment. Authenticated, admin, and API routes stay outside it — they do not need translated URLs, and pulling them in just adds a parameter to every signature for no benefit.

Target layout:

- `src/app/[locale]/` — the new public surface
  - `layout.tsx` — sets `<html lang>`, loads the dictionary, mounts the client provider
  - `page.tsx` — the homepage, moved from `src/app/page.tsx`
  - `[city]/page.tsx` and `[city]/[category]/page.tsx`
  - `salon/[slug]/...`
  - `search/...`
  - `services/...`
  - `locations/...`
  - `book/[slug]/...`
  - `about`, `guide`, `agb`, `datenschutz`, `impressum`, `become-pro`, `reviews`
  - `sitemap.ts` — per-locale sitemap, see section 6
- `src/app/api/` — unchanged
- `src/app/auth/` — unchanged
- `src/app/admin`, `dashboard`, `account`, `provider`, `onboarding`, `chat`, `my-bookings` — unchanged
- `src/app/layout.tsx` — becomes a thin shell, no `<html lang>` here
- `src/app/robots.ts` and `src/app/sitemap.ts` — `sitemap.ts` becomes a sitemap-index that fans out to the per-locale sitemaps
- `src/app/globals.css`, `error.tsx`, `global-error.tsx`, `template.tsx` — stay where they are

Effects of this restructuring:

- `[locale]/[city]` no longer collides with system paths, because the system paths live above `[locale]` in the tree. We can simplify `RESERVED_SLUGS` to just the locale-internal page names (`salon`, `search`, `services`, `locations`, `book`, etc.) and drop the auth/admin/api entries from that list.
- The two `<html lang="de">` declarations and the global JSON-LD become locale-aware. But `<html>` can only be emitted once, so the root `layout.tsx` becomes a pass-through and `[locale]/layout.tsx` is the one that renders `<html>`. Next allows this when only one layout in the tree renders `<html>`.
- Routes that today live directly under `app/` and are not in the public list (auth, dashboard, etc.) stay where they are. They will render at unprefixed paths and treat the user as the default locale.

## 3. Middleware logic

Augment `src/middleware.ts`, do not replace it. The existing auth, onboarding, and ban logic is correct and we do not want to rewrite it. Order of operations on every request:

1. **Bypass**: any path matching `/api`, `/_next`, `/favicon`, image extensions (`*.png|jpg|svg|webp|ico`), `/robots.txt`, `/sitemap*.xml`. Pass straight through.
2. **Strip locale**: detect a leading `/de` or `/uk`, remember it, treat the remainder as the "logical path" for the rest of the middleware.
3. **Run the existing auth/ban/onboarding logic** against the logical path. Auth redirects must preserve the locale prefix so a Ukrainian user being sent to login goes to `/uk/auth/login`, not `/auth/login`.
4. **Locale resolution branch**, only for paths without a locale prefix and not in the always-default allowlist:
   - If the logical path starts with `/auth`, `/admin`, `/dashboard`, `/account`, `/provider`, `/onboarding`, `/chat`, or `/my-bookings`: no locale handling. Default to `ru`, no prefix.
   - Otherwise, if the top match in `Accept-Language` is `de` or `uk`: 308 redirect to `/<locale>/<path>`.
   - Otherwise (`ru` or unknown): pass through. This is the default `ru` case, no prefix.
5. **Set a request header** `x-locale` to the resolved locale so RSC code can read it without re-parsing the URL.

Why these choices:

- **308 instead of 307**: permanent for SEO, preserves method. We only redirect on initial unprefixed visits where `Accept-Language` clearly indicates `de` or `uk`. Inside an already-prefixed locale we never redirect.
- **No cookies, no localStorage**: satisfied. The only state is the URL itself. `Accept-Language` only influences the very first visit to an unprefixed URL.
- **`x-locale` request header**: lets server components and `generateMetadata` read the locale without re-parsing `params.locale`. This is useful in pages outside `[locale]/` (the global error boundary, the sitemap index) where there is no `params` to read from.
- **Matcher**: keep the current matcher. Locale handling lives behind the asset bypass so we never redirect `_next` traffic.
- **Crawler exemption**: do not vary on User-Agent, do not sniff bots. Googlebot sends `Accept-Language: en-US`, so it lands on `ru` (default), which is exactly what we want. It will then crawl the `de` and `uk` trees via the sitemap and hreflang we add in section 6.

## 4. Dictionary management

### Library choice

Recommendation: `next-intl`. App Router-native, RSC-aware, has `getTranslations()` for server and `useTranslations()` for client, supports ICU plurals, has decent message tooling. Rolling our own works and saves a dependency, but with 97 client components a hand-rolled provider gets fiddly and the type-safety story is weaker. Open to going hand-rolled if you would rather avoid the dep — flag it before PR-1.

### File layout

- `src/i18n/config.ts` — locale list, default locale, `isLocale()` type guard
- `src/i18n/request.ts` — next-intl server-side dictionary loader
- `src/i18n/messages/ru.json` — source of truth, hand-edited
- `src/i18n/messages/de.json`
- `src/i18n/messages/uk.json`
- `src/i18n/types.d.ts` — generated from `ru.json`, declares the `IntlMessages` shape so unknown keys fail typecheck

### Type safety

Declare the `IntlMessages` interface from `ru.json` so calls like `t('home.hero.title')` autocomplete and unknown keys break the build. next-intl supports this via module augmentation. For a hand-rolled implementation we would generate the union with a tiny build script.

### Namespacing

Group keys by route segment, not by component: `home.*`, `search.*`, `salon.*`, `city.*`, `common.*`, `seo.*`. This way each route's `layout.tsx` can pre-load only the namespaces it needs (next-intl supports per-route message loading) and we do not ship the whole dictionary on every page.

## 5. Translating UI without breaking client components

The 97 client components are the actual hard part. The plan in five points:

1. **Server components**: call `getTranslations(namespace)` directly in the RSC. No prop drilling, no provider needed. Most page-level files (`[city]/page.tsx`, `salon/[slug]/page.tsx`, etc.) are RSCs and migrate cleanly.
2. **Client components**: wrap the `[locale]/layout.tsx` tree in `<NextIntlClientProvider messages={...}>`. Pass only the namespaces the route actually needs (the search page passes `search` plus `common`, the booking page passes `booking` plus `common`), so we do not ship every string to every client. Inside the client component, call `useTranslations('search')`.
3. **Strings inside server actions and `lib/`**: those run server-side and have no request context for next-intl to lock onto. Use `getTranslations({ locale })` and pass `locale` explicitly — it is not derivable from request headers in a server action.
4. **Migration sequence** to avoid a flag day:
   - PR-1: add `next-intl`, set up `[locale]/layout.tsx` and the provider, ship the empty dictionaries.
   - Wave 1: page-level RSC strings, `generateMetadata`, JSON-LD. This is the SEO-critical wave; it ships first and we verify in Search Console before anything else.
   - Wave 2: shared layout chrome — `Header.tsx`, `Footer.tsx`. Both read `useTranslations('common')`.
   - Wave 3: feature surfaces grouped by directory (`search/`, `profile/`, `booking-ui/`, `dashboard/`...). One PR per directory. Each PR adds the keys to all three locale files. Untranslated keys fall back to `ru`.
   - Wave 4: dynamic content (forms, validation, toasts). Zod messages get a localized resolver.
5. **Fallback chain**: missing key in `de` or `uk` falls back to `ru`. We do not let next-intl throw in production; configure `onError` to swallow and report. This lets us ship partial translations without a hard failure.

## 6. SEO — canonical, sitemap, JSON-LD, hreflang

This is where the as-needed default decision pays off.

### Canonical rule, uniform across all pages

For locale `ru`, the canonical is the unprefixed path. This is the existing behavior and does not change. For locale `de` or `uk`, the canonical is `/<locale>` plus the path. Implement this once via a helper `localizedCanonical(locale, path)` and call it from every `generateMetadata`. Drop the ad-hoc `canonical: '/search'`-style strings in favor of the helper.

### Hreflang — the part that broke before

Each indexable page emits `alternates.languages` with all three locale URLs plus `x-default`. The `ru` entry points at the unprefixed URL, the `de` entry points at the `/de/...` URL, the `uk` entry points at the `/uk/...` URL, and `x-default` points at the `ru` (unprefixed) URL.

Critical correctness rules — these are what trip most teams up:

1. **Reciprocity**: every page in the cluster must list every other variant *and itself*. Centralize this in the helper so we cannot forget.
2. **Only emit hreflang for pages that genuinely have a localized counterpart.** A salon profile in Ukrainian does not exist as a translated URL until the database is multilingual — so until section 7 lands, salon profile pages emit a single self-canonical and no hreflang group, not a wrong one.
3. **Self-referential hreflang is required.** Google rejects clusters that skip it.
4. **No hreflang on noindex pages** (auth, dashboard, account, etc.).

### Sitemap

Convert `src/app/sitemap.ts` into a sitemap index that points to `sitemap-ru.xml`, `sitemap-de.xml`, and `sitemap-uk.xml`. Each per-locale sitemap emits the URLs for that locale and includes `<xhtml:link rel="alternate" hreflang="...">` entries for the other locales. Next 14's `MetadataRoute.Sitemap` supports `alternates.languages` per entry, so this is one helper, not three sitemap files of duplicated logic. Keep the existing "only emit pairs with at least one published profile" guard.

### JSON-LD

The `BreadcrumbList` in `[city]/page.tsx` has `'Главная'` hardcoded; that becomes `t('common.home')`. The `Organization` and `WebSite` blocks in the root layout move into `[locale]/layout.tsx`. `Organization` itself is locale-independent so we could keep it once at the root, but `WebSite.potentialAction.target` should point at the locale's search URL — which means it has to live below `[locale]/layout.tsx`.

### robots.ts

Stays as-is. Locale paths are allowed by default.

## 7. Database content (translated categories and services)

UI-first as requested, but the design needs to anticipate the database layer so we do not trap ourselves.

- **Categories**: small, controlled set. Use a translation table or a jsonb column (`name_ru`, `name_de`, `name_uk` or alternatively `name jsonb` keyed by locale). A translation table is cleaner; jsonb is faster to ship.
- **Services**: provider-authored. The provider writes in their primary language; we store `original_locale` and the original text. Optionally add LLM-generated translations later, gated behind a "translated" flag so search can prefer original-language matches.
- **Profile bio and free text**: same model as services.
- **City names**: already canonical German via `GERMAN_CITIES`. We will add Russian and Ukrainian display names as a lookup, but the slug stays German. So `/uk/berlin`, not `/uk/берлін`. This is a deliberate SEO call: one URL per page, language switch via prefix only, no URL fragmentation across the cluster.
- **`generateMetadata` for salon and profile pages**: can localize the *template* ("Beauty masters in {city}") immediately even when the underlying entity content is monolingual. Worth shipping in Wave 1 because it is template-only and risk-free.

Defer the actual schema migration until UI i18n is stable. But introduce the helper `getLocalized(field, locale, fallbackLocale)` in Wave 1 with a no-op implementation, so every call site is ready when the schema lands.

## 8. Rollout sequencing (PR-sized chunks)

1. **PR-1, scaffolding, dark.** Add `next-intl`, create the `[locale]/` tree, move public routes, update middleware, set `<html lang>` correctly, ship empty dictionaries (every key returns `ru`). At this point `/de/berlin` works but reads in Russian. Ship and soak for a day to catch routing regressions before any translation noise.
2. **PR-2, SEO surface.** `generateMetadata`, JSON-LD, sitemap index, hreflang helper, canonical helper. No visible UI change for `ru` users.
3. **PR-3, header and footer translations.** First user-visible translated chrome. Smallest possible blast radius.
4. **PR-4 through PR-N, feature directories** (search, profile, booking, dashboard...). One per PR, each translated for all three locales.
5. **PR-final, database schema for translated categories**, then enable on the relevant pages.

## Open questions before we start

1. Confirm `uk` (not `ua`) for the URL prefix.
2. Confirm as-needed default (no prefix for `ru`) over always-prefix.
3. OK to add `next-intl` as a dependency, or hand-rolled?
4. For Wave 1, do you want translated `de` and `uk` copy from us (LLM draft plus your review) or stub them as `ru` and have a human translator fill in?
