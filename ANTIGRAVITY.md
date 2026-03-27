<!-- GSD:project-start source:PROJECT.md -->
## Project

**Svoi.de**

Svoi.de is a B2B SaaS online booking platform for beauty professionals (solo masters and salons) in Germany. The primary target audience currently includes Ukrainian expat beauty masters integrating into the German market.

**Core Value:** A highly polished, robust, and production-grade booking platform designed to provide a frictionless user experience and handle 1000+ DAU from day one without performance bottlenecks or data conflicts.

### Constraints

- **Performance**: Must smoothly handle 1000+ DAU from day one without bottlenecks.
- **Compliance**: Must be strictly GDPR compliant and 100% cookieless.
- **Quality**: Must be highly polished and frictionless; no fragile MVP code.
- **Infrastructure**: Vercel Edge compute and Neon Serverless Postgres.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- **TypeScript**: Primary language for the entire codebase.
## Runtime & Hosting
- **Node.js**: Expected runtime environment (based on `@types/node` dependency).
- **Vercel**: Target hosting platform, utilizing `@vercel/blob` for edge storage.
## Core Frameworks
- **Next.js**: Version `14.2.5`. Using the App Router (`src/app`) for routing and server components.
- **React**: Version 18. Used for building user interfaces.
## Database & ORM
- **PostgreSQL**: Primary database. Hosted on Neon (`@neondatabase/serverless`).
- **Prisma**: Version `5.22.0`. Used as the ORM for database migrations, schema definitions (`prisma/schema.prisma`), and data access.
## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **shadcn/ui**: Component library built on top of Radix UI and Tailwind CSS.
- **Radix UI**: Unstyled, accessible UI primitives (`@radix-ui/react-*`).
- **Lucide React**: Icon library.
- **Framer Motion**: Animation library.
## State Management & Data Fetching
- **SWR**: Used for client-side data fetching and revalidation.
- **React Hook Form**: Form state management and validation.
- **Zod**: Schema declaration and runtime validation, heavily integrated with React Hook Form (`@hookform/resolvers`).
## Other Utilities
- **date-fns** & **date-fns-tz**: Date formatting and timezone utilities.
- **bcryptjs**: Password hashing for credential-based authentication.
- **react-leaflet** & **leaflet**: Map integration for geo-features.
- **recharts**: Charting library for dashboards/analytics.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Code Style & Formatting
- **Linter**: `eslint-config-next` is used as the standard base.
- **Component Structure**: Follows standard React Functional Component patterns.
- **UI Components**: `shadcn/ui` pattern is adopted, with base UI components residing in `src/components/ui` (implied by dependencies like `@radix-ui/*`, `clsx`, `tailwind-merge`).
- **Styling**: Tailwind CSS classes are heavily utilized. Complex class merging uses `cn` utility (standard shadcn pattern combining `clsx` and `tailwind-merge`).
## Error Handling
- **Next.js Error Boundaries**: App uses standard Next.js error handling mechanisms (`error.tsx` and `global-error.tsx` at the root of `src/app`).
- **Form Validation**: Client and server-side form validation is handled via `zod`. Server Actions often return specific error structures handled by `react-hot-toast` on the client.
## Routing and Data
- **Data Fetching**: The App Router is used, leaning towards Server Components for initial fetches. Client-side fetching is managed by `swr`.
- **Mutations**: Server Actions (`src/app/actions`) are the primary mechanism for invoking database changes from the client without dedicated API routes.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Architectural Pattern
- **Server Components (RSC)**: The project uses Next.js 14 App Router, heavily leaning on React Server Components for initial rendering and server-side data fetching.
- **Server Actions**: Mutations and form submissions are handled via Next.js Server Actions (found in `src/app/actions` and throughout the app), reducing the need for traditional API routes.
- **Monolith with Edge Capabilities**: A monolithic Next.js application intended to be deployed on Vercel, potentially utilizing Edge functions where applicable.
## Layers & Data Flow
## Key Abstractions
- **Authentication Flow**: Managed by NextAuth.js (v5). User sessions are tracked via JWTs, enriched with database calls (via the `jwt` callback in `src/auth.ts`) to attach `role`, `profileId`, and onboarding state directly to the session token.
- **Provider vs. Client dichotomy**: The system manages both service consumers (Users) and service providers (Profiles/Salons/Individuals). The abstraction relies on the `Role` enum and `ProviderType` to dictate permissions.
## Entry Points
- **Web App**: `src/app/page.tsx` serves as the primary entry point/landing page.
- **Authentication**: `src/app/auth/login/page.tsx` and NextAuth paths (`src/app/api/auth/[...nextauth]`).
- **Dashboards**: Distinct entry points for administrators (`src/app/admin`) and service providers (`src/app/dashboard`, `src/app/provider`).
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-antigravity-profile` -- do not edit manually.
<!-- GSD:profile-end -->
