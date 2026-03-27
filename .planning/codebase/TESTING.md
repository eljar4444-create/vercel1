# TESTING.md

## Test Frameworks
- **Current State**: There are currently NO automated test files (`*.test.ts`, `*.spec.ts`) detected in the `src/` directory.
- **Frameworks**: No testing frameworks (Jest, Vitest, Playwright, Cypress) are present in the `package.json`.

## Testing Practices
- **Manual Testing**: Development currently relies heavily on manual verification and typesafety (TypeScript + Prisma + Zod).

## Recommendations for Future Phases
- Introduce **Vitest** for unit testing utility functions and complex React hooks.
- Introduce **Playwright** or **Cypress** for end-to-end testing of critical flows (e.g., Auth, Booking process).
