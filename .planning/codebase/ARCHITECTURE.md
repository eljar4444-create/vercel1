# ARCHITECTURE.md

## Architectural Pattern
- **Server Components (RSC)**: The project uses Next.js 14 App Router, heavily leaning on React Server Components for initial rendering and server-side data fetching.
- **Server Actions**: Mutations and form submissions are handled via Next.js Server Actions (found in `src/app/actions` and throughout the app), reducing the need for traditional API routes.
- **Monolith with Edge Capabilities**: A monolithic Next.js application intended to be deployed on Vercel, potentially utilizing Edge functions where applicable.

## Layers & Data Flow
1. **Client Components**: Handle user interactions, form state (`react-hook-form`), and immediate UI feedback (`framer-motion`, `react-hot-toast`).
2. **Server Actions / API Routes**: Receive requests from the client. Serve as the controller layer to validate input (using `zod`), perform business logic, and interact with the database.
3. **ORM Layer (Prisma)**: Manages all direct database interactions. Prisma Client is the single source of truth for database operations.
4. **Database (Neon Postgres)**: Persistent storage for users, profiles, bookings, categories, messages, etc.

## Key Abstractions
- **Authentication Flow**: Managed by NextAuth.js (v5). User sessions are tracked via JWTs, enriched with database calls (via the `jwt` callback in `src/auth.ts`) to attach `role`, `profileId`, and onboarding state directly to the session token.
- **Provider vs. Client dichotomy**: The system manages both service consumers (Users) and service providers (Profiles/Salons/Individuals). The abstraction relies on the `Role` enum and `ProviderType` to dictate permissions.

## Entry Points
- **Web App**: `src/app/page.tsx` serves as the primary entry point/landing page.
- **Authentication**: `src/app/auth/login/page.tsx` and NextAuth paths (`src/app/api/auth/[...nextauth]`).
- **Dashboards**: Distinct entry points for administrators (`src/app/admin`) and service providers (`src/app/dashboard`, `src/app/provider`).
