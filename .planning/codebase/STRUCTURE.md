# STRUCTURE.md

## Directory Layout

- `prisma/`
  - Database schema definitions (`schema.prisma`) and seed scripts.
- `public/`
  - Static assets, images, icons.
- `src/`
  - Application source code root.
  - `app/`: Next.js App Router directory.
    - `[city]/`: Dynamic route for city-specific searches/pages.
    - `actions/`: Next.js Server Actions for handling mutations.
    - `admin/`: Admin dashboard pages.
    - `api/`: Traditional API routes.
    - `auth/`: Authentication pages (e.g., login, register).
    - `chat/`: Chat functionality between clients and providers.
    - `dashboard/`: Provider dashboard overarching layout/pages.
    - `onboarding/`: User and provider onboarding flows.
    - `provider/`: Provider-specific profile management.
    - `search/`: Search functionality for services/providers.
  - `components/`: React components.
    - Expected to contain `ui/` for shadcn generic components and domain-specific component folders.
  - `constants/`: Global constants, configuration values.
  - `hooks/`: Custom React hooks.
  - `lib/`: Utility functions and shared library configurations (e.g., `prisma.ts`, `utils.ts`).
  - `types/`: TypeScript type definitions and interfaces.

## Key Locations
- **Database Schema**: `prisma/schema.prisma`
- **Authentication Logic**: `src/auth.ts` and `src/auth.config.ts`
- **Global Styles**: `src/app/globals.css`
- **Middleware**: `src/middleware.ts` (Handles route protection and auth redirects)

## Naming Conventions
- Next.js conventions: `page.tsx` for route UI, `layout.tsx` for shared layouts, `error.tsx` for error boundaries.
- Kebab-case or lowerCamelCase for folders/files, varying based on Next.js standard vs component logic. Component files typically use PascalCase if they export a single main component, though Next.js forces `page.tsx` style for routing.
