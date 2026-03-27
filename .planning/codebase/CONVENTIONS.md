# CONVENTIONS.md

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
