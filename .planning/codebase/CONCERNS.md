# CONCERNS.md

## Technical Debt & Architecture Quirks
- **Lack of Automated Testing**: The codebase currently has zero automated tests. This makes refactoring risky and relies entirely on manual QA.
- **Sequential Queries**: Historical insights suggest past issues with sequential database queries in bookings causing performance bottlenecks (mitigated by `Promise.all()` in past optimizations, but needs watching).

## Performance & UX Issues
- **Mobile LCP / Media Performance**: There is a history of Largest Contentful Paint (LCP) issues on mobile due to heavy video/image assets. The use of modern Next.js image optimization and lazy-loading is critical.
- **Cross-Browser Styling**: Past bugs noted "Edge Image Rendering" issues, specifically with CSS grid layouts and `h-full`. Careful cross-browser testing of new UI is required.

## Security Constraints
- **Authentication Routes**: The `middleware.ts` handles complex navigation rules for onboarding and provider vs. user roles. These redirect rules need to be rigorously examined whenever adding new paths to avoid routing bugs (like system paths being intercepted by dynamic `[city]` routes).
